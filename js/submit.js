// --- TBCW FIELD REPORT SUBMISSION MODULE ---

let encryption_timeout;
let progress_interval;

function getMoscowTime() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * 3)); 
    const yy = nd.getFullYear();
    const mm = String(nd.getMonth() + 1).padStart(2, '0');
    const dd = String(nd.getDate()).padStart(2, '0');
    const hh = String(nd.getHours()).padStart(2, '0');
    const mins = String(nd.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${mins}`;
}

function addReportSection() {
    playSound(sfx.click);
    const container = document.getElementById('reports-container');
    const submitBox = document.getElementById('submit-box'); 
    const entry = document.createElement('div');
    entry.className = "report-entry flex flex-col gap-2 relative group pt-3 border-t border-gray-800/50 mt-3";
    
    entry.innerHTML = `
        <div class="btn-group absolute top-1 right-0 flex gap-3 hidden group-hover:flex z-20 bg-[#030504] px-2 py-1 rounded border theme-border">
            <button class="btn-focus-report theme-text hover:text-white text-[10px] font-bold transition-colors ui-element">[ MAXIMIZE ]</button>
            <button class="btn-remove-report text-red-700 hover:text-red-400 text-[10px] font-bold transition-colors ui-element">[ REMOVE ]</button>
        </div>
        <input type="text" placeholder="Report Title (e.g. History & Incidents)" class="report-title w-full bg-black border border-gray-800 text-xs theme-text p-2 pr-28 focus-theme transition-colors ui-element">
        <input type="text" placeholder="Audio Record URL (Catbox.moe / Discord CDN)" class="report-audio w-full bg-black border border-gray-800 text-xs theme-text opacity-80 p-2 focus-theme transition-colors ui-element">
        <textarea placeholder="Enter background details or incident report here using formatting protocols..." class="report-content w-full min-h-[140px] bg-black border border-gray-800 text-xs text-gray-300 p-2 focus-theme transition-colors resize-none custom-scrollbar ui-element"></textarea>
    `;
    
    const removeBtn = entry.querySelector('.btn-remove-report');
    removeBtn.addEventListener('click', function() {
        playSound(sfx.click);
        entry.remove();
    });

    const focusBtn = entry.querySelector('.btn-focus-report');
    const btnGroup = entry.querySelector('.btn-group');
    const textarea = entry.querySelector('.report-content');
    let isFocused = false;

    focusBtn.addEventListener('click', () => {
        playSound(sfx.click);
        isFocused = !isFocused;
        
        if (isFocused) {
            submitBox.insertAdjacentHTML('beforeend', '<div id="focus-backdrop" class="absolute inset-0 bg-[#030504] z-[90]"></div>');
            btnGroup.classList.remove('hidden', 'group-hover:flex', 'absolute', 'top-1', 'right-0', 'border');
            btnGroup.classList.add('flex', 'fixed', 'top-6', 'right-6', 'md:top-10', 'md:right-10', 'z-[100]', 'p-2', 'bg-black', 'border-2', 'theme-border');
            
            // Расширяем поле, убираем w-full чтобы не выезжало за рамки
            textarea.classList.add('fixed', 'inset-4', 'md:inset-8', 'z-[95]', 'text-sm', 'md:text-base', 'p-6', 'shadow-[0_0_50px_rgba(16,185,129,0.15)]');
            textarea.classList.remove('min-h-[140px]', 'w-full'); 
            
            // Скрываем кнопку удаления от греха подальше
            removeBtn.style.display = 'none';
            focusBtn.innerText = "[ MINIMIZE ]";
        } else {
            const backdrop = document.getElementById('focus-backdrop');
            if (backdrop) backdrop.remove();
            
            btnGroup.classList.add('hidden', 'group-hover:flex', 'absolute', 'top-1', 'right-0', 'border');
            btnGroup.classList.remove('flex', 'fixed', 'top-6', 'right-6', 'md:top-10', 'md:right-10', 'z-[100]', 'p-2', 'bg-black', 'border-2', 'theme-border');
            
            // Возвращаем исходные стили
            textarea.classList.remove('fixed', 'inset-4', 'md:inset-8', 'z-[95]', 'text-sm', 'md:text-base', 'p-6', 'shadow-[0_0_50px_rgba(16,185,129,0.15)]');
            textarea.classList.add('min-h-[140px]', 'w-full');
            
            removeBtn.style.display = 'block';
            focusBtn.innerText = "[ MAXIMIZE ]";
        }
    });
    
    container.appendChild(entry);
    
    entry.querySelectorAll('.ui-element').forEach(el => {
        el.addEventListener('mouseenter', () => playSound(sfx.hover));
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.addEventListener('focus', () => playSound(sfx.click));
        }
    });
}

function setupSubmitControls() {
    const submit_modal = document.getElementById('submit-modal');
    const submit_box = document.getElementById('submit-box');
    const btn_open = document.getElementById('btn-open-submit');
    const btn_close = document.getElementById('btn-close-submit');
    
    const btn_encrypt = document.getElementById('btn-encrypt-data');
    const btn_copy = document.getElementById('btn-copy-hash');
    const output_hash = document.getElementById('submit-output');
    const btn_add = document.getElementById('btn-add-report');
    const container = document.getElementById('reports-container');
    
    const enc_overlay = document.getElementById('encryption-overlay');
    const btn_skip = document.getElementById('btn-skip-anim');
    const anim_status = document.getElementById('anim-status');
    const anim_progress = document.getElementById('anim-progress');

    // Если контейнер пустой, создаем первую форму отчета
    if (container && container.children.length === 0) {
        addReportSection();
    }

    const tabBtns = document.querySelectorAll('.sub-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound(sfx.click);
            tabBtns.forEach(b => {
                b.classList.remove('tab-active');
                b.classList.add('tab-inactive');
            });
            
            const targets = ['sub-tab-content-guide', 'sub-tab-content-param', 'sub-tab-content-logs', 'sub-tab-content-crypt'];
            targets.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.add('hidden');
                    el.classList.remove('flex', 'lg:flex-row', 'flex-col');
                }
            });

            btn.classList.remove('tab-inactive');
            btn.classList.add('tab-active');
            
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                if (targetId === 'sub-tab-content-logs') targetEl.classList.add('flex', 'flex-col');
                if (targetId === 'sub-tab-content-crypt') targetEl.classList.add('flex', 'flex-col', 'lg:flex-row');
            }
        });
    });

    if(btn_add) { btn_add.addEventListener('click', addReportSection); }

    if(btn_open) {
        btn_open.addEventListener('click', () => {
            playSound(sfx.click);
            addSystemLog('Opening HR Registration Terminal');
            if(output_hash) output_hash.value = '';
            
            if(tabBtns.length > 0) tabBtns[0].click();

            submit_modal.classList.remove('hidden');
            setTimeout(() => { 
                submit_modal.classList.remove('opacity-0');
                if(submit_box) submit_box.classList.add('window-open-active');
                playSound(sfx.docOpen);
            }, 10);
        });
    }

    if(btn_close) {
        btn_close.addEventListener('click', () => {
            playSound(sfx.click);
            stopSound(sfx.typing);
            clearTimeout(encryption_timeout);
            clearInterval(progress_interval);
            if(enc_overlay) enc_overlay.classList.add('hidden');
            
            document.querySelectorAll('.btn-focus-report').forEach(btn => {
                if (btn.innerText === "[ MINIMIZE ]") btn.click();
            });

            submit_modal.classList.add('opacity-0');
            if(submit_box) submit_box.classList.remove('window-open-active');
            setTimeout(() => { submit_modal.classList.add('hidden'); }, 300);
        });
    }

    let pending_hash = "";

    function finishEncryption() {
        clearTimeout(encryption_timeout);
        clearInterval(progress_interval);
        stopSound(sfx.typing);
        playSound(sfx.docOpen);
        if(enc_overlay) enc_overlay.classList.add('hidden');
        if(output_hash) output_hash.value = pending_hash;
        addSystemLog(`Dossier packaged successfully.`);
    }

    if(btn_skip) { btn_skip.addEventListener('click', () => { playSound(sfx.click); finishEncryption(); }); }

    if(btn_encrypt) {
        btn_encrypt.addEventListener('click', () => {
            playSound(sfx.click);

            document.querySelectorAll('.btn-focus-report').forEach(btn => {
                if (btn.innerText === "[ MINIMIZE ]") btn.click();
            });
            
            const nameInput = document.getElementById('sub-name');
            const name_val = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "UNKNOWN";
            const initials = name_val.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

            const photo_input = document.getElementById('sub-photo') ? document.getElementById('sub-photo').value.trim() : '';
            const final_photo = photo_input.length > 5 ? photo_input : `https://placehold.co/400x400/0a0a0c/10b981?text=${initials}`;

            const tagsInput = document.getElementById('sub-tags');
            const tagsArr = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];

            const reports_arr = [];
            document.querySelectorAll('.report-entry').forEach(entry => {
                const t = entry.querySelector('.report-title').value.trim() || "UNTITLED LOG";
                const a = entry.querySelector('.report-audio').value.trim() || "";
                const c = entry.querySelector('.report-content').value.trim() || "No data provided.";
                reports_arr.push({ title: t, audio: a, content: c });
            });

            const dossier_data = {
                id: document.getElementById('sub-id') ? document.getElementById('sub-id').value.trim() || "TBCW-XXX" : "TBCW-XXX",
                name: name_val,
                age: document.getElementById('sub-age') ? parseInt(document.getElementById('sub-age').value) || 0 : 0,
                district: document.getElementById('sub-district') ? document.getElementById('sub-district').value.trim() || "Unknown" : "Unknown",
                affiliation: document.getElementById('sub-aff') ? document.getElementById('sub-aff').value || "Unknown" : "Unknown",
                grade: document.getElementById('sub-grade') ? document.getElementById('sub-grade').value : "Grade 9",
                status: document.getElementById('sub-status') ? document.getElementById('sub-status').value : "Active",
                last_update: getMoscowTime(),
                photo: final_photo,
                tags: tagsArr.length > 0 ? tagsArr : ["Unclassified"],
                reports: reports_arr.length > 0 ? reports_arr : [{ title: "INITIAL LOG", content: "No data provided." }]
            };

            const json_str = JSON.stringify(dossier_data, null, 0); 
            const encrypted_str = encryptData(json_str);
            pending_hash = `"${encrypted_str}",`;
            
            if(output_hash) output_hash.value = "";
            if(enc_overlay) {
                enc_overlay.classList.remove('hidden');
                enc_overlay.classList.add('flex');
            }
            playSound(sfx.typing);
            
            let progress = 0;
            if(anim_progress) anim_progress.style.width = '0%';
            
            const steps = [
                "> COMPILING BIOMETRICS...",
                "> GENERATING IDENT-TAGS...",
                "> ENCRYPTING DATA PACKETS...",
                "> PACKAGING LOG SECTORS...",
                "> FINALIZING DOSSIER HASH..."
            ];
            let step_idx = 0;

            progress_interval = setInterval(() => {
                progress += 2;
                if(anim_progress) anim_progress.style.width = progress + '%';
                
                if (progress % 20 === 0 && step_idx < steps.length) {
                    if(anim_status) {
                        anim_status.innerText = steps[step_idx];
                        anim_status.setAttribute('data-val', steps[step_idx]);
                        scrambleText([anim_status]);
                    }
                    step_idx++;
                }

                if(progress >= 100) { finishEncryption(); }
            }, 80);
        });
    }

    if(btn_copy) {
        btn_copy.addEventListener('click', () => {
            if(!output_hash || !output_hash.value) return;
            navigator.clipboard.writeText(output_hash.value).then(() => {
                playSound(sfx.click);
                addSystemLog('Dossier hash copied to clipboard');
                const original_text = btn_copy.innerText;
                btn_copy.innerText = "[ COPIED TO CLIPBOARD ]";
                setTimeout(() => { btn_copy.innerText = original_text; }, 2000);
            });
        });
    }
}