// --- TBCW WIZARD: REPORT SECTIONS, TOOLBAR, DOC MODE & DRAFT ---

// Панель инструментов: обёртка выделения в разметку
const WIZ_TOOLBAR = [
    { label: 'B', open: '[b]', close: '[/b]' },
    { label: 'I', open: '[i]', close: '[/i]' },
    { label: 'U', open: '[u]', close: '[/u]' },
    { label: 'S', open: '[s]', close: '[/s]' },
    { label: 'CODE', open: '[code]', close: '[/code]' },
    { label: 'REDACT', open: '||', close: '||' },
    { label: 'COLOR', open: '[c:red]', close: '[/c]' },
    { label: 'STAMP', ins: '[STAMP: CLASSIFIED]' },
    { label: 'BLINK', open: '[blink]', close: '[/blink]' },
    { label: 'HIGHLIGHT', open: '[h]', close: '[/h]' },
    { label: 'GLITCH', open: '***', close: '***' },
    { label: 'TAG', open: '[tag]', close: '[/tag]' },
    { label: 'CENTER', open: '[center]', close: '[/center]' },
    { label: 'RIGHT', open: '[right]', close: '[/right]' },
    { label: 'HR', ins: '[hr]' },
    { label: 'IMG', open: '[img]', close: '[/img]' },
    { label: 'SMALL', open: '[small]', close: '[/small]' }
];

function wizApplyMarkup(ta, item) {
    const selStart = ta.selectionStart, selEnd = ta.selectionEnd;
    const sel = ta.value.slice(selStart, selEnd);
    let ins, caretOffset;
    if (item.ins !== undefined) {
        ins = item.ins;
        caretOffset = ins.length;
    } else {
        const inner = sel || 'text';
        ins = item.open + inner + item.close;
        caretOffset = item.open.length + inner.length;
    }
    ta.value = ta.value.slice(0, selStart) + ins + ta.value.slice(selEnd);
    ta.setSelectionRange(selStart + caretOffset, selStart + caretOffset);
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function wizBuildToolbar(ta) {
    const bar = document.createElement('div');
    bar.className = 'doc-toolbar';
    WIZ_TOOLBAR.forEach(item => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerText = '[' + item.label + ']';
        b.addEventListener('click', () => { playSound(sfx.click); wizApplyMarkup(ta, item); });
        bar.appendChild(b);
    });
    return bar;
}

// --- DOC MODE: фуллскрин-редактор (слева разметка, справа превью) ---

let wizFsEntry = null;

function wizFsOpen(entry) {
    wizFsEntry = entry;
    const fs = document.getElementById('doc-fs');
    const editor = document.getElementById('doc-fs-editor');
    const title = document.getElementById('doc-fs-title');
    document.getElementById('doc-fs-title').value = entry.querySelector('.wiz-report-title').value;
    editor.value = entry.querySelector('.wiz-report-content').value;
    const bar = document.getElementById('doc-fs-toolbar');
    bar.innerHTML = '';
    bar.appendChild(wizBuildToolbar(editor));
    const imgBtn = document.createElement('button');
    imgBtn.type = 'button';
    imgBtn.innerText = '[IMG FILE]';
    imgBtn.addEventListener('click', () => { playSound(sfx.click); wizFsEntry.querySelector('.wiz-image-file').click(); });
    bar.appendChild(imgBtn);
    if (!editor.dataset.fsBound) {
        editor.addEventListener('input', wizFsSync);
        title.addEventListener('input', wizFsSync);
        editor.dataset.fsBound = '1';
    }
    fs.classList.remove('hidden');
    fs.classList.add('flex');
    playSound(sfx.docOpen);
    wizFsSync();
    editor.focus();
}

function wizFsClose() {
    const fs = document.getElementById('doc-fs');
    fs.classList.add('hidden');
    fs.classList.remove('flex');
    playSound(sfx.click);
    wizFsEntry = null;
}

function wizFsSync() {
    if (!wizFsEntry) return;
    const editor = document.getElementById('doc-fs-editor');
    const title = document.getElementById('doc-fs-title');
    wizFsEntry.querySelector('.wiz-report-content').value = editor.value;
    wizFsEntry.querySelector('.wiz-report-title').value = title.value;
    const span = wizFsEntry.querySelector('.wiz-report-preview');
    if (span) span.innerHTML = typeof parseLogText === 'function' ? parseLogText(editor.value).slice(0, 160) : '';
    document.getElementById('doc-fs-preview').innerHTML = typeof parseLogText === 'function' ? parseLogText(editor.value) : wizEsc(editor.value);
    wizRenderPreview();
    wizSaveDraft();
}

function wizAddReport(data = {}) {
    const container = document.getElementById('wiz-reports');
    const entry = document.createElement('div');
    entry.className = 'wiz-report border theme-border p-3 bg-black/40 space-y-2 relative';
    entry.innerHTML = `
        <div class="absolute top-2 right-2 flex gap-2">
            <button class="wiz-report-fs theme-text hover:text-white text-[9px] font-bold ui-element">[ FULLSCREEN ]</button>
            <button class="wiz-report-remove text-red-700 hover:text-red-400 text-[9px] font-bold ui-element">[ REMOVE ]</button>
        </div>
        <input type="text" placeholder="Report Title (e.g. History & Incidents)" class="wiz-report-title w-full bg-black border border-gray-800 text-xs theme-text p-2 pr-48 focus-theme transition-colors ui-element" value="${wizEsc(data.title || '')}">
        <div class="flex gap-2 items-center flex-wrap">
            <input type="file" accept=".mp3,.ogg,.wav,audio/*" class="wiz-audio-file hidden">
            <button class="wiz-audio-pick theme-text text-[9px] hover:text-white border theme-border px-2 py-1.5 ui-element font-bold transition-colors">[ AUDIO FILE ]</button>
            <button class="wiz-audio-clear hidden text-red-700 hover:text-red-400 text-[9px] font-bold">[X]</button>
            <span class="wiz-audio-name text-[9px] text-gray-600 truncate flex-1">no audio file</span>
        </div>
        <div class="flex gap-2 items-center flex-wrap">
            <input type="file" accept="image/*" class="wiz-image-file hidden">
            <button class="wiz-image-pick theme-text text-[9px] hover:text-white border theme-border px-2 py-1.5 ui-element font-bold transition-colors">[ IMAGE FILE ]</button>
            <span class="wiz-image-hint text-[9px] text-gray-600 truncate flex-1">→ img/ in the package, tag auto-inserted into the text</span>
        </div>
        <input type="text" placeholder="...or direct audio URL" class="wiz-report-audio w-full bg-black border border-gray-800 text-xs theme-text p-2 focus-theme transition-colors ui-element opacity-80" value="${wizEsc(data.audioUrl || '')}">
        <div class="wiz-toolbar-slot"></div>
        <textarea placeholder="Report content — formatting protocols supported" class="wiz-report-content w-full min-h-[110px] bg-black border border-gray-800 text-xs text-gray-300 p-2 focus-theme transition-colors resize-none custom-scrollbar ui-element">${wizEsc(data.content || '')}</textarea>
        <div class="text-[9px] text-gray-600 border-t border-gray-800/60 pt-1.5">LIVE: <span class="wiz-report-preview text-gray-500"></span></div>`;

    entry.querySelector('.wiz-report-fs').addEventListener('click', () => { playSound(sfx.click); wizFsOpen(entry); });

    entry.querySelector('.wiz-report-remove').addEventListener('click', () => {
        playSound(sfx.click);
        const idx = [...container.children].indexOf(entry);
        delete wizAudio[idx];
        // сдвигаем индексы аудио после удаления
        const next = {};
        Object.keys(wizAudio).forEach(k => { const ki = parseInt(k, 10); if (ki > idx) next[ki - 1] = wizAudio[k]; else if (ki < idx) next[ki] = wizAudio[k]; });
        wizAudio = next;
        entry.remove();
        wizRenderPreview();
        wizSaveDraft();
    });

    const fileInput = entry.querySelector('.wiz-audio-file');
    entry.querySelector('.wiz-audio-pick').addEventListener('click', () => { playSound(sfx.click); fileInput.click(); });
    fileInput.addEventListener('change', () => {
        const f = fileInput.files[0];
        if (!f) return;
        const idx = [...container.children].indexOf(entry);
        const ext = (f.name.split('.').pop() || 'mp3').toLowerCase();
        wizAudio[idx] = { ext, blob: f };
        entry.querySelector('.wiz-audio-name').innerText = f.name + ' → sfx/';
        entry.querySelector('.wiz-audio-clear').classList.remove('hidden');
        playSound(sfx.pickItem);
        wizSaveDraft();
    });
    entry.querySelector('.wiz-audio-clear').addEventListener('click', () => {
        playSound(sfx.click);
        const idx = [...container.children].indexOf(entry);
        delete wizAudio[idx];
        fileInput.value = '';
        entry.querySelector('.wiz-audio-name').innerText = 'no audio file';
        entry.querySelector('.wiz-audio-clear').classList.add('hidden');
    });

    const imgInput = entry.querySelector('.wiz-image-file');
    entry.querySelector('.wiz-image-pick').addEventListener('click', () => { playSound(sfx.click); imgInput.click(); });
    imgInput.addEventListener('change', async () => {
        const f = imgInput.files[0];
        if (!f) return;
        try {
            const dataUrl = await wizCompressImage(f);
            wizImageSeq++;
            const name = (wizVal('wiz-id') || 'TBCW-XXX') + '_img' + wizImageSeq + '.jpg';
            wizImages.push({ name, blob: wizDataUrlToBlob(dataUrl) });
            const path = '[img]img/' + name + '[/img]';
            if (wizFsEntry) {
                const ed = document.getElementById('doc-fs-editor');
                ed.value = ed.value.replace(/\s*$/, '') + '\n' + path + '\n';
                ed.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const ta = entry.querySelector('.wiz-report-content');
                ta.value = ta.value.replace(/\s*$/, '') + '\n' + path + '\n';
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
            entry.querySelector('.wiz-image-hint').innerText = f.name + ' → img/' + name;
            playSound(sfx.pickItem);
            wizSaveDraft();
        } catch (err) {
            addSystemLog('IMAGE DECODE FAILED.', true);
            playSound(sfx.scannerUse);
        }
    });

    const contentEl = entry.querySelector('.wiz-report-content');
    const previewEl = entry.querySelector('.wiz-report-preview');
    entry.querySelector('.wiz-toolbar-slot').appendChild(wizBuildToolbar(contentEl));
    contentEl.addEventListener('input', () => {
        previewEl.innerHTML = typeof parseLogText === 'function' ? parseLogText(contentEl.value).slice(0, 160) : '';
        wizRenderPreview();
        wizSaveDraft();
    });
    entry.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { wizRenderPreview(); wizSaveDraft(); }));

    container.appendChild(entry);
}

// --- ЧЕРНОВИК ---

function wizSaveDraft() {
    try {
        const data = { fields: {}, reports: [], photoDataUrl: wizPhotoDataUrl, step: wizStep };
        WIZ_FIELDS.forEach(id => { const el = document.getElementById(id); if (el) data.fields[id] = el.value; });
        document.querySelectorAll('#wiz-reports .wiz-report').forEach(e => {
            data.reports.push({
                title: e.querySelector('.wiz-report-title').value,
                url: e.querySelector('.wiz-report-audio').value,
                content: e.querySelector('.wiz-report-content').value,
                hadAudio: !!e.querySelector('.wiz-audio-name').innerText.match(/→ sfx\/$/)
            });
        });
        localStorage.setItem(WIZ_DRAFT_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage полон или недоступен */ }
}

function wizRestoreDraft() {
    let data;
    try { data = JSON.parse(localStorage.getItem(WIZ_DRAFT_KEY)); } catch (e) { return false; }
    if (!data) return false;

    Object.entries(data.fields || {}).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
    });
    (data.reports || []).forEach(r => wizAddReport({ title: r.title, content: r.content, audioUrl: r.url }));
    wizDraftAudioLost = (data.reports || []).some(r => r.hadAudio);
    if (data.photoDataUrl) {
        wizPhotoDataUrl = data.photoDataUrl;
        wizPhotoBlob = wizDataUrlToBlob(data.photoDataUrl);
        const thumb = document.getElementById('wiz-photo-thumb');
        thumb.src = data.photoDataUrl;
        thumb.classList.remove('hidden');
        document.getElementById('wiz-photo-name').innerText = 'portrait restored from draft';
        document.getElementById('wiz-photo-clear').classList.remove('hidden');
    }
    wizGoStep(Math.min(data.step || 0, wizMaxReached = Math.min(data.step || 0, 4)));
    return true;
}

function wizReset() {
    playSound(sfx.click);
    localStorage.removeItem(WIZ_DRAFT_KEY);
    WIZ_FIELDS.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('wiz-reports').innerHTML = '';
    wizAudio = {};
    wizImages = [];
    wizImageSeq = 0;
    wizPhotoBlob = null;
    wizPhotoDataUrl = '';
    wizZipBlob = null;
    wizDraftAudioLost = false;
    const thumb = document.getElementById('wiz-photo-thumb');
    thumb.src = ''; thumb.classList.add('hidden');
    document.getElementById('wiz-photo-name').innerText = 'no file';
    document.getElementById('wiz-photo-clear').classList.add('hidden');
    document.getElementById('wiz-results').classList.add('hidden');
    document.getElementById('wiz-id-check').innerHTML = '&nbsp;';
    wizMaxReached = 0;
    wizAddReport();
    wizRenderPreview();
    wizGoStep(0);
    addSystemLog('Registration draft wiped.');
}
