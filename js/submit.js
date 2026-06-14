// --- TBCW FIELD REPORT SUBMISSION MODULE (DOSSIER GENERATOR) ---

let encryption_timeout;
let progress_interval;

function getMoscowTime() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * 3)); // +3 hours for MSK
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
    const entry = document.createElement('div');
    entry.className = "report-entry flex flex-col gap-2 relative group pt-3 border-t border-gray-800/50 mt-3";
    entry.innerHTML = `
        <button class="btn-remove-report absolute top-1 right-0 text-red-900 hover:text-red-500 text-[10px] font-bold ui-element transition-colors hidden group-hover:block">[ REMOVE ]</button>
        <input type="text" placeholder="Report Title (e.g. Combat Gear)" class="report-title w-full bg-black border border-gray-800 text-xs text-emerald-400 p-2 pr-16 focus:border-emerald-500 focus:outline-none transition-colors ui-element">
        <textarea placeholder="Enter details..." class="report-content w-full min-h-[80px] bg-black border border-gray-800 text-xs text-gray-300 p-2 focus:border-emerald-500 focus:outline-none transition-colors resize-none custom-scrollbar ui-element"></textarea>
    `;
    
    entry.querySelector('.btn-remove-report').addEventListener('click', function() {
        playSound(sfx.click);
        entry.remove();
    });
    
    container.appendChild(entry);
    
    // Подключаем звуки к новым элементам
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
    
    const enc_overlay = document.getElementById('encryption-overlay');
    const btn_skip = document.getElementById('btn-skip-anim');
    const anim_status = document.getElementById('anim-status');
    const anim_progress = document.getElementById('anim-progress');

    if(btn_add) {
        btn_add.addEventListener('click', addReportSection);
    }

    if(btn_open) {
        btn_open.addEventListener('click', () => {
            playSound(sfx.click);
            addSystemLog('Opening HR Registration Terminal');
            output_hash.value = '';
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
            submit_modal.classList.add('opacity-0');
            if(submit_box) submit_box.classList.remove('window-open-active');
            setTimeout(() => { submit_modal.classList.add('hidden'); }, 300);
        });
    }

    let pending_hash = "";

    // Функция завершения процесса шифровки
    function finishEncryption() {
        clearTimeout(encryption_timeout);
        clearInterval(progress_interval);
        stopSound(sfx.typing);
        playSound(sfx.docOpen);
        enc_overlay.classList.add('hidden');
        output_hash.value = pending_hash;
        addSystemLog(`Dossier packaged successfully.`);
    }

    if(btn_skip) {
        btn_skip.addEventListener('click', () => {
            playSound(sfx.click);
            finishEncryption();
        });
    }

    if(btn_encrypt) {
        btn_encrypt.addEventListener('click', () => {
            playSound(sfx.click);
            
            const name_val = document.getElementById('sub-name').value.trim() || "UNKNOWN";
            const initials = name_val.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

            // Сбор всех добавленных отчетов
            const reports_arr = [];
            document.querySelectorAll('.report-entry').forEach(entry => {
                const t = entry.querySelector('.report-title').value.trim() || "UNTITLED LOG";
                const c = entry.querySelector('.report-content').value.trim() || "No data provided.";
                reports_arr.push({ title: t, content: c });
            });

            // Формирование JSON объекта Досье
            const dossier_data = {
                id: document.getElementById('sub-id').value.trim() || "TBCW-XXX",
                name: name_val,
                age: parseInt(document.getElementById('sub-age').value) || 0,
                district: document.getElementById('sub-district').value.trim() || "Unknown",
                affiliation: document.getElementById('sub-aff').value || "Unknown",
                grade: document.getElementById('sub-grade').value,
                status: document.getElementById('sub-status').value,
                last_update: getMoscowTime(),
                photo: `https://placehold.co/400x400/0a0a0c/10b981?text=${initials}`,
                stats: {
                    fortitude: parseInt(document.getElementById('sub-f').value) || 1,
                    prudence: parseInt(document.getElementById('sub-p').value) || 1,
                    temperance: parseInt(document.getElementById('sub-t').value) || 1,
                    justice: parseInt(document.getElementById('sub-j').value) || 1
                },
                reports: reports_arr.length > 0 ? reports_arr : [{ title: "INITIAL LOG", content: "No data." }]
            };

            const json_str = JSON.stringify(dossier_data, null, 0); 
            const encrypted_str = encryptData(json_str);
            pending_hash = `"${encrypted_str}",`;
            
            // ЗАПУСК АНИМАЦИИ
            output_hash.value = "";
            enc_overlay.classList.remove('hidden');
            enc_overlay.classList.add('flex');
            playSound(sfx.typing);
            
            let progress = 0;
            anim_progress.style.width = '0%';
            
            const steps = [
                "> COMPILING BIOMETRICS...",
                "> SECURING VIRTUE METRICS...",
                "> ENCRYPTING REPORTS...",
                "> BYPASSING ROOT SECURITY...",
                "> FINALIZING HASH..."
            ];
            let step_idx = 0;

            // Таймер 4 секунды (50 итераций по 80мс = 4000мс)
            progress_interval = setInterval(() => {
                progress += 2;
                anim_progress.style.width = progress + '%';
                
                if (progress % 20 === 0 && step_idx < steps.length) {
                    anim_status.innerText = steps[step_idx];
                    anim_status.setAttribute('data-val', steps[step_idx]);
                    scrambleText([anim_status]);
                    step_idx++;
                }

                if(progress >= 100) {
                    finishEncryption();
                }
            }, 80);
        });
    }

    if(btn_copy) {
        btn_copy.addEventListener('click', () => {
            if(!output_hash.value) return;
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