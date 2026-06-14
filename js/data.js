// --- CONFIGURATION & DATABASE ---

const statusConfig = {
    "Active": { bg: "bg-emerald-900/10", text: "text-emerald-500", border: "border-emerald-800/50" },
    "Deceased": { bg: "bg-red-900/10", text: "text-red-700", border: "border-red-900" },
    "MIA": { bg: "bg-gray-800/20", text: "text-gray-500", border: "border-gray-800" },
    "Kill on Sight": { bg: "bg-red-900/20", text: "text-red-500", border: "border-red-500", extraClass: "status-kos" },
};

const dossiers = [
    {
        id: "TBCW-001",
        name: "Alex Rain",
        age: 28,
        district: "District 12",
        affiliation: "The Backstreets Commonwealth",
        grade: "Grade 5",
        status: "Active",
        lastUpdate: "2024.11.02 14:00",
        photo: "https://placehold.co/400x400/0a0a0c/10b981?text=AR",
        stats: { fortitude: 4, prudence: 3, temperance: 5, justice: 3 },
        reports: [{ title: "Psychological Evaluation", content: "Subject demonstrates high stress tolerance. Assigned to containment block after Incident 44-B. Mental stability metrics are within acceptable parameters." }]
    },
    {
        id: "FIX-1022",
        name: "Marcus Woods",
        age: 41,
        district: "District 23",
        affiliation: "Shi Association",
        grade: "Grade 3",
        status: "Deceased",
        lastUpdate: "2023.08.15 09:30",
        photo: "https://placehold.co/400x400/0a0a0c/991b1b?text=MW",
        stats: { fortitude: 5, prudence: 4, temperance: 2, justice: 4 },
        reports: [{ title: "Incident Report #77-A", content: "Veteran operative. Killed in action during a perimeter breach. Body recovered by cleanup crew." }]
    },
    {
        id: "W-CORP-812",
        name: "Sarah Jenkins",
        age: 32,
        district: "District 4",
        affiliation: "W Corp Cleanup Crew",
        grade: "Grade 4",
        status: "MIA",
        lastUpdate: "2024.01.12 11:45",
        photo: "https://placehold.co/400x400/0a0a0c/6b7280?text=SJ",
        stats: { fortitude: 3, prudence: 5, temperance: 3, justice: 3 },
        reports: [{ title: "Disappearance Log", content: "Agent lost contact during a standard WARP train cleanup operation. Last known signal emitted from carriage 4. Search protocols suspended." }]
    },
    {
        id: "SYN-099",
        name: "Victor 'Hound' Vance",
        age: 36,
        district: "Outskirts",
        affiliation: "Unregistered Syndicate",
        grade: "Grade 2",
        status: "Kill on Sight",
        lastUpdate: "2024.05.20 22:15",
        photo: "https://placehold.co/400x400/0a0a0c/ef4444?text=VV",
        stats: { fortitude: 5, prudence: 2, temperance: 1, justice: 5 },
        reports: [
            { title: "Threat Assessment", content: "Highly dangerous individual. Implants modified with illegal Outskirts tech. Do not engage without Grade 3+ Backup." },
            { title: "Bounty Status", content: "Hana Association issued an open contract. Priority: Elimination." }
        ]
    },
    {
        id: "TBCW-044",
        name: "Elena Rostova",
        age: 25,
        district: "District 12",
        affiliation: "The Backstreets Commonwealth",
        grade: "Grade 6",
        status: "Active",
        lastUpdate: "2024.06.11 08:00",
        photo: "https://placehold.co/400x400/0a0a0c/10b981?text=ER",
        stats: { fortitude: 2, prudence: 4, temperance: 4, justice: 2 },
        reports: [{ title: "Transfer Record", content: "Recently transferred from logistical support to frontline observation. Shows high aptitude for tracking anomaly traces." }]
    },
    {
        id: "TBCW-009",
        name: "Gideon Cross",
        age: 37,
        district: "Outskirts Border",
        affiliation: "The Backstreets Commonwealth // Vanguard Command",
        grade: "Grade 1 Fixer (Color Candidate)",
        status: "Active",
        lastUpdate: "2026.06.12 23:00",
        photo: "https://placehold.co/400x400/0a0a0c/dc2626?text=GC",
        stats: { fortitude: 5, prudence: 4, temperance: 3, justice: 5 },
        reports: [
            {
                title: "SECTION I: EXTENDED BIOGRAPHICAL OVERVIEW",
                content: "Gideon Cross. Born in the deepest slums of District 23, an area notorious for rampant cannibalism and the culinary atrocities of the Eight O'Clock Circus. According to fragmented Hana Association records, Cross was not originally a registered Fixer. He was assimilated into a Sweeper family during his early teens. His internal organs were systematically liquefied and replaced with the standard cybernetic carapace and life-support slurry typical of the Sweeper hive mind.\n\nHowever, during the incident classified as the 'Blood-Red Night', a massive localized Distortion event severed the telepathic link between Cross and his family unit. Instead of collapsing into a vegetative state like standard Sweepers isolated from their 'Mother', Cross experienced a violent awakening of self-awareness. He tore his way out of District 23, slaughtering his former brethren to secure enough liquid fuel to sustain his own failing carapace.\n\nHe was discovered half-dead on the borders of the Outskirts by the founding members of the TBCW. Recognizing his unnatural resilience and immense combat potential, he was offered sanctuary and a steady supply of refined bio-fuel in exchange for his absolute loyalty. He currently serves as the Commander of the Vanguard, the primary defense line standing between the Commonwealth's hidden branches and the Eldritch horrors bleeding in from the Ruins."
            },
            {
                title: "SECTION II: COMBAT CAPABILITY & WORKSHOP GEAR",
                content: "THREAT ASSESSMENT: CATACLYSMIC. HIGH PRIORITY FOR IMMEDIATE DISPATCH IF GONE ROGUE.\n\nPrimary Armament: The 'Tartarus-Model Piledriver' — a massive, heavily customized hydraulic spear-gauntlet crafted by an underground Workshop affiliated with the Tres Association. The weapon utilizes a highly unstable, unrefined variant of W Corp's spatial distortion Singularities. Upon impact, the Piledriver does not merely crush armor; it forcefully overlaps the physical space of the target's internal organs with the surrounding air, effectively 'deleting' chunks of matter.\n\nPhysiological Augmentations: Due to his time as a Sweeper, over 70% of Gideon's internal biology is non-human. He does not possess a traditional heart or lungs. Instead, his thoracic cavity houses a pressurized tank of nutrient-dense slurry. This grants him near-instantaneous tissue regeneration and immunity to conventional poisons, gases, and biological hazards (including extreme resistance to K Corp's degenerative ampules). To kill him, one must shatter the reinforced core housed within his spine, a feat requiring firepower equivalent to a Grade 1 Fixer team.\n\nCombat Doctrine: Relentless forward assault. Cross does not utilize evasion. He relies on his Sweeper-grade armor and hyper-regeneration to absorb lethal blows, closing the distance to execute targets with his Piledriver. He thrives in chaotic, close-quarters environments where his lack of pain receptors gives him an absolute psychological advantage over human combatants."
            },
            {
                title: "SECTION III: PSYCHOLOGICAL PORTRAIT & DISTORTION THREAT",
                content: "MENTAL STABILITY: PRECARIOUS. DISTORTION THREAT LEVEL: 42% (CAUTION REQUIRED).\n\nPsychiatric evaluations indicate that Cross suffers from severe chronic phantom pain — not from a missing limb, but from the missing 'hive mind' of his Sweeper family. The absolute silence in his head drives him towards extreme acts of violence, which temporarily trigger chemical spikes in his slurry, simulating the warmth of the collective.\n\nFurthermore, automated surveillance algorithms have flagged multiple instances of Cross muttering to an invisible entity. When questioned, he claims to hear a 'gentle woman's voice' urging him to shed his metallic carapace and embrace his true, liquid nature. This is a recognized precursor to the Distortion Phenomenon.\n\nDespite this, his loyalty to the TBCW remains ironclad. He views the Commonwealth as his new 'Family'. The structure and rigid discipline of the Vanguard act as his mental anchor. As long as he is given clear, brutal directives, his ego remains intact. \n\nDirectives: Under no circumstances is Cross to be deployed in District 23 or allowed contact with active Sweeper patrols. The risk of him re-assimilating or, worse, Distorting into an Apex-class Hive Entity is too high."
            },
            {
                title: "SECTION IV: EXPANDED INCIDENT LOG // BACK-OUT-88 // THE RUINS PUSH",
                content: "TRANSCRIPT RECOVERED FROM GIDEON CROSS'S TACTICAL VISOR HUD. DATE: [REDACTED]. LOCATION: 40KM INTO THE OUTSKIRTS.\n\n[02:14 AM] - Vanguard Squad Delta encounters a localized reality-tear near the abandoned L Corp branch ruins. \n[02:15 AM] - Entities designated as 'Peccatulum' begin swarming the perimeter. Standard rounds are ineffective. Casualties reported: 4.\n[02:19 AM] - Commander Cross engages. Audio logs detect the hydraulic screech of the Tartarus Piledriver charging.\n[02:22 AM] - CROSS: 'Hold the line! If they breach the perimeter, the Backstreets will drown in this filth! Fire the incendiaries!'\n[02:30 AM] - A massive Abnormality-class entity emerges from the ruins. Classification: WAW-level threat. It resembles a grotesque amalgamation of human limbs and weeping eyes.\n[02:35 AM] - Cross orders the squad to fall back. He manually overrides the safety limiters on his Piledriver, venting toxic W-Corp spatial exhaust directly into his own life-support slurry.\n[02:40 AM] - Seismic sensors record a spatial detonation. The Abnormality's core is ruptured. Cross is found buried under 40 tons of rubble, his carapace severely compromised, leaking black fluid, but laughing.\n[02:45 AM] - CROSS: 'Is that all the Ruins have to offer? We are the Commonwealth. We do not break.'\n\nCONCLUSION: The operation was a success. The perimeter was secured. Cross required 400 liters of replacement biomass but returned to active duty within 72 hours. He has been nominated for a Color title by the Hana Association, though TBCW leadership has intercepted and buried the paperwork to keep him off the Head's radar."
            }
        ]
    }
    
];

const activeBranches = ['D', 'L', 'W'];

const nodes = {
    n_A_B_C: [520, 450], n_A_C_D: [540, 500], n_A_D_E: [490, 540], n_A_E_F: [440, 520], n_A_F_B: [450, 460],
    n_B_C_H: [560, 390], n_B_H_G: [500, 360], n_B_G_F: [410, 390],
    n_C_H_I: [620, 430], n_C_I_D: [590, 510],
    n_D_I_J: [600, 580], n_D_J_K: [530, 610], n_D_K_E: [490, 580],
    n_E_K_L: [420, 610], n_E_L_F: [380, 550],
    n_F_L_M: [320, 520], n_F_M_N: [330, 450], n_F_N_G: [360, 400],
    n_G_N_Y: [340, 310], n_G_Y_O: [420, 260], n_G_O_H: [500, 280],
    n_H_O_P: [580, 270], n_H_P_Q: [640, 320], n_H_Q_I: [660, 400],
    n_I_Q_R: [740, 460], n_I_R_J: [710, 560],
    n_J_R_S: [750, 630], n_J_S_T: [680, 690], n_J_T_K: [590, 680],
    n_K_T_U: [540, 750], n_K_U_L: [450, 720],
    n_L_U_V: [370, 740], n_L_V_M: [300, 640],
    n_M_V_W: [220, 610], n_M_W_X: [190, 480], n_M_X_N: [240, 400],
    n_N_X_Y: [260, 300],
    n_out_X_Y: [100, 120], n_out_Y_top1: [200, 40], n_out_Y_top2: [380, 30], n_out_Y_O: [480, 40], 
    n_out_O_top: [600, 50], n_out_O_P: [700, 90], n_out_P_top: [820, 140], n_out_P_Q: [900, 220],
    n_out_Q_right: [980, 320], n_out_Q_R: [1020, 420], n_out_R_right: [1040, 580], n_out_R_S: [980, 720], 
    n_out_S_bot: [920, 850], n_out_S_T: [780, 920], n_out_T_bot: [640, 950], n_out_T_U: [520, 980], 
    n_out_U_bot: [360, 980], n_out_U_V: [220, 920], n_out_V_bot: [120, 860], n_out_V_W: [50, 740], 
    n_out_W_left: [20, 580], n_out_W_X: [30, 420], n_out_X_left: [40, 260] 
};

const districtDefinitions = [
    { id: 'A', num: 1, nodes: ['n_A_B_C', 'n_A_C_D', 'n_A_D_E', 'n_A_E_F', 'n_A_F_B'] },
    { id: 'B', num: 2, nodes: ['n_A_F_B', 'n_A_B_C', 'n_B_C_H', 'n_B_H_G', 'n_B_G_F'] },
    { id: 'C', num: 3, nodes: ['n_A_B_C', 'n_A_C_D', 'n_C_I_D', 'n_C_H_I', 'n_B_C_H'] },
    { id: 'D', num: 4, nodes: ['n_A_C_D', 'n_A_D_E', 'n_D_K_E', 'n_D_J_K', 'n_D_I_J', 'n_C_I_D'] },
    { id: 'E', num: 5, nodes: ['n_A_D_E', 'n_A_E_F', 'n_E_L_F', 'n_E_K_L', 'n_D_K_E'] },
    { id: 'F', num: 6, nodes: ['n_A_E_F', 'n_A_F_B', 'n_B_G_F', 'n_F_N_G', 'n_F_M_N', 'n_F_L_M', 'n_E_L_F'] },
    { id: 'G', num: 7, nodes: ['n_B_G_F', 'n_B_H_G', 'n_G_O_H', 'n_G_Y_O', 'n_G_N_Y', 'n_F_N_G'] },
    { id: 'H', num: 8, nodes: ['n_B_H_G', 'n_B_C_H', 'n_C_H_I', 'n_H_Q_I', 'n_H_P_Q', 'n_H_O_P', 'n_G_O_H'] },
    { id: 'I', num: 9, nodes: ['n_C_H_I', 'n_C_I_D', 'n_D_I_J', 'n_I_R_J', 'n_I_Q_R', 'n_H_Q_I'] },
    { id: 'J', num: 10, nodes: ['n_D_I_J', 'n_D_J_K', 'n_J_T_K', 'n_J_S_T', 'n_J_R_S', 'n_I_R_J'] },
    { id: 'K', num: 11, nodes: ['n_D_J_K', 'n_D_K_E', 'n_E_K_L', 'n_K_U_L', 'n_K_T_U', 'n_J_T_K'] },
    { id: 'L', num: 12, nodes: ['n_E_K_L', 'n_E_L_F', 'n_F_L_M', 'n_L_V_M', 'n_L_U_V', 'n_K_U_L'] },
    { id: 'M', num: 13, nodes: ['n_F_L_M', 'n_F_M_N', 'n_M_X_N', 'n_M_W_X', 'n_M_V_W', 'n_L_V_M'] },
    { id: 'N', num: 14, nodes: ['n_F_M_N', 'n_F_N_G', 'n_G_N_Y', 'n_N_X_Y', 'n_M_X_N'] },
    { id: 'O', num: 15, nodes: ['n_G_Y_O', 'n_G_O_H', 'n_H_O_P', 'n_out_O_P', 'n_out_O_top', 'n_out_Y_O'] },
    { id: 'P', num: 16, nodes: ['n_H_O_P', 'n_H_P_Q', 'n_out_P_Q', 'n_out_P_top', 'n_out_O_P'] },
    { id: 'Q', num: 17, nodes: ['n_H_P_Q', 'n_H_Q_I', 'n_I_Q_R', 'n_out_Q_R', 'n_out_Q_right', 'n_out_P_Q'] },
    { id: 'R', num: 18, nodes: ['n_I_Q_R', 'n_I_R_J', 'n_J_R_S', 'n_out_R_S', 'n_out_R_right', 'n_out_Q_R'] },
    { id: 'S', num: 19, nodes: ['n_J_R_S', 'n_J_S_T', 'n_out_S_T', 'n_out_S_bot', 'n_out_R_S'] },
    { id: 'T', num: 20, nodes: ['n_J_S_T', 'n_J_T_K', 'n_K_T_U', 'n_out_T_U', 'n_out_T_bot', 'n_out_S_T'] },
    { id: 'U', num: 21, nodes: ['n_K_T_U', 'n_K_U_L', 'n_L_U_V', 'n_out_U_V', 'n_out_U_bot', 'n_out_T_U'] },
    { id: 'V', num: 22, nodes: ['n_L_U_V', 'n_L_V_M', 'n_M_V_W', 'n_out_V_W', 'n_out_V_bot', 'n_out_U_V'] },
    { id: 'W', num: 23, nodes: ['n_M_V_W', 'n_M_W_X', 'n_out_W_X', 'n_out_W_left', 'n_out_V_W'] },
    { id: 'X', num: 24, nodes: ['n_M_W_X', 'n_M_X_N', 'n_N_X_Y', 'n_out_X_Y', 'n_out_X_left', 'n_out_W_X'] },
    { id: 'Y', num: 25, nodes: ['n_G_N_Y', 'n_G_Y_O', 'n_out_Y_O', 'n_out_Y_top2', 'n_out_Y_top1', 'n_out_X_Y', 'n_N_X_Y'] }
];

const baseOuterNodeNames = [
    'n_out_Y_top1', 'n_out_Y_top2', 'n_out_Y_O', 'n_out_O_top', 'n_out_O_P', 'n_out_P_top',
    'n_out_P_Q', 'n_out_Q_right', 'n_out_Q_R', 'n_out_R_right', 'n_out_R_S', 'n_out_S_bot',
    'n_out_S_T', 'n_out_T_bot', 'n_out_T_U', 'n_out_U_bot', 'n_out_U_V', 'n_out_V_bot',
    'n_out_V_W', 'n_out_W_left', 'n_out_W_X', 'n_out_X_left', 'n_out_X_Y'
];