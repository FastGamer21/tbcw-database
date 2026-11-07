// --- TBCW DATA LAYER ---
// Загружает досье из dossiers/*.json по манифесту и кладёт их в глобальную
// переменную dossiers ДО первого рендера. Глобальный контракт сохранён:
// renderCards/populateDistricts продолжают читать window.dossiers.

let dossiers = [];

const dataReady = (async () => {
    try {
        if (window.location.protocol === 'file:') {
            throw new Error('OPEN VIA HTTP SERVER (file:// BLOCKS DATALOAD)');
        }

        const manifestRes = await fetch('dossiers/manifest.json');
        if (!manifestRes.ok) throw new Error('MANIFEST OFFLINE [' + manifestRes.status + ']');

        const ids = await manifestRes.json();
        if (!Array.isArray(ids)) throw new Error('MANIFEST CORRUPTED');

        const results = await Promise.allSettled(ids.map(id =>
            fetch('dossiers/' + id + '.json').then(res => {
                if (!res.ok) throw new Error(id + ' OFFLINE [' + res.status + ']');
                return res.json();
            })
        ));

        dossiers = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        results
            .filter(r => r.status === 'rejected')
            .forEach(r => {
                console.error('DOSSIER LOAD FAILED:', r.reason);
                if (typeof addSystemLog === 'function') {
                    addSystemLog('DOSSIER LOAD FAILED: ' + (r.reason && r.reason.message ? r.reason.message : 'UNKNOWN'), true);
                }
            });
    } catch (e) {
        console.error('DATABANK LOAD FAILED:', e);
        if (typeof addSystemLog === 'function') {
            addSystemLog('DATABANK OFFLINE: ' + e.message, true);
        }
    }
    return dossiers;
})();
