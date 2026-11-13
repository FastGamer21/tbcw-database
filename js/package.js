// --- TBCW WIZARD: PACKAGE BUILDER (media compression + ZIP) ---

// Сжимает изображение до maxSide по большей стороне, JPEG
function wizCompressImage(file, maxSide = 400, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('IMAGE DECODE FAILED')); };
        img.src = url;
    });
}

function wizDataUrlToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/data:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

function wizDownloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// dossier — готовый объект с путями; files: { photo: Blob|null, photoName, audio: [{name, blob}] }
async function wizBuildZip(dossier, files) {
    if (typeof JSZip === 'undefined') throw new Error('JSZIP OFFLINE');
    const zip = new JSZip();
    zip.file('dossier.json', JSON.stringify(dossier, null, 4));
    if (files.photo) zip.file('img/' + files.photoName, files.photo);
    files.audio.forEach(f => zip.file('sfx/' + f.name, f.blob));
    (files.images || []).forEach(f => zip.file('img/' + f.name, f.blob));
    if (files.message && files.message.trim()) {
        zip.file('MESSAGE_TO_ADMIN.txt', 'UNPACKING: dossier.json -> dossiers/, portrait -> img/, audio -> sfx/, add "' + dossier.id + '" to dossiers/manifest.json\n\nMESSAGE FROM THE MEMBER:\n' + files.message.trim());
    }
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

// --- СБОРКА ПАКЕТА (анимация + сборка ZIP) ---

function wizAnimRun(steps) {
    return new Promise(resolve => {
        const overlay = document.getElementById('encryption-overlay');
        const status = document.getElementById('anim-status');
        const progress = document.getElementById('anim-progress');
        if (!overlay) { resolve(); return; }
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        playSound(sfx.typing);
        let p = 0, idx = 0;
        wizProgressInterval = setInterval(() => {
            p += 2;
            if (progress) progress.style.width = p + '%';
            if (p % 20 === 0 && idx < steps.length && status) {
                status.innerText = steps[idx];
                idx++;
            }
            if (p >= 100) {
                clearInterval(wizProgressInterval);
                stopSound(sfx.typing);
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
                resolve();
            }
        }, 80);
        const skip = document.getElementById('btn-skip-anim');
        if (skip) skip.onclick = () => { p = 100; };
    });
}

async function wizBuild() {
    // Тип публикации: personal/lore -> таблица dossiers, archive -> lore_docs
    let archiveDoc = null;
    if (wizKind === 'archive') {
        const entry = document.querySelector('#wiz-reports .wiz-report');
        archiveDoc = {
            doc_id: 'ARC-' + Date.now().toString(36).toUpperCase(),
            title: entry ? (entry.querySelector('.wiz-report-title').value.trim() || 'UNTITLED DOC') : 'UNTITLED DOC',
            category: (document.getElementById('wiz-arch-category') || {}).value || 'lore',
            content: entry ? (entry.querySelector('.wiz-report-content').value.trim() || 'No data provided.') : 'No data provided.'
        };
    }

    const d = wizCollect();
    const v = wizRenderValidation(d);
    if (v.blockers.length) { playSound(sfx.scannerUse); return; }
    playSound(sfx.click);

    const files = {
        photo: wizPhotoBlob,
        photoName: d.id + '.jpg',
        audio: [],
        images: wizImages,
        message: wizVal('wiz-message')
    };
    document.querySelectorAll('#wiz-reports .wiz-report').forEach((entry, idx) => {
        const f = wizAudio[idx];
        if (f) files.audio.push({ idx, name: `${d.id}_rep${idx + 1}.${f.ext}`, blob: f.blob });
    });

    try {
        const [zip] = await Promise.all([
            wizBuildZip(d, files),
            wizAnimRun(['> COLLECTING FIELDS...', '> COMPRESSING MEDIA...', '> PACKAGING DOSSIER...', '> SEALING THE ARCHIVE...'])
        ]);
        wizZipBlob = zip;
        wizJson = JSON.stringify(d, null, 4);

        // Публикация в базу (если auth настроен и роль позволяет)
        let pubMsg = 'AUTH OFFLINE — ZIP ONLY';
        if (typeof AUTH_ON !== 'undefined' && AUTH_ON) {
            let pub;
            if (wizKind === 'archive') {
                pub = await dbPublishLore(archiveDoc, files);
            } else {
                pub = await dbPublishDossier(d, files, wizKind === 'lore' ? 'lore' : 'personal');
            }
            pubMsg = pub.message || (pub.ok ? 'PUBLISHED' : 'FAILED');
            addSystemLog('DB PUBLISH: ' + pubMsg, !pub.ok);
        }

        document.getElementById('wiz-results').classList.remove('hidden');
        const pubEl = document.getElementById('wiz-pub-status');
        if (pubEl) {
            pubEl.innerText = '> DB: ' + pubMsg;
            pubEl.classList.remove('hidden');
        }
        document.getElementById('wiz-build').style.display = 'none';
        addSystemLog(`Dossier package ${d.id} compiled.`);
        playSound(sfx.docOpen);
    } catch (e) {
        console.error('PACKAGE BUILD FAILED:', e);
        addSystemLog('PACKAGE BUILD FAILED — FILES ONLY.', true);
        // Fallback: файлы по отдельности
        wizJson = JSON.stringify(d, null, 4);
        wizDownloadBlob(new Blob([wizJson], { type: 'application/json' }), d.id + '.json');
        if (files.photo) wizDownloadBlob(files.photo, files.photoName);
        files.audio.forEach(f => wizDownloadBlob(f.blob, f.name));
        playSound(sfx.scannerUse);
    }
}
