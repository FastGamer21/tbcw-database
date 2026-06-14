// --- TBCW ENTRY POINT & GLOBAL EVENTS ---

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal');
        const map_modal = document.getElementById('map-modal');
        const archive_modal = document.getElementById('archive-modal');
        const archive_box = document.getElementById('archive-box');

        if(modal && !modal.classList.contains('hidden')) closeModal();
        if(map_modal && !map_modal.classList.contains('hidden')) { 
            map_modal.classList.add('opacity-0'); 
            setTimeout(() => map_modal.classList.add('hidden'), 300); 
        }
        if(archive_modal && !archive_modal.classList.contains('hidden')) { 
            archive_modal.classList.add('opacity-0'); 
            if(archive_box) archive_box.classList.remove('window-open-active');
            setTimeout(() => archive_modal.classList.add('hidden'), 300); 
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    try { buildMap(); } catch(e) { console.error("Map build failed:", e); }
    try { setupMapControls(); } catch(e) { console.error("Map controls failed:", e); }
    try { setupArchiveControls(); } catch(e) { console.error("Archive controls failed:", e); }
    
    const init = document.getElementById('init-screen');
    const boot_screen = document.getElementById('boot-screen');
    const main_ui = document.getElementById('main-ui');
    
    if(!init || !boot_screen || !main_ui) return;

    init.addEventListener('click', async () => {
        playSound(sfx.click);
        init.style.opacity = '0';
        init.style.pointerEvents = 'none';
        setTimeout(() => init.style.display = 'none', 500);

        const boot_text = document.getElementById('boot-text');
        const lines = ["> INITIALIZING TBCW DATABANK...", "> CONNECTING TO NETWORK...", "> DECRYPTING SECURE ARCHIVES...", "> ACCESS GRANTED."];
        
        if (typeof encrypted_dossiers !== 'undefined') {
            encrypted_dossiers.forEach(enc_str => {
                const decoded = decryptData(enc_str);
                if(decoded) {
                    try { 
                        dossiers.push(JSON.parse(decoded)); 
                    } catch(e) {
                        console.error("Failed to parse dossier json:", e);
                    }
                }
            });
        }

        if (typeof encrypted_lore !== 'undefined') {
            encrypted_lore.forEach(enc_str => {
                const decoded = decryptData(enc_str);
                if(decoded) {
                    try { 
                        lore_chapters.push(JSON.parse(decoded)); 
                    } catch(e) {
                        console.error("Failed to parse lore json:", e);
                    }
                }
            });
        }

        for (let line of lines) { 
            await typeLine(boot_text, line); 
            await new Promise(r => setTimeout(r, 200)); 
        }
        
        sfx.ambient.play().catch(() => {});
        boot_screen.style.opacity = '0'; 
        boot_screen.style.pointerEvents = 'none';
        
        setTimeout(() => {
            boot_screen.style.display = 'none';
            main_ui.classList.remove('hidden');
            setTimeout(() => { 
                main_ui.style.opacity = '1'; 
                renderCards(); 
                initGlobalSounds(); 
                scrambleText(document.querySelectorAll('#main-ui .glitch-text'));
            }, 50);
        }, 500);
    });
});