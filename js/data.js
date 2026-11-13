// --- CONFIGURATION ---
// Цветовая дифференциация статусов оперативников.
// Сами досье живут в dossiers/*.json и загружаются через js/dataload.js.

const status_config = {
    "Active": { bg: "bg-orange-950/40", text: "text-amber-500", border: "border-orange-800" },
    "On Leave": { bg: "bg-slate-800/40", text: "text-slate-400", border: "border-slate-600" },
    "Missing": { bg: "bg-orange-950/20", text: "text-orange-400", border: "border-orange-800/60" },
    "Detained": { bg: "bg-sky-950/40", text: "text-sky-500", border: "border-sky-800" },
    "Retired": { bg: "bg-gray-900/60", text: "text-gray-400", border: "border-gray-700" },
    "Deceased": { bg: "bg-red-950/80", text: "text-red-500", border: "border-red-900 border-dashed" },
    "Kill on Sight": { bg: "bg-red-900/40", text: "text-red-500", border: "border-red-600", extra_class: "status-kos font-bold" },
};
