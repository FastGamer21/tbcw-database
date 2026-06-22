// --- TBCW LORE ARCHIVES MODULE (DRAG AND DROP) ---

// Функция авто-цензуры секретных слов
function applyClassifiedRedaction(text) {
    // Слова, которые будут скрыты черными блоками
    const secretWords = ["Lobotomy Corporation", "White Nights", "Black Days", "Singularity", "The Head", "The Eye", "The Claw", "NEIN", "Distortions", "Eldritch Whales"];
    let redactedText = text;
    secretWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        redactedText = redactedText.replace(regex, `<span class="redacted" title="[ DECRYPT TO VIEW ]">${word}</span>`);
    });
    return redactedText;
}

function setupArchiveControls() {
    const archive_modal = document.getElementById('archive-modal');
    const archive_list = document.getElementById('archive-list');
    const archive_box = document.getElementById('archive-box');
    
    const reader_bay = document.getElementById('reader-bay');
    const reader_status = document.getElementById('reader-status');
    const decryption_screen = document.getElementById('decryption-screen');
    const decryption_text = document.getElementById('decryption-text');
    const reader_content = document.getElementById('archive-reader-content');

    if(document.getElementById('btn-open-archives')) {
        document.getElementById('btn-open-archives').addEventListener('click', () => {
            playSound(sfx.click);
            addSystemLog('Accessing secure lore archives');
            
            if(archive_list && archive_list.children.length === 0 && typeof lore_chapters !== 'undefined') {
                lore_chapters.forEach((chapter) => {
                    const li = document.createElement('li');
                    li.className = "cursor-grab active:cursor-grabbing group relative bg-[#050505] border border-gray-800 p-2 hover:border-emerald-500 transition-colors ui-element flex items-center gap-3";
                    li.draggable = true;
                    li.dataset.id = chapter.id; 
                    
                    // Обновленный дизайн физического картриджа
                    li.innerHTML = `
                        <div class="w-12 h-16 shrink-0 lore-drive flex flex-col relative group-hover:border-emerald-500 transition-colors pointer-events-none">
                            <div class="ml-2 flex-1 flex flex-col w-full bg-[#050505]/50">
                                <div class="h-2 w-full border-b border-emerald-900/50 flex justify-end items-center px-1 pt-1">
                                    <div class="w-1 h-1 rounded-full drive-led idle"></div>
                                </div>
                                <div class="flex-1 flex items-center justify-center pr-2">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-4 h-4 text-emerald-900 group-hover:text-emerald-500 transition-colors">
                                        <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M6 18h12M6 14h12M6 10h12" />
                                    </svg>
                                </div>
                            </div>
                            <div class="drive-serial font-mono-custom">SN-${Math.floor(1000 + Math.random()*9000)}</div>
                        </div>
                        <div class="flex-1 min-w-0 pointer-events-none pl-1">
                            <div class="text-[9px] text-emerald-700 font-mono-custom mb-0.5 glitch-text" data-val="${chapter.id}">${chapter.id}</div>
                            <div class="text-xs text-gray-300 font-bold truncate font-mono-custom glitch-text" data-val="${chapter.title}">${chapter.title}</div>
                        </div>
                    `;
                    
                    li.addEventListener('mouseenter', () => playSound(sfx.hover));
                    
                    li.addEventListener('dragstart', (e) => {
                        playSound(sfx.hover);
                        e.dataTransfer.setData('text/plain', chapter.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => li.classList.add('opacity-40'), 0);
                    });

                    li.addEventListener('dragend', () => {
                        li.classList.remove('opacity-40');
                    });

                    archive_list.appendChild(li);
                });
            }
            
            archive_modal.classList.remove('hidden');
            setTimeout(() => { 
                archive_modal.classList.remove('opacity-0');
                if(archive_box) archive_box.classList.add('window-open-active');
                playSound(sfx.docOpen);
                if(archive_list) scrambleText(archive_list.querySelectorAll('.glitch-text'));
            }, 10);
        });
    }

    if(reader_bay) {
        reader_bay.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
            reader_bay.classList.add('border-emerald-500');
            reader_status.innerText = "[ RELEASE TO MOUNT DRIVE ]";
        });

        reader_bay.addEventListener('dragleave', () => {
            reader_bay.classList.remove('border-emerald-500');
            reader_status.innerText = "[ AWAITING DRIVE INSERTION ]";
        });

        reader_bay.addEventListener('drop', (e) => {
            e.preventDefault();
            reader_bay.classList.remove('border-emerald-500');
            
            const drive_id = e.dataTransfer.getData('text/plain');
            const chapter = lore_chapters.find(c => c.id === drive_id);

            if(chapter) {
                processDriveInsertion(chapter);
            }
        });
    }

    function processDriveInsertion(chapter) {
        playSound(sfx.click); 
        playSound(sfx.typing); 

        // Схлопываем окно сканера сверху
        reader_bay.classList.remove('reader-empty');
        reader_bay.classList.add('reader-filled');

        reader_content.classList.add('hidden', 'opacity-0');
        decryption_screen.classList.remove('hidden');
        
        const hack_text = `> MOUNTING VOLUME [${chapter.id}]...\n> BYPASSING SECURE ENCRYPTION PROTOCOLS...\n> EXTRACTING DATA SECTORS [||||||||||||] 100%`;
        decryption_text.innerText = hack_text;
        decryption_text.setAttribute('data-val', hack_text);
        scrambleText([decryption_text]);

        addSystemLog(`Commencing decryption of ${chapter.id}`);

        // Возвращаем все диоды в ждущий красный режим
        document.querySelectorAll('.drive-led').forEach(led => {
            led.className = "w-1 h-1 rounded-full drive-led idle";
        });

        // Включаем зеленый диод у вставленного диска
        const active_drive = document.querySelector(`li[data-id="${chapter.id}"] .drive-led`);
        if(active_drive) {
            active_drive.className = "w-1.5 h-1.5 rounded-full drive-led active";
        }

        const decrypted_content = chapter.content;

        setTimeout(() => {
            playSound(sfx.docOpen);
            decryption_screen.classList.add('hidden');
            
            reader_content.classList.remove('hidden');
            setTimeout(() => reader_content.classList.remove('opacity-0'), 50);

            document.getElementById('archive-title').innerText = chapter.title;
            document.getElementById('archive-title').setAttribute('data-val', chapter.title);

            document.getElementById('archive-id').innerText = chapter.id;
            document.getElementById('archive-id').setAttribute('data-val', chapter.id);

            // Вставляем зацензуренный текст (innerHTML вместо innerText)
            document.getElementById('archive-content').innerHTML = applyClassifiedRedaction(decrypted_content);

            // Скремблим только заголовки, чтобы не сломать HTML тэгов цензуры
            scrambleText([document.getElementById('archive-title'), document.getElementById('archive-id')]);
            addSystemLog(`Decryption successful.`);
        }, 1800);
    }

    if(document.getElementById('btn-close-archive')) {
        document.getElementById('btn-close-archive').addEventListener('click', () => {
            playSound(sfx.click);
            archive_modal.classList.add('opacity-0');
            if(archive_box) archive_box.classList.remove('window-open-active');
            
            // Полный сброс ридера при закрытии окна
            setTimeout(() => { 
                archive_modal.classList.add('hidden'); 
                reader_bay.classList.remove('reader-filled');
                reader_bay.classList.add('reader-empty');
                reader_status.innerText = "[ AWAITING DRIVE INSERTION ]";
                reader_content.classList.add('hidden', 'opacity-0');
                document.querySelectorAll('.drive-led').forEach(led => {
                    led.className = "w-1 h-1 rounded-full drive-led idle";
                });
            }, 300);
        });
    }
}