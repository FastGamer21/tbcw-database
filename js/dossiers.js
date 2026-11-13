// --- ОБЩИЙ АУДИОПЛЕЕР МОДАЛКИ ---
// Один активный HTMLAudioElement на всё досье. Кнопка PLAY/PAUSE живёт
// в заголовке каждого репорта, у которого заполнено поле audio.

let current_log_audio = null;
let current_audio_ui = null;

function resetAudioUI() {
    if (current_audio_ui) {
        current_audio_ui.btn.innerText = "[ PLAY ]";
        current_audio_ui.bar.style.width = '0%';
        current_audio_ui.time.innerText = "00:00";
        current_audio_ui = null;
    }
}

function teardownModalAudio() {
    resetAudioUI();
    if (current_log_audio) {
        current_log_audio.pause();
        current_log_audio.src = '';
        current_log_audio = null;
    }
}

function setupReportAudio(reportsContainer) {
    reportsContainer.querySelectorAll('.report-audio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound(sfx.click);

            // Повторный клик по активной кнопке — это PLAY/PAUSE
            if (current_log_audio && current_audio_ui && current_audio_ui.btn === btn) {
                if (current_log_audio.paused) {
                    current_log_audio.play().catch(e => console.error("Audio playback error:", e));
                    btn.innerText = "[ PAUSE ]";
                } else {
                    current_log_audio.pause();
                    btn.innerText = "[ PLAY ]";
                }
                return;
            }

            // Переключение на другую запись: глушим старую, сбрасываем её UI
            if (current_log_audio) current_log_audio.pause();
            resetAudioUI();

            const wrap = btn.closest('.report-block');
            current_audio_ui = {
                btn: btn,
                bar: wrap.querySelector('.report-audio-progress'),
                time: wrap.querySelector('.report-audio-time')
            };

            current_log_audio = new Audio(btn.getAttribute('data-audio'));
            current_log_audio.volume = 0.5;
            current_log_audio.play().catch(e => console.error("Audio playback error:", e));
            btn.innerText = "[ PAUSE ]";

            current_log_audio.addEventListener('timeupdate', () => {
                if (!current_log_audio.duration || !current_audio_ui) return;
                const pct = (current_log_audio.currentTime / current_log_audio.duration) * 100;
                current_audio_ui.bar.style.width = (pct || 0) + '%';
                const m = Math.floor(current_log_audio.currentTime / 60).toString().padStart(2, '0');
                const s = Math.floor(current_log_audio.currentTime % 60).toString().padStart(2, '0');
                current_audio_ui.time.innerText = `${m}:${s}`;
            });

            current_log_audio.addEventListener('ended', () => {
                resetAudioUI();
                current_log_audio = null;
            });
        });
    });
}

function populateDistricts() {
    const select = document.getElementById('filter-district');
    if(!select || typeof dossiers === 'undefined') return;
    
    const uniqueDistricts = [...new Set(dossiers.map(d => d.district))].sort();
    
    select.innerHTML = '<option value="ALL">ALL DISTRICTS</option>';
    uniqueDistricts.forEach(dist => {
        select.innerHTML += `<option value="${dist}">${dist}</option>`;
    });
}

// УЛУЧШЕННЫЙ ТЕКСТОВЫЙ ПАРСЕР
function parseLogText(text) {
    if (!text) return "";
    
    // --- НОВЫЕ ФИЧИ ---
    // 1. Заголовки (начинаются с # )
    text = text.replace(/^#\s+(.*)$/gm, '<div class="text-sm font-bold theme-text mt-4 mb-2 border-b theme-border pb-1 uppercase tracking-widest">$1</div>');
    
    // 2. Списки (начинаются с - или * )
    text = text.replace(/^[-*]\s+(.*)$/gm, '<div class="flex gap-2 mb-1"><span class="theme-text font-bold">></span><span class="text-gray-300">$1</span></div>');
    
    // 3. Блок кода (многострочный)
    text = text.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<pre class="bg-[#020302] border border-gray-800 p-3 font-mono-custom text-[10px] text-gray-400 overflow-x-auto my-3 shadow-inner leading-relaxed">$1</pre>');
    
    // 4. Мигающий текст
    text = text.replace(/\[blink\](.*?)\[\/blink\]/gi, '<span class="theme-text font-bold animate-pulse uppercase tracking-wider" style="text-shadow: 0 0 8px currentColor;">$1</span>');
    
    // 5. Инлайн-теги (плашки)
    text = text.replace(/\[tag\](.*?)\[\/tag\]/gi, '<span class="bg-gray-900 border border-gray-700 text-gray-300 px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono-custom uppercase tracking-wider mx-1">$1</span>');

    // --- СТАРЫЕ ФИЧИ ---
    text = text.replace(/\|\|(.*?)\|\|/g, '<span class="log-redacted">$1</span>');
    text = text.replace(/^!\s+(.*)$/gm, '<div class="log-warning">⚠ WARNING: $1</div>');
    text = text.replace(/^>\s+(.*)$/gm, '<div class="log-quote">$1</div>');
    
    text = text.replace(/\[STAMP:\s*(APPROVED|DENIED|DECEASED|CLASSIFIED)\]/gi, (match, p1) => {
        const type = p1.toLowerCase();
        return `<div class="log-stamp stamp-${type}">${p1}</div>`;
    });

    text = text.replace(/\[c:([^\]]+)\](.*?)\[\/c\]/gi, (match, color, content) => {
        const safeColor = color.replace(/["';\\]/g, "");
        return `<span style="color: ${safeColor}; text-shadow: 0 0 8px ${safeColor}; font-weight: bold;">${content}</span>`;
    });

    text = text.replace(/\[h\](.*?)\[\/h\]/gi, '<span class="log-highlight">$1</span>');
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<span class="text-glitch-fx font-bold" data-val="$1">$1</span>');

    // --- ИНСТРУМЕНТЫ V0.9.14 ---
    text = text.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>');
    text = text.replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>');
    text = text.replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>');
    text = text.replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>');
    text = text.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="text-center">$1</div>');
    text = text.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div class="text-right">$1</div>');
    text = text.replace(/\[small\](.*?)\[\/small\]/gi, '<span class="text-[10px] text-gray-500 tracking-wider">$1</span>');
    text = text.replace(/\[img\]([^\[\]"\s]+?)\[\/img\]/gi, '<img src="$1" alt="" class="w-full border theme-border my-3" loading="lazy">');
    text = text.replace(/\[hr\]/gi, '<div class="border-t theme-border my-4"></div>');

    return text;
}

function renderCards() {
    const grid = document.getElementById('dossier-grid');
    if(!grid || typeof dossiers === 'undefined') return;
    
    const searchInput = document.getElementById('search-input');
    const districtSelect = document.getElementById('filter-district');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterDistrict = districtSelect ? districtSelect.value : 'ALL';

    grid.innerHTML = '';
    
    dossiers.forEach((person, index) => {
        const matchSearch = person.name.toLowerCase().includes(searchTerm) || person.id.toLowerCase().includes(searchTerm);
        const matchDistrict = filterDistrict === 'ALL' || person.district === filterDistrict;
        if (!matchSearch || !matchDistrict) return;

        const conf = status_config[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
        const card = document.createElement('div');
        
        card.className = `dossier-card p-4 flex flex-col h-full`;
        card.addEventListener('click', () => { playSound(sfx.click); openModal(index); });
        
        card.addEventListener('mousemove', (e) => {
            card.style.zIndex = "50";
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8; 
            const rotateY = ((x - centerX) / centerX) * 8;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.zIndex = "1";
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
        
        const hasAudio = (person.audio_log && person.audio_log.length > 5) ||
            (person.reports && person.reports.some(r => r.audio && r.audio.length > 5));
        const hasAudioIcon = hasAudio ? `<span class="theme-text text-[10px] font-bold theme-text-shadow">[ AUDIO ]</span>` : '';

        card.innerHTML = `<div class="flex gap-4 mb-4 relative z-10"><img src="${person.photo}" class="w-16 h-16 object-cover border theme-border grayscale"><div class="flex-1 min-w-0"><div class="text-[10px] font-mono-custom theme-text opacity-50 mb-1 flex justify-between"><span class="glitch-text" data-val="${person.id}">${person.id}</span> ${hasAudioIcon}</div><h3 class="font-bold text-gray-100 uppercase truncate text-sm glitch-text" data-val="${person.name}">${person.name}</h3><div class="text-xs theme-text opacity-70 truncate font-mono-custom glitch-text" data-val="${person.affiliation}">${person.affiliation}</div></div></div><div class="mt-auto relative z-10 space-y-2"><div class="flex justify-between text-[10px] font-mono-custom theme-text opacity-70 border-t theme-border pt-2"><span class="glitch-text" data-val="${person.district}">${person.district}</span><span class="glitch-text" data-val="${person.grade}">${person.grade}</span></div><div class="text-right"><span class="inline-block px-2 py-1 text-[9px] font-mono-custom uppercase tracking-widest ${conf.bg} ${conf.text} ${conf.border} border glitch-text" data-val="${person.status}">${person.status}</span></div></div>`;
        grid.appendChild(card);
    });
}

function openModal(index) {
    const person = dossiers[index];
    const conf = status_config[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
    
    document.getElementById('modal-photo').src = person.photo;
    const fields = ['id', 'name', 'age', 'district', 'affiliation', 'grade'];
    fields.forEach(f => {
        const el = document.getElementById('modal-'+f);
        if(el) { el.innerText = person[f]; el.setAttribute('data-val', person[f]); }
    });

    // Звание — опциональное поле: строка видна только если оно указано
    const rankLabel = document.getElementById('modal-rank-label');
    const rankEl = document.getElementById('modal-rank');
    if (rankLabel && rankEl) {
        if (person.rank) {
            rankLabel.style.display = '';
            rankEl.style.display = '';
            rankEl.innerText = person.rank;
            rankEl.setAttribute('data-val', person.rank);
        } else {
            rankLabel.style.display = 'none';
            rankEl.style.display = 'none';
        }
    }
    
    document.getElementById('modal-date').innerText = "LAST_MODIFIED: " + person.last_update;
    document.getElementById('modal-date').setAttribute('data-val', "LAST_MODIFIED: " + person.last_update);
    
    const statusEl = document.getElementById('modal-status');
    statusEl.innerText = person.status; statusEl.setAttribute('data-val', person.status);
    statusEl.className = `inline-block w-full text-center py-2 text-[11px] border uppercase tracking-widest font-mono-custom font-bold glitch-text ${conf.bg} ${conf.text} ${conf.border} ${conf.extra_class || ''}`;

    const tagsContainer = document.getElementById('modal-tags-container');
    if(tagsContainer) {
        tagsContainer.innerHTML = '';
        if (person.tags && person.tags.length > 0) {
            person.tags.forEach(tag => {
                tagsContainer.innerHTML += `<span class="px-2 py-1 theme-bg-heavy border theme-border text-[9px] theme-text font-mono-custom uppercase glitch-text" data-val="${tag}">${tag}</span>`;
            });
        } else {
            tagsContainer.innerHTML = `<span class="text-[9px] text-gray-600 font-mono-custom">NO DATA</span>`;
        }
    }

    const reportsContainer = document.getElementById('modal-reports');
    reportsContainer.innerHTML = '';

    // Корневой audio_log — легаси-поле: если репорты без аудио, вешаем его на первый репорт
    const rootAudio = (person.audio_log && person.audio_log.length > 5) ? person.audio_log : '';

    person.reports.forEach((report, rIdx) => {
        const parsedContent = parseLogText(report.content);
        const audioUrl = (report.audio && report.audio.length > 5) ? report.audio : (rIdx === 0 ? rootAudio : '');

        const reportEl = document.createElement('div');
        reportEl.className = 'report-block';
        reportEl.innerHTML = `
            <div class="flex items-center justify-between gap-3 border-b theme-border pb-1 mb-3">
                <h3 class="text-[10px] font-mono-custom theme-text uppercase tracking-wider glitch-text" data-val=">> ${report.title}">>> ${report.title}</h3>
            </div>
            ${audioUrl ? `
            <div class="flex items-center gap-3 mb-3 border theme-border theme-bg-heavy p-2">
                <button class="report-audio-btn theme-text hover:text-white font-mono-custom text-[10px] font-bold tracking-widest shrink-0 w-16 text-left ui-element" data-audio="${audioUrl}">[ PLAY ]</button>
                <div class="flex-1 h-1 bg-black border theme-border relative overflow-hidden">
                    <div class="report-audio-progress absolute top-0 left-0 h-full theme-bg-heavy w-0 transition-all duration-75"></div>
                </div>
                <span class="report-audio-time text-[10px] font-mono-custom theme-text w-10 text-right">00:00</span>
            </div>` : ''}
            <div class="whitespace-pre-line text-gray-300 text-sm pl-2 border-l theme-border leading-relaxed">${parsedContent}</div>
        `;
        reportsContainer.appendChild(reportEl);
    });

    teardownModalAudio();
    setupReportAudio(reportsContainer);

    const modal = document.getElementById('modal');
    const modalBox = document.getElementById('modal-box');
    modal.classList.remove('hidden');
    addSystemLog(`Accessing record ${person.id}`);
    
    setTimeout(() => { 
        modal.classList.remove('opacity-0');
        modalBox.classList.remove('opacity-0');
        playSound(sfx.docOpen);
        modalBox.classList.add('window-open-active');
        
        // РАСШИФРОВКА ТОЛЬКО ПРИ ПЕРВОМ ОТКРЫТИИ
        if (!person.isScrambled) {
            scrambleText(modal.querySelectorAll('.glitch-text'));
            person.isScrambled = true;
        }
    }, 10);
}

function closeModal() {
    playSound(sfx.click);
    teardownModalAudio();

    document.getElementById('modal').classList.add('opacity-0');
    document.getElementById('modal-box').classList.remove('window-open-active');
    setTimeout(() => { document.getElementById('modal').classList.add('hidden'); }, 300);
}