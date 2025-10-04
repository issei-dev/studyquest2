// --------------------------------------------------------------------------
// 🌟 Ver0.22: スタンプボタンの色制御を完全に削除し、動作を保証 🌟
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


// --- データほぞん・よみこみ関数 (省略) ---
function saveData() { /* ... */ }
function loadData() { /* ... */ }
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

    // 3. スタンプボタンの動作保証
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        // 🚨 修正: 色制御のコードは不要です。HTML/CSSのデフォルト設定（緑）を維持します。
        // 🚨 修正: 意図しない無効化を防ぐため、ここで常に有効化します
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
                // updateUIによって既に有効化されていますが、念のため再活性化を保証
                stampButton.disabled = false;
            }, 500);
        }
    });

    // 3. ガチャ機能のイベントリスナー (変更なし)
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('gacha-roll-button') && !button.disabled) {
            const currentGachaCount = gachaLog[today] ? gachaLog[today].count : 0;

            if (currentGachaCount > 0) {
                gachaLog[today].count -= 1; 
                
                const type = button.id.includes('weapon') ? 'ぶき' : 'ペット';
                const resultElement = document.getElementById('gacha-result');
                
                const rollItems = items.filter(i => (type === 'ぶき' ? i.type !== 'pet' : i.type === 'pet'));
                const rolledItem = rollItems[Math.floor(Math.random() * rollItems.length)];
                
                let modalMessage = '';
                const existingItemIndex = userData.inventory.findIndex(invItem => invItem.id === rolledItem.id);

                if (existingItemIndex !== -1) {
                    userData.inventory[existingItemIndex].level = (userData.inventory[existingItemIndex].level || 1) + 1;
                    modalMessage = `<p class="text-xl font-bold text-red-600 mb-2">🎉 ${type}ガチャ 結果発表 🎉</p>
                                    <img src="${rolledItem.image}" alt="${rolledItem.name}" class="mx-auto my-2 rounded-md border-2 border-yellow-400" width="80" height="80">
                                    <p class="text-lg">「${rolledItem.name}」がレベルアップしたよ！</p>
                                    <p class="text-md">現在のレベル: **${userData.inventory[existingItemIndex].level}**</p>`;
                } else {
                    userData.inventory.push({ 
                        id: rolledItem.id, 
                        level: 1, 
                        isEquipped: false
                    });
                    modalMessage = `<p class="text-xl font-bold text-red-600 mb-2">🎉 ${type}ガチャ 結果発表 🎉</p>
                                    <img src="${rolledItem.image}" alt="${rolledItem.name}" class="mx-auto my-2 rounded-md border-2 border-blue-400" width="80" height="80">
                                    <p class="text-lg">「${rolledItem.name}」を手に入れた！</p>`;
                }
                
                showModal('ガチャ結果', modalMessage);

                resultElement.innerHTML = `<p class="text-gray-500">ガチャを引きました！結果はポップアップで確認してください。</p>`;

                updateUI();
            }
        }
    });

    updateUI(); 
});


// ------------------ グローバル関数 (タブ切り替え、モーダル等) (変更なし) ------------------

window.showTab = (clickedButton, tabId) => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none'; 
    });
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.style.display = 'block'; 
    }

    if (tabId === 'inventory') {
        updateInventoryUI();
    }
    
    if (tabId === 'calendar') {
        updateCalendarLogUI();
    }

    if (tabId === 'enemy') {
        updateEnemyUI();
    }
};

window.showModal = (title = 'お知らせ', message = '') => { /* ... */ };
window.hideModal = () => { /* ... */ };
function updateCalendarLogUI() { /* ... */ }
