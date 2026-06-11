// --- TBCW CORE ENGINE // PROTOTYPE V.0.4.4 ---

// 1. ЗВУКОВОЙ ДВИЖОК
const sfx = {
    hover: new Audio('sfx/hover.mp3'),
    click: new Audio('sfx/click.mp3'),
    typing: new Audio('sfx/typing.mp3'),
    ambient: new Audio('sfx/ambient.mp3'),
    docOpen: new Audio('sfx/docopen.mp3'),
    mapOpen: new Audio('sfx/mapclick.mp3'),
    mapHover: new Audio('sfx/hover.mp3')
};

Object.values(sfx).forEach(a => { a.volume = 0.2; a.loop = false; });
sfx.typing.loop = true; 
sfx.ambient.loop = true;

function playSound(audioObj) {
    try {
        if(audioObj.readyState > 0) audioObj.currentTime = 0;
        audioObj.play().catch(() => {});
    } catch (e) {}
}

function stopSound(audioObj) {
    try {
        audioObj.pause();
        audioObj.currentTime = 0;
    } catch (e) {}
}

function initGlobalSounds() {
    document.querySelectorAll('.ui-element, input, select').forEach(el => {
        el.addEventListener('mouseenter', () => playSound(sfx.hover));
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
            el.addEventListener('focus', () => playSound(sfx.click));
        } else {
            el.addEventListener('click', () => playSound(sfx.click));
        }
    });
}

// 2. ДИНАМИЧЕСКИЕ ЛОГИ
function addSystemLog(message, isError = false) {
    const list = document.getElementById('log-list');
    if (!list) return;
    const li = document.createElement('li');
    li.className = `flex gap-2 ui-element ${isError ? 'text-red-900 cursor-pointer hover:text-red-500' : ''}`;
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    li.innerHTML = `<span class="${isError ? 'text-red-900' : 'text-gray-500'}">[${timeStr}]</span> <span class="${isError ? 'text-red-800 glitch-text' : 'glitch-text'}" data-val="${message}">${message}</span>`;
    
    li.addEventListener('mouseenter', () => playSound(sfx.hover));
    if (isError) li.addEventListener('click', () => playSound(sfx.click));
    
    list.prepend(li);
    if(list.children.length > 8) list.lastChild.remove();
}

// 3. ЭФФЕКТ ДЕШИФРОВКИ
function scrambleText(elements) {
    playSound(sfx.typing);
    elements.forEach(el => {
        const originalText = el.getAttribute('data-val') || el.innerText || '';
        el.setAttribute('data-val', originalText);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let iterations = 0;
        const maxIterations = 10 + Math.random() * 15;
        
        const interval = setInterval(() => {
            if (iterations >= maxIterations) {
                clearInterval(interval);
                el.innerText = originalText;
            } else {
                let scrambled = "";
                for(let i=0; i<originalText.length; i++) {
                    scrambled += originalText[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
                }
                el.innerText = scrambled;
                iterations++;
            }
        }, 30);
    });
    setTimeout(() => stopSound(sfx.typing), 800);
}

// 4. ДВИЖОК КАРТЫ
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
    const mapContainer = document.getElementById('map-districts');
    if (mapContainer) mapContainer.innerHTML = districtsSvg;
    document.querySelectorAll('.district-group').forEach(g => g.addEventListener('mouseenter', () => playSound(sfx.mapHover)));
}

// 5. ДОСЬЕ И ГРИД
function generateStatBar(statName, value, cssClass) {
    let blocks = '';
    for(let i = 1; i <= 5; i++) { blocks += `<div class="stat-segment ${cssClass} ${i <= value ? 'filled' : ''}"></div>`; }
    let valueTicks = value > 0 ? 'I'.repeat(value) : '-';
    return `
        <div>
            <div class="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
                <span class="uppercase glitch-text" data-val="${statName}">${statName}</span>
                <span class="glitch-text" data-val="${valueTicks}">${valueTicks}</span>
            </div>
            <div class="stat-bar-container">${blocks}</div>
        </div>`;
}

function renderCards() {
    const grid = document.getElementById('dossier-grid');
    if(!grid) return;
    grid.innerHTML = '';
    dossiers.forEach((person, index) => {
        const conf = statusConfig[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
        const card = document.createElement('div');
        card.className = `dossier-card p-4 flex flex-col h-full ui-element`;
        card.addEventListener('mouseenter', () => playSound(sfx.hover));
        card.addEventListener('click', () => { 
            playSound(sfx.click); 
            openModal(index); 
        });
        card.innerHTML = `
            <div class="flex gap-4 mb-4 relative z-10">
                <img src="${person.photo}" class="w-16 h-16 object-cover border border-gray-800 grayscale">
                <div class="flex-1 min-w-0">
                    <div class="text-[10px] font-mono-custom text-emerald-700/50 mb-1 glitch-text" data-val="${person.id}">${person.id}</div>
                    <h3 class="font-bold text-gray-200 uppercase truncate text-sm glitch-text" data-val="${person.name}">${person.name}</h3>
                    <div class="text-xs text-gray-500 truncate font-mono-custom glitch-text" data-val="${person.affiliation}">${person.affiliation}</div>
                </div>
            </div>
            <div class="mt-auto relative z-10 space-y-2">
                <div class="flex justify-between text-[10px] font-mono-custom text-gray-600 border-t border-gray-800 pt-2">
                    <span class="glitch-text" data-val="${person.district}">${person.district}</span>
                    <span class="glitch-text" data-val="${person.grade}">${person.grade}</span>
                </div>
                <div class="text-right">
                    <span class="inline-block px-2 py-1 text-[9px] font-mono-custom uppercase tracking-widest ${conf.bg} ${conf.text} ${conf.border} border glitch-text" data-val="${person.status}">${person.status}</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// 6. МОДАЛЬНЫЕ ОКНА
function openModal(index) {
    const person = dossiers[index];
    const conf = statusConfig[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
    
    document.getElementById('modal-photo').src = person.photo;
    
    const idEl = document.getElementById('modal-id');
    const nameEl = document.getElementById('modal-name');
    const ageEl = document.getElementById('modal-age');
    const distEl = document.getElementById('modal-district');
    const affilEl = document.getElementById('modal-affiliation');
    const gradeEl = document.getElementById('modal-grade');
    const dateEl = document.getElementById('modal-date');
    const statusEl = document.getElementById('modal-status');
    const statsContainer = document.getElementById('modal-stats-container');
    const reportsContainer = document.getElementById('modal-reports');
    
    idEl.innerText = person.id; idEl.setAttribute('data-val', person.id);
    nameEl.innerText = person.name; nameEl.setAttribute('data-val', person.name);
    ageEl.innerText = person.age; ageEl.setAttribute('data-val', person.age);
    distEl.innerText = person.district; distEl.setAttribute('data-val', person.district);
    affilEl.innerText = person.affiliation; affilEl.setAttribute('data-val', person.affiliation);
    gradeEl.innerText = person.grade; gradeEl.setAttribute('data-val', person.grade);
    dateEl.innerText = "LAST_MODIFIED: " + person.lastUpdate; dateEl.setAttribute('data-val', "LAST_MODIFIED: " + person.lastUpdate);
    
    statusEl.innerText = person.status; 
    statusEl.setAttribute('data-val', person.status);
    statusEl.className = `inline-block w-full text-center py-2 text-[11px] border uppercase tracking-widest font-mono-custom font-bold glitch-text ${conf.bg} ${conf.text} ${conf.border} ${conf.extraClass || ''}`;

    statsContainer.innerHTML = 
        generateStatBar("Fortitude (Instinct)", person.stats.fortitude, "stat-fortitude") +
        generateStatBar("Prudence (Insight)", person.stats.prudence, "stat-prudence") +
        generateStatBar("Temperance (Attachment)", person.stats.temperance, "stat-temperance") +
        generateStatBar("Justice (Repression)", person.stats.justice, "stat-justice");

    reportsContainer.innerHTML = '';
    person.reports.forEach(report => {
        const reportEl = document.createElement('div');
        reportEl.innerHTML = `
            <h3 class="text-[10px] font-mono-custom text-emerald-600 mb-3 border-b border-gray-800/50 pb-1 uppercase tracking-wider glitch-text" data-val=">> ${report.title}">>> ${report.title}</h3>
            <p class="whitespace-pre-line text-gray-400 text-sm pl-2 border-l border-gray-800 glitch-text" data-val="${report.content}">${report.content}</p>`;
        reportsContainer.appendChild(reportEl);
    });

    const modal = document.getElementById('modal');
    const modalBox = document.getElementById('modal-box');
    modal.classList.remove('hidden');
    
    addSystemLog(`Accessing record ${person.id}`);
    
    setTimeout(() => { 
        modal.classList.remove('opacity-0');
        playSound(sfx.docOpen);
        modalBox.classList.add('window-open-active');
        
        scrambleText(modal.querySelectorAll('.glitch-text')); 
    }, 10);
}

function closeModal() {
    playSound(sfx.click);
    document.getElementById('modal').classList.add('opacity-0');
    document.getElementById('modal-box').classList.remove('window-open-active');
    setTimeout(() => { document.getElementById('modal').classList.add('hidden'); }, 300);
}

const mapModal = document.getElementById('map-modal');
const svgContainer = document.getElementById('svg-container');

if(document.getElementById('btn-open-map')) {
    document.getElementById('btn-open-map').addEventListener('click', () => {
        playSound(sfx.click);
        addSystemLog('City Map radar activated');
        mapModal.classList.remove('hidden');
        
        setTimeout(() => { 
            mapModal.classList.remove('opacity-0');
            playSound(sfx.mapOpen);
            svgContainer.classList.add('window-open-active');
        }, 10);
    });
}

if(document.getElementById('btn-close-map')) {
    document.getElementById('btn-close-map').addEventListener('click', () => {
        playSound(sfx.click);
        mapModal.classList.add('opacity-0');
        svgContainer.classList.remove('window-open-active');
        setTimeout(() => { mapModal.classList.add('hidden'); }, 300);
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if(!document.getElementById('modal').classList.contains('hidden')) closeModal();
        if(!mapModal.classList.contains('hidden')) {
            mapModal.classList.add('opacity-0');
            svgContainer.classList.remove('window-open-active');
            setTimeout(() => { mapModal.classList.add('hidden'); }, 300);
        }
    }
});

// 7. СТАРТ И ЗАГРУЗКА
async function typeLine(container, textStr, speed = 35) {
    const p = document.createElement('p');
    container.appendChild(p);
    playSound(sfx.typing);
    for (let char of textStr) {
        p.textContent += char;
        await new Promise(r => setTimeout(r, speed));
    }
    stopSound(sfx.typing);
}

document.addEventListener('DOMContentLoaded', () => {
    try { buildMap(); } catch(e) { console.error(e); }
    
    const init = document.getElementById('init-screen');
    const bootScreen = document.getElementById('boot-screen');
    const mainUI = document.getElementById('main-ui');
    
    if(!init || !bootScreen || !mainUI) return;

    init.addEventListener('click', async () => {
        playSound(sfx.click);
        init.style.opacity = '0';
        init.style.pointerEvents = 'none';
        setTimeout(() => init.style.display = 'none', 500);

        const bootText = document.getElementById('boot-text');
        const lines = ["> INITIALIZING TBCW DATABANK...", "> CONNECTING TO NETWORK...", "> DECRYPTING DOSSIER ARCHIVES...", "> ACCESS GRANTED."];
        for (let line of lines) {
            await typeLine(bootText, line);
            await new Promise(r => setTimeout(r, 200));
        }
        
        sfx.ambient.play().catch(() => {});
        
        bootScreen.style.opacity = '0';
        bootScreen.style.pointerEvents = 'none';
        
        setTimeout(() => {
            bootScreen.style.display = 'none';
            mainUI.classList.remove('hidden');
            
            setTimeout(() => { 
                mainUI.style.opacity = '1'; 
                renderCards(); 
                initGlobalSounds(); 
                scrambleText(document.querySelectorAll('#main-ui .glitch-text'));
            }, 50);
        }, 500);
    });
});