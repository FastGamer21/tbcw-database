// --- TBCW DB LAYER: контент из Supabase, публикация, админ-очередь ---

// Загрузка контента по роли и мёрж в глобалы dossiers[] / lore_chapters[].
// Если в базе пусто (миграция ещё не гонялась) — статика остаётся как фолбэк.
async function dbLoadContent() {
    if (!authClient || !authProfile) return;

    const isGuest = authProfile.role === 'guest';

    // --- ДОСЬЕ: гостю не отдаём вообще ---
    let dRows = [];
    if (!isGuest) {
        const { data, error } = await authClient
            .from('dossiers')
            .select('owner_id, data, kind, status')
            .eq('status', 'approved');
        if (error) {
            console.error('DOSSIERS LOAD FAILED:', error.message);
            addSystemLog('DOSSIERS LOAD FAILED: ' + error.message, true);
        } else {
            dRows = data || [];
        }
    }

    // --- ЛОР: гостю только public_brief, членам — approved ---
    let lRows = [];
    {
        let q = authClient.from('lore_docs')
            .select('doc_id, title, category, content, is_public_brief, status');
        if (isGuest) q = q.eq('is_public_brief', true);
        else q = q.eq('status', 'approved');
        const { data, error } = await q;
        if (error) {
            console.error('LORE LOAD FAILED:', error.message);
            addSystemLog('LORE LOAD FAILED: ' + error.message, true);
        } else {
            lRows = data || [];
        }
    }

    // --- МЁРЖ: если в базе есть контент — база главный источник ---
    if (dRows.length) {
        const dbDossiers = dRows.map(r => ({ ...r.data }));
        dossiers.length = 0;
        dbDossiers.forEach(d => dossiers.push(d));
    }

    // Для гостя заменяем лор ВСЕГДА (даже пустым) — статика не должна просачиваться
    if (lRows.length || isGuest) {
        const dbLore = lRows.map(r => ({
            id: r.doc_id,
            title: r.title,
            category: r.category,
            content: r.content
        }));
        lore_chapters.length = 0;
        dbLore.forEach(ch => lore_chapters.push(ch));
        archiveListScrambled = false; // новый список — глитч заново
    }

    // --- Гостевая витрина: промо + краткий лор ---
    if (isGuest) dbFillGuestBrief(lRows.filter(r => r.is_public_brief));
}

// --- Гостевая витрина ---

function dbFillGuestBrief(briefRows) {
    const target = document.getElementById('guest-brief');
    if (!target) return;
    target.innerHTML = briefRows.length
        ? briefRows.map(r => `
            <div class="border theme-border p-3 bg-black/40 mb-2">
                <div class="text-[9px] theme-text font-mono-custom tracking-widest mb-1">${r.doc_id}</div>
                <div class="theme-text font-bold text-xs mb-1">${r.title}</div>
                <div class="text-gray-500 text-[11px] leading-relaxed">${(typeof parseLogText === 'function' ? parseLogText(r.content) : r.content).slice(0, 220)}…</div>
            </div>`).join('')
        : '<div class="text-gray-600 text-[10px]">> BRIEF ARCHIVES COMING SOON.</div>';
}

// --- ПУБЛИКАЦИЯ ---

async function dbUploadMedia(uid, path, blob) {
    const full = `media/${uid}/${path}`;
    const { error } = await authClient.storage
        .from('media')
        .upload(full, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' });
    if (error) throw error;
    return `${SUPABASE_URL}/storage/v1/object/public/media/${full}`;
}

// Публикация досье из визарда. media: { photoBlob, audioFiles: [{idx, ext, blob}], images: [{name, blob}] }
async function dbPublishDossier(data, media, kind = 'personal') {
    if (!authClient || !authProfile) return { ok: false, message: 'AUTH OFFLINE' };
    const uid = authProfile.id || (await authClient.auth.getUser()).data.user.id;
    const role = authProfile.role;
    const status = role === 'base' ? 'pending' : 'approved';

    // 1. Портрет
    if (media.photoBlob) {
        data.photo = await dbUploadMedia(uid, `photo_${Date.now()}.jpg`, media.photoBlob);
    }

    // 2. Аудио репортов
    for (const a of (media.audioFiles || [])) {
        const url = await dbUploadMedia(uid, a.name, a.blob);
        const rep = data.reports[a.idx];
        if (rep) rep.audio = url;
    }

    // 3. Картинки документов: [img]img/NAME[/img] -> [img]URL[/img]
    for (const img of (media.images || [])) {
        const url = await dbUploadMedia(uid, img.name, img.blob);
        data.reports.forEach(r => {
            r.content = r.content.split(`[img]img/${img.name}[/img]`).join(`[img]${url}[/img]`);
        });
    }

    // 4. Insert или update по TBCW-ID
    const { data: existing } = await authClient
        .from('dossiers')
        .select('id, status')
        .eq('data->>id', data.id)
        .maybeSingle();

    let error;
    if (existing) {
        const newStatus = (authProfile.role === 'admin') ? 'approved' : 'pending';
        ({ error } = await authClient.from('dossiers')
            .update({ data, kind, status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', existing.id));
        return { ok: !error, message: error ? error.message : (newStatus === 'pending' ? 'UPDATED — PENDING APPROVAL' : 'UPDATED'), status: newStatus };
    }

    ({ error } = await authClient.from('dossiers')
        .insert({ owner_id: uid, data, kind, status }));
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: status === 'pending' ? 'PUBLISHED — PENDING ADMIN APPROVAL' : 'PUBLISHED', status };
}

// Публикация архивного документа (extended/admin)
async function dbPublishLore(doc, media) {
    if (!authClient || !authProfile) return { ok: false, message: 'AUTH OFFLINE' };
    const uid = authProfile.id || (await authClient.auth.getUser()).data.user.id;

    // картинки документа -> Storage -> URL в тексте
    if (media && (media.images || []).length) {
        for (const img of media.images) {
            const url = await dbUploadMedia(uid, img.name, img.blob);
            doc.content = doc.content.split(`[img]img/${img.name}[/img]`).join(`[img]${url}[/img]`);
        }
    }

    const { error } = await authClient.from('lore_docs')
        .insert({
            author_id: uid,
            doc_id: doc.doc_id,
            title: doc.title,
            category: doc.category,
            content: doc.content,
            is_public_brief: false,
            status: 'approved'
        });
    return { ok: !error, message: error ? error.message : 'PUBLISHED' };
}

// --- АДМИН: очередь апрува + миграция ---

async function dbAdminQueue() {
    if (!authClient) return;
    const out = { dossiers: [], lore: [] };

    const d = await authClient.from('dossiers')
        .select('id, owner_id, data, kind, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
    out.dossiers = d.data || [];

    const l = await authClient.from('lore_docs')
        .select('id, doc_id, title, author_id, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
    out.lore = l.data || [];

    const container = document.getElementById('admin-queue-list');
    if (!container) return;

    const rows = [];
    out.dossiers.forEach(row => {
        rows.push(`
            <div class="border theme-border p-3 bg-black/40 space-y-2">
                <div class="flex justify-between items-center gap-3">
                    <div>
                        <div class="theme-text text-xs font-bold tracking-wider">${row.data.id} — ${row.data.name}</div>
                        <div class="text-[9px] text-gray-600">${row.kind.toUpperCase()} · ${row.created_at.slice(0, 16)}</div>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button class="admin-approve theme-text text-[9px] font-bold border theme-border px-3 py-1.5 hover:theme-bg-heavy" data-table="dossiers" data-id="${row.id}" data-status="approved">[ APPROVE ]</button>
                        <button class="admin-reject text-red-700 hover:text-red-400 text-[9px] font-bold border border-red-900/50 px-3 py-1.5" data-table="dossiers" data-id="${row.id}" data-status="rejected">[ REJECT ]</button>
                    </div>
                </div>
            </div>`);
    });
    out.lore.forEach(row => {
        rows.push(`
            <div class="border theme-border p-3 bg-black/40 space-y-2">
                <div class="flex justify-between items-center gap-3">
                    <div>
                        <div class="theme-text text-xs font-bold tracking-wider">${row.doc_id} — ${row.title}</div>
                        <div class="text-[9px] text-gray-600">LORE DOC · ${row.created_at.slice(0, 16)}</div>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button class="admin-approve theme-text text-[9px] font-bold border theme-border px-3 py-1.5 hover:theme-bg-heavy" data-table="lore_docs" data-id="${row.id}" data-status="approved">[ APPROVE ]</button>
                        <button class="admin-reject text-red-700 hover:text-red-400 text-[9px] font-bold border border-red-900/50 px-3 py-1.5" data-table="lore_docs" data-id="${row.id}" data-status="rejected">[ REJECT ]</button>
                    </div>
                </div>
            </div>`);
    });

    container.innerHTML = rows.length
        ? rows.join('')
        : '<div class="text-gray-600 text-[10px]">>> QUEUE EMPTY. NOTHING AWAITS APPROVAL.</div>';
}

async function dbSetStatus(table, id, status) {
    const { error } = await authClient.from(table)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) { addSystemLog('SET STATUS FAILED: ' + error.message, true); return false; }
    await dbLoadContent();
    if (typeof renderCards === 'function') renderCards();
    return true;
}

// Разовая миграция статики в базу (кнопка под админом)
async function dbMigrateStatic() {
    if (!authClient || !authProfile) return { ok: false, message: 'AUTH OFFLINE' };
    const uid = authProfile.id || (await authClient.auth.getUser()).data.user.id;
    let migrated = 0, skipped = 0;

    for (const ch of (typeof lore_chapters !== 'undefined' ? lore_chapters : [])) {
        const { data: existing } = await authClient.from('lore_docs')
            .select('id').eq('doc_id', ch.id).maybeSingle();
        if (existing) { skipped++; continue; }
        const { error } = await authClient.from('lore_docs').insert({
            author_id: uid,
            doc_id: ch.id,
            title: ch.title,
            category: ch.category || 'lore',
            content: ch.content,
            is_public_brief: ch.id === 'TBCW-GEN-01',
            status: 'approved'
        });
        if (error) return { ok: false, message: error.message };
        migrated++;
    }

    for (const d of (typeof dossiers !== 'undefined' ? dossiers : [])) {
        const { data: existing } = await authClient.from('dossiers')
            .select('id').eq('data->>id', d.id).maybeSingle();
        if (existing) { skipped++; continue; }
        const { error } = await authClient.from('dossiers').insert({
            owner_id: uid,
            data: JSON.parse(JSON.stringify(d)),
            kind: 'personal',
            status: 'approved'
        });
        if (error) return { ok: false, message: error.message };
        migrated++;
    }

    await dbLoadContent();
    if (typeof renderCards === 'function') renderCards();
    return { ok: true, message: `MIGRATED ${migrated}, SKIPPED ${skipped}` };
}

// Биндинг админ-очереди (вызывается один раз из main.js)
function dbBindAdmin() {
    const queue = document.getElementById('admin-queue-list');
    if (!queue) return;
    queue.addEventListener('click', async e => {
        const btn = e.target.closest('.admin-approve, .admin-reject');
        if (!btn) return;
        playSound(sfx.click);
        btn.disabled = true;
        const ok = await dbSetStatus(btn.dataset.table, btn.dataset.id, btn.dataset.status);
        if (ok) addSystemLog(`${btn.dataset.table} ${btn.dataset.id} → ${btn.dataset.status.toUpperCase()}`);
        dbAdminQueue();
    });
    const migrateBtn = document.getElementById('btn-admin-migrate');
    if (migrateBtn) migrateBtn.addEventListener('click', async () => {
        playSound(sfx.click);
        migrateBtn.disabled = true;
        migrateBtn.innerText = '[ MIGRATING... ]';
        const res = await dbMigrateStatic();
        migrateBtn.innerText = '[' + (res.ok ? 'DONE: ' + res.message : 'FAILED: ' + res.message) + ']';
        addSystemLog('MIGRATION: ' + res.message, !res.ok);
    });
}
// --- CLOCK IN/OUT + CAREER LADDER ---
// Ранг растёт от разных дней клока (стаж), не от часов — часы накручиваются вкладкой.

const RANK_LADDER = [
    [60, 'LEGEND'],
    [30, 'VETERAN'],
    [14, 'SENIOR FIXER'],
    [7, 'FIXER'],
    [3, 'ROOKIE'],
    [0, 'RECRUIT']
];

function dbRankFromDays(days) {
    for (const [min, name] of RANK_LADDER) if (days >= min) return name;
    return 'RECRUIT';
}

async function dbClockStatus(retry = true) {
    if (!authClient || !authProfile) return null;
    const { data: last, error } = await authClient.from('clock_events')
        .select('kind, created_at')
        .eq('user_id', authProfile.id)
        .order('created_at', { ascending: false })
        .limit(1);
    if (error) {
        console.error('CLOCK STATUS FAILED:', error.message);
        if (retry) {
            await new Promise(r => setTimeout(r, 800));
            return dbClockStatus(false);
        }
        return null;
    }

    const { data: all } = await authClient.from('clock_events')
        .select('kind, created_at')
        .eq('user_id', authProfile.id)
        .order('created_at', { ascending: true });

    const days = new Set((all || []).map(r => r.created_at.slice(0, 10))).size;

    // Часы: сумма пар in->out + текущая незакрытая сессия
    let hoursMs = 0, openStart = null;
    (all || []).forEach(ev => {
        const t = new Date(ev.created_at).getTime();
        if (ev.kind === 'in') openStart = t;
        else if (ev.kind === 'out' && openStart !== null) { hoursMs += (t - openStart); openStart = null; }
    });
    if (openStart !== null) hoursMs += Date.now() - openStart;
    const hours = Math.floor(hoursMs / 3600000);

    const state = (last && last[0]) ? last[0].kind : 'out';
    return { state, days, hours, rank: dbRankFromDays(days) };
}

async function dbClockToggle() {
    if (!authClient || !authProfile) return null;
    const st = await dbClockStatus();
    const kind = (st && st.state === 'in') ? 'out' : 'in';
    const { error } = await authClient.from('clock_events')
        .insert({ user_id: authProfile.id, kind });
    if (error) { console.error('CLOCK FAILED:', error.message); return null; }
    return dbClockStatus();
}

// Для админ-реестра: { user_id: { days, rank } } по всем событиям
async function dbMemberRanks() {
    if (!authClient) return {};
    const { data } = await authClient.from('clock_events')
        .select('user_id, kind, created_at')
        .order('created_at', { ascending: true });

    const daysByUser = {}, hoursByUser = {};
    let openByUser = {};
    (data || []).forEach(r => {
        const uid = r.user_id;
        const t = new Date(r.created_at).getTime();
        const day = r.created_at.slice(0, 10);
        (daysByUser[uid] = daysByUser[uid] || new Set()).add(day);
        if (r.kind === 'in') openByUser[uid] = t;
        else if (r.kind === 'out' && openByUser[uid] !== undefined) {
            hoursByUser[uid] = (hoursByUser[uid] || 0) + (t - openByUser[uid]);
            delete openByUser[uid];
        }
    });
    Object.keys(openByUser).forEach(uid => {
        hoursByUser[uid] = (hoursByUser[uid] || 0) + (Date.now() - openByUser[uid]);
    });
    const out = {};
    Object.keys(daysByUser).forEach(uid => {
        const days = daysByUser[uid].size;
        const hours = Math.floor((hoursByUser[uid] || 0) / 3600000);
        out[uid] = { days, hours, rank: dbRankFromDays(days) };
    });
    return out;
}
