// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5;

let userData = {
    hp: 100,
    maxHp: 100,
    baseAttack: 10,  // 基本ステータス
    baseDefense: 5,  // 基本ステータス
    attack: 10,      // 装備込みの現在のステータス
    defense: 5,      // 装備込みの現在のステータス
    inventory: [] // { id: 1, level: 1, isEquipped: false } 形式
};

let currentStage = 1;
let enemiesDefeatedInStage = 0; // 現在のステージで倒した敵の数
const DEFEAT_COUNT_FOR_BOSS = 15;

let gachaLog = {};
let currentEnemies = [];

// --- アイテムデータ ---
const items = [
    // 武器 (weapon): 2枠
    { id: 1, name: 'きのつるぎ', type: 'weapon', rarity: 'N', attackBonus: 5, defenseBonus: 1, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=きのつるぎ' },
    { id: 4, name: 'てつのつるぎ', type: 'weapon', rarity: 'R', attackBonus: 10, defenseBonus: 2, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=てつのつるぎ' },
    { id: 6, name: 'ほのおのつるぎ', type: 'weapon', rarity: 'SR', attackBonus: 25, defenseBonus: 5, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ほのおのつるぎ' },
    // 防具 (armor): 1枠
    { id: 2, name: 'いしのたて', type: 'armor', rarity: 'N', attackBonus: 1, defenseBonus: 3, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=いしのたて' },
    { id: 5, name: 'かわのよろい', type: 'armor', rarity: 'R', attackBonus: 2, defenseBonus: 7, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=かわのよろい' },
    { id: 7, name: 'ドラゴンのたて', type: 'armor', rarity: 'SSR', attackBonus: 0, defenseBonus: 30, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴンのたて' },
    // ペット (pet): 3枠
    { id: 3, name: 'スライム', type: 'pet', rarity: 'N', attackBonus: 2, defenseBonus: 2, hpBonus: 5, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=スライム' },
    { id: 8, name: 'こいぬ', type: 'pet', rarity: 'R', attackBonus: 5, defenseBonus: 3, hpBonus: 10, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=こいぬ' },
    { id: 9, name: 'ねこ', type: 'pet', rarity: 'R', attackBonus: 3, defenseBonus: 5, hpBonus: 10, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ねこ' },
    
    // 強化アイテム (material)
    { id: 100, name: 'きょうかのかけら（小）', type: 'material', rarity: 'N', levelIncrease: 1, imageUrl: 'https://placehold.jp/200x200.png?text=かけら小' },
    { id: 101, name: 'きょうかのかけら（中）', type: 'material', rarity: 'R', levelIncrease: 2, imageUrl: 'https://placehold.jp/200x200.png?text=かけら中' },
    { id: 102, name: 'きょうかのかけら（大）', type: 'material', rarity: 'SR', levelIncrease: 3, imageUrl: 'https://placehold.jp/200x200.png?text=かけら大' },
    { id: 103, name: 'きょうかのかたまり（小）', type: 'material', rarity: 'SSR', levelIncrease: 4, imageUrl: 'https://placehold.jp/200x200.png?text=かたまり小' },
];

// 装備枠の定義
const EQUIP_SLOTS = {
    'weapon': 2,
    'armor': 1,
    'pet': 3
};

// --- 敵のデータ (カテゴリー追加) ---
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

// --- ドロップ率の定義 ---
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

// HPバーUIを更新するヘルパー関数
function updateHpBar(elementId, currentHp, maxHp) {
    const bar = document.getElementById(elementId);
    if (!bar) return;
    const percentage = Math.max(0, (currentHp / maxHp) * 100);
    bar.style.width = `${percentage}%`;
    bar.textContent = `${currentHp} / ${maxHp}`;
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

// --- ガチャロジック ---
function updateGachaUI() {
    const dailyLog = gachaLog[today] || { count: 0, studyContent: [] };
    const remaining = MAX_GACHA_COUNT - dailyLog.count;
    document.getElementById('gacha-count').textContent = remaining;
    
    const form = document.getElementById('gacha-form');
    if (!form) return; // HTML要素がない場合はスキップ

    if (remaining <= 0) {
        form.querySelector('button[type="submit"]').disabled = true;
        form.querySelector('textarea').disabled = true;
    } else {
        form.querySelector('button[type="submit"]').disabled = false;
        form.querySelector('textarea').disabled = false;
    }
}

function rollGacha(itemPool) {
    const rarities = ['SSR', 'SR', 'R', 'N'];
    const weights = [1, 5, 20, 74];
    
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
    
    const filteredItems = itemPool.filter(item => item.rarity === selectedRarity);
    if (filteredItems.length === 0) {
        // 同じレアリティのアイテムがなければ、別のレアリティのアイテムを探す（再帰的に呼び出す）
        return rollGacha(items.filter(item => item.type === 'weapon' || item.type === 'pet')); // 全アイテムプールから再抽選
    }
    
    return filteredItems[Math.floor(Math.random() * filteredItems.length)];
}

// --- ガチャフォームのイベントリスナー ---
document.addEventListener('DOMContentLoaded', () => {
    const gachaForm = document.getElementById('gacha-form');
    if (gachaForm) {
        gachaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const studyContent = document.getElementById('study-content').value;
            const gachaType = document.getElementById('gacha-type').value;
            
            if (gachaLog[today].count >= MAX_GACHA_COUNT) {
                document.getElementById('gacha-result').textContent = 'きょうのガチャの かいすうじょうげんに たっしました。';
                return;
            }
            
            gachaLog[today].count++;
            gachaLog[today].studyContent.push(studyContent);
            
            const itemPool = items.filter(item => item.type === gachaType);
            const pulledItem = rollGacha(itemPool);

            let message = '';
            // 同じIDのアイテムがインベントリにあるかチェック
            const existingItem = userData.inventory.find(invItem => invItem.id === pulledItem.id);

            if (existingItem) {
                if (existingItem.level < pulledItem.maxLevel) {
                    existingItem.level++;
                    message = `${pulledItem.name}を じゅうふくして にゅうしゅしました！レベルが${existingItem.level}に あがりました！`;
                } else {
                    message = `${pulledItem.name}を じゅうふくして にゅうしゅしましたが、すでに さいだいレベルです。`;
                }
            } else {
                const newItem = { id: pulledItem.id, level: 1, isEquipped: false };
                userData.inventory.push(newItem);
                message = `${pulledItem.name}を あたらしく てにいれました！`;
            }

            document.getElementById('gacha-result').innerHTML = `
                <p>${message}</p>
                <div class="item-card">
                    <img src="${pulledItem.imageUrl}" alt="${pulledItem.name}">
                    <p>${pulledItem.name} (${pulledItem.rarity})</p>
                </div>
            `;

            document.getElementById('study-content').value = '';
            updateGachaUI();
            saveData();
        });
    }
});


// --- インベントリーロジック (updateInventoryUI 関数内) ---
function updateInventoryUI() {
    // ... (省略: totalAttackBonus, totalDefenseBonus, totalHpBonus の計算)

    // ステータスの更新と表示 (ここは変更なし)
    userData.attack = userData.baseAttack + totalAttackBonus;
    userData.defense = userData.baseDefense + totalDefenseBonus;
    userData.maxHp = 100 + totalHpBonus; 
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }

    // --- 装備スロットのHTML生成ロジックの変更 ---
    let mainEquipHtml = '<div style="display: flex; gap: 20px;">'; // 2つの列をラップ

    // A. ぶき (2枠) と ぼうぐ (1枠) の列
    let columnA = '<div><h3>ぶき、ぼうぐ</h3><div class="item-list" style="display: flex; flex-wrap: wrap; width: 320px;">';
    // B. ペット (3枠) の列
    let columnB = '<div><h3>ペット</h3><div class="item-list" style="display: flex; flex-wrap: wrap; width: 320px;">';
    
    // スロットの定義とアイテムの振り分け
    const slotOrderA = ['weapon', 'weapon', 'armor'];
    const slotOrderB = ['pet', 'pet', 'pet'];
    const equippedItemsMap = {}; // 装備されているアイテムをタイプごとに分類
    userData.inventory.filter(item => item.isEquipped).forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;
        
        if (!equippedItemsMap[itemDetails.type]) {
            equippedItemsMap[itemDetails.type] = [];
        }
        equippedItemsMap[itemDetails.type].push(invItem);
    });
    
    // 1. Column A (武器2, 防具1) の生成
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

        if (invItem) {
            const itemDetails = items.find(item => item.id === invItem.id);
            columnA += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})" style="width: 100px;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em;">${itemDetails.name} Lv.${invItem.level}</p>
                    <p style="font-size: 0.7em;">(${type})</p>
                </div>
            `;
        } else {
             columnA += `
                <div class="item-card empty-slot" style="width: 100px;">
                    <p>${type}わく (あき)</p>
                </div>
            `;
        }
    });
    columnA += '</div></div>';


    // 2. Column B (ペット3) の生成
    let usedPetSlots = 0;
    slotOrderB.forEach(type => {
        let invItem = null;
        if (usedPetSlots < EQUIP_SLOTS.pet && equippedItemsMap.pet && equippedItemsMap.pet.length > usedPetSlots) {
            invItem = equippedItemsMap.pet[usedPetSlots];
            usedPetSlots++;
        }
        
        if (invItem) {
            const itemDetails = items.find(item => item.id === invItem.id);
            columnB += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})" style="width: 100px;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em;">${itemDetails.name} Lv.${invItem.level}</p>
                    <p style="font-size: 0.7em;">(${type})</p>
                </div>
            `;
        } else {
             columnB += `
                <div class="item-card empty-slot" style="width: 100px;">
                    <p>${type}わく (あき)</p>
                </div>
            `;
        }
    });
    columnB += '</div></div>';

    mainEquipHtml += columnA + columnB + '</div>'; // 2つの列を結合

    // ... (省略: unequippedHtml の生成)
    
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

// ... (equipItem, unequipItem, showEnhanceModal, applyEnhancement は変更なし)

// --- 戦闘UIの更新 (updateEnemyUI) ---
function updateEnemyUI() {
    // ... (省略: 敵のコンテナとログの取得、HTMLのリセット)

    // ここで userData.attack と userData.defense の値が使われます。
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
    
    // ... (省略: 敵のカードの生成ロジック)
}

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

    // --- 1. 自分の攻撃 ---
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
    
    // 敵を倒したかチェック
    if (enemy.hp <= 0) {
        battleLog.textContent += ` ${enemy.name}をたおした！`;
        if (!enemy.isBoss) {
            enemiesDefeatedInStage++;
        }
        
        // --- 倒した際のドロップアイテム処理 ---
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

    // --- 2. モンスターの反撃（残っている敵全員） ---
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
    
    // 最終チェックとUI更新
    if (userData.hp <= 0) {
        userData.hp = 0;
        battleLog.textContent = ' あなたはたおれてしまった...';
        document.querySelectorAll('#enemy-container button').forEach(button => button.disabled = true);
    }
    
    updateHpBar('player-hp-bar', userData.hp, userData.maxHp);
    saveData();
    updateEnemyUI();
}

// 戦闘終了時の処理
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


// --- カレンダーロジック ---
function updateCalendarUI() {
    const logList = document.getElementById('study-log-list');
    if (!logList) return;
    logList.innerHTML = '';
    
    const sortedDates = Object.keys(gachaLog).sort().reverse();
    
    sortedDates.forEach(date => {
        const log = gachaLog[date];
        const item = document.createElement('li');
        const studyContent = log.studyContent.length > 0 ? log.studyContent.join(', ') : 'きろくなし';
        item.textContent = `${date}: ${studyContent}`;
        logList.appendChild(item);
    });
}

// --- 初期化 ---
window.onload = () => {
    loadData();
    updateInventoryUI(); 
    showTab('gacha'); 
};
