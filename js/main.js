// --- TBCW ENTRY POINT & GLOBAL EVENTS ---

// Глобальное закрытие окон на клавишу Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal');
        const mapModal = document.getElementById('map-modal');
        const archiveModal = document.getElementById('archive-modal');
        const archiveBox = document.getElementById('archive-box');

        if(modal && !modal.classList.contains('hidden')) closeModal();
        if(mapModal && !mapModal.classList.contains('hidden')) { 
            mapModal.classList.add('opacity-0'); 
            setTimeout(() => mapModal.classList.add('hidden'), 300); 
        }
        if(archiveModal && !archiveModal.classList.contains('hidden')) { 
            archiveModal.classList.add('opacity-0'); 
            if(archiveBox) archiveBox.classList.remove('window-open-active');
            setTimeout(() => archiveModal.classList.add('hidden'), 300); 
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация всех интерфейсов
    try { buildMap(); } catch(e) { console.error("Map build failed:", e); }
    try { setupMapControls(); } catch(e) { console.error("Map controls failed:", e); }
    try { setupArchiveControls(); } catch(e) { console.error("Archive controls failed:", e); }
    
    // 2. Логика загрузочного терминала
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
        
        // 3. Открытие главного интерфейса
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