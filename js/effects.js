// --- TBCW VISUAL EFFECTS & LOGGING ---

// Глобальная функция дешифровки пакетов данных Содружества
function decryptData(encrypted_str) {
    try {
        let decoded_base = atob(encrypted_str);
        return decodeURIComponent(escape(decoded_base));
    } catch (e) {
        console.error("CRITICAL ERROR: DATA CORRUPTION.");
        return "";
    }
}

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