// --- TBCW DOSSIERS MODULE ---

let current_log_audio = null;

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
    
    text = text.replace(/^#\s+(.*)$/gm, '<div class="text-sm font-bold theme-text mt-4 mb-2 border-b theme-border pb-1 uppercase tracking-widest">$1</div>');
    text = text.replace(/^-\s+(.*)$/gm, '<div class="flex gap-2 mb-1"><span class="theme-text font-bold">></span><span class="text-gray-300">$1</span></div>');
    text = text.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<pre class="bg-[#020302] border border-gray-800 p-3 font-mono-custom text-[10px] text-gray-400 overflow-x-auto my-3 shadow-inner leading-relaxed">$1</pre>');
    text = text.replace(/\[blink\](.*?)\[\/blink\]/gi, '<span class="theme-text font-bold animate-pulse uppercase tracking-wider" style="text-shadow: 0 0 8px currentColor;">$1</span>');
    text = text.replace(/\[tag\](.*?)\[\/tag\]/gi, '<span class="bg-gray-900 border border-gray-700 text-gray-300 px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono-custom uppercase tracking-wider mx-1">$1</span>');

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

    return text;
}

function generateStatBar(statName, value, cssClass) {
    let blocks = '';
    for(let i = 1; i <= 5; i++) { blocks += `<div class="stat-segment ${cssClass} ${i <= value ? 'filled' : ''}"></div>`; }
    let valueTicks = value > 0 ? 'I'.repeat(value) : '-';
    return `<div><div class="flex justify-between text-[10px] text-gray-500 mb-1 font-bold"><span class="uppercase glitch-text" data-val="${statName}">${statName}</span><span class="glitch-text" data-val="${valueTicks}">${valueTicks}</span></div><div class="stat-bar-container">${blocks}</div></div>`;
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
        
        // ФИКС АУДИО: Ищем аудиозаписи в самом досье или внутри его репортов
        let hasAudio = false;
        if (person.audio_log && person.audio_log.length > 5) hasAudio = true;
        if (person.reports && person.reports.some(r => r.audio && r.audio.length > 5)) hasAudio = true;
        
        const hasAudioIcon = hasAudio ? `<span class="theme-text text-[10px] font-bold theme-text-shadow">[ AUDIO ]</span>` : '';

        card.innerHTML = `<div class="flex gap-4 mb-4 relative z-10"><img src="${person.photo}" class="w-16 h-16 object-cover border theme-border grayscale"><div class="flex-1 min-w-0"><div class="text-[10px] font-mono-custom theme-text opacity-50 mb-1 glitch-text flex justify-between" data-val="${person.id}"><span>${person.id}</span> ${hasAudioIcon}</div><h3 class="font-bold text-gray-100 uppercase truncate text-sm glitch-text" data-val="${person.name}">${person.name}</h3><div class="text-xs theme-text opacity-70 truncate font-mono-custom glitch-text" data-val="${person.affiliation}">${person.affiliation}</div></div></div><div class="mt-auto relative z-10 space-y-2"><div class="flex justify-between text-[10px] font-mono-custom theme-text opacity-70 border-t theme-border pt-2"><span class="glitch-text" data-val="${person.district}">${person.district}</span><span class="glitch-text" data-val="${person.grade}">${person.grade}</span></div><div class="text-right"><span class="inline-block px-2 py-1 text-[9px] font-mono-custom uppercase tracking-widest ${conf.bg} ${conf.text} ${conf.border} border glitch-text" data-val="${person.status}">${person.status}</span></div></div>`;
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
    person.reports.forEach(report => {
        const parsedContent = parseLogText(report.content);
        
        const reportEl = document.createElement('div');
        reportEl.innerHTML = `
            <h3 class="text-[10px] font-mono-custom theme-text mb-3 border-b theme-border pb-1 uppercase tracking-wider glitch-text" data-val=">> ${report.title}">>> ${report.title}</h3>
            <div class="whitespace-pre-line text-gray-300 text-sm pl-2 border-l theme-border leading-relaxed">${parsedContent}</div>
        `;
        reportsContainer.appendChild(reportEl);
    });

    const audio_container = document.getElementById('modal-audio-container');
    const btn_play = document.getElementById('btn-play-log');
    
    if (current_log_audio) { current_log_audio.pause(); current_log_audio = null; }
    
    document.getElementById('log-progress').style.width = '0%';
    document.getElementById('log-time').innerText = "00:00";

    const new_btn_play = btn_play.cloneNode(true);
    btn_play.parentNode.replaceChild(new_btn_play, btn_play);
    new_btn_play.innerText = "[ PLAY ]";

    // ФИКС АУДИО: Достаем ссылку на аудио либо из корня досье, либо из первого подходящего репорта
    let activeAudioLog = person.audio_log || "";
    if (!activeAudioLog && person.reports) {
        const reportWithAudio = person.reports.find(r => r.audio && r.audio.length > 5);
        if (reportWithAudio) activeAudioLog = reportWithAudio.audio;
    }

    if (activeAudioLog && activeAudioLog.length > 5) {
        audio_container.classList.remove('hidden');
        current_log_audio = new Audio(activeAudioLog);
        current_log_audio.volume = 0.5;
        
        new_btn_play.addEventListener('click', () => {
            playSound(sfx.click);
            if (current_log_audio.paused) {
                current_log_audio.play().catch(e => console.error("Audio playback error:", e));
                new_btn_play.innerText = "[ PAUSE ]";
            } else {
                current_log_audio.pause();
                new_btn_play.innerText = "[ PLAY ]";
            }
        });

        current_log_audio.addEventListener('timeupdate', () => {
            if(!current_log_audio.duration) return;
            const pct = (current_log_audio.currentTime / current_log_audio.duration) * 100;
            document.getElementById('log-progress').style.width = (pct || 0) + '%';
            
            const m = Math.floor(current_log_audio.currentTime / 60).toString().padStart(2, '0');
            const s = Math.floor(current_log_audio.currentTime % 60).toString().padStart(2, '0');
            document.getElementById('log-time').innerText = `${m}:${s}`;
        });
        
        current_log_audio.addEventListener('ended', () => {
            new_btn_play.innerText = "[ PLAY ]";
            document.getElementById('log-progress').style.width = '0%';
            document.getElementById('log-time').innerText = "00:00";
        });
    } else {
        audio_container.classList.add('hidden');
    }

    const modal = document.getElementById('modal');
    const modalBox = document.getElementById('modal-box');
    modal.classList.remove('hidden');
    addSystemLog(`Accessing record ${person.id}`);
    
    setTimeout(() => { 
        modal.classList.remove('opacity-0');
        modalBox.classList.remove('opacity-0');
        playSound(sfx.docOpen);
        modalBox.classList.add('window-open-active');
        
        if (!person.isScrambled) {
            scrambleText(modal.querySelectorAll('.glitch-text:not(#log-time)'));
            person.isScrambled = true;
        }
    }, 10);
}

function closeModal() {
    playSound(sfx.click);
    
    if (current_log_audio) {
        current_log_audio.pause();
        current_log_audio.currentTime = 0;
    }

    document.getElementById('modal').classList.add('opacity-0');
    document.getElementById('modal-box').classList.remove('window-open-active');
    setTimeout(() => { document.getElementById('modal').classList.add('hidden'); }, 300);
}