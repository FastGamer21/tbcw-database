// --- TBCW LORE ARCHIVES MODULE (DRAG AND DROP) ---

function setupArchiveControls() {
    const archiveModal = document.getElementById('archive-modal');
    const archiveList = document.getElementById('archive-list');
    const archiveBox = document.getElementById('archive-box');
    
    // Элементы считывателя
    const readerBay = document.getElementById('reader-bay');
    const readerStatus = document.getElementById('reader-status');
    const decryptionScreen = document.getElementById('decryption-screen');
    const decryptionText = document.getElementById('decryption-text');
    const readerContent = document.getElementById('archive-reader-content');

    if(document.getElementById('btn-open-archives')) {
        document.getElementById('btn-open-archives').addEventListener('click', () => {
            playSound(sfx.click);
            addSystemLog('Accessing secure lore archives');
            
            if(archiveList && archiveList.children.length === 0 && typeof loreChapters !== 'undefined') {
                loreChapters.forEach((chapter) => {
                    // Создаем Draggable элемент
                    const li = document.createElement('li');
                    li.className = "cursor-grab active:cursor-grabbing group relative bg-[#050505] border border-gray-800 p-3 hover:border-emerald-500 transition-colors ui-element flex items-center gap-4";
                    li.draggable = true;
                    li.dataset.id = chapter.id; // Привязываем ID для передачи при Drag-and-Drop
                    
                    // Строгий минималистичный векторный диск
                    li.innerHTML = `
                        <div class="w-12 h-16 shrink-0 border border-emerald-900 bg-black flex flex-col relative overflow-hidden group-hover:border-emerald-500 transition-colors pointer-events-none">
                            <div class="h-2 w-full border-b border-emerald-900 flex justify-evenly items-end px-1">
                                <div class="w-1 h-1 bg-emerald-900 group-hover:bg-emerald-500"></div>
                                <div class="w-1 h-1 bg-emerald-900 group-hover:bg-emerald-500"></div>
                                <div class="w-1 h-1 bg-emerald-900 group-hover:bg-emerald-500"></div>
                            </div>
                            <div class="flex-1 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-emerald-900 group-hover:text-emerald-500">
                                    <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M6 18h12M6 14h12M6 10h12" />
                                </svg>
                            </div>
                            <div class="h-3 w-full border-t border-emerald-900 flex items-center px-1">
                                <div class="w-1.5 h-1.5 rounded-full bg-red-900 group-hover:bg-yellow-500 transition-colors shadow-[0_0_5px_rgba(0,0,0,0)] group-hover:shadow-[0_0_8px_rgba(234,179,8,0.8)] drive-led"></div>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0 pointer-events-none">
                            <div class="text-[9px] text-emerald-700 font-mono-custom mb-0.5 glitch-text" data-val="${chapter.id}">${chapter.id}</div>
                            <div class="text-xs text-gray-300 font-bold truncate font-mono-custom glitch-text" data-val="${chapter.title}">${chapter.title}</div>
                        </div>
                    `;
                    
                    li.addEventListener('mouseenter', () => playSound(sfx.hover));
                    
                    // ЛОГИКА ПЕРЕТАСКИВАНИЯ (Drag Start)
                    li.addEventListener('dragstart', (e) => {
                        playSound(sfx.hover);
                        e.dataTransfer.setData('text/plain', chapter.id);
                        e.dataTransfer.effectAllowed = 'move';
                        // Визуальная полупрозрачность перетаскиваемого элемента
                        setTimeout(() => li.classList.add('opacity-40'), 0);
                    });

                    li.addEventListener('dragend', () => {
                        li.classList.remove('opacity-40');
                    });

                    archiveList.appendChild(li);
                });
            }
            
            archiveModal.classList.remove('hidden');
            setTimeout(() => { 
                archiveModal.classList.remove('opacity-0');
                if(archiveBox) archiveBox.classList.add('window-open-active');
                playSound(sfx.docOpen);
                if(archiveList) scrambleText(archiveList.querySelectorAll('.glitch-text'));
            }, 10);
        });
    }

    // ЛОГИКА ПРИЕМНИКА (Drop Zone)
    if(readerBay) {
        // Разрешаем сброс в эту зону
        readerBay.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
            readerBay.classList.add('border-emerald-500', 'bg-emerald-900/20');
            readerStatus.innerText = "[ RELEASE TO INSERT ]";
        });

        // Если увели мышку из зоны
        readerBay.addEventListener('dragleave', () => {
            readerBay.classList.remove('border-emerald-500', 'bg-emerald-900/20');
            readerStatus.innerText = "[ DRAG AND DROP ARCHIVE DRIVE HERE ]";
        });

        // Момент сброса диска
        readerBay.addEventListener('drop', (e) => {
            e.preventDefault();
            readerBay.classList.remove('border-emerald-500', 'bg-emerald-900/20');
            readerStatus.innerText = "[ DRAG AND DROP ARCHIVE DRIVE HERE ]";
            
            const driveId = e.dataTransfer.getData('text/plain');
            const chapter = loreChapters.find(c => c.id === driveId);

            if(chapter) {
                processDriveInsertion(chapter);
            }
        });
    }

    // СЕКВЕНСОР ВЗЛОМА
    function processDriveInsertion(chapter) {
        playSound(sfx.click); // Звук вставки
        playSound(sfx.typing); // Звук вычислений терминала

        // Скрываем старый контент
        readerContent.classList.add('hidden', 'opacity-0');
        
        // Показываем терминал взлома
        decryptionScreen.classList.remove('hidden');
        
        const hackText = `> MOUNTING VOLUME [${chapter.id}]...\n> BYPASSING SECURE ENCRYPTION PROTOCOLS...\n> EXTRACTING DATA SECTORS [||||||||||||] 100%`;
        decryptionText.innerText = hackText;
        decryptionText.setAttribute('data-val', hackText);
        scrambleText([decryptionText]);

        addSystemLog(`Commencing decryption of ${chapter.id}`);

        // Сброс диодов на всех дисках на полке
        document.querySelectorAll('.drive-led').forEach(led => {
            led.className = "w-1.5 h-1.5 rounded-full bg-red-900 group-hover:bg-yellow-500 transition-colors shadow-[0_0_5px_rgba(0,0,0,0)] group-hover:shadow-[0_0_8px_rgba(234,179,8,0.8)] drive-led";
        });

        // Зажигаем зеленый диод на вставленном диске
        const activeDrive = document.querySelector(`li[data-id="${chapter.id}"] .drive-led`);
        if(activeDrive) {
            activeDrive.classList.remove('bg-red-900', 'group-hover:bg-yellow-500');
            activeDrive.classList.add('bg-emerald-500', 'shadow-[0_0_8px_rgba(16,185,129,0.8)]');
        }

        // Через 1.8 секунды показываем лор
        setTimeout(() => {
            playSound(sfx.docOpen);
            decryptionScreen.classList.add('hidden');
            
            readerContent.classList.remove('hidden');
            setTimeout(() => readerContent.classList.remove('opacity-0'), 50);

            document.getElementById('archive-title').innerText = chapter.title;
            document.getElementById('archive-title').setAttribute('data-val', chapter.title);

            document.getElementById('archive-id').innerText = chapter.id;
            document.getElementById('archive-id').setAttribute('data-val', chapter.id);

            document.getElementById('archive-content').innerText = chapter.content;
            document.getElementById('archive-content').setAttribute('data-val', chapter.content);

            scrambleText([document.getElementById('archive-title'), document.getElementById('archive-id'), document.getElementById('archive-content')]);
            addSystemLog(`Decryption successful.`);
        }, 1800);
    }

    if(document.getElementById('btn-close-archive')) {
        document.getElementById('btn-close-archive').addEventListener('click', () => {
            playSound(sfx.click);
            archiveModal.classList.add('opacity-0');
            if(archiveBox) archiveBox.classList.remove('window-open-active');
            setTimeout(() => { archiveModal.classList.add('hidden'); }, 300);
        });
    }
}