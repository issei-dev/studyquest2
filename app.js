// --------------------------------------------------------------------------
// 🌟 Ver0.25: スタンプボタン再活性化とタブ切り替え機能の修正 🌟
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

    const finalMaxHp = Math.round(userData.maxHp + totalMaxHpBonus);
    const finalAttack = Math.round(userData.baseAttack + totalAttackBonus);
    const finalDefense = Math.round(userData.baseDefense + totalDefenseBonus);

    userData.attack = Math.round(finalAttack * (1 + totalAttackPercentBonus));
    userData.defense = Math.round(finalDefense * (1 + totalDefensePercentBonus));
    userData.maxHp = Math.round(finalMaxHp * (1 + totalHpPercentBonus));
    userData.hp = Math.min(userData.hp, userData.maxHp);
}

// --- ステータスUI更新関数 ---
function updateCharacterStatsUI() {
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

    // たたかうタブのステータス更新
    const enemyTabHp = document.getElementById('enemy-tab-hp');
    const enemyTabAttack = document.getElementById('enemy-tab-attack');
    if(enemyTabHp) enemyTabHp.textContent = `${userData.hp} / ${userData.maxHp}`;
    if(enemyTabAttack) enemyTabAttack.textContent = userData.attack;
}

// --- インベントリUI更新関数 ---
function updateInventoryUI() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    const equippedWeaponContainer = document.getElementById('equipped-weapon-container');
    const equippedPetContainer = document.getElementById('equipped-pet-container');

    if (equippedWeaponContainer) equippedWeaponContainer.innerHTML = '<div class="text-gray-500 text-sm">なし</div>';
    if (equippedPetContainer) equippedPetContainer.innerHTML = '<div class="text-gray-500 text-sm">なし</div>';

    userData.inventory.forEach((invItem, index) => {
        const itemData = items.find(i => i.id === invItem.id);
        if (!itemData) return;

        const level = invItem.level || 1;
        const enhancementLevel = level - 1;

        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 border-b';
        
        let itemHtml = `<div class="flex items-center">
            <img src="${itemData.image}" alt="${itemData.name}" class="w-10 h-10 mr-3 rounded-full">
            <div>
                <span class="font-bold">${itemData.name} +${enhancementLevel}</span>
                <span class="text-sm text-gray-500 block">(${itemData.type === 'pet' ? 'ペット' : '装備'})</span>
            </div>
        </div>`;
        
        let buttonHtml = '<div>';
        if (itemData.type !== 'pet') { // 武器・防具の装備/解除
            const isEquipped = invItem.isEquipped;
            buttonHtml += `<button onclick="toggleEquipItem(${index})" class="text-xs p-1 rounded ${isEquipped ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} mr-2">
                ${isEquipped ? '解除' : '装備'}
            </button>`;
        } else { // ペットの装備/解除
             const isEquipped = invItem.isEquipped;
             buttonHtml += `<button onclick="toggleEquipItem(${index})" class="text-xs p-1 rounded ${isEquipped ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} mr-2">
                ${isEquipped ? '解除' : 'セット'}
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
                <span class="font-bold">${itemData.name} +${enhancementLevel}</span>
            </div>`;
            
            if (itemData.type === 'pet' && equippedPetContainer) {
                equippedPetContainer.innerHTML = equippedHtml;
            } else if (equippedWeaponContainer) {
                 equippedWeaponContainer.innerHTML = equippedHtml;
            }
        }
    });
}

// 装備・解除機能 (簡略版)
window.toggleEquipItem = (itemIndex) => { 
    const targetItem = userData.inventory[itemIndex];
    if (!targetItem) return;

    const itemData = items.find(i => i.id === targetItem.id);
    if (!itemData) return;

    if (targetItem.isEquipped) {
        // 解除
        targetItem.isEquipped = false;
    } else {
        // 装備 (同種の他のアイテムを解除するロジック)
        const type = itemData.type;
        userData.inventory.forEach(invItem => {
            const currentItemData = items.find(i => i.id === invItem.id);
            if (currentItemData && currentItemData.type === type) {
                invItem.isEquipped = false;
            }
        });
        targetItem.isEquipped = true;
    }
    updateUI(); 
};

window.enhanceItem = (itemIndex) => {
    const targetItem = userData.inventory[itemIndex];
    if (!targetItem) return;

    // 強化レベルを上げる (シンプルに+1)
    targetItem.level = (targetItem.level || 1) + 1;
    
    showModal('強化完了！', `${items.find(i => i.id === targetItem.id).name} がレベル ${targetItem.level} にアップした！`);

    updateUI();
};

function updateEnemyUI() { /* ... */ }
window.attackEnemy = () => { /* ... */ };
function updateCalendarLogUI() { /* ... */ }


/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 🚨 修正: 総合ステータスUIを更新 (HP, 攻撃力, 防御力)
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
        // グレーアウト防止と緑色の維持
        button.classList.remove('bg-gray-400');
        button.classList.add('bg-green-500'); 
        
        // 🚨 修正: 意図しない無効化を防ぐため、ここで常に有効化を保証
        button.disabled = false;
    });

    // 4. インベントリUIの更新
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
            
            // 🚨 修正: 処理開始時にボタンを無効化し、連続タップを防ぐ
            stampButton.disabled = true;
            
            gachaLog[today].count += 1; 
            
            if (!gachaLog[today].studyContent.includes(content)) {
                gachaLog[today].studyContent.push(content); 
            }
            
            showModal('スタンプゲット！', `今日もがんばったね！<br>ガチャ回数が **1回** 増えたよ！`);
            
            // updateUIを呼び出すことで、ボタンはすぐに再活性化されます (updateUIの3番)
            updateUI(); 

            // 🚨 修正: タイムアウトによる再活性化は不要になりましたが、保険として残す場合は、
            // 確実に色も戻します。ただし、updateUIで処理されるため、このsetTimeoutは削除推奨です。
            // 今回は動作保証のため、念のため残しておきますが、メインの再活性化はupdateUIに依存します。
            setTimeout(() => {
                stampButton.disabled = false;
            }, 500);
        }
    });

    // 3. ガチャ機能のイベントリスナー (変更なし)
    document.getElementById('gacha-controls').addEventListener('click', (event) => { /* ... */ });

    updateUI(); 
    
    // 画面ロード時に最初のタブ（ガチャ）を強制的に表示
    window.showTab(document.querySelector('.tab-button.active'), 'gacha');
});


// ------------------ グローバル関数 (タブ切り替え、モーダル等) ------------------

window.showTab = (clickedButton, tabId) => {
    // 🚨 修正: 全てのタブボタンから 'active' クラスを削除
    document.querySelectorAll('.tabs .tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // 🚨 修正: クリックされたボタンに 'active' クラスを追加
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // 🚨 修正: 全てのタブコンテンツを非表示にする
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none'; 
    });
    
    // 🚨 修正: 選択されたタブコンテンツを表示する
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.style.display = 'block'; 
    }

    // 特定のタブに切り替わったときの処理
    if (tabId === 'inventory') {
        updateInventoryUI();
        updateCharacterStatsUI(); // ステータス再計算・表示
    }
    
    if (tabId === 'calendar') {
        updateCalendarLogUI();
    }

    if (tabId === 'enemy') {
        updateEnemyUI();
    }
};

window.showModal = (title = 'お知らせ', message = '') => { 
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (modalTitle) modalTitle.innerHTML = title;
    if (modalMessage) modalMessage.innerHTML = message;
    if (modal) modal.classList.add('visible');
};

window.hideModal = () => { 
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.remove('visible');
};

function updateCalendarLogUI() { 
    const logList = document.getElementById('study-log-list');
    if (!logList) return;
    logList.innerHTML = '';
    
    const sortedDates = Object.keys(gachaLog).sort().reverse();
    
    sortedDates.forEach(date => {
        const log = gachaLog[date];
        if (log.studyContent && log.studyContent.length > 0) {
            const li = document.createElement('li');
            const contents = log.studyContent.join('と');
            li.innerHTML = `**${date}**: ${contents} (ガチャ ${log.count}回)`;
            logList.appendChild(li);
        }
    });

    if (logList.children.length === 0) {
        logList.innerHTML = `<li class="text-gray-500">まだ勉強の記録がありません。</li>`;
    }
}
