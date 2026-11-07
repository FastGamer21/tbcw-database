// --- CONFIGURATION ---
// Цветовая дифференциация статусов оперативников.
// Сами досье живут в dossiers/*.json и загружаются через js/dataload.js.

const status_config = {
    "Active": { bg: "bg-orange-950/40", text: "text-amber-500", border: "border-orange-800" },
    "Deceased": { bg: "bg-red-950/80", text: "text-red-500", border: "border-red-900 border-dashed" },
    "MIA": { bg: "bg-transparent", text: "text-orange-800", border: "border-orange-950" },
    "Kill on Sight": { bg: "bg-red-900/40", text: "text-red-500", border: "border-red-600", extra_class: "status-kos font-bold" },
};
