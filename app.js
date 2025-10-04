// --------------------------------------------------------------------------
// 🌟 Ver0.24: キャラクター初期ステータス、総合ステータス計算、装備/ペット表示 🌟
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


// --- データほぞん・よみこみ関数 ---
function saveData() { 
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('gachaLog', JSON.stringify(gachaLog));
    localStorage.setItem('currentStage', currentStage);
    localStorage.setItem('enemiesDefeatedInStage', enemiesDefeatedInStage);
}
function loadData() { 
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        userData = JSON.parse(savedUserData);
        userData.baseAttack = userData.baseAttack || BASE_STATS_ATTACK;
        userData.baseDefense = userData.baseDefense || BASE_STATS_DEFENSE;
        userData.maxHp = userData.maxHp || BASE_STATS_HP;
        userData.hp = userData.hp || userData.maxHp;
    }
    const savedGachaLog = localStorage.getItem('gachaLog');
    if (savedGachaLog) {
        gachaLog = JSON.parse(savedGachaLog);
    }
    const savedStage = localStorage.getItem('currentStage');
    if (savedStage) {
        currentStage = parseInt(savedStage, 10);
    }
    const savedDefeated = localStorage.getItem('enemiesDefeatedInStage');
    if (savedDefeated) {
        enemiesDefeatedInStage = parseInt(savedDefeated, 10);
    }
    
    if (!gachaLog[today] || gachaLog[today].count === undefined || gachaLog[today].studyContent === undefined) { 
        userData.hp = userData.maxHp; 
        gachaLog[today] = { count: 0, studyContent: [] };
    }
    gachaLog[today].count = Number(gachaLog[today].count) || 0;
}

// --- アイテムボーナス計算関数 ---

function calculateWeaponArmorBonus(baseBonus, level) { 
    return Math.round(baseBonus * Math.pow(ENHANCEMENT_RATE, level - 1)); 
}
function calculatePetPercentBonus(basePercent, level) { 
    return basePercent + (level - 1) * PET_GROWTH_RATE; 
}

// 装備とペットの合計ステータスを計算
function calculateTotalStats() {
    let totalMaxHpBonus = 0;
    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpPercentBonus = 0;
    let totalAttackPercentBonus = 0;
    let totalDefensePercentBonus = 0;

    userData.inventory.forEach((invItem) => {
        if (invItem.isEquipped) {
            const itemData = items.find(i => i.id === invItem.id);
            if (!itemData) return;

            const level = invItem.level || 1;

            if (itemData.type === 'weapon' || itemData.type === 'armor') {
                totalMaxHpBonus += calculateWeaponArmorBonus(itemData.hpBonus || 0, level);
                totalAttackBonus += calculateWeaponArmorBonus(itemData.attackBonus || 0, level);
                totalDefenseBonus += calculateWeaponArmorBonus(itemData.defenseBonus || 0, level);
            } else if (itemData.type === 'pet') {
                totalHpPercentBonus += calculatePetPercentBonus(itemData.hpPercentBonus || 0, level);
                totalAttackPercentBonus += calculatePetPercentBonus(itemData.attackPercentBonus || 0, level);
                totalDefensePercentBonus += calculatePetPercentBonus(itemData.defensePercentBonus || 0, level);
            }
        }
    });

    // 基礎ステータスにボーナスを加算
    const finalMaxHp = Math.round(userData.maxHp + totalMaxHpBonus);
    const finalAttack = Math.round(userData.baseAttack + totalAttackBonus);
    const finalDefense = Math.round(userData.baseDefense + totalDefenseBonus);

    // パーセンテージボーナスを適用
    userData.attack = Math.round(finalAttack * (1 + totalAttackPercentBonus));
    userData.defense = Math.round(finalDefense * (1 + totalDefensePercentBonus));
    userData.maxHp = Math.round(finalMaxHp * (1 + totalHpPercentBonus));
    // HPが最大HPを超えないように調整
    userData.hp = Math.min(userData.hp, userData.maxHp);
    
    // HPが回復などで更新された場合、UIを更新するためにtrueを返す（今回はUI更新をメイン関数に任せる）
}

// --- ステータスUI更新関数 ---

function updateCharacterStatsUI() {
    // 総合ステータスを計算
    calculateTotalStats(); 

    // HPバーの更新 (character-hp-bar-fill, character-hp-text)
    const hpPercent = (userData.hp / userData.maxHp) * 100;
    const hpBar = document.getElementById('character-hp-bar-fill');
    const hpText = document.getElementById('character-hp-text');

    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    if (hpText) hpText.textContent = `${userData.hp} / ${userData.maxHp}`;

    // 攻撃力、防御力の数値更新 (character-attack, character-defense)
    const attackText = document.getElementById('character-attack');
    const defenseText = document.getElementById('character-defense');
    
    if (attackText) attackText.textContent = userData.attack;
    if (defenseText) defenseText.textContent = userData.defense;
}


// --- インベントリUI更新関数 ---

function updateInventoryUI() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    const equippedWeaponContainer = document.getElementById('equipped-weapon-container');
    const equippedPetContainer = document.getElementById('equipped-pet-container');

    // コンテナを初期化
    if (equippedWeaponContainer) equippedWeaponContainer.innerHTML = 'なし';
    if (equippedPetContainer) equippedPetContainer.innerHTML = 'なし';

    userData.inventory.forEach((invItem, index) => {
        const itemData = items.find(i => i.id === invItem.id);
        if (!itemData) return;

        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 border-b';
        
        // アイテム表示
        let itemHtml = `<div class="flex items-center">
            <img src="${itemData.image}" alt="${itemData.name}" class="w-10 h-10 mr-3 rounded-full">
            <div>
                <span class="font-bold">${itemData.name} +${invItem.level - 1}</span>
                <span class="text-sm text-gray-500 block">(${itemData.type === 'pet' ? 'ペット' : '装備'})</span>
            </div>
        </div>`;
        
        // ボタン表示
        let buttonHtml = '<div>';
        if (itemData.type !== 'pet') { // 武器・防具の装備
            const isEquipped = invItem.isEquipped && itemData.type !== 'pet';
            buttonHtml += `<button onclick="toggleEquipItem(${index})" class="text-xs p-1 rounded ${isEquipped ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} mr-2">
                ${isEquipped ? '解除' : '装備'}
            </button>`;
        }
        buttonHtml += `<button onclick="enhanceItem(${index})" class="text-xs p-1 rounded bg-yellow-500 text-white">
            強化
        </button></div>`;

        li.innerHTML = itemHtml + buttonHtml;
        inventoryList.appendChild(li);

        // 装備/ペットの表示を更新
        if (invItem.isEquipped) {
            const equippedHtml = `<div class="flex items-center">
                <img src="${itemData.image}" alt="${itemData.name}" class="w-12 h-12 mr-3 rounded-full border-2 border-yellow-400">
                <span class="font-bold">${itemData.name} +${invItem.level - 1}</span>
            </div>`;
            
            if (itemData.type === 'pet' && equippedPetContainer) {
                equippedPetContainer.innerHTML = equippedHtml;
            } else if (itemData.type !== 'pet' && equippedWeaponContainer) {
                 // 簡易化のため、ここでは武器と防具をまとめて '装備' として表示。
                 // 厳密な区別が必要な場合はHTML側に 'equipped-armor-container' などを追加する必要があります。
                 // 今回は'装備'コンテナに直近に装備したものを表示する形で対応します。
                 equippedWeaponContainer.innerHTML = equippedHtml;
            }
        }
    });
}

// --- その他のUI更新関数 (省略) ---
window.toggleEquipItem = (itemIndex) => { /* ... */ updateUI(); };
window.enhanceItem = (itemIndex) => { /* ... */ updateUI(); };
function updateEnemyUI() { /* ... */ }
window.attackEnemy = () => { /* ... */ };
function updateCalendarLogUI() { /* ... */ }


/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 🚨 修正: 総合ステータスUIを更新
    updateCharacterStatsUI();
    
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
        button.classList.remove('bg-gray-400');
        button.classList.add('bg-green-500'); 
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
            
            stampButton.disabled = true;
            
            gachaLog[today].count += 1; 
            
            if (!gachaLog[today].studyContent.includes(content)) {
                gachaLog[today].studyContent.push(content); 
            }
            
            showModal('スタンプゲット！', `今日もがんばったね！<br>ガチャ回数が **1回** 増えたよ！`);
            
            updateUI(); 

            setTimeout(() => {
                stampButton.disabled = false;
                stampButton.classList.remove('bg-gray-400');
                stampButton.classList.add('bg-green-500'); 
            }, 500);
        }
    });

    // 3. ガチャ機能のイベントリスナー
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
