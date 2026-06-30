// --- TBCW ENTRY POINT & GLOBAL EVENTS ---

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
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
    try { setupSubmitControls(); } catch(e) {}
    
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
        
        boot_screen.innerHTML = '<div id="boot-text" class="font-mono-custom text-sm w-full max-w-3xl px-6 flex flex-col gap-1 items-start"></div>';
        
        document.body.classList.add('terminal-active');
        
        setTimeout(() => unlockTerminal(), 500); 
    }

    async function unlockTerminal() {
        const boot_text = document.getElementById('boot-text');
        
        if (typeof encrypted_lore !== 'undefined') {
            encrypted_lore.forEach(enc_data => {
                const full_str = Array.isArray(enc_data) ? enc_data.join('').replace(/\s/g, '') : enc_data.replace(/\s/g, '');
                const decoded = decryptData(full_str);
                if(decoded) { try { lore_chapters.push(JSON.parse(decoded)); } catch(e) {} }
            });
        }
        if (typeof populateDistricts === 'function') populateDistricts();

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
            await typeLine(boot_text, line, 20, "text-gray-500 opacity-60 text-[10px] md:text-xs font-mono-custom w-full"); 
            await new Promise(r => setTimeout(r, 200)); 
        }

        // ФАЗА 2: Отключение питания
        await new Promise(r => setTimeout(r, 400));
        boot_screen.classList.add('power-failure');
        playSound(sfx.click); 
        
        await new Promise(r => setTimeout(r, 800)); 
        boot_screen.classList.remove('power-failure');
        boot_text.innerHTML = ''; 
        
        // ФАЗА 3: Фальшивая тревога
        boot_screen.classList.add('emergency-state'); 
        playSound(sfx.scannerUse); 
        
        const warning = document.createElement('div');
        warning.className = "text-red-500 font-bold uppercase tracking-widest my-3 text-sm font-mono-custom border-l-2 border-red-600 pl-3";
        warning.innerHTML = "CRITICAL WARNING<br><span class='text-[10px] text-red-400 opacity-80'>UNAUTHORIZED ACCESS DETECTED</span>";
        boot_text.appendChild(warning);

        await new Promise(r => setTimeout(r, 1200));
        
        const countdown = document.createElement('div');
        countdown.className = "text-red-500 font-bold text-xs font-mono-custom mt-2";
        boot_text.appendChild(countdown);
        
        for (let i = 3; i > 0; i--) {
            countdown.innerText = `> INITIATING PURGE PROTOCOL IN ${i}...`;
            playSound(sfx.click); 
            await new Promise(r => setTimeout(r, 1000)); 
        }

        // ФАЗА 4: Перехват управления (ЗВУК УДАЛЕН ОТСЮДА)
        boot_screen.classList.remove('emergency-state');
        boot_text.innerHTML = '';
        
        const override = document.createElement('div');
        override.className = "theme-text font-bold uppercase tracking-widest my-3 text-sm md:text-base font-mono-custom glitch-text border-b border-gray-800 pb-2 w-full";
        override.setAttribute('data-val', "> OVERRIDE ACCEPTED. WELCOME.");
        override.innerText = "> OVERRIDE ACCEPTED. WELCOME.";
        boot_text.appendChild(override);
        
        scrambleText([override]); 
        await new Promise(r => setTimeout(r, 1000)); 
        
        // ФИНАЛ: 4 надписи
        const finalLines = [
            "> DECRYPTING VANGUARD PROTOCOLS...",
            "> SYNCING DATABANKS WITH COMMONWEALTH SERVERS...",
            "> ALL MODULES ONLINE.",
            "> ACCESS GRANTED."
        ];

        for (let line of finalLines) { 
            await typeLine(boot_text, line, 30, "theme-text text-xs md:text-sm font-mono-custom opacity-80 w-full"); 
            await new Promise(r => setTimeout(r, 300)); 
        }
        
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