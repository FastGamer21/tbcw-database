// --- TBCW AUTH: Supabase sessions, roles, login gate ---

const authClient = (AUTH_ON && typeof supabase !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
let authProfile = null; // { callsign, role }

async function authGetSession() {
    if (!authClient) return null;
    const { data } = await authClient.auth.getSession();
    return data.session || null;
}

async function authFetchProfile() {
    if (!authClient) return null;
    const { data: sessData } = await authClient.auth.getSession();
    if (!sessData.session) return null;
    const uid = sessData.session.user.id;
    const { data, error } = await authClient
        .from('profiles')
        .select('id, callsign, role')
        .eq('id', uid)
        .maybeSingle();
    if (error) {
        console.error('PROFILE FETCH FAILED:', error.message);
        return { id: uid, callsign: 'UNKNOWN', role: 'base' };
    }
    return data || { id: uid, callsign: 'UNKNOWN', role: 'base' };
}

// Вход по одной строке CALLSIGN-CODE
async function authSignInByCode(input) {
    if (!authClient) return { ok: false, message: 'AUTH OFFLINE' };
    const raw = String(input || '').trim();
    const dash = raw.indexOf('-');
    if (dash < 1) return { ok: false, message: 'FORMAT: CALLSIGN-CODE' };
    const callsign = raw.slice(0, dash).toLowerCase().replace(/[^a-z0-9_]/g, '');
    const code = raw.slice(dash + 1).trim();
    if (!callsign || !code) return { ok: false, message: 'FORMAT: CALLSIGN-CODE' };
    const email = callsign + '@' + AUTH_EMAIL_DOMAIN;
    const { error } = await authClient.auth.signInWithPassword({ email, password: code });
    if (error) return { ok: false, message: 'ACCESS DENIED — INVALID CODE' };
    authProfile = await authFetchProfile();
    return { ok: true, profile: authProfile };
}

async function authSignOut() {
    if (authClient) await authClient.auth.signOut();
    authProfile = null;
}

function authUpdateBadge(profile) {
    if (!profile) return;
    const badge = document.getElementById('auth-badge');
    const btnLogout = document.getElementById('btn-logout');
    const btnAdmin = document.getElementById('btn-open-admin');
    if (badge) {
        badge.innerText = `[ROLE: ${(profile.role || 'base').toUpperCase()} // ${(profile.callsign || '?').toUpperCase()}]`;
        badge.classList.remove('hidden');
    }
    if (btnLogout) btnLogout.classList.remove('hidden');
    if (btnAdmin && profile.role === 'admin') btnAdmin.classList.remove('hidden');
}

// --- ЛОГИН-ГЕЙТ внутри бут-экрана: promise с терминальной панелью ввода ---

function authGateAwait() {
    return new Promise(resolve => {
        const boot_text = document.getElementById('boot-text');
        if (!boot_text) { resolve(null); return; }
        boot_text.innerHTML = '';

        const prompt = document.createElement('div');
        prompt.className = 'text-red-500 font-bold uppercase tracking-widest my-3 text-sm font-mono-custom border-l-2 border-red-600 pl-3';
        prompt.innerHTML = 'IDENTIFICATION REQUIRED<br><span class="text-[10px] text-red-400 opacity-80">ENTER YOUR ACCESS CODE — CALLSIGN-CODE</span>';
        boot_text.appendChild(prompt);

        const row = document.createElement('div');
        row.className = 'flex gap-2 items-center w-full';
        const input = document.createElement('input');
        input.id = 'auth-code-input';
        input.type = 'text';
        input.placeholder = 'CALLSIGN-XXXXXX';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.className = 'flex-1 bg-black border border-red-900/60 text-xs theme-text font-mono-custom p-2.5 outline-none tracking-widest';
        const btn = document.createElement('button');
        btn.className = 'theme-bg-heavy border theme-border theme-text px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase ui-element shrink-0';
        btn.innerText = '[ AUTHENTICATE ]';
        row.appendChild(input);
        row.appendChild(btn);
        boot_text.appendChild(row);

        const msg = document.createElement('div');
        msg.className = 'text-[10px] font-mono-custom text-red-500 mt-2 min-h-[16px] w-full text-left';
        boot_text.appendChild(msg);

        input.focus();
        // Вход обязателен: SKIP на время гейта недоступен
        const skipBtn = document.getElementById('btn-skip-boot');
        if (skipBtn) skipBtn.style.display = 'none';
        let busy = false;

        async function tryLogin() {
            if (busy) return;
            busy = true;
            msg.innerText = '> VALIDATING...';
            const res = await authSignInByCode(input.value);
            if (!res.ok) {
                msg.innerText = '> ' + res.message;
                boot_text.classList.add('system-shake');
                setTimeout(() => boot_text.classList.remove('system-shake'), 350);
                playSound(sfx.scannerUse);
                busy = false;
                return;
            }
            resolve(res.profile);
        }

        btn.addEventListener('click', tryLogin);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
    });
}

// --- АДМИН: реестр членов (read-only) ---

async function authOpenAdmin() {
    const modal = document.getElementById('admin-modal');
    const list = document.getElementById('admin-list');
    if (!modal || !list) return;
    list.innerHTML = '<div class="text-gray-600">> LOADING REGISTRY...</div>';
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const box = document.getElementById('admin-box');
        if (box) box.classList.add('window-open-active');
        playSound(sfx.docOpen);
    }, 10);

    if (!authClient) { list.innerHTML = '<div class="text-red-500">✕ AUTH OFFLINE</div>'; return; }
    const { data, error } = await authClient
        .from('profiles')
        .select('callsign, role, created_at')
        .order('created_at', { ascending: true });
    if (error) { list.innerHTML = '<div class="text-red-500">✕ ' + error.message + '</div>'; return; }

    list.innerHTML = (data && data.length)
        ? data.map(p => `
            <div class="flex justify-between items-center gap-3 border theme-border p-2.5 bg-black/40">
                <span class="theme-text font-bold tracking-wider">${(p.callsign || '?').toUpperCase()}</span>
                <span class="text-gray-600 text-[10px]">joined ${p.created_at ? p.created_at.slice(0, 10) : '—'}</span>
                <span class="px-2 py-1 border text-[9px] tracking-widest uppercase ${(p.role === 'admin') ? 'text-amber-500 border-amber-800' : 'text-gray-500 border-gray-800'}">${p.role || 'base'}</span>
            </div>`).join('')
        : '<div class="text-gray-600">> REGISTRY EMPTY</div>';

    // Очередь апрува — только под админом
    if (authProfile && authProfile.role === 'admin' && typeof dbAdminQueue === 'function') dbAdminQueue();
}

function authCloseAdmin() {
    playSound(sfx.click);
    const modal = document.getElementById('admin-modal');
    const box = document.getElementById('admin-box');
    if (modal) modal.classList.add('opacity-0');
    if (box) box.classList.remove('window-open-active');
    setTimeout(() => { if (modal) modal.classList.add('hidden'); }, 300);
}