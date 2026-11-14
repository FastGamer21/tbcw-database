// --- TBCW ENTRY POINT & GLOBAL EVENTS ---

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const doc_fs = document.getElementById('doc-fs');
        if(doc_fs && !doc_fs.classList.contains('hidden')) { if (typeof wizFsClose === 'function') wizFsClose(); return; }
        const admin_modal = document.getElementById('admin-modal');
        if(admin_modal && !admin_modal.classList.contains('hidden')) { if (typeof authCloseAdmin === 'function') authCloseAdmin(); return; }
        const modal = document.getElementById('modal');
        const map_modal = document.getElementById('map-modal');
        const archive_modal = document.getElementById('archive-modal');
        const submit_modal = document.getElementById('submit-modal');

        if(modal && !modal.classList.contains('hidden')) closeModal();
        if(map_modal && !map_modal.classList.contains('hidden')) { document.getElementById('btn-close-map').click(); }
        if(archive_modal && !archive_modal.classList.contains('hidden')) { document.getElementById('btn-close-archive').click(); }
        if(submit_modal && !submit_modal.classList.contains('hidden')) { document.getElementById('btn-close-submit').click(); }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    try { buildMap(); } catch(e) {}
    try { setupMapControls(); } catch(e) {}
    try { setupArchiveControls(); } catch(e) {}
    try { setupWizardControls(); } catch(e) {}
    
    const searchInput = document.getElementById('search-input');
    const filterDistrict = document.getElementById('filter-district');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderCards(); 
        });
    }
    if (filterDistrict) {
        filterDistrict.addEventListener('change', () => {
            playSound(sfx.click);
            renderCards(); 
        });
    }

    const themeSelect = document.getElementById('ui-theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            playSound(sfx.click);
            document.body.setAttribute('data-theme', e.target.value);
            addSystemLog(`UI Protocol shifted to ${e.target.value.toUpperCase()}`);
        });
    }

    // Ролевая видимость: гость видит витрину, члены — терминал целиком.
    // Инлайн-стили: инлайн бьёт любой CSS (ui-element, lg:flex и пр.)
    function applyRoleVisibility(role) {
        const guest = role === 'guest';
        const set = (id, hide) => {
            const el = document.getElementById(id);
            if (el) el.style.display = hide ? 'none' : '';
        };
        const grid = document.getElementById('dossier-grid');
        if (grid) grid.style.display = guest ? 'none' : '';
        const promo = document.getElementById('guest-promo');
        if (promo) promo.style.display = guest ? 'block' : 'none';
        set('panel-query', guest);
        set('btn-open-archives', guest);
        set('btn-open-submit', guest);
        set('btn-open-admin', role !== 'admin');
        const filesTitle = document.querySelector('.view-title');
        if (filesTitle) filesTitle.style.display = guest ? 'none' : '';
    }

    // CLOCK: кнопка и ранг по состоянию последнего события
    function applyClockUI(clk) {
        const btn = document.getElementById('btn-clock');
        const rank = document.getElementById('rank-badge');
        if (!btn || !rank) return;
        if (!clk) {
            btn.classList.add('hidden');
            rank.classList.add('hidden');
            return;
        }
        btn.classList.remove('hidden');
        btn.innerText = clk.state === 'in' ? '[ CLOCK OUT ]' : '[ CLOCK IN ]';
        btn.classList.toggle('clocked-in', clk.state === 'in');
        rank.classList.remove('hidden');
        rank.innerText = `[RANK: ${clk.rank} · ${clk.days}D · ${clk.hours}H]`;
    }

    const btnClock = document.getElementById('btn-clock');
    if (btnClock) btnClock.addEventListener('click', async () => {
        playSound(sfx.click);
        btnClock.disabled = true;
        const clk = await dbClockToggle();
        btnClock.disabled = false;
        if (clk) {
            applyClockUI(clk);
            addSystemLog(clk.state === 'in'
                ? `CLOCKED IN — RANK: ${clk.rank} (${clk.days}D)`
                : `CLOCKED OUT — RANK: ${clk.rank} (${clk.days}D)`);
        } else {
            addSystemLog('CLOCK EVENT FAILED', true);
        }
    });

    // AUTH: выход + админ-реестр
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', async () => {
        playSound(sfx.click);
        await authSignOut();
        location.reload();
    });
    const btnOpenAdmin = document.getElementById('btn-open-admin');
    if (btnOpenAdmin) btnOpenAdmin.addEventListener('click', () => {
        if (authProfile && authProfile.role === 'admin') authOpenAdmin();
        else playSound(sfx.scannerUse);
    });
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    if (btnCloseAdmin) btnCloseAdmin.addEventListener('click', authCloseAdmin);
    const btnQueue = document.getElementById('btn-admin-queue');
    const btnRegistry2 = document.getElementById('btn-admin-registry');
    const setAdminTab = (showQueue) => {
        const q = document.getElementById('admin-queue-list');
        const r = document.getElementById('admin-list');
        if (q) q.classList.toggle('hidden', !showQueue);
        if (r) r.classList.toggle('hidden', showQueue);
        if (btnQueue) { btnQueue.classList.toggle('theme-text', showQueue); btnQueue.classList.toggle('theme-border', showQueue); btnQueue.classList.toggle('text-gray-500', !showQueue); btnQueue.classList.toggle('border-gray-800', !showQueue); }
        if (btnRegistry2) { btnRegistry2.classList.toggle('theme-text', !showQueue); btnRegistry2.classList.toggle('theme-border', !showQueue); btnRegistry2.classList.toggle('text-gray-500', showQueue); btnRegistry2.classList.toggle('border-gray-800', showQueue); }
    };
    if (btnQueue) btnQueue.addEventListener('click', () => { playSound(sfx.click); setAdminTab(true); });
    if (btnRegistry2) btnRegistry2.addEventListener('click', () => { playSound(sfx.click); setAdminTab(false); });
    if (typeof dbBindAdmin === 'function') dbBindAdmin();

    const initScreen = document.getElementById('init-screen');
    const boot_screen = document.getElementById('boot-screen');
    const main_ui = document.getElementById('main-ui');
    
    const idCard = document.getElementById('id-card');
    const idSlot = document.getElementById('id-slot');
    const slotLed = document.getElementById('slot-led');
    const crtFlash = document.getElementById('crt-flash');

    if (idCard && idSlot) {
            idCard.addEventListener('dragstart', (e) => {
            playSound(sfx.pickItem); 
            e.dataTransfer.setData('text/plain', 'vanguard-id');
            e.dataTransfer.effectAllowed = 'move';
            
            const clone = idCard.cloneNode(true);
            clone.classList.add('dragged-clone');
            clone.style.position = 'absolute';
            clone.style.top = '-9999px'; 
            clone.style.opacity = '1';
            document.body.appendChild(clone);

            const rect = idCard.getBoundingClientRect();
            e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);

            setTimeout(() => {
                document.body.removeChild(clone);
                idCard.style.opacity = '0.2'; 
            }, 0);
        });

        idCard.addEventListener('dragend', () => {
            idCard.style.opacity = '1';
        });

        idSlot.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            idSlot.classList.add('drag-over');
        });

        idSlot.addEventListener('dragleave', () => {
            idSlot.classList.remove('drag-over');
        });

        idSlot.addEventListener('drop', (e) => {
            e.preventDefault();
            idSlot.classList.remove('drag-over');
            const data = e.dataTransfer.getData('text/plain');
            
            if (data === 'vanguard-id') {
                processIdCard();
            }
        });
        
        idCard.addEventListener('click', processIdCard);
        idCard.addEventListener('touchstart', processIdCard, {passive: true});
    }

    function processIdCard() {
        if(!idCard || idCard.style.display === 'none') return;
        
        idCard.style.display = 'none'; 
        playSound(sfx.keycardUse); 
        // 1. ОСТАВЛЯЕМ ЗВУК СТАРТА ПК ТОЛЬКО ЗДЕСЬ (В САМОМ НАЧАЛЕ)
        playSound(sfx.terminalStart); 
        
        if (slotLed) {
            slotLed.classList.remove('idle');
            slotLed.classList.add('granted');
        }
        
        if (idSlot) {
            idSlot.innerHTML = `<span class="theme-text font-mono-custom text-sm font-bold tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.8)] px-4 py-2 bg-emerald-900/20 border theme-border">[ ID VERIFIED ]</span>`;
        }
        
        setTimeout(() => {
            triggerCRTFlash();
        }, 800);
    }

    function triggerCRTFlash() {
        if(initScreen) initScreen.style.display = 'none';
        
        boot_screen.style.display = 'flex';
        boot_screen.style.opacity = '1';
        
        boot_screen.innerHTML = '<div id="boot-text" class="font-mono-custom text-sm w-full max-w-3xl px-6 flex flex-col gap-1 items-start"></div>' +
            '<button id="btn-skip-boot" class="absolute bottom-8 right-8 text-gray-600 hover:theme-text font-mono-custom text-xs tracking-widest ui-element transition-colors">[ SKIP ]</button>';
        
        document.body.classList.add('terminal-active');
        
        setTimeout(() => unlockTerminal(), 500); 
    }

    async function unlockTerminal() {
        const boot_text = document.getElementById('boot-text');
        const skipBtn = document.getElementById('btn-skip-boot');

        // --- SKIP-МЕХАНИКА: флаг + разблокировка всех ожиданий ---
        let bootSkipped = false;
        let bootWaiters = [];
        const bootWait = (ms) => new Promise(resolve => {
            if (bootSkipped) { resolve(); return; }
            const timer = setTimeout(resolve, ms);
            bootWaiters.push(() => { clearTimeout(timer); resolve(); });
        });
        const skipBoot = () => {
            if (bootSkipped) return;
            bootSkipped = true;
            bootWaiters.forEach(w => w());
            bootWaiters = [];
        };

        if (skipBtn) {
            skipBtn.classList.remove('hidden');
            skipBtn.addEventListener('click', () => { playSound(sfx.click); skipBoot(); });
        }

        if (typeof dataReady !== 'undefined') await dataReady;
        if (typeof populateDistricts === 'function') populateDistricts();

        // --- AUTH GATE: идентификация перед доступом к базе ---
        if (typeof AUTH_ON !== 'undefined' && AUTH_ON) {
            const sess = await authGetSession();
            if (!sess) authProfile = await authGateAwait();
            else if (!authProfile) authProfile = await authFetchProfile();
            if (authProfile) {
                authUpdateBadge(authProfile);
                applyRoleVisibility(authProfile.role);
                if (typeof dbClockStatus === 'function') {
                    const clk = await dbClockStatus();
                    applyClockUI(clk);
                }
                if (typeof dbLoadContent === 'function') {
                    await dbLoadContent();
                    if (typeof populateDistricts === 'function') populateDistricts();
                }
                const idLine = document.createElement('div');
                idLine.className = 'theme-text text-xs md:text-sm font-mono-custom opacity-80 w-full';
                idLine.innerText = `> IDENTITY CONFIRMED: ${(authProfile.callsign || 'unknown').toUpperCase()} [ROLE: ${(authProfile.role || 'base').toUpperCase()}]`;
                boot_text.appendChild(idLine);
                await new Promise(r => setTimeout(r, 500));
            }
        } else {
            addSystemLog('AUTH OFFLINE: SUPABASE NOT CONFIGURED', true);
        }

        // --- ФИНАЛЬНЫЙ ЭПИЛОГ: общий путь для обычного бута и SKIP ---
        const epilogue = async (didSkip) => {
            boot_screen.classList.remove('power-failure', 'emergency-state');
            if (didSkip) {
                stopSound(sfx.typing);
                boot_text.innerHTML = '';

                const override = document.createElement('div');
                override.className = "theme-text font-bold uppercase tracking-widest my-3 text-sm md:text-base font-mono-custom glitch-text border-b border-gray-800 pb-2 w-full";
                override.setAttribute('data-val', "> OVERRIDE ACCEPTED. WELCOME.");
                override.innerText = "> OVERRIDE ACCEPTED. WELCOME.";
                boot_text.appendChild(override);

                const granted = document.createElement('div');
                granted.className = "theme-text text-xs md:text-sm font-mono-custom opacity-80 w-full";
                granted.innerText = "> ACCESS GRANTED.";
                boot_text.appendChild(granted);

                scrambleText([override]);
            }
            if (skipBtn) skipBtn.classList.add('hidden');

            sfx.ambient.play().catch(() => {});

            await new Promise(r => setTimeout(r, 1500));
            boot_screen.style.opacity = '0';
            boot_screen.style.pointerEvents = 'none';

            setTimeout(() => {
                boot_screen.style.display = 'none';
                main_ui.classList.remove('hidden');

                if (typeof fadeOutSound === 'function') { fadeOutSound(sfx.terminalStart, 3000); }

                setTimeout(() => {
                    main_ui.style.opacity = '1';
                    renderCards();
                    initGlobalSounds();
                    scrambleText(document.querySelectorAll('#main-ui .glitch-text'));
                }, 50);
            }, 500);
        };

        // ФАЗА 1: 6 надписей начальной загрузки
        const fastLines = [
            "> HANDSHAKE PROTOCOL INITIATED...",
            "> KERNEL LOADED. ALLOCATING MEMORY...",
            "> READING VANGUARD ID...",
            "> VALIDATING CRYPTOGRAPHIC HASH...",
            "> BYPASSING SECURITY SECTOR 0x0A...",
            "> ESTABLISHING SECURE CONNECTION..."
        ];

        for (let line of fastLines) {
            if (bootSkipped) return epilogue(true);
            await typeLine(boot_text, line, 20, "text-gray-500 opacity-60 text-[10px] md:text-xs font-mono-custom w-full", () => bootSkipped);
            await bootWait(200);
        }
        if (bootSkipped) return epilogue(true);

        // ФАЗА 2: Отключение питания
        await bootWait(400);
        if (bootSkipped) return epilogue(true);
        boot_screen.classList.add('power-failure');
        playSound(sfx.click);

        await bootWait(800);
        boot_screen.classList.remove('power-failure');
        boot_text.innerHTML = '';
        if (bootSkipped) return epilogue(true);

        // ФАЗА 3: Фальшивая тревога — редкий флёр (дропается с шансом ~15%)
        if (Math.random() >= 0.15) {
            boot_screen.classList.remove('emergency-state');
            boot_text.innerHTML = '';
        } else boot_screen.classList.add('emergency-state');
        playSound(sfx.scannerUse);

        const warning = document.createElement('div');
        warning.className = "text-red-500 font-bold uppercase tracking-widest my-3 text-sm font-mono-custom border-l-2 border-red-600 pl-3";
        warning.innerHTML = "CRITICAL WARNING<br><span class='text-[10px] text-red-400 opacity-80'>UNAUTHORIZED ACCESS DETECTED</span>";
        boot_text.appendChild(warning);

        await bootWait(1200);
        if (bootSkipped) return epilogue(true);
        
        const countdown = document.createElement('div');
        countdown.className = "text-red-500 font-bold text-xs font-mono-custom mt-2";
        boot_text.appendChild(countdown);
        
        for (let i = 3; i > 0; i--) {
            if (bootSkipped) return epilogue(true);
            countdown.innerText = `> INITIATING PURGE PROTOCOL IN ${i}...`;
            playSound(sfx.click);
            await bootWait(1000);
        }
        if (bootSkipped) return epilogue(true);

        // ФАЗА 4: Перехват управления (ЗВУК УДАЛЕН ОТСЮДА)
        boot_screen.classList.remove('emergency-state');
        boot_text.innerHTML = '';
        
        const override = document.createElement('div');
        override.className = "theme-text font-bold uppercase tracking-widest my-3 text-sm md:text-base font-mono-custom glitch-text border-b border-gray-800 pb-2 w-full";
        override.setAttribute('data-val', "> OVERRIDE ACCEPTED. WELCOME.");
        override.innerText = "> OVERRIDE ACCEPTED. WELCOME.";
        boot_text.appendChild(override);
        
        scrambleText([override]);
        await bootWait(1000);
        if (bootSkipped) return epilogue(true);

        // ФИНАЛ: 4 надписи
        const finalLines = [
            "> DECRYPTING VANGUARD PROTOCOLS...",
            "> SYNCING DATABANKS WITH COMMONWEALTH SERVERS...",
            "> ALL MODULES ONLINE.",
            "> ACCESS GRANTED."
        ];

        for (let line of finalLines) {
            if (bootSkipped) return epilogue(true);
            await typeLine(boot_text, line, 30, "theme-text text-xs md:text-sm font-mono-custom opacity-80 w-full", () => bootSkipped);
            await bootWait(300);
        }

        await epilogue(false);
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const dossierGridContainer = document.querySelector('main > div.flex-1'); 
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            playSound(sfx.click); 
            const aside = document.querySelector('aside');
            if (aside) {
                if (aside.classList.contains('hidden-mobile')) {
                    aside.classList.remove('hidden', 'hidden-mobile');
                    aside.classList.add('visible-mobile', 'fixed', 'inset-0', 'bg-black/95', 'backdrop-blur-sm', 'z-[90]', 'p-6', 'justify-center', 'items-center');
                    mobileMenuBtn.innerText = '[ CLOSE ]';
                    mobileMenuBtn.classList.add('text-red-500');
                    if(dossierGridContainer) dossierGridContainer.style.display = 'none';
                } else {
                    aside.classList.remove('visible-mobile', 'fixed', 'inset-0', 'bg-black/95', 'backdrop-blur-sm', 'z-[90]', 'p-6', 'justify-center', 'items-center');
                    aside.classList.add('hidden', 'hidden-mobile');
                    mobileMenuBtn.innerText = '[ MENU ]';
                    mobileMenuBtn.classList.remove('text-red-500');
                    if(dossierGridContainer) dossierGridContainer.style.display = 'block';
                }
            }
        });
    }
});