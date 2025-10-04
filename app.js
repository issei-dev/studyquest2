// --------------------------------------------------------------------------
// 🌟 Ver0.15: ポップアップメッセージの修正 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT_INITIAL = 5; 
const BASE_STATS_HP = 100;
const BASE_STATS_ATTACK = 10;
const BASE_STATS_DEFENSE = 5;
const ENHANCEMENT_RATE = 1.2;
const PET_GROWTH_RATE = 0.001;

// プレイヤーのメインステータスと持ち物
let userData = {
    hp: BASE_STATS_HP,
    maxHp: BASE_STATS_HP,
    baseAttack: BASE_STATS_ATTACK,
    baseDefense: BASE_STATS_DEFENSE,
    attack: BASE_STATS_ATTACK,
    defense: BASE_STATS_DEFENSE,
    inventory: [] 
};

// 日別スタンプ記録とガチャ回数
let gachaLog = {}; 

// --- 戦闘関連データ ---
let currentStage = 1;
let enemiesDefeatedInStage = 0; 
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; 

const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, defenseBonus: 0, hpBonus: 0, rarity: 1 },
    { id: 'A001', name: '皮のよろい', type: 'armor', attackBonus: 0, defenseBonus: 3, hpBonus: 10, rarity: 1 },
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.0, defensePercentBonus: 0.0, hpPercentBonus: 0.1, rarity: 2 },
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, defenseBonus: 0, hpBonus: 0, rarity: 3 },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, defensePercentBonus: 0.0, hpPercentBonus: 0.0, rarity: 4 }
];
const enemies = {
    1: [
        { name: 'スライム', hp: 50, attack: 5, defense: 2, xp: 5, gold: 10, isBoss: false, image: 'スライム' },
        { name: 'ゴブリン', hp: 80, attack: 10, defense: 5, xp: 8, gold: 15, isBoss: false, image: 'ゴブリン' },
        { name: 'マンドラゴラ', hp: 60, attack: 7, defense: 8, xp: 6, gold: 12, isBoss: false, image: 'マンドラゴラ' }
    ],
    '1_boss': { name: 'ミノタウロス', hp: 200, attack: 25, defense: 15, xp: 50, gold: 100, isBoss: true, image: 'ミノタウロス' }
};
let currentEnemy = null;


// --- データほぞん・よみこみ関数 (変更なし) ---
function saveData() { /* ... 変更なし ... */ }
function loadData() { 
    // ... gachaLog[today] の初期化ロジックは変更なし ...
}


// --- 共通の計算ロジック, インベントリ操作ロジック, UI更新とステータス計算 (変更なし) ---
// ... (変更なし) ...


/** 画面全体に関わるUI更新関数 (変更なし) */
function updateUI() {
    // ... (変更なし) ...
}


// --- イベントハンドラーとメインロジック ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. データロード
    loadData();

    // 2. スタンプ機能のイベントリスナー
    document.getElementById('study-stamps').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('study-stamp-button') && !button.disabled) {
            const content = button.getAttribute('data-content');
            
            // ガチャ回数が1回増える
            gachaLog[today].count += 1; 
            
            // スタンプを記録
            if (!gachaLog[today].studyContent.includes(content)) {
                gachaLog[today].studyContent.push(content); 
            }
            
            // 🚨 修正: ポップアップのメッセージを変更
            showModal('スタンプゲット！', `今日もがんばったね！<br>ガチャ回数が **1回** 増えたよ！`);
            
            updateUI(); 
        }
    });

    // 3. ガチャ機能のイベントリスナー (変更なし)
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        // ... (変更なし) ...
    });

    // 4. 初回UI更新
    updateUI(); 
});


// ------------------ 戦闘ロジック (変更なし) ------------------

window.attackEnemy = () => {
    // ... (変更なし) ...
};


// ------------------ その他の関数 (変更なし) ------------------
window.showTab = (clickedButton, tabId) => { /* ... 変更なし ... */ };
window.showModal = (title = 'お知らせ', message = '') => { /* ... 変更なし ... */ };
window.hideModal = () => { /* ... 変更なし ... */ };
function updateCalendarLogUI() { /* ... 変更なし ... */ }
function updateInventoryUI() { /* ... 変更なし ... */ }
function updateEnemyUI() { /* ... 変更なし ... */ }
