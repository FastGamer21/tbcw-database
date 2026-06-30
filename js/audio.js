// --- TBCW AUDIO ENGINE ---

const sfx = {
    ambient: new Audio('sfx/ambient.mp3'),
    boot: new Audio('sfx/boot.mp3'),
    click: new Audio('sfx/click.mp3'),
    docOpen: new Audio('sfx/docopen.mp3'),
    hover: new Audio('sfx/hover.mp3'),
    mapClick: new Audio('sfx/mapclick.mp3'),
    typing: new Audio('sfx/typing.mp3'),
    voicemes: new Audio('sfx/voicemes.mp3'),
    
    // Новые звуки (ОБНОВЛЕННЫЕ ИМЕНА ИЗ ТВОЕЙ ПАПКИ) 
    terminalStart: new Audio('sfx/terminal_start.mp3'), 
    scannerUse: new Audio('sfx/ScannerUse2.mp3'),
    keycardUse: new Audio('sfx/keycardUse.mp3'), // <-- Теперь совпадает 1 в 1
    pickItem: new Audio('sfx/pickItem.mp3')      // <-- Теперь совпадает 1 в 1
};

sfx.ambient.loop = true;
sfx.ambient.volume = 0.15;
sfx.typing.loop = true;
sfx.typing.volume = 0.3;

sfx.boot.volume = 0.5;
sfx.click.volume = 0.3;
sfx.docOpen.volume = 0.4;
sfx.hover.volume = 0.05;
sfx.mapClick.volume = 0.4;
sfx.voicemes.volume = 0.5;

sfx.terminalStart.volume = 0.6;
sfx.scannerUse.volume = 0.8; 
sfx.keycardUse.volume = 1.0; 
sfx.pickItem.volume = 1.0; 

function playSound(sound) {
    if (!sound) return;
    sound.currentTime = 0; 
    sound.play().catch(e => console.log("Audio play prevented: ", e));
}

function stopSound(sound) {
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
}

function fadeOutSound(sound, duration = 2000) {
    if (!sound || sound.paused) return;
    const step = sound.volume / (duration / 50);
    const fade = setInterval(() => {
        if (sound.volume - step > 0) {
            sound.volume -= step;
        } else {
            sound.volume = 0;
            sound.pause();
            clearInterval(fade);
        }
    }, 50);
}

function initGlobalSounds() {
    playSound(sfx.ambient);
}