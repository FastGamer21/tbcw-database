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
        reports: [{ title: "Incident Report #77-A", content: "Veteran operative. Killed in action during a perimeter breach." }]
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