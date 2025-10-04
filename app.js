// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5; // スタンプ回数の上限
const BASE_STATS_HP = 100;
const ENHANCEMENT_RATE = 1.2; // レベルアップ時のステータス成長率

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
// ★修正: レアリティ名を新しい確率に合わせるため変更 (N, R, SR, UR, LE)
const items = [
    // 武器 (weapon): 2枠
    { id: 1, name: 'きのつるぎ', type: 'weapon', rarity: 'N', attackBonus: 5, defenseBonus: 1, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=きのつるぎ' },
    { id: 4, name: 'てつのつるぎ', type: 'weapon', rarity: 'R', attackBonus: 10, defenseBonus: 2, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=てつのつるぎ' },
    { id: 6, name: 'ほのおのつるぎ', type: 'weapon', rarity: 'SR', attackBonus: 25, defenseBonus: 5, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ほのおのつるぎ' },
    { id: 13, name: 'でんせつのけん', type: 'weapon', rarity: 'UR', attackBonus: 50, defenseBonus: 10, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=URつるぎ' },
    { id: 14, name: 'きぼうのひかり', type: 'weapon', rarity: 'LE', attackBonus: 100, defenseBonus: 20, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=LEつるぎ' },
    // 防具 (armor): 1枠
    { id: 2, name: 'いしのたて', type: 'armor', rarity: 'N', attackBonus: 1, defenseBonus: 3, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=いしのたて' },
    { id: 5, name: 'かわのよろい', type: 'armor', rarity: 'R', attackBonus: 2, defenseBonus: 7, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=かわのよろい' },
    { id: 7, name: 'ドラゴンのたて', type: 'armor', rarity: 'SR', attackBonus: 0, defenseBonus: 30, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴンのたて' },
    // ペット (pet): 3枠
    { id: 3, name: 'スライム', type: 'pet', rarity: 'N', attackBonus: 2, defenseBonus: 2, hpBonus: 5, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=スライム' },
    { id: 8, name: 'こいぬ', type: 'pet', rarity: 'R', attackBonus: 5, defenseBonus: 3, hpBonus: 10, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=こいぬ' },
    { id: 9, name: 'ねこ', type: 'pet', rarity: 'R', attackBonus: 3, defenseBonus: 5, hpBonus: 10, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ねこ' },
    { id: 15, name: 'フェニックス', type: 'pet', rarity: 'UR', attackBonus: 15, defenseBonus: 15, hpBonus: 30, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=URペット' },
    { id: 16, name: 'ユニコーン', type: 'pet', rarity: 'LE', attackBonus: 10, defenseBonus: 20, hpBonus: 50, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=LEペット' },
    
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

// --- 敵のデータ (省略) ---
const ENEMY_GROUPS = {
    1: [ 
        { id: 1, name: 'ゴブリン', hp: 20, maxHp: 20, attack: 10, defense: 3, isBoss: false, category: 'A', imageUrl: 'https://placehold.jp/200x200.png?text=ゴブリン' },
        { id: 2, name: 'オーク', hp: 50, maxHp: 50, attack: 15, defense: 5, isBoss: false, category: 'B', imageUrl: 'https://placehold.jp/200x200.png?text=オーク' },
        { id: 3, name: 'スケルトン', hp: 30, maxHp: 30, attack: 8, defense: 2, isBoss: false, category: 'A', imageUrl: 'https://placehold.jp/200x200.png?text=スケルトン' },
    ],
    2: [
        { id: 10, name: 'まほうつかい', hp: 60, maxHp: 60, attack: 25, defense: 8, isBoss: false, category: 'C', imageUrl: 'https://placehold.jp/200x200.png?text=まほうつかい' },
        { id: 11, name: 'ゴースト', hp: 40, maxHp: 40, attack: 18, defense: 10, isBoss: false, category: 'B', imageUrl: 'https://placehold.jp/200x200.png?text=ゴースト' },
        { id: 12, name: 'きょじん', hp: 80, maxHp: 80, attack: 30, defense: 15, isBoss: false, category: 'C', imageUrl: 'https://placehold.jp/200x200.png?text=きょじん' },
    ],
    'boss': { id: 99, name: 'ドラゴン', hp: 500, maxHp: 500, attack: 50, defense: 20, isBoss: true, category: 'Z', attackCount: 2, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴン' },
};
const DROP_RATES = {
    'A': [ { id: 100, rate: 95 }, { id: 101, rate: 5 } ],
    'B': [ { id: 100, rate: 70 }, { id: 101, rate: 25 }, { id: 102, rate: 5 } ],
    'C': [ { id: 101, rate: 50 }, { id: 102, rate: 40 }, { id: 103, rate: 10 } ],
    'Z': [],
};


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

// --- UIそうさ関数 (タブ切り替え) ---
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

// --- スタンプ・ポップアップ機能 ---

/**
 * スタンプを押した後のポップアップ表示
 * @param {string} message - ポップアップに表示するメッセージ
 * @param {function} onOk - OKボタンを押した後の処理
 */
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

/**
 * 「そのほか」ボタンを押した際のテキスト入力付きポップアップ
 */
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
        
        // ログに記録してから、成功ポップアップを表示
        handleStudyStamp(content, true);
    };
}

/**
 * 勉強スタンプが押されたときのメイン処理
 * @param {string} content - 勉強内容
 * @param {boolean} isManual - 手動入力かどうか
 */
function handleStudyStamp(content, isManual = false) {
    if (gachaLog[today].count >= MAX_GACHA_COUNT) {
        showStampPopup('きょうのスタンプは じょうげんに たっしました。', updateGachaUI);
        return;
    }

    gachaLog[today].count++;
    gachaLog[today].studyContent.push(content);
    saveData();
    
    // 手動入力でなければ、すぐに成功ポップアップを表示
    if (!isManual) {
        showStampPopup('きょうもがんばったね！', updateGachaUI);
    } else {
        // 手動入力の場合は入力後にこの関数が呼ばれるため、成功ポップアップのみ表示
        showStampPopup('きょうもがんばったね！', updateGachaUI);
    }
}

// --- ガチャロジック ---
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
    // ★修正: 新しい確率 (UR, LEを含む)
    const rarities = ['LE', 'UR', 'SR', 'R', 'N'];
    const weights = [1, 4, 15, 30, 50]; // 合計100
    
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

    // ★修正: 最大レベルのアイテムを除外したプールを作成
    const availableItemsPool = items.filter(item => {
        if (item.type !== itemType) return false;
        
        const existingItem = userData.inventory.find(invItem => invItem.id === item.id);
        
        // アイテムをまだ持っていない、または最大レベルに達していない
        return !existingItem || existingItem.level < item.maxLevel;
    });

    if (availableItemsPool.length === 0) {
        // 全てのアイテムが最大レベルの場合
        return { name: `${TYPE_NAMES[itemType]}ガチャ`, rarity: 'None', message: '全てのアイテムが最大レベルです！' };
    }

    // 選択されたレアリティのアイテムをプールから抽出
    let filteredItems = availableItemsPool.filter(item => item.rarity === selectedRarity);

    // もし選択されたレアリティのアイテムが全て最大レベルで排出プールから消えていた場合、
    // ランダムに他のレアリティから選出（本来ならあり得ないが安全策）
    if (filteredItems.length === 0) {
        // 残っているアイテム全てからランダムに選ぶ
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
        // 全アイテム最大レベルの場合
        message = pulledItem.message;
        resultHtml = `<p>結果: ${message}</p>`;
    } else {
        const existingItem = userData.inventory.find(invItem => invItem.id === pulledItem.id);

        if (existingItem) {
            // ★修正: 重複してもレベルを上げる (最大レベルチェックはrollGachaで済んでいる)
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

    // 装備ステータスが変わる可能性があるので更新
    updateInventoryUI();
    updateGachaUI();
    saveData();
}

// --- インベントリーロジック (省略) ---
function calculateBonus(baseBonus, level) {
    if (level <= 1) {
        return baseBonus;
    }
    
    let totalBonus = baseBonus;
    
    for (let i = 2; i <= level; i++) {
        totalBonus *= ENHANCEMENT_RATE;
    }
    
    return Math.round(totalBonus); 
}


function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    if (!invDiv) return;

    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpBonus = 0;

    const equippedItems = userData.inventory.filter(item => item.isEquipped);
    
    const equippedItemsMap = {}; 
    equippedItems.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;
        
        const attackBoost = calculateBonus(itemDetails.attackBonus, invItem.level);
        const defenseBoost = calculateBonus(itemDetails.defenseBonus, invItem.level);
        const hpBoost = calculateBonus(itemDetails.hpBonus, invItem.level);
        
        totalAttackBonus += attackBoost;
        totalDefenseBonus += defenseBoost;
        totalHpBonus += hpBoost;

        if (!equippedItemsMap[itemDetails.type]) {
            equippedItemsMap[itemDetails.type] = [];
        }
        equippedItemsMap[itemDetails.type].push(invItem);
    });

    userData.attack = Number(userData.baseAttack) + Number(totalAttackBonus);
    userData.defense = Number(userData.baseDefense) + Number(totalDefenseBonus);
    userData.maxHp = Number(BASE_STATS_HP) + Number(totalHpBonus); 
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }

    let mainEquipHtml = '<div style="display: flex; gap: 20px;">'; 

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
            columnA += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})" style="width: 100px;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em;">${itemDetails.name} Lv.${invItem.level}</p>
                    <p style="font-size: 0.7em;">(${typeName})</p>
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
            columnB += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})" style="width: 100px;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em;">${itemDetails.name} Lv.${invItem.level}</p>
                    <p style="font-size: 0.7em;">(${typeName})</p>
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

    const statusHtml = `
        <h2>キャラクターと アイテムいちらん</h2>
        <div id="character-status" style="margin-bottom: 20px;">
            <h3>ステータス</h3>
            <p>たいりょく: ${userData.hp} / ${userData.maxHp}</p>
            <p>こうげき力: ${userData.attack} (きほん: ${userData.baseAttack} + ほせい: ${totalAttackBonus})</p>
            <p>ぼうぎょ力: ${userData.defense} (きほん: ${userData.baseDefense} + ほせい: ${totalDefenseBonus})</p>
        </div>
        <hr>
        ${mainEquipHtml}
        <hr>
        ${unequippedHtml}
    `;
    
    invDiv.innerHTML = statusHtml;
    saveData();
}

function equipItem(invItemId) {
    const invItem = userData.inventory.find(item => item.id === invItemId && !item.isEquipped);
    if (!invItem) return;

    const itemDetails = items.find(item => item.id === invItem.id);
    const itemType = itemDetails.type;
    
    const equippedCount = userData.inventory.filter(item => {
        const details = items.find(i => i.id === item.id);
        return item.isEquipped && details && details.type === itemType;
    }).length;

    if (equippedCount >= EQUIP_SLOTS[itemType]) {
        alert(`${TYPE_NAMES[itemType] || itemType}わくはもう いっぱいです！ほかのそうびを はずしてね。`);
        return;
    }
    
    invItem.isEquipped = true;
    updateInventoryUI();
    updateEnemyUI(); 
}

function unequipItem(invItemId) {
    const invItem = userData.inventory.find(item => item.id === invItemId && item.isEquipped); 
    if (invItem) {
        invItem.isEquipped = false;
    }
    updateInventoryUI();
    updateEnemyUI(); 
}

function showEnhanceModal(materialId) {
    const materialItem = userData.inventory.find(item => item.id === materialId && !item.isEquipped);
    if (!materialItem) return;

    const materialDetails = items.find(item => item.id === materialId);
    const equipableItems = userData.inventory.filter(item => items.find(i => i.id === item.id).type !== 'material' && item.level < items.find(i => i.id === item.id).maxLevel); 
    
    if (equipableItems.length === 0) {
        alert('つよくできる アイテムが ありません。');
        return;
    }

    let selectHtml = `
        <div id="enhance-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 20px; border-radius: 10px;">
                <h3>${materialDetails.name}を つかって つよくする</h3>
                <p>${materialDetails.name}は レベルを +${materialDetails.levelIncrease} します。</p>
                <select id="target-item-select">
                    ${equipableItems.map((item, index) => { 
                        const details = items.find(i => i.id === item.id);
                        return `<option value="${item.id}_${index}">${details.name} Lv.${item.level} (あと${details.maxLevel - item.level}レベル)</option>`;
                    }).join('')}
                </select>
                <button onclick="applyEnhancement(${materialId})">けってい</button>
                <button onclick="document.getElementById('enhance-modal').remove()">やめる</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', selectHtml);
}

function applyEnhancement(materialId) {
    const targetValue = document.getElementById('target-item-select').value;
    const [targetItemIdStr, targetItemIndexStr] = targetValue.split('_');
    const targetItemId = parseInt(targetItemIdStr);
    const targetItemIndex = parseInt(targetItemIndexStr);

    const targetItemCandidates = userData.inventory.filter(item => items.find(i => i.id === item.id).type !== 'material' && item.level < items.find(i => i.id === item.id).maxLevel);
    const targetItem = targetItemCandidates[targetItemIndex];
    const materialItem = userData.inventory.find(item => item.id === materialId && !item.isEquipped);
    
    const materialDetails = items.find(item => item.id === materialId);
    const targetItemDetails = items.find(item => item.id === targetItemId);

    if (!targetItem || !materialItem || !materialDetails) {
        alert('エラーがおきました。（ターゲットまたは素材が見つかりません）');
        document.getElementById('enhance-modal').remove();
        return;
    }

    let levelUp = materialDetails.levelIncrease;
    
    if (targetItem.level + levelUp > targetItemDetails.maxLevel) {
        levelUp = targetItemDetails.maxLevel - targetItem.level;
    }

    if (levelUp <= 0) {
        alert(`${targetItemDetails.name}は さいだいレベルなので、つかえません。`);
        document.getElementById('enhance-modal').remove();
        return;
    }
    
    targetItem.level += levelUp;

    const materialIndex = userData.inventory.findIndex(item => item.id === materialId && !item.isEquipped);
    if (materialIndex !== -1) {
        userData.inventory.splice(materialIndex, 1);
    }
    
    alert(`${targetItemDetails.name}のレベルが ${targetItem.level}に なりました！`);
    
    document.getElementById('enhance-modal').remove();
    updateInventoryUI();
    updateEnemyUI();
}

// --- 戦闘ロジック (省略) ---
function getStageEnemies() {
    if (enemiesDefeatedInStage >= DEFEAT_COUNT_FOR_BOSS && ENEMY_GROUPS['boss']) {
        return [{...ENEMY_GROUPS['boss']}];
    }
    
    const group = ENEMY_GROUPS[currentStage] || ENEMY_GROUPS[1];
    return group;
}

function spawnEnemies() {
    if (currentEnemies.length > 0 && currentEnemies.every(e => e.hp <= 0)) {
        currentEnemies = [];
    }
    
    if (currentEnemies.length === 0) {
        const stageEnemies = getStageEnemies();

        if (stageEnemies.some(e => e.isBoss)) {
            currentEnemies.push({...stageEnemies[0], id: Date.now()});
        } else {
            const availableEnemies = stageEnemies;
            for (let i = 0; i < 3; i++) {
                const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                currentEnemies.push({...randomEnemy, originalId: randomEnemy.id, id: Date.now() + i});
            }
        }
    }
}

function updateEnemyUI() {
    const enemyContainer = document.getElementById('enemy-container');
    const battleLog = document.getElementById('battle-log');
    if (!enemyContainer) return;
    
    enemyContainer.innerHTML = '';
    
    const stageText = currentEnemies.some(e => e.isBoss) ? 'ボスせん！' : `ステージ ${currentStage}`;
    
    document.getElementById('player-status-enemy-tab').innerHTML = `
        <h3>${stageText}</h3>
        <p>たおしたてきの数: ${enemiesDefeatedInStage} / ${DEFEAT_COUNT_FOR_BOSS}たい</p>
        <p>じぶんの たいりょく:</p>
        <div class="hp-bar-container">
            <div id="player-hp-bar" class="hp-bar"></div>
        </div>
        <p>こうげき力: ${userData.attack} / ぼうぎょ力: ${userData.defense}</p>
    `;
    updateHpBar('player-hp-bar', userData.hp, userData.maxHp);

    let enemiesPresent = false;
    currentEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
            enemiesPresent = true;
            const card = document.createElement('div');
            card.className = 'enemy-card';
            card.id = `enemy-card-${enemy.id}`;
            card.innerHTML = `
                <img src="${enemy.imageUrl}" alt="${enemy.name}">
                <h4>${enemy.name}</h4>
                <div class="hp-bar-container">
                    <div id="enemy-hp-bar-${enemy.id}" class="hp-bar"></div>
                </div>
                <button onclick="attackEnemy(${enemy.id})" ${userData.hp <= 0 ? 'disabled' : ''}>こうげき！</button>
            `;
            enemyContainer.appendChild(card);
            updateHpBar(`enemy-hp-bar-${enemy.id}`, enemy.hp, enemy.maxHp);
        }
    });
    
    if (!enemiesPresent && !battleLog.textContent.includes('つぎのステージへ')) {
        handleBattleEnd();
    }
}

function calculateDamage(attackerAttack, defenderDefense) {
    const rawDamage = attackerAttack - defenderDefense;
    return Math.max(1, rawDamage); 
}

function rollDropItem(category) {
    const drops = DROP_RATES[category];
    if (!drops || drops.length === 0) return null;

    let totalRate = drops.reduce((sum, drop) => sum + drop.rate, 0);
    let rand = Math.floor(Math.random() * totalRate);

    for (const drop of drops) {
        if (rand < drop.rate) {
            return drop.id;
        }
        rand -= drop.rate;
    }
    return null; 
}

async function attackEnemy(enemyId) {
    const enemy = currentEnemies.find(e => e.id === enemyId);
    const battleLog = document.getElementById('battle-log');
    
    if (!enemy || enemy.hp <= 0 || userData.hp <= 0) {
        battleLog.textContent = 'もうこうげきできないよ。';
        return;
    }

    const damageToEnemy = calculateDamage(userData.attack, enemy.defense);
    enemy.hp -= damageToEnemy;
    battleLog.textContent = `じぶんは ${enemy.name}に ${damageToEnemy}のダメージ！`;
    
    const enemyCard = document.getElementById(`enemy-card-${enemy.id}`);
    if (enemyCard) {
        enemyCard.classList.add('shake-enemy');
        await new Promise(resolve => setTimeout(resolve, 200));
        enemyCard.classList.remove('shake-enemy');
    }
    updateHpBar(`enemy-hp-bar-${enemy.id}`, enemy.hp, enemy.maxHp);
    
    if (enemy.hp <= 0) {
        battleLog.textContent += ` ${enemy.name}をたおした！`;
        if (!enemy.isBoss) {
            enemiesDefeatedInStage++;
        }
        
        const dropItemId = rollDropItem(enemy.category);
        if (dropItemId) {
            const dropItemDetails = items.find(i => i.id === dropItemId);
            
            const newItem = { id: dropItemId, level: 1, isEquipped: false };
            userData.inventory.push(newItem);
            
            battleLog.textContent += ` 「${dropItemDetails.name}」を てにいれた！`;
        }
    }
    
    if (currentEnemies.every(e => e.hp <= 0)) {
        saveData();
        updateEnemyUI();
        handleBattleEnd();
        return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const activeEnemies = currentEnemies.filter(e => e.hp > 0).sort((a, b) => a.id - b.id);
    
    for (const activeEnemy of activeEnemies) {
        if (userData.hp <= 0) break;

        const attackCount = activeEnemy.isBoss ? (activeEnemy.attackCount || 1) : 1;
        for (let i = 0; i < attackCount; i++) {
            if (userData.hp <= 0) break;
            
            const damageToUser = calculateDamage(activeEnemy.attack, userData.defense);
            userData.hp -= damageToUser;

            battleLog.textContent = `${activeEnemy.name}のこうげき！${damageToUser}のダメージをうけた！`;
            
            document.body.classList.add('shake-screen');
            await new Promise(resolve => setTimeout(resolve, 300));
            document.body.classList.remove('shake-screen');
            updateHpBar('player-hp-bar', userData.hp, userData.maxHp);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    if (userData.hp <= 0) {
        userData.hp = 0;
        battleLog.textContent = ' あなたはたおれてしまった...';
        document.querySelectorAll('#enemy-container button').forEach(button => button.disabled = true);
    }
    
    updateHpBar('player-hp-bar', userData.hp, userData.maxHp);
    saveData();
    updateEnemyUI();
}

function handleBattleEnd() {
    const battleLog = document.getElementById('battle-log');
    if (!battleLog) return;
    
    const isBossDefeated = currentEnemies.some(e => e.isBoss && e.hp <= 0);
    
    if (isBossDefeated) {
        battleLog.textContent = 'ボスをたおした！つぎのステージへ！🎉';
        currentStage++;
        enemiesDefeatedInStage = 0;
        currentEnemies = [];
        saveData();
        setTimeout(() => {
            spawnEnemies();
            updateEnemyUI();
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


// --- カレンダーロジック (省略) ---
function updateCalendarUI() {
    const logList = document.getElementById('study-log-list');
    if (!logList) return;
    logList.innerHTML = '';
    
    const sortedDates = Object.keys(gachaLog).sort().reverse();
    
    sortedDates.forEach(date => {
        const log = gachaLog[date];
        const count = log.count || 0;
        const studyContent = log.studyContent.length > 0 ? log.studyContent.join(', ') : 'きろくなし';
        item.textContent = `${date}: スタンプ${count}こ, きろく: ${studyContent}`; // スタンプ回数も表示
        logList.appendChild(item);
    });
}

// --- 初期化 ---
window.onload = () => {
    loadData();
    updateInventoryUI(); 

    // ★修正: iOS/iPadOSのダブルタップによるピンチアウトを無効化
    document.addEventListener('touchend', (e) => {
        if (e.detail === 2) { // 連続したタップが2回
            e.preventDefault();
        }
    }, { passive: false });
    
    // ★修正: ガチャボタンのイベントリスナー設定
    const weaponGachaButton = document.getElementById('gacha-roll-weapon');
    if (weaponGachaButton) {
        weaponGachaButton.onclick = () => processGachaRoll('weapon');
    }
    const petGachaButton = document.getElementById('gacha-roll-pet');
    if (petGachaButton) {
        petGachaButton.onclick = () => processGachaRoll('pet');
    }

    // ★修正: スタンプボタンのイベントリスナー設定
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
