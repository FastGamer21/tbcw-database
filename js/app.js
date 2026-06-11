// --- TBCW CORE ENGINE // PROTOTYPE V.0.4.3 ---

// 1. ПРОДВИНУТЫЙ ЗВУКОВОЙ ДВИЖОК (AUDIO ENGINE)
class SoundEngine {
    constructor() {
        this.sounds = {};
        this.unlocked = false;
    }

    // Регистрация звука (Имя, Путь, Громкость, Зацикленность)
    register(name, src, volume = 1.0, loop = false) {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.loop = loop;
        audio.preload = 'auto'; // Заставляем браузер грузить звук до клика
        this.sounds[name] = audio;
    }

    // Разблокировка движка (Вызывается первым кликом по экрану)
    unlock() {
        this.unlocked = true;
    }

    // Проигрывание звука
    play(name) {
        if (!this.unlocked) return; // Браузер заблокирует звук, если не было клика
        
        const audio = this.sounds[name];
        if (!audio) {
            console.error(`[SFX ENGINE] Ошибка: Звук '${name}' не зарегистрирован.`);
            return;
        }

        try {
            // Если звук не зациклен, клонируем его для наслоения (чтобы быстрые клики не "глотались")
            if (!audio.loop) {
                const clone = audio.cloneNode();
                clone.volume = audio.volume;
                clone.play().catch(e => console.warn(`[SFX ENGINE] Ошибка воспроизведения '${name}':`, e));
            } else {
                // Зацикленные звуки (ambient, typing) играем напрямую
                if (audio.paused) {
                    audio.play().catch(e => console.warn(`[SFX ENGINE] Ошибка воспроизведения '${name}':`, e));
                }
            }
        } catch (e) {
            console.error(`[SFX ENGINE] Критическая ошибка звука '${name}':`, e);
        }
    }

    // Остановка зацикленного звука
    stop(name) {
        const audio = this.sounds[name];
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
}

// Инициализация движка
const sfx = new SoundEngine();

// РЕГИСТРАЦИЯ ФАЙЛОВ. 
// ВНИМАНИЕ: Проверь пути! Если папка sfx лежит внутри папки data, то путь будет 'data/sfx/hover.mp3'
sfx.register('hover', 'sfx/hover.mp3', 0.08);
sfx.register('click', 'sfx/click.mp3', 0.2);
sfx.register('typing', 'sfx/typing.mp3', 0.15, true); // true = зациклено
sfx.register('ambient', 'sfx/ambient.mp3', 0.25, true); // true = зациклено
sfx.register('docOpen', 'sfx/docopen.mp3', 0.3);
sfx.register('mapOpen', 'sfx/mapclick.mp3', 0.3);
sfx.register('mapHover', 'sfx/hover.mp3', 0.05); // Временно используем hover для карты
sfx.register('boot', 'sfx/boot.mp3', 0.2);

function attachHoverSounds() {
    document.querySelectorAll('.hover-sound, input, select, button').forEach(el => {
        el.addEventListener('mouseenter', () => sfx.play('hover'));
    });
}

// 2. ДВИЖОК КАРТЫ
function expandNodes(nodeNames, padding) {
    return nodeNames.map(name => {
        const [x, y] = nodes[name];
        const dx = x - 500; const dy = y - 500;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const ratio = (dist + padding) / dist;
        return [500 + dx * ratio, 500 + dy * ratio];
    });
}

function calculateCentroid(pts) {
    let x = 0, y = 0;
    pts.forEach(p => { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
}

function buildMap() {
    const outskirtsPts = expandNodes(baseOuterNodeNames, 40);
    const outskirtsPath = "M " + outskirtsPts.map(p => p.join(',')).join(' L ') + " Z";
    const mapOutskirts = document.getElementById('map-outskirts');
    if(mapOutskirts) mapOutskirts.innerHTML = `
        <path d="${outskirtsPath}" fill="rgba(30, 5, 5, 0.7)" stroke="rgba(220, 20, 20, 0.2)" stroke-width="2" stroke-dasharray="10,5"/>
        <text x="180" y="200" fill="rgba(220, 20, 20, 0.3)" font-family="Oswald" font-size="28" transform="rotate(-45 180,200)" font-weight="bold" letter-spacing="10">THE OUTSKIRTS</text>
        <text x="1000" y="200" fill="rgba(220, 20, 20, 0.3)" font-family="Oswald" font-size="28" transform="rotate(45 1000,200)" font-weight="bold" letter-spacing="10">THE OUTSKIRTS</text>
    `;

    const railsPts = expandNodes(baseOuterNodeNames, 100);
    const railsPath = "M " + railsPts.map(p => p.join(',')).join(' L ') + " Z";
    const mapRails = document.getElementById('map-rails');
    if(mapRails) mapRails.innerHTML = `
        <path d="${railsPath}" fill="none" stroke="rgba(220,20,20,0.2)" stroke-width="4"/>
        <path d="${railsPath}" fill="none" stroke="rgba(220,20,20,0.8)" stroke-width="14" stroke-dasharray="4, 20"/>
    `;

    const cityPts = baseOuterNodeNames.map(n => nodes[n]);
    const cityPath = "M " + cityPts.map(p => p.join(',')).join(' L ') + " Z";
    let districtsSvg = `<path d="${cityPath}" fill="#0a0303" />`;

    districtDefinitions.forEach(dist => {
        const pts = dist.nodes.map(n => nodes[n]);
        const pathStr = "M " + pts.map(p => p.join(',')).join(' L ') + " Z";
        const centroid = calculateCentroid(pts);
        const hasBranch = activeBranches.includes(dist.id);
        
        districtsSvg += `
            <g class="district-group">
                <path class="district-path" d="${pathStr}" />
                <text class="district-label-letter" x="${centroid[0]}" y="${centroid[1] + 5}">${dist.id}</text>
                <text class="district-label-num" x="${centroid[0]}" y="${centroid[1] + 20}">DISTRICT ${dist.num}</text>
                ${hasBranch ? `<g class="branch-flag" transform="translate(${centroid[0]-25}, ${centroid[1]-55}) scale(1.8)"><polygon points="0,0 14,9 0,18" fill="#000000"/><polygon points="28,0 14,9 28,18" fill="#000000"/><polygon points="0,0 28,0 14,9" fill="#ffffff"/><polygon points="0,18 28,18 14,9" fill="#ffffff"/><line x1="0" y1="0" x2="28" y2="18" stroke="#1d4ed8" stroke-width="2"/><line x1="0" y1="18" x2="28" y2="0" stroke="#1d4ed8" stroke-width="2"/><line x1="14" y1="0" x2="14" y2="18" stroke="#eab308" stroke-width="3"/><line x1="0" y1="9" x2="28" y2="9" stroke="#eab308" stroke-width="3"/><rect x="0" y="0" width="28" height="18" fill="none" stroke="#fff" stroke-width="0.5"/></g>` : ''}
            </g>`;
    });
    document.getElementById('map-districts').innerHTML = districtsSvg;
    document.querySelectorAll('.district-group').forEach(g => g.addEventListener('mouseenter', () => sfx.play('mapHover')));
}

const mapModal = document.getElementById('map-modal');
const svgContainer = document.getElementById('svg-container');

document.getElementById('btn-open-map').addEventListener('click', () => {
    sfx.play('click');
    mapModal.classList.remove('hidden');
    
    setTimeout(() => { 
        mapModal.classList.remove('opacity-0');
        sfx.play('mapOpen');
        svgContainer.classList.add('window-open-active');
    }, 10);
});

document.getElementById('btn-close-map').addEventListener('click', () => {
    sfx.play('click');
    mapModal.classList.add('opacity-0');
    svgContainer.classList.remove('window-open-active');
    setTimeout(() => { mapModal.classList.add('hidden'); }, 300);
});

// 3. ДОСЬЕ И МОДАЛКИ
function generateStatBar(statName, value, cssClass) {
    let blocks = '';
    for(let i = 1; i <= 5; i++) { blocks += `<div class="stat-segment ${cssClass} ${i <= value ? 'filled' : ''}"></div>`; }
    let valueTicks = value > 0 ? 'I'.repeat(value) : '-';
    return `
        <div>
            <div class="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
                <span class="uppercase">${statName}</span><span>${valueTicks}</span>
            </div>
            <div class="stat-bar-container">${blocks}</div>
        </div>`;
}

function renderCards() {
    const grid = document.getElementById('dossier-grid');
    grid.innerHTML = '';
    dossiers.forEach((person, index) => {
        const conf = statusConfig[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
        const card = document.createElement('div');
        card.className = `dossier-card p-4 flex flex-col h-full`;
        card.addEventListener('mouseenter', () => sfx.play('hover'));
        card.addEventListener('click', () => { sfx.play('click'); openModal(index); });
        card.innerHTML = `<div class="flex gap-4 mb-4 relative z-10"><img src="${person.photo}" class="w-16 h-16 object-cover border border-gray-800 grayscale"><div class="flex-1 min-w-0"><div class="text-[10px] font-mono-custom text-emerald-700/50 mb-1">${person.id}</div><h3 class="font-bold text-gray-200 uppercase truncate text-sm">${person.name}</h3><div class="text-xs text-gray-500 truncate font-mono-custom">${person.affiliation}</div></div></div><div class="mt-auto relative z-10"><span class="inline-block px-2 py-1 text-[9px] font-mono-custom uppercase tracking-widest ${conf.bg} ${conf.text} ${conf.border} border">${person.status}</span></div>`;
        grid.appendChild(card);
    });
}

function openModal(index) {
    const person = dossiers[index];
    document.getElementById('modal-photo').src = person.photo;
    document.getElementById('modal-id').textContent = person.id;
    document.getElementById('modal-age').textContent = person.age;
    document.getElementById('modal-district').textContent = person.district;
    document.getElementById('modal-affiliation').textContent = person.affiliation;
    document.getElementById('modal-grade').textContent = person.grade;
    document.getElementById('modal-name').textContent = person.name;
    document.getElementById('modal-date').textContent = "LAST_MODIFIED: " + person.lastUpdate;

    document.getElementById('modal-stats-container').innerHTML = 
        generateStatBar("Fortitude (Instinct)", person.stats.fortitude, "stat-fortitude") +
        generateStatBar("Prudence (Insight)", person.stats.prudence, "stat-prudence") +
        generateStatBar("Temperance (Attachment)", person.stats.temperance, "stat-temperance") +
        generateStatBar("Justice (Repression)", person.stats.justice, "stat-justice");

    const statusEl = document.getElementById('modal-status');
    const conf = statusConfig[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
    statusEl.textContent = person.status;
    statusEl.className = `inline-block w-full text-center py-2 text-[11px] border uppercase tracking-widest font-mono-custom font-bold ${conf.bg} ${conf.text} ${conf.border} ${conf.extraClass || ''}`;

    const reportsContainer = document.getElementById('modal-reports');
    reportsContainer.innerHTML = '';
    person.reports.forEach(report => {
        const reportEl = document.createElement('div');
        reportEl.innerHTML = `
            <h3 class="text-[10px] font-mono-custom text-emerald-600 mb-3 border-b border-gray-800/50 pb-1 uppercase tracking-wider">>> ${report.title}</h3>
            <p class="whitespace-pre-line text-gray-400 text-sm pl-2 border-l border-gray-800">${report.content}</p>`;
        reportsContainer.appendChild(reportEl);
    });

    const modal = document.getElementById('modal');
    const modalBox = document.getElementById('modal-box');
    modal.classList.remove('hidden');
    setTimeout(() => { 
        modal.classList.remove('opacity-0');
        sfx.play('docOpen');
        modalBox.classList.add('window-open-active');
    }, 10);
}

function closeModal() {
    sfx.play('click');
    const modal = document.getElementById('modal');
    const modalBox = document.getElementById('modal-box');
    modal.classList.add('opacity-0');
    modalBox.classList.remove('window-open-active');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal');
        const mapModal = document.getElementById('map-modal');
        if(!modal.classList.contains('hidden')) closeModal();
        if(!mapModal.classList.contains('hidden')) {
            mapModal.classList.add('opacity-0');
            document.getElementById('svg-container').classList.remove('window-open-active');
            setTimeout(() => { mapModal.classList.add('hidden'); }, 300);
        }
    }
});

// 4. ПЕЧАТНАЯ МАШИНКА
async function typeLine(container, textStr, speed = 35) {
    return new Promise(resolve => {
        const p = document.createElement('p');
        container.appendChild(p);
        
        sfx.play('typing');
        
        let i = 0;
        const interval = setInterval(() => {
            p.textContent += textStr.charAt(i);
            i++;
            if (i >= textStr.length) {
                clearInterval(interval);
                sfx.stop('typing');
                resolve();
            }
        }, speed);
    });
}

// 5. СТАРТ ТЕРМИНАЛА
window.onload = async () => {
    buildMap();
    const init = document.getElementById('init-screen');
    init.addEventListener('click', async () => {
        sfx.unlock(); // ВАЖНО: Разрешаем браузеру играть звуки
        sfx.play('click');
        
        init.style.opacity = '0';
        setTimeout(() => init.style.display = 'none', 500);

        const bootScreen = document.getElementById('boot-screen');
        bootScreen.className = "fixed inset-0 bg-black flex flex-col justify-center items-center z-[100] transition-opacity duration-500";
        sfx.play('boot');

        const bootText = document.getElementById('boot-text');
        const lines = [
            "> INITIALIZING TBCW DATABANK...", 
            "> CONNECTING TO THE BACKSTREETS NETWORK...", 
            "> VERIFYING SECURITY PROTOCOLS...", 
            "> DECRYPTING DOSSIER ARCHIVES...", 
            "> ACCESS GRANTED."
        ];
        
        for (let line of lines) {
            await typeLine(bootText, line, 25);
            await new Promise(r => setTimeout(r, 200));
        }

        sfx.play('ambient');

        bootScreen.style.opacity = '0';
        const mainUI = document.getElementById('main-ui');
        mainUI.classList.remove('hidden');
        mainUI.style.display = 'flex';

        setTimeout(() => { 
            bootScreen.style.display = 'none';
            mainUI.style.opacity = '1'; 
            renderCards(); 
            attachHoverSounds();
        }, 500);
    });
};