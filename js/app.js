// --- LOGIC & RENDERING ---

function expandNodes(nodeNames, padding) {
    return nodeNames.map(name => {
        const [x, y] = nodes[name];
        const dx = x - 500;
        const dy = y - 500;
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
    document.getElementById('map-outskirts').innerHTML = `
        <path d="${outskirtsPath}" fill="rgba(30, 5, 5, 0.7)" stroke="rgba(220, 20, 20, 0.2)" stroke-width="2" stroke-dasharray="10,5"/>
        <text x="180" y="200" fill="rgba(220, 20, 20, 0.3)" font-family="Oswald" font-size="28" transform="rotate(-45 180,200)" font-weight="bold" letter-spacing="10">THE OUTSKIRTS</text>
        <text x="1000" y="200" fill="rgba(220, 20, 20, 0.3)" font-family="Oswald" font-size="28" transform="rotate(45 1000,200)" font-weight="bold" letter-spacing="10">THE OUTSKIRTS</text>
    `;

    const railsPts = expandNodes(baseOuterNodeNames, 100);
    const railsPath = "M " + railsPts.map(p => p.join(',')).join(' L ') + " Z";
    document.getElementById('map-rails').innerHTML = `
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
        
        const flagSVG = hasBranch ? `
            <g class="branch-flag" transform="translate(${centroid[0] - 25}, ${centroid[1] - 55}) scale(1.8)">
                <polygon points="0,0 14,9 0,18" fill="#000000"/>
                <polygon points="28,0 14,9 28,18" fill="#000000"/>
                <polygon points="0,0 28,0 14,9" fill="#ffffff"/>
                <polygon points="0,18 28,18 14,9" fill="#ffffff"/>
                <line x1="0" y1="0" x2="28" y2="18" stroke="#1d4ed8" stroke-width="2"/>
                <line x1="0" y1="18" x2="28" y2="0" stroke="#1d4ed8" stroke-width="2"/>
                <line x1="14" y1="0" x2="14" y2="18" stroke="#eab308" stroke-width="3"/>
                <line x1="0" y1="9" x2="28" y2="9" stroke="#eab308" stroke-width="3"/>
                <rect x="0" y="0" width="28" height="18" fill="none" stroke="#fff" stroke-width="0.5"/>
            </g>
        ` : '';

        districtsSvg += `
            <g class="district-group">
                <path class="district-path" d="${pathStr}" />
                <text class="district-label-letter" x="${centroid[0]}" y="${centroid[1] + 5}">${dist.id}</text>
                <text class="district-label-num" x="${centroid[0]}" y="${centroid[1] + 20}">DISTRICT ${dist.num}</text>
                ${flagSVG}
            </g>`;
    });
    document.getElementById('map-districts').innerHTML = districtsSvg;
}

// --- ЛОГИКА ОТКРЫТИЯ/ЗАКРЫТИЯ ОКНА КАРТЫ ---
const mapModal = document.getElementById('map-modal');
document.getElementById('btn-open-map').addEventListener('click', () => {
    mapModal.classList.remove('hidden');
    setTimeout(() => { mapModal.classList.remove('opacity-0'); }, 10);
});
document.getElementById('btn-close-map').addEventListener('click', () => {
    mapModal.classList.add('opacity-0');
    setTimeout(() => { mapModal.classList.add('hidden'); }, 300);
});

// --- ЛОГИКА ДОСЬЕ И КАРТОЧЕК ---
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
        card.addEventListener('click', () => { openModal(index); });
        card.innerHTML = `
            <div class="flex gap-4 mb-4 relative z-10">
                <img src="${person.photo}" class="w-16 h-16 object-cover border border-gray-800 grayscale">
                <div class="flex-1 min-w-0">
                    <div class="text-[10px] font-mono-custom text-emerald-700/50 mb-1">${person.id}</div>
                    <h3 class="font-bold text-gray-200 uppercase truncate text-sm md:text-base">${person.name}</h3>
                    <div class="text-xs text-gray-500 truncate font-mono-custom">${person.affiliation}</div>
                </div>
            </div>
            <div class="mt-auto relative z-10 space-y-2">
                <div class="flex justify-between text-[10px] font-mono-custom text-gray-600 border-t border-gray-800 pt-2">
                    <span>${person.district}</span><span>${person.grade}</span>
                </div>
                <div class="text-right">
                    <span class="inline-block px-2 py-1 text-[9px] font-mono-custom uppercase tracking-widest ${conf.bg} ${conf.text} ${conf.border} border ${conf.extraClass || ''}">${person.status}</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

const modal = document.getElementById('modal');
function openModal(index) {
    const person = dossiers[index];
    const conf = statusConfig[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };

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

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
}

function closeModal() {
    modal.classList.add('opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if(!modal.classList.contains('hidden')) closeModal();
        if(!mapModal.classList.contains('hidden')) {
            mapModal.classList.add('opacity-0');
            setTimeout(() => { mapModal.classList.add('hidden'); }, 300);
        }
    }
});

// --- АВТОЗАГРУЗКА ---
window.onload = async () => {
    buildMap();

    const bootScreen = document.getElementById('boot-screen');
    const bootText = document.getElementById('boot-text');

    const lines = ["> INITIALIZING TBCW DATABANK...", "> CONNECTING TO THE BACKSTREETS NETWORK...", "> VERIFYING SECURITY PROTOCOLS...", "> DECRYPTING DOSSIER ARCHIVES...", "> ACCESS GRANTED."];
    for (let i = 0; i < lines.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const p = document.createElement('p');
        p.textContent = lines[i];
        bootText.appendChild(p);
    }
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mainUI = document.getElementById('main-ui');
    
    // ЖЁСТКИЙ ФОЛБЭК: Меняем стили напрямую через JavaScript
    bootScreen.style.transition = 'opacity 0.5s ease';
    bootScreen.style.opacity = '0';
    mainUI.classList.remove('hidden'); // Для Tailwind
    mainUI.style.display = 'flex';     // Бронебойный показ интерфейса
    
    setTimeout(() => {
        bootScreen.style.display = 'none'; // Полностью удаляем черный экран
        mainUI.style.opacity = '1';
        renderCards();
    }, 500);
};