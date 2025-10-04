// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5; // スタンプ回数の上限
const BASE_STATS_HP = 100;
const ENHANCEMENT_RATE = 1.2; // 武器・防具のレベルアップ時のステータス成長率
const PET_GROWTH_RATE = 0.001; // ペットのレベルアップ時のパーセント成長率 (0.1% = 0.001)

let userData = {
    hp: BASE_STATS_HP,
    maxHp: BASE_STATS_HP,
    baseAttack: 10,
    baseDefense: 5,
    attack: 10,
    defense: 5,
    inventory: [] // { id: 1, level: 1, isEquipped: false } 形式
};

let currentStage = 1;
let enemiesDefeatedInStage = 0;
const DEFEAT_COUNT_FOR_BOSS = 15;

let gachaLog = {};
let currentEnemies = [];

// --- アイテムデータ ---
// ★修正: ペットのボーナスをパーセント (PercentBonus) に変更
const items = [
    // 武器 (weapon): 2枠 (レベルアップ時 1.2倍成長)
    { id: 1, name: 'きのつるぎ', type: 'weapon', rarity: 'N', attackBonus: 5, defenseBonus: 1, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=きのつるぎ' },
    { id: 4, name: 'てつのつるぎ', type: 'weapon', rarity: 'R', attackBonus: 10, defenseBonus: 2, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=てつのつるぎ' },
    { id: 6, name: 'ほのおのつるぎ', type: 'weapon', rarity: 'SR', attackBonus: 25, defenseBonus: 5, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ほのおのつるぎ' },
    { id: 13, name: 'でんせつのけん', type: 'weapon', rarity: 'UR', attackBonus: 50, defenseBonus: 10, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=URつるぎ' },
    { id: 14, name: 'きぼうのひかり', type: 'weapon', rarity: 'LE', attackBonus: 100, defenseBonus: 20, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=LEつるぎ' },
    // 防具 (armor): 1枠 (レベルアップ時 1.2倍成長)
    { id: 2, name: 'いしのたて', type: 'armor', rarity: 'N', attackBonus: 1, defenseBonus: 3, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=いしのたて' },
    { id: 5, name: 'かわのよろい', type: 'armor', rarity: 'R', attackBonus: 2, defenseBonus: 7, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=かわのよろい' },
    { id: 7, name: 'ドラゴンのたて', type: 'armor', rarity: 'SR', attackBonus: 0, defenseBonus: 30, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴンのたて' },
    // ペット (pet): 3枠 (レベルアップ時 0.1%成長)
    { id: 3, name: 'スライム', type: 'pet', rarity: 'N', attackPercentBonus: 10, defensePercentBonus: 0, hpPercentBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=スライム' },
    { id: 8, name: 'こいぬ', type: 'pet', rarity: 'R', attackPercentBonus: 5, defensePercentBonus: 5, hpPercentBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=こいぬ' },
    { id: 9, name: 'ねこ', type: 'pet', rarity: 'R', attackPercentBonus: 0, defensePercentBonus: 10, hpPercentBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ねこ' },
    { id: 15, name: 'フェニックス', type: 'pet', rarity: 'UR', attackPercentBonus: 15, defensePercentBonus: 15, hpPercentBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=URペット' },
    { id: 16, name: 'ユニコーン', type: 'pet', rarity: 'LE', attackPercentBonus: 10, defensePercentBonus: 10, hpPercentBonus: 10, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=LEペット' },
    
    // 強化アイテム (material)
    { id: 100, name: 'きょうかのかけら（小）', type: 'material', rarity: 'N', levelIncrease: 1, imageUrl: 'https://placehold.jp/200x200.png?text=かけら小' },
    { id: 101, name: 'きょうかのかけら（中）', type: 'material', rarity: 'R', levelIncrease: 2, imageUrl: 'https://placehold.jp/200x200.png?text=かけら中' },
    { id: 102, name: 'きょうかのかけら（大）', type: 'material', rarity: 'SR', levelIncrease: 3, imageUrl: 'https://placehold.jp/200x200.png?text=かけら大' },
    { id: 103, name: 'きょうかのかたまり（小）', type: 'material', rarity: 'UR', levelIncrease: 4, imageUrl: 'https://placehold.jp/200x200.png?text=かたまり小' },
];

// 装備枠の定義
const EQUIP_SLOTS = {
    'weapon': 2,
    'armor': 1,
    'pet': 3
};

// タイプの日本語名
const TYPE_NAMES = {
    'weapon': 'ぶき',
    'armor': 'ぼうぐ',
    'pet': 'ペット',
    'material': 'そざい'
};

// ... (ENEMY_GROUPS, DROP_RATES は省略) ...

// --- データほぞん・よみこみ関数 (省略) ---
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
    
    if (!gachaLog[today]) {
        userData.hp = userData.maxHp; 
        gachaLog[today] = { count: 0, studyContent: [] };
    }
}

function updateHpBar(elementId, currentHp, maxHp) {
    const bar = document.getElementById(elementId);
    if (!bar) return;
    const percentage = Math.max(0, (currentHp / maxHp) * 100);
    bar.style.width = `${percentage}%`;
    bar.textContent = `${Math.max(0, currentHp)} / ${maxHp}`;
    bar.style.backgroundColor = percentage > 50 ? 'green' : (percentage > 20 ? 'orange' : 'red');
}

// --- UIそうさ関数 (タブ切り替え) (省略) ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'gacha') {
        updateGachaUI();
    } else if (tabId === 'inventory') {
        updateInventoryUI();
    } else if (tabId === 'enemy') {
        spawnEnemies();
        updateEnemyUI();
    } else if (tabId === 'calendar') {
        updateCalendarUI();
    }
}

// --- スタンプ・ポップアップ機能 (省略) ---
function showStampPopup(message, onOk) {
    let popupHtml = `
        <div id="stamp-popup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 200; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 80%;">
                <h3>${message}</h3>
                <button id="popup-ok-button" style="padding: 10px 20px; margin-top: 20px;">OK</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);
    
    document.getElementById('popup-ok-button').onclick = () => {
        document.getElementById('stamp-popup').remove();
        if (onOk) onOk();
    };
}

function showOtherStampPopup() {
    let inputPopupHtml = `
        <div id="stamp-input-popup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 200; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 80%;">
                <h3>何を勉強しましたか？</h3>
                <input type="text" id="study-input" placeholder="例: 漢字練習" style="width: 80%; padding: 10px; margin: 10px 0;">
                <div style="margin-top: 10px;">
                    <button id="input-ok-button" style="padding: 10px 20px;">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', inputPopupHtml);
    
    document.getElementById('input-ok-button').onclick = () => {
        const content = document.getElementById('study-input').value || 'そのほか';
        document.getElementById('stamp-input-popup').remove();
        
        handleStudyStamp(content, true);
    };
}

function handleStudyStamp(content, isManual = false) {
    if (gachaLog[today].count >= MAX_GACHA_COUNT) {
        showStampPopup('きょうのスタンプは じょうげんに たっしました。', updateGachaUI);
        return;
    }

    gachaLog[today].count++;
    gachaLog[today].studyContent.push(content);
    saveData();
    
    if (!isManual) {
        showStampPopup('きょうもがんばったね！', updateGachaUI);
    } else {
        showStampPopup('きょうもがんばったね！', updateGachaUI);
    }
}

// --- ガチャロジック (省略) ---
function updateGachaUI() {
    const dailyLog = gachaLog[today] || { count: 0, studyContent: [] };
    const remaining = dailyLog.count;
    document.getElementById('gacha-count').textContent = remaining;
    
    const gachaButtons = document.querySelectorAll('.gacha-roll-button');
    gachaButtons.forEach(button => {
        button.disabled = remaining <= 0;
    });
}

function rollGacha(itemType) {
    const rarities = ['LE', 'UR', 'SR', 'R', 'N'];
    const weights = [1, 4, 15, 30, 50]; 
    
    let totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.floor(Math.random() * totalWeight);
    
    let selectedRarity = '';
    for (let i = 0; i < rarities.length; i++) {
        if (rand < weights[i]) {
            selectedRarity = rarities[i];
            break;
        }
        rand -= weights[i];
    }

    const availableItemsPool = items.filter(item => {
        if (item.type !== itemType) return false;
        
        const existingItem = userData.inventory.find(invItem => invItem.id === item.id);
        
        return !existingItem || existingItem.level < item.maxLevel;
    });

    if (availableItemsPool.length === 0) {
        return { name: `${TYPE_NAMES[itemType]}ガチャ`, rarity: 'None', message: '全てのアイテムが最大レベルです！' };
    }

    let filteredItems = availableItemsPool.filter(item => item.rarity === selectedRarity);

    if (filteredItems.length === 0) {
        filteredItems = availableItemsPool;
    }
    
    const pulledItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];
    return pulledItem;
}

function processGachaRoll(itemType) {
    if (gachaLog[today].count <= 0) {
        document.getElementById('gacha-result').textContent = 'スタンプが たりません。';
        return;
    }
    
    gachaLog[today].count--;
    
    const pulledItem = rollGacha(itemType);

    let message = '';
    let resultHtml = '';

    if (pulledItem.message && pulledItem.rarity === 'None') {
        message = pulledItem.message;
        resultHtml = `<p>結果: ${message}</p>`;
    } else {
        const existingItem = userData.inventory.find(invItem => invItem.id === pulledItem.id);

        if (existingItem) {
            existingItem.level++;
            message = `${pulledItem.name}を じゅうふくして にゅうしゅしました！レベルが${existingItem.level}に あがりました！`;
        } else {
            const newItem = { id: pulledItem.id, level: 1, isEquipped: false };
            userData.inventory.push(newItem);
            message = `${pulledItem.name}を あたらしく てにいれました！`;
        }

        resultHtml = `
            <p>${message}</p>
            <div class="item-card">
                <img src="${pulledItem.imageUrl}" alt="${pulledItem.name}">
                <p>${pulledItem.name} (${pulledItem.rarity})</p>
            </div>
        `;
    }
    
    document.getElementById('gacha-result').innerHTML = resultHtml;

    updateInventoryUI();
    updateGachaUI();
    saveData();
}

// --- インベントリーロジック (装備枠と強化機能) ---

/**
 * 武器/防具のレベルに応じたボーナス値を計算します。
 * @param {number} baseBonus - アイテムの基本ボーナス値 (絶対値)
 * @param {number} level - 現在のレベル
 * @returns {number} 計算された合計ボーナス値 (絶対値)
 */
function calculateWeaponArmorBonus(baseBonus, level) {
    if (level <= 1) {
        return baseBonus;
    }
    
    let totalBonus = baseBonus;
    
    // レベル L の時のボーナス値 = baseBonus * (ENHANCEMENT_RATE ^ (L-1))
    for (let i = 2; i <= level; i++) {
        totalBonus *= ENHANCEMENT_RATE;
    }
    
    return Math.round(totalBonus); 
}

/**
 * ペットのレベルに応じたパーセントボーナスを計算します。
 * @param {number} basePercent - ペットの基本パーセントボーナス (例: 10 for 10%)
 * @param {number} level - 現在のレベル
 * @returns {number} 計算された合計パーセントボーナス (例: 10.5 for 10.5%)
 */
function calculatePetPercentBonus(basePercent, level) {
    // レベル1のボーナスはそのまま
    let totalPercent = basePercent;
    
    // レベルアップごとに 0.1% 増加 (PET_GROWTH_RATE = 0.001)
    if (level > 1) {
        // level-1 回の成長がある (例: L2では1回、L3では2回)
        totalPercent += (level - 1) * (PET_GROWTH_RATE * 100); 
    }
    
    // 小数点第2位を四捨五入して表示するため、第3位で丸めます
    return Math.round(totalPercent * 100) / 100;
}


function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    if (!invDiv) return;

    // --- 1. 武器/防具による絶対値ボーナス計算 ---
    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpBonus = 0;
    
    // --- 2. ペットによるパーセンテージボーナス計算 ---
    let totalAttackPercent = 0;
    let totalDefensePercent = 0;
    let totalHpPercent = 0;

    const equippedItems = userData.inventory.filter(item => item.isEquipped);
    const equippedItemsMap = {}; 

    equippedItems.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;
        
        if (itemDetails.type === 'weapon' || itemDetails.type === 'armor') {
            // 武器・防具の絶対値ボーナス計算
            const attackBoost = calculateWeaponArmorBonus(itemDetails.attackBonus || 0, invItem.level);
            const defenseBoost = calculateWeaponArmorBonus(itemDetails.defenseBonus || 0, invItem.level);
            const hpBoost = calculateWeaponArmorBonus(itemDetails.hpBonus || 0, invItem.level);
            
            totalAttackBonus += attackBoost;
            totalDefenseBonus += defenseBoost;
            totalHpBonus += hpBoost;
            
        } else if (itemDetails.type === 'pet') {
            // ペットのパーセントボーナス計算
            const attackP = calculatePetPercentBonus(itemDetails.attackPercentBonus || 0, invItem.level);
            const defenseP = calculatePetPercentBonus(itemDetails.defensePercentBonus || 0, invItem.level);
            const hpP = calculatePetPercentBonus(itemDetails.hpPercentBonus || 0, invItem.level);
            
            totalAttackPercent += attackP;
            totalDefensePercent += defenseP;
            totalHpPercent += hpP;
        }

        if (!equippedItemsMap[itemDetails.type]) {
            equippedItemsMap[itemDetails.type] = [];
        }
        equippedItemsMap[itemDetails.type].push(invItem);
    });

    // --- 3. 最終ステータス計算 ---
    // 絶対値ボーナスを適用
    const interimAttack = Number(userData.baseAttack) + Number(totalAttackBonus);
    const interimDefense = Number(userData.baseDefense) + Number(totalDefenseBonus);
    const interimMaxHp = Number(BASE_STATS_HP) + Number(totalHpBonus); 
    
    // パーセントボーナス（ペット）を適用
    userData.attack = Math.round(interimAttack * (1 + totalAttackPercent / 100));
    userData.defense = Math.round(interimDefense * (1 + totalDefensePercent / 100));
    userData.maxHp = Math.round(interimMaxHp * (1 + totalHpPercent / 100));
    
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }
    
    // --- UI HTML生成 (省略) ---
    // (装備スロットのHTML生成ロジックは変更なし)

    let mainEquipHtml = '<div style="display: flex; gap: 20px;">'; 
    // ... (columnA, columnB のHTML生成ロジック。省略しますが、ここでは装備カードの表示は変わらない) ...
    
    let columnA = '<div><h3>ぶき、ぼうぐ</h3><div class="item-list" style="display: flex; flex-wrap: wrap; width: 320px;">';
    const slotOrderA = ['weapon', 'weapon', 'armor'];
    let usedWeaponSlots = 0;
    let usedArmorSlots = 0;

    slotOrderA.forEach(type => {
        let invItem = null;
        if (type === 'weapon' && usedWeaponSlots < EQUIP_SLOTS.weapon && equippedItemsMap.weapon && equippedItemsMap.weapon.length > usedWeaponSlots) {
            invItem = equippedItemsMap.weapon[usedWeaponSlots];
            usedWeaponSlots++;
        } else if (type === 'armor' && usedArmorSlots < EQUIP_SLOTS.armor && equippedItemsMap.armor && equippedItemsMap.armor.length > usedArmorSlots) {
            invItem = equippedItemsMap.armor[usedArmorSlots];
            usedArmorSlots++;
        }

        const typeName = TYPE_NAMES[type] || type; 
        if (invItem) {
            const itemDetails = items.find(item => item.id === invItem.id);
            // ボーナス値表示の調整
            let bonusDisplay = '';
            if(itemDetails.type === 'pet') {
                const attackP = calculatePetPercentBonus(itemDetails.attackPercentBonus || 0, invItem.level);
                const defenseP = calculatePetPercentBonus(itemDetails.defensePercentBonus || 0, invItem.level);
                const hpP = calculatePetPercentBonus(itemDetails.hpPercentBonus || 0, invItem.level);
                bonusDisplay = `A+${attackP}%, D+${defenseP}%, HP+${hpP}%`;
            } else {
                const attackB = calculateWeaponArmorBonus(itemDetails.attackBonus || 0, invItem.level);
                const defenseB = calculateWeaponArmorBonus(itemDetails.defenseBonus || 0, invItem.level);
                const hpB = calculateWeaponArmorBonus(itemDetails.hpBonus || 0, invItem.level);
                bonusDisplay = `A+${attackB}, D+${defenseB}, HP+${hpB}`;
            }

            columnA += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})" style="width: 100px;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em;">${itemDetails.name} Lv.${invItem.level}</p>
                    <p style="font-size: 0.7em;">(${typeName})</p>
                    <p style="font-size: 0.7em; color: green;">${bonusDisplay}</p>
                </div>
            `;
        } else {
             columnA += `
                <div class="item-card empty-slot" style="width: 100px;">
                    <p>${typeName}わく (あき)</p>
                </div>
            `;
        }
    });
    columnA += '</div></div>';


    let columnB = '<div><h3>ペット</h3><div class="item-list" style="display: flex; flex-wrap: wrap; width: 320px;">';
    const slotOrderB = ['pet', 'pet', 'pet'];
    let usedPetSlots = 0;
    
    slotOrderB.forEach(type => {
        let invItem = null;
        if (usedPetSlots < EQUIP_SLOTS.pet && equippedItemsMap.pet && equippedItemsMap.pet.length > usedPetSlots) {
            invItem = equippedItemsMap.pet[usedPetSlots];
            usedPetSlots++;
        }
        
        const typeName = TYPE_NAMES[type] || type; 
        if (invItem) {
            const itemDetails = items.find(item => item.id === invItem.id);
            // ボーナス値表示の調整
            let bonusDisplay = '';
            if(itemDetails.type === 'pet') {
                const attackP = calculatePetPercentBonus(itemDetails.attackPercentBonus || 0, invItem.level);
                const defenseP = calculatePetPercentBonus(itemDetails.defensePercentBonus || 0, invItem.level);
                const hpP = calculatePetPercentBonus(itemDetails.hpPercentBonus || 0, invItem.level);
                bonusDisplay = `A+${attackP}%, D+${defenseP}%, HP+${hpP}%`;
            } else {
                const attackB = calculateWeaponArmorBonus(itemDetails.attackBonus || 0, invItem.level);
                const defenseB = calculateWeaponArmorBonus(itemDetails.defenseBonus || 0, invItem.level);
                const hpB = calculateWeaponArmorBonus(itemDetails.hpBonus || 0, invItem.level);
                bonusDisplay = `A+${attackB}, D+${defenseB}, HP+${hpB}`;
            }
            
            columnB += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})" style="width: 100px;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em;">${itemDetails.name} Lv.${invItem.level}</p>
                    <p style="font-size: 0.7em;">(${typeName})</p>
                    <p style="font-size: 0.7em; color: green;">${bonusDisplay}</p>
                </div>
            `;
        } else {
             columnB += `
                <div class="item-card empty-slot" style="width: 100px;">
                    <p>${typeName}わく (あき)</p>
                </div>
            `;
        }
    });
    columnB += '</div></div>';

    mainEquipHtml += columnA + columnB + '</div>'; 
    
    // ... (unequippedHtml のHTML生成ロジックは変更なし) ...
    let unequippedHtml = '<h3>もちもの</h3><div class="item-list">';
    const unequippedItems = userData.inventory.filter(item => !item.isEquipped).sort((a, b) => a.id - b.id);
    
    unequippedItems.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;
        
        const isEquipable = itemDetails.type !== 'material';
        const isMaterial = itemDetails.type === 'material';
        
        let actions = '';
        if (isEquipable) {
            actions += `<button onclick="equipItem(${invItem.id})">そうびする</button>`;
        }
        if (isMaterial) {
            actions += `<button onclick="showEnhanceModal(${invItem.id})">きょうかする</button>`;
        }
        
        const levelDisplay = !isMaterial ? `Lv.${invItem.level}` : '';
        
        unequippedHtml += `
            <div class="item-card">
                <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                <p>${itemDetails.name} ${levelDisplay}</p>
                ${actions}
            </div>
        `;
    });
    unequippedHtml += '</div>';

    // ステータス表示の調整 (絶対値とパーセントの合計を追記)
    const statusHtml = `
        <h2>キャラクターと アイテムいちらん</h2>
        <div id="character-status" style="margin-bottom: 20px;">
            <h3>ステータス</h3>
            <p>たいりょく: ${userData.hp} / ${userData.maxHp}</p>
            <p>こうげき力: ${userData.attack} (きほん: ${userData.baseAttack} + ぶきぼうぐ: ${totalAttackBonus} + ペット: +${totalAttackPercent}%)</p>
            <p>ぼうぎょ力: ${userData.defense} (きほん: ${userData.baseDefense} + ぶきぼうぐ: ${totalDefenseBonus} + ペット: +${totalDefensePercent}%)</p>
        </div>
        <hr>
        ${mainEquipHtml}
        <hr>
        ${unequippedHtml}
    `;
    
    invDiv.innerHTML = statusHtml;
    saveData();
}

// ... (equipItem, unequipItem, showEnhanceModal, applyEnhancement は省略) ...


// --- 戦闘ロジック (省略) ---
// ... (getStageEnemies, spawnEnemies, updateEnemyUI, calculateDamage, rollDropItem, attackEnemy は省略) ...

/**
 * 戦闘終了時の処理
 */
function handleBattleEnd() {
    const battleLog = document.getElementById('battle-log');
    if (!battleLog) return;
    
    const isBossDefeated = currentEnemies.some(e => e.isBoss && e.hp <= 0);
    
    if (isBossDefeated) {
        // ★修正: ボス撃破時にガチャ回数を増やす
        const bonusCount = currentStage; 
        gachaLog[today].count += bonusCount;
        
        battleLog.textContent = `ボスをたおした！ガチャ回数が${bonusCount}回 ふえたよ！つぎのステージへ！🎉`;
        
        currentStage++;
        enemiesDefeatedInStage = 0;
        currentEnemies = [];
        saveData();
        setTimeout(() => {
            spawnEnemies();
            updateEnemyUI();
            updateGachaUI(); // カウント更新のため
        }, 2000);
    } else if (currentEnemies.every(e => e.hp <= 0)) {
        battleLog.textContent = 'ぜんぶのてきをたおしました！';
        currentEnemies = [];
        saveData();
        setTimeout(() => {
            spawnEnemies();
            updateEnemyUI();
        }, 2000);
    }
}


// ... (updateCalendarUI は省略) ...

// --- 初期化 ---
window.onload = () => {
    loadData();
    updateInventoryUI(); 

    // iOS/iPadOSのダブルタップによるピンチアウトを無効化
    document.addEventListener('touchend', (e) => {
        if (e.detail === 2) { 
            e.preventDefault();
        }
    }, { passive: false });
    
    // ガチャボタンのイベントリスナー設定
    const weaponGachaButton = document.getElementById('gacha-roll-weapon');
    if (weaponGachaButton) {
        weaponGachaButton.onclick = () => processGachaRoll('weapon');
    }
    const petGachaButton = document.getElementById('gacha-roll-pet');
    if (petGachaButton) {
        petGachaButton.onclick = () => processGachaRoll('pet');
    }

    // スタンプボタンのイベントリスナー設定
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        const content = button.getAttribute('data-content');
        if (content === 'そのほか') {
            button.onclick = showOtherStampPopup;
        } else {
            button.onclick = () => handleStudyStamp(content);
        }
    });
    
    showTab('gacha'); 
};
