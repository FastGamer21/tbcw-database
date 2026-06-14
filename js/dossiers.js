// --- TBCW DOSSIERS MODULE ---

function generateStatBar(stat_name, value, css_class) {
    let blocks = '';
    for(let i = 1; i <= 5; i++) { blocks += `<div class="stat-segment ${css_class} ${i <= value ? 'filled' : ''}"></div>`; }
    let value_ticks = value > 0 ? 'I'.repeat(value) : '-';
    return `<div><div class="flex justify-between text-[10px] text-gray-500 mb-1 font-bold"><span class="uppercase glitch-text" data-val="${stat_name}">${stat_name}</span><span class="glitch-text" data-val="${value_ticks}">${value_ticks}</span></div><div class="stat-bar-container">${blocks}</div></div>`;
}

function renderCards() {
    const grid = document.getElementById('dossier-grid');
    if(!grid || typeof dossiers === 'undefined') return;
    grid.innerHTML = '';
    dossiers.forEach((person, index) => {
        const conf = status_config[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
        const card = document.createElement('div');
        card.className = `dossier-card p-4 flex flex-col h-full ui-element`;
        card.addEventListener('click', () => { playSound(sfx.click); openModal(index); });
        card.innerHTML = `<div class="flex gap-4 mb-4 relative z-10"><img src="${person.photo}" class="w-16 h-16 object-cover border border-gray-800 grayscale"><div class="flex-1 min-w-0"><div class="text-[10px] font-mono-custom text-emerald-700/50 mb-1 glitch-text" data-val="${person.id}">${person.id}</div><h3 class="font-bold text-gray-200 uppercase truncate text-sm glitch-text" data-val="${person.name}">${person.name}</h3><div class="text-xs text-gray-500 truncate font-mono-custom glitch-text" data-val="${person.affiliation}">${person.affiliation}</div></div></div><div class="mt-auto relative z-10 space-y-2"><div class="flex justify-between text-[10px] font-mono-custom text-gray-600 border-t border-gray-800 pt-2"><span class="glitch-text" data-val="${person.district}">${person.district}</span><span class="glitch-text" data-val="${person.grade}">${person.grade}</span></div><div class="text-right"><span class="inline-block px-2 py-1 text-[9px] font-mono-custom uppercase tracking-widest ${conf.bg} ${conf.text} ${conf.border} border glitch-text" data-val="${person.status}">${person.status}</span></div></div>`;
        grid.appendChild(card);
    });
}

function openModal(index) {
    const person = dossiers[index];
    const conf = status_config[person.status] || { bg: "bg-gray-900", text: "text-gray-500", border: "border-gray-800" };
    
    document.getElementById('modal-photo').src = person.photo;
    const fields = ['id', 'name', 'age', 'district', 'affiliation', 'grade'];
    fields.forEach(f => {
        const el = document.getElementById('modal-'+f);
        el.innerText = person[f]; el.setAttribute('data-val', person[f]);
    });
    
    document.getElementById('modal-date').innerText = "LAST_MODIFIED: " + person.last_update;
    document.getElementById('modal-date').setAttribute('data-val', "LAST_MODIFIED: " + person.last_update);
    
    const status_el = document.getElementById('modal-status');
    status_el.innerText = person.status; status_el.setAttribute('data-val', person.status);
    status_el.className = `inline-block w-full text-center py-2 text-[11px] border uppercase tracking-widest font-mono-custom font-bold glitch-text ${conf.bg} ${conf.text} ${conf.border} ${conf.extra_class || ''}`;

    document.getElementById('modal-stats-container').innerHTML = 
        generateStatBar("Fortitude (Instinct)", person.stats.fortitude, "stat-fortitude") + generateStatBar("Prudence (Insight)", person.stats.prudence, "stat-prudence") +
        generateStatBar("Temperance (Attachment)", person.stats.temperance, "stat-temperance") + generateStatBar("Justice (Repression)", person.stats.justice, "stat-justice");

    const reports_container = document.getElementById('modal-reports');
    reports_container.innerHTML = '';
    person.reports.forEach(report => {
        const report_el = document.createElement('div');
        report_el.innerHTML = `<h3 class="text-[10px] font-mono-custom text-emerald-600 mb-3 border-b border-gray-800/50 pb-1 uppercase tracking-wider glitch-text" data-val=">> ${report.title}">>> ${report.title}</h3><p class="whitespace-pre-line text-gray-400 text-sm pl-2 border-l border-gray-800 glitch-text" data-val="${report.content}">${report.content}</p>`;
        reports_container.appendChild(report_el);
    });

    const modal = document.getElementById('modal');
    const modal_box = document.getElementById('modal-box');
    modal.classList.remove('hidden');
    addSystemLog(`Accessing record ${person.id}`);
    
    setTimeout(() => { 
        modal.classList.remove('opacity-0');
        modal_box.classList.remove('opacity-0');
        playSound(sfx.docOpen);
        modal_box.classList.add('window-open-active');
        scrambleText(modal.querySelectorAll('.glitch-text')); 
    }, 10);
}

function closeModal() {
    playSound(sfx.click);
    document.getElementById('modal').classList.add('opacity-0');
    document.getElementById('modal-box').classList.remove('window-open-active');
    setTimeout(() => { document.getElementById('modal').classList.add('hidden'); }, 300);
}