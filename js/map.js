// --- TBCW CITY MAP MODULE ---

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
    if(typeof nodes === 'undefined') return;
    
    const outskirtsPts = expandNodes(baseOuterNodeNames, 40);
    const outskirtsPath = "M " + outskirtsPts.map(p => p.join(',')).join(' L ') + " Z";
    const mapOutskirts = document.getElementById('map-outskirts');
    if(mapOutskirts) mapOutskirts.innerHTML = `<path d="${outskirtsPath}" fill="rgba(30, 5, 5, 0.7)" stroke="rgba(220, 20, 20, 0.2)" stroke-width="2" stroke-dasharray="10,5"/><text x="180" y="200" fill="rgba(220, 20, 20, 0.3)" font-family="Oswald" font-size="28" transform="rotate(-45 180,200)" font-weight="bold" letter-spacing="10">THE OUTSKIRTS</text><text x="1000" y="200" fill="rgba(220, 20, 20, 0.3)" font-family="Oswald" font-size="28" transform="rotate(45 1000,200)" font-weight="bold" letter-spacing="10">THE OUTSKIRTS</text>`;

    const railsPts = expandNodes(baseOuterNodeNames, 100);
    const railsPath = "M " + railsPts.map(p => p.join(',')).join(' L ') + " Z";
    const mapRails = document.getElementById('map-rails');
    if(mapRails) mapRails.innerHTML = `<path d="${railsPath}" fill="none" stroke="rgba(220,20,20,0.2)" stroke-width="4"/><path d="${railsPath}" fill="none" stroke="rgba(220,20,20,0.8)" stroke-width="14" stroke-dasharray="4, 20"/>`;

    const cityPts = baseOuterNodeNames.map(n => nodes[n]);
    const cityPath = "M " + cityPts.map(p => p.join(',')).join(' L ') + " Z";
    let districtsSvg = `<path d="${cityPath}" fill="#0a0303" />`;

    districtDefinitions.forEach(dist => {
        const pts = dist.nodes.map(n => nodes[n]);
        const pathStr = "M " + pts.map(p => p.join(',')).join(' L ') + " Z";
        const centroid = calculateCentroid(pts);
        const hasBranch = activeBranches.includes(dist.id);
        
        districtsSvg += `<g class="district-group"><path class="district-path" d="${pathStr}" /><text class="district-label-letter" x="${centroid[0]}" y="${centroid[1] + 5}">${dist.id}</text><text class="district-label-num" x="${centroid[0]}" y="${centroid[1] + 20}">DISTRICT ${dist.num}</text>${hasBranch ? `<g transform="translate(${centroid[0]-25}, ${centroid[1]-55}) scale(1.8)"><g class="branch-flag"><polygon points="0,0 14,9 0,18" fill="#000000"/><polygon points="28,0 14,9 28,18" fill="#000000"/><polygon points="0,0 28,0 14,9" fill="#ffffff"/><polygon points="0,18 28,18 14,9" fill="#ffffff"/><line x1="0" y1="0" x2="28" y2="18" stroke="#1d4ed8" stroke-width="2"/><line x1="0" y1="18" x2="28" y2="0" stroke="#1d4ed8" stroke-width="2"/><line x1="14" y1="0" x2="14" y2="18" stroke="#eab308" stroke-width="3"/><line x1="0" y1="9" x2="28" y2="9" stroke="#eab308" stroke-width="3"/><rect x="0" y="0" width="28" height="18" fill="none" stroke="#fff" stroke-width="0.5"/></g></g>` : ''}</g>`;
    });
    
    const mapContainer = document.getElementById('map-districts');
    if (mapContainer) {
        mapContainer.innerHTML = districtsSvg;
        document.querySelectorAll('.district-group').forEach(g => g.addEventListener('mouseenter', () => playSound(sfx.mapHover)));
    }
}

// Управление модальным окном карты
function setupMapControls() {
    const mapModal = document.getElementById('map-modal');
    const svgContainer = document.getElementById('svg-container');

    if(document.getElementById('btn-open-map')) {
        document.getElementById('btn-open-map').addEventListener('click', () => {
            playSound(sfx.click);
            addSystemLog('City Map radar activated');
            mapModal.classList.remove('hidden');
            
            setTimeout(() => { 
                mapModal.classList.remove('opacity-0');
                svgContainer.classList.remove('opacity-0');
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
}