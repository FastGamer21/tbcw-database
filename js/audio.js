// --- TBCW AUDIO ENGINE ---

const sfx = {
    hover: new Audio('sfx/hover.mp3'),
    click: new Audio('sfx/click.mp3'),
    typing: new Audio('sfx/typing.mp3'),
    ambient: new Audio('sfx/ambient.mp3'),
    docOpen: new Audio('sfx/docopen.mp3'),
    mapOpen: new Audio('sfx/mapclick.mp3'),
    mapHover: new Audio('sfx/hover.mp3'),

    // --- НОВЫЕ ЗВУКИ ДЛЯ ЭКРАНА ВХОДА (ПОКА ЗАКОММЕНТИРОВАНЫ) ---
    // Для активации просто раскомментируй строки ниже
    // pickup: new Audio('sfx/card_pickup.mp3'),
    // insert: new Audio('sfx/card_insert.mp3'),
    // granted: new Audio('sfx/access_granted_beep.mp3'),
    // crt: new Audio('sfx/crt_monitor_power_on.mp3')
};

// Задаем базовые настройки, игнорируя закомментированные (undefined) звуки
Object.values(sfx).forEach(a => { 
    if(a) {
        a.volume = 0.2; 
        a.loop = false; 
    }
});

if(sfx.typing) sfx.typing.loop = true; 
if(sfx.ambient) sfx.ambient.loop = true;

function playSound(audioObj) {
    try {
        if(!audioObj) return; // Защита от краша при вызове закомментированного звука
        if(audioObj.readyState > 0) audioObj.currentTime = 0;
        audioObj.play().catch(() => {});
    } catch (e) {}
}

function stopSound(audioObj) {
    try {
        if(!audioObj) return;
        audioObj.pause();
        audioObj.currentTime = 0;
    } catch (e) {}
}

function initGlobalSounds() {
    document.querySelectorAll('.ui-element, input, select, .dossier-card').forEach(el => {
        el.addEventListener('mouseenter', () => playSound(sfx.hover));
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
            el.addEventListener('focus', () => playSound(sfx.click));
        } else {
            el.addEventListener('click', () => playSound(sfx.click));
        }
    });
}