// --- TBCW HR WIZARD: пошаговая регистрация оперативника ---

function getMoscowTime() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * 3));
    const mm = String(nd.getMonth() + 1).padStart(2, '0');
    const dd = String(nd.getDate()).padStart(2, '0');
    const hh = String(nd.getHours()).padStart(2, '0');
    const mins = String(nd.getMinutes()).padStart(2, '0');
    return `${nd.getFullYear()}.${mm}.${dd} ${hh}:${mins}`;
}

const WIZ_DRAFT_KEY = 'tbcw_wizard_draft';
const WIZ_FIELDS = ['wiz-id', 'wiz-name', 'wiz-age', 'wiz-district', 'wiz-photo-url', 'wiz-aff', 'wiz-grade', 'wiz-status', 'wiz-rank', 'wiz-tags', 'wiz-message'];

let wizStep = 0;
let wizMaxReached = 0;
let wizManifestIds = [];
let wizPhotoBlob = null;   // сжатое фото (runtime)
let wizPhotoDataUrl = '';  // для превью и черновика
let wizAudio = {};         // idx отчета -> { ext, blob }
let wizImages = [];        // [{ name, blob }] — файлы картинок для img/ пакета
let wizImageSeq = 0;
let wizZipBlob = null;
let wizJson = '';
let wizDraftRestored = false;
let wizKind = 'personal'; // personal | lore | archive
let wizDraftAudioLost = false;
let wizEncryptionTimeout = null;
let wizProgressInterval = null;

function wizEsc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function wizVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// --- СБОР ДАННЫХ ---

function wizCollect() {
    const id = wizVal('wiz-id') || 'TBCW-XXX';
    const reports = [];
    document.querySelectorAll('#wiz-reports .wiz-report').forEach((entry, idx) => {
        const file = wizAudio[idx];
        const url = entry.querySelector('.wiz-report-audio').value.trim();
        reports.push({
            title: entry.querySelector('.wiz-report-title').value.trim() || 'UNTITLED LOG',
            audio: file ? `sfx/${id}_rep${idx + 1}.${file.ext}` : url,
            content: entry.querySelector('.wiz-report-content').value.trim() || 'No data provided.'
        });
    });
    if (!reports.length) reports.push({ title: 'INITIAL LOG', audio: '', content: 'No data provided.' });

    const initials = (wizVal('wiz-name') || 'UN').split(/\s+/).map(w => w[0] || '').join('').substring(0, 2).toUpperCase();
    const out = {
        id,
        name: wizVal('wiz-name') || 'UNKNOWN OPERATIVE',
        age: parseInt(wizVal('wiz-age'), 10) || 0,
        district: wizVal('wiz-district') || 'Unknown',
        affiliation: wizVal('wiz-aff') || 'Unknown',
        grade: wizVal('wiz-grade') || 'Grade 9',
        status: wizVal('wiz-status') || 'Active',
        last_update: getMoscowTime(),
        photo: wizPhotoDataUrl ? `img/${id}.jpg` : (wizVal('wiz-photo-url') || `https://placehold.co/400x400/0a0a0c/10b981?text=${initials}`),
        tags: wizVal('wiz-tags') ? wizVal('wiz-tags').split(',').map(t => t.trim()).filter(Boolean) : ['Unclassified'],
        reports
    };
    const rank = wizVal('wiz-rank');
    if (rank) out.rank = rank;
    return out;
}

// --- PREVIEW / REVIEW ---

function wizRenderDossier(target) {
    if (!target) return;
    const d = wizCollect();
    const conf = (typeof status_config !== 'undefined' && status_config[d.status]) ? status_config[d.status] : { bg: 'bg-gray-900', text: 'text-gray-500', border: 'border-gray-800' };
    const tagsHtml = d.tags.map(t => `<span class="px-2 py-1 theme-bg-heavy border theme-border text-[9px] theme-text font-mono-custom uppercase">${wizEsc(t)}</span>`).join('');
    const reportsHtml = d.reports.map(r => `
        <div class="mb-6">
            <h3 class="text-[10px] font-mono-custom theme-text mb-3 border-b theme-border pb-1 uppercase tracking-wider">>> ${wizEsc(r.title)}</h3>
            <div class="whitespace-pre-line text-gray-300 text-sm pl-2 border-l theme-border leading-relaxed">${typeof parseLogText === 'function' ? parseLogText(r.content) : wizEsc(r.content)}</div>
        </div>`).join('');
    const rankHtml = d.rank ? `
            <div class="text-gray-600">Rank: <span class="text-gray-300 ml-1">${wizEsc(d.rank)}</span></div>` : '';

    target.innerHTML = `
        <div class="border-b theme-border pb-3 mb-4">
            <div class="text-[10px] theme-text mb-1">REGISTRY_ID: ${wizEsc(d.id)}</div>
            <h2 class="text-2xl font-bold text-gray-100 uppercase tracking-tight">${wizEsc(d.name)}</h2>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-4 text-xs font-mono-custom">
            <div class="text-gray-600">Age: <span class="text-gray-300 ml-1">${d.age}</span></div>
            <div class="text-gray-600">District: <span class="text-gray-300 ml-1">${wizEsc(d.district)}</span></div>
            <div class="text-gray-600 col-span-2">Affiliation: <span class="text-gray-300 ml-1">${wizEsc(d.affiliation)}</span></div>
            <div class="text-gray-600">Grade: <span class="text-gray-300 ml-1">${wizEsc(d.grade)}</span></div>
            ${rankHtml}
        </div>
        <div class="mb-4">
            <div class="text-gray-600 text-[10px] mb-2">EXPERTISE:</div>
            <div class="flex flex-wrap gap-2">${tagsHtml}</div>
        </div>
        <div class="mb-6 pt-3 border-t theme-border">
            <div class="text-gray-600 text-[10px] mb-2">STATUS:</div>
            <div class="inline-block w-full text-center py-2 text-[11px] border uppercase tracking-widest font-mono-custom font-bold ${conf.bg} ${conf.text} ${conf.border}">${wizEsc(d.status)}</div>
        </div>
        <div>${reportsHtml}</div>`;
}

// --- ШАГИ ---

function wizGoStep(n) {
    n = Math.max(0, Math.min(4, n));
    wizStep = n;
    wizMaxReached = Math.max(wizMaxReached, n);

    document.querySelectorAll('.wiz-panel').forEach(p => {
        p.classList.toggle('hidden', p.getAttribute('data-panel') !== String(n));
    });
    document.querySelectorAll('.wiz-step-tab').forEach(t => {
        const s = parseInt(t.dataset.step, 10);
        t.classList.remove('wiz-active', 'wiz-done');
        if (s === n) t.classList.add('wiz-active');
        else if (s < n) t.classList.add('wiz-done');
    });
    document.getElementById('wiz-step-label').innerText = `STEP ${n + 1} / 5`;
    document.getElementById('wiz-back').style.visibility = n === 0 ? 'hidden' : 'visible';
    document.getElementById('wiz-next').style.visibility = n === 4 ? 'hidden' : 'visible';

    if (n === 3) wizRenderDossier(document.getElementById('wiz-review'));
    if (n === 4) wizRenderValidation();
    playSound(sfx.click);
}

function wizNext() {
    if (wizStep === 0) {
        const id = wizVal('wiz-id');
        if (!/^TBCW-\d{3}$/.test(id)) { wizIdCheck(id); playSound(sfx.scannerUse); return; }
        if (!wizVal('wiz-name')) {
            document.getElementById('wiz-id-check').innerHTML = '<span class="text-red-500">> FULL NAME IS REQUIRED.</span>';
            playSound(sfx.scannerUse);
            return;
        }
    }
    wizGoStep(wizStep + 1);
}

function renderWizKindButtons() {
    const row = document.getElementById('wiz-kind-buttons');
    if (!row) return;
    const role = (authProfile && authProfile.role) || 'base';
    const all = [
        ['personal', 'PERSONAL DOSSIER'],
        ['lore', 'LORE CHARACTER'],
        ['archive', 'ARCHIVE DOC']
    ];
    const visible = (role === 'extended' || role === 'admin') ? all : [all[0]];
    row.innerHTML = '';
    visible.forEach(([k, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.kind = k;
        b.innerText = '[' + label + ']';
        b.className = 'text-[9px] font-bold tracking-widest border px-3 py-2 ui-element transition-colors ' +
            (k === wizKind ? 'theme-text theme-border theme-bg-heavy' : 'text-gray-500 border-gray-800 hover:text-white');
        b.addEventListener('click', () => {
            playSound(sfx.click);
            wizKind = k;
            [...row.children].forEach(x => {
                const on = x.dataset.kind === k;
                x.classList.toggle('theme-text', on);
                x.classList.toggle('theme-border', on);
                x.classList.toggle('theme-bg-heavy', on);
                x.classList.toggle('text-gray-500', !on);
            });
            const cat = document.getElementById('wiz-arch-cat-row');
            if (cat) cat.classList.toggle('hidden', k !== 'archive');
        });
        row.appendChild(b);
    });
    const cat = document.getElementById('wiz-arch-cat-row');
    if (cat) cat.classList.toggle('hidden', wizKind !== 'archive');
}

function wizIdCheck(id) {
    const el = document.getElementById('wiz-id-check');
    if (!id) { el.innerHTML = '&nbsp;'; return; }
    if (!/^TBCW-\d{3}$/.test(id)) {
        el.innerHTML = '<span class="text-red-500">> FORMAT: TBCW-000</span>';
    } else if (wizManifestIds.includes(id)) {
        el.innerHTML = '<span class="text-red-500">> THIS ID ALREADY EXISTS IN THE DATABASE.</span>';
    } else {
        el.innerHTML = '<span class="theme-text">> ID IS FREE.</span>';
    }
}

// --- ВАЛИДАЦИЯ ---

function wizValidate(d) {
    const blockers = [], warnings = [];
    if (!/^TBCW-\d{3}$/.test(d.id)) blockers.push('REGISTRY ID is empty or malformed (TBCW-000).');
    else if (wizManifestIds.includes(d.id)) blockers.push('REGISTRY ID already exists in the database.');
    if (d.name === 'UNKNOWN OPERATIVE') blockers.push('FULL NAME is empty.');
    if (!wizPhotoDataUrl && !wizVal('wiz-photo-url')) warnings.push('No portrait — a placeholder image will be generated.');
    if (wizDraftAudioLost) warnings.push('Audio/image files are not stored in the draft — re-attach them (step 03).');
    return { blockers, warnings };
}

function wizRenderValidation(d) {
    const v = wizValidate(d || wizCollect());
    const el = document.getElementById('wiz-validation');
    const b = v.blockers.map(x => `<div class="text-red-500">✕ ${x}</div>`).join('');
    const w = v.warnings.map(x => `<div class="text-amber-500">! ${x}</div>`).join('');
    el.innerHTML = (b + w) || '<div class="theme-text">✓ ALL CHECKS PASSED. READY TO BUILD.</div>';
    document.getElementById('wiz-build').style.display = v.blockers.length ? 'none' : '';
    return v;
}

// --- ОТЧЕТЫ ---

// --- ПРЕВЬЮ-КОЛОНКА / ИНИЦ ---

function wizRenderPreview() {
    wizRenderDossier(document.getElementById('wiz-preview'));
}

function setupWizardControls() {
    renderWizKindButtons();
    const submit_modal = document.getElementById('submit-modal');
    const submit_box = document.getElementById('submit-box');
    const btn_open = document.getElementById('btn-open-submit');
    const btn_close = document.getElementById('btn-close-submit');

    if (btn_open) {
        btn_open.addEventListener('click', () => {
            playSound(sfx.click);
            addSystemLog('Opening HR Registration Terminal');
            submit_modal.classList.remove('hidden');

            renderWizKindButtons(); // роль уже известна после входа
            fetch('dossiers/manifest.json').then(r => r.ok ? r.json() : []).then(ids => {
                wizManifestIds = Array.isArray(ids) ? ids : [];
                wizIdCheck(wizVal('wiz-id'));
            }).catch(() => { wizManifestIds = []; });

            if (!wizDraftRestored) {
                wizDraftRestored = true;
                if (!wizRestoreDraft()) wizAddReport();
            }
            if (!document.querySelectorAll('#wiz-reports .wiz-report').length) wizAddReport();

            wizRenderPreview();
            setTimeout(() => {
                submit_modal.classList.remove('opacity-0');
                if (submit_box) submit_box.classList.add('window-open-active');
                playSound(sfx.docOpen);
            }, 10);
        });
    }

    if (btn_close) {
        btn_close.addEventListener('click', () => {
            playSound(sfx.click);
            submit_modal.classList.add('opacity-0');
            if (submit_box) submit_box.classList.remove('window-open-active');
            setTimeout(() => { submit_modal.classList.add('hidden'); }, 300);
        });
    }

    document.querySelectorAll('.wiz-step-tab').forEach(t => {
        t.addEventListener('click', () => {
            const n = parseInt(t.dataset.step, 10);
            if (n <= wizMaxReached) wizGoStep(n);
        });
    });
    document.getElementById('wiz-next').addEventListener('click', wizNext);
    document.getElementById('wiz-back').addEventListener('click', () => { playSound(sfx.click); wizGoStep(wizStep - 1); });
    document.getElementById('wiz-add-report').addEventListener('click', () => { wizAddReport(); wizSaveDraft(); });
    document.getElementById('wiz-reset').addEventListener('click', wizReset);
    document.getElementById('wiz-build').addEventListener('click', wizBuild);
    document.getElementById('wiz-format-toggle').addEventListener('click', () => {
        playSound(sfx.click);
        document.getElementById('wiz-format-guide').classList.toggle('hidden');
    });

    // Портрет: файл
    const photoFile = document.getElementById('wiz-photo-file');
    document.getElementById('wiz-photo-pick').addEventListener('click', () => { playSound(sfx.click); photoFile.click(); });
    photoFile.addEventListener('change', async () => {
        const f = photoFile.files[0];
        if (!f) return;
        try {
            wizPhotoDataUrl = await wizCompressImage(f);
            wizPhotoBlob = wizDataUrlToBlob(wizPhotoDataUrl);
            const thumb = document.getElementById('wiz-photo-thumb');
            thumb.src = wizPhotoDataUrl;
            thumb.classList.remove('hidden');
            document.getElementById('wiz-photo-name').innerText = f.name + ' (compressed)';
            document.getElementById('wiz-photo-clear').classList.remove('hidden');
            playSound(sfx.pickItem);
            wizRenderPreview();
            wizSaveDraft();
        } catch (e) {
            addSystemLog('PORTRAIT DECODE FAILED.', true);
            playSound(sfx.scannerUse);
        }
    });
    document.getElementById('wiz-photo-clear').addEventListener('click', () => {
        playSound(sfx.click);
        photoFile.value = '';
        wizPhotoBlob = null;
        wizPhotoDataUrl = '';
        const thumb = document.getElementById('wiz-photo-thumb');
        thumb.src = ''; thumb.classList.add('hidden');
        document.getElementById('wiz-photo-name').innerText = 'no file';
        document.getElementById('wiz-photo-clear').classList.add('hidden');
        wizRenderPreview();
        wizSaveDraft();
    });

    // Поля: превью + черновик + проверка ID
    WIZ_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            if (id === 'wiz-id') wizIdCheck(wizVal('wiz-id'));
            wizRenderPreview();
            wizSaveDraft();
        });
    });

    // Превью-тумблер (мобилка)
    document.getElementById('wiz-toggle-preview').addEventListener('click', () => {
        playSound(sfx.click);
        document.getElementById('wiz-preview-col').classList.toggle('preview-open');
    });

    // Результаты
    document.getElementById('wiz-download').addEventListener('click', () => {
        if (!wizZipBlob) return;
        playSound(sfx.click);
        wizDownloadBlob(wizZipBlob, wizVal('wiz-id') + '_package.zip');
        addSystemLog('Dossier package downloaded.');
    });
}
