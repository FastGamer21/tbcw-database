// --- CONFIGURATION & DATABASE ---

const status_config = {
    "Active": { bg: "bg-orange-950/40", text: "text-amber-500", border: "border-orange-800" },
    "Deceased": { bg: "bg-red-950/80", text: "text-red-500", border: "border-red-900 border-dashed" },
    "MIA": { bg: "bg-transparent", text: "text-orange-800", border: "border-orange-950" },
    "Kill on Sight": { bg: "bg-red-900/40", text: "text-red-500", border: "border-red-600", extra_class: "status-kos font-bold" },
};

// БАЗА ДАННЫХ СОТРУДНИКОВ
// Просто вставляй код, сгенерированный Терминалом (HR TERMINAL), внутрь этих квадратных скобок:
let dossiers = [
    {
        "id": "TBCW-009",
        "name": "Gideon Cross",
        "age": 37,
        "district": "Outskirts Border",
        "affiliation": "The Backstreets Commonwealth // Vanguard Command",
        "grade": "Grade 1 Fixer (Color Candidate)",
        "status": "Active",
        "last_update": "2026.06.13 04:17",
        "photo": "https://placehold.co/400x400/0a0a0c/dc2626?text=GC",
        "tags": [
            "CQB",
            "Extreme Combat",
            "Cybernetics",
            "Interrogation"
        ],
        "reports": [
            {
                "title": "SECTION I: EXTENDED BIOGRAPHICAL OVERVIEW",
                "audio": "",
                "content": "Gideon Cross. Born in the deepest slums of District 23, an area notorious for rampant cannibalism and the culinary atrocities of the Eight O'Clock Circus.\n\nHe currently serves as the Commander of the Vanguard, the primary defense line standing between the Commonwealth's hidden branches and the Eldritch horrors bleeding in from the Ruins.\n[STAMP: CLASSIFIED]"
            }
        ]
    }
];