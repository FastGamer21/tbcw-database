// --- TBCW AUDIO ENGINE ---

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
    document.querySelectorAll('.ui-element, input, select, .dossier-card').forEach(el => {
        el.addEventListener('mouseenter', () => playSound(sfx.hover));
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
            el.addEventListener('focus', () => playSound(sfx.click));
        } else {
            el.addEventListener('click', () => playSound(sfx.click));
        }
    });
}