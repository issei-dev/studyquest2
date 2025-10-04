// --------------------------------------------------------------------------
// 🌟 Ver0.20: スタンプボタンの動作保証と色修正 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
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

// 日別スタンプ記録とガチャ回数 (countは利用可能回数)
let gachaLog = {}; 

// --- 戦闘関連データ ---
let currentStage = 1;
let enemiesDefeatedInStage = 0; 
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; 

const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, defenseBonus: 0, hpBonus: 0, rarity: 1, image: 'https://placehold.co/80x80/a0522d/ffffff?text=木剣' },
    { id: 'A001', name: '皮のよろい', type: 'armor', attackBonus: 0, defenseBonus: 3, hpBonus: 10, rarity: 1, image: 'https://placehold.co/80x80/d2b48c/ffffff?text=皮鎧' },
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.0, defensePercentBonus: 0.0, hpPercentBonus: 0.1, rarity: 2, image: 'https://placehold.co/80x80/87ceeb/ffffff?text=スライム' },
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, defenseBonus: 0, hpBonus: 0, rarity: 3, image: 'https://placehold.co/80x80/808080/ffffff?text=鋼剣' },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, defensePercentBonus: 0.0, hpPercentBonus: 0.0, rarity: 4, image: 'https://placehold.co/80x80/ff4500/ffffff?text=ドラゴン' }
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
function saveData() { /* ... */ }
function loadData() { 
    // ... (データロードロジックは変更なし) ...
}


// --- 共通の計算ロジック, インベントリ操作ロジック, UI更新とステータス計算 (省略) ---
function calculateWeaponArmorBonus(baseBonus, level) { return Math.round(baseBonus * Math.pow(ENHANCEMENT_RATE, level - 1)); }
function calculatePetPercentBonus(basePercent, level) { return basePercent + (level - 1) * PET_GROWTH_RATE; }
window.toggleEquipItem = (itemIndex) => { updateUI(); };
window.enhanceItem = (itemIndex) => { updateUI(); };
function updateInventoryUI() { /* ... */ }
function selectEnemy() { /* ... */ }
function updateEnemyHPBar(enemy, container) { /* ... */ }
function updateEnemyUI() { /* ... */ }
window.attackEnemy = () => { /* ... */ };


/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 1. ガチャ回数更新 
    const gachaCount = gachaLog[today] ? gachaLog[today].count : 0;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化
    const isDisabled = gachaCount <= 0;
    const weaponButton = document.getElementById('gacha-roll-weapon');
    const petButton = document.getElementById('gacha-roll-pet');

    if (weaponButton) weaponButton.disabled = isDisabled;
    if (petButton) petButton.disabled = isDisabled;

    // 3. スタンプボタンの色制御
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        // 🚨 修正: 常に緑色を適用し、グレーのクラスを確実に削除
        button.classList.remove('bg-gray-400');
        button.classList.add('bg-green-500'); 
        // 🚨 修正: 誤って無効化されないよう、ここで常に有効化します
        button.disabled = false;
    });

    // 4. ステータス計算とインベントリUIの更新
    updateInventoryUI(); 

    // 5. データ保存
    saveData();
}


// --- イベントハンドラーとメインロジック ---

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // 2. スタンプ機能のイベントリスナー
    document.getElementById('study-stamps').addEventListener('click', (event) => {
        // 🚨 修正: button要素自体、またはその親であるボタン要素を取得
        const stampButton = event.target.closest('.study-stamp-button');

        if (stampButton && !stampButton.disabled) {
            const content = stampButton.getAttribute('data-content');
            
            // 🚨 連続タップ防止のため、処理開始時にボタンを無効化
            stampButton.disabled = true;
            
            gachaLog[today].count += 1; 
            
            // 記録はコンテンツ種類ごとに1日1回のみ
            if (!gachaLog[today].studyContent.includes(content)) {
                gachaLog[today].studyContent.push(content); 
            }
            
            showModal('スタンプゲット！', `今日もがんばったね！<br>ガチャ回数が **1回** 増えたよ！`);
            
            updateUI(); 

            // 🚨 0.5秒後にボタンを再活性化
            setTimeout(() => {
                stampButton.disabled = false;
                // updateUIが呼ばれた後も、ボタンの色が緑であることを再度保証
                stampButton.classList.remove('bg-gray-400');
                stampButton.classList.add('bg-green-500'); 
            }, 500);
        }
    });

    // 3. ガチャ機能のイベントリスナー (変更なし)
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        // ... (変更なし) ...
    });

    updateUI(); 
});


// ------------------ グローバル関数 (タブ切り替え、モーダル等) (変更なし) ------------------

window.showTab = (clickedButton, tabId) => { /* ... */ };
window.showModal = (title = 'お知らせ', message = '') => { /* ... */ };
window.hideModal = () => { /* ... */ };
function updateCalendarLogUI() { /* ... */ }
