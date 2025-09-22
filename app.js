// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5;

let userData = {
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    inventory: []
};

const items = [
    { id: 1, name: '木の剣', type: 'weapon', rarity: 'N', attackBonus: 5, defenseBonus: 0, hpBonus: 0, maxLevel: 5, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 2, name: '石の盾', type: 'armor', rarity: 'N', attackBonus: 0, defenseBonus: 3, hpBonus: 0, maxLevel: 5, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 3, name: 'スライム', type: 'pet', rarity: 'N', attackBonus: 2, defenseBonus: 2, hpBonus: 5, maxLevel: 5, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 4, name: '鉄の剣', type: 'weapon', rarity: 'R', attackBonus: 10, defenseBonus: 0, hpBonus: 0, maxLevel: 10, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 5, name: '革の鎧', type: 'armor', rarity: 'R', attackBonus: 0, defenseBonus: 7, hpBonus: 0, maxLevel: 10, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 6, name: '炎の剣', type: 'weapon', rarity: 'SR', attackBonus: 25, defenseBonus: 0, hpBonus: 0, maxLevel: 25, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 7, name: 'ドラゴンの盾', type: 'armor', rarity: 'SSR', attackBonus: 0, defenseBonus: 30, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/150x150.png' },
];

const enemies = [
    { id: 1, name: 'ゴブリン', hp: 20, attack: 5, isBoss: false, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 2, name: 'オーク', hp: 50, attack: 15, isBoss: false, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 3, name: 'スケルトン', hp: 30, attack: 8, isBoss: false, imageUrl: 'https://placehold.jp/150x150.png' },
    { id: 4, name: 'ドラゴン', hp: 500, attack: 50, isBoss: true, imageUrl: 'https://placehold.jp/150x150.png' },
];

let gachaLog = {};
let currentEnemies = [];

// --- データ保存・読み込み関数 ---
function saveData() {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('gachaLog', JSON.stringify(gachaLog));
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
    
    // 日付が変わったらHPを全回復
    if (!gachaLog[today]) {
        userData.hp = userData.maxHp;
        gachaLog[today] = { count: 0, studyContent: [] };
    }
}

// --- UI操作関数 ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    // タブ表示時に各コンテンツを更新
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
    if (remaining <= 0) {
        form.querySelector('button').disabled = true;
        form.querySelector('textarea').disabled = true;
    } else {
        form.querySelector('button').disabled = false;
        form.querySelector('textarea').disabled = false;
    }
}

document.getElementById('gacha-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const studyContent = document.getElementById('study-content').value;
    const gachaType = document.getElementById('gacha-type').value;
    
    if (gachaLog[today].count >= MAX_GACHA_COUNT) {
        document.getElementById('gacha-result').textContent = '今日のガチャ回数上限に達しました。';
        return;
    }
    
    gachaLog[today].count++;
    gachaLog[today].studyContent.push(studyContent);
    
    const itemPool = items.filter(item => item.type === gachaType);
    const pulledItem = rollGacha(itemPool);

    let message = '';
    const existingItem = userData.inventory.find(invItem => invItem.id === pulledItem.id);

    if (existingItem) {
        if (existingItem.level < pulledItem.maxLevel) {
            existingItem.level++;
            message = `${pulledItem.name}を重複して入手しました！レベルが${existingItem.level}に上がりました！`;
        } else {
            message = `${pulledItem.name}を重複して入手しましたが、すでに最大レベルです。`;
        }
    } else {
        const newItem = { id: pulledItem.id, level: 1, isEquipped: false };
        userData.inventory.push(newItem);
        message = `${pulledItem.name}を新しく手に入れました！`;
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
        return rollGacha(itemPool); // 選択されたレアリティのアイテムがない場合、再抽選
    }
    
    return filteredItems[Math.floor(Math.random() * filteredItems.length)];
}

// --- インベントリーロジック ---
function updateInventoryUI() {
    const equippedItemsDiv = document.getElementById('equipped-items');
    const unequippedItemsDiv = document.getElementById('unequipped-items');
    equippedItemsDiv.innerHTML = '';
    unequippedItemsDiv.innerHTML = '';

    let totalAttack = 0;
    let totalDefense = 0;
    let totalHp = 0;

    userData.inventory.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
            <p>${itemDetails.name} (${itemDetails.rarity}) Lv.${invItem.level}</p>
        `;

        if (invItem.isEquipped) {
            equippedItemsDiv.appendChild(card);
            totalAttack += itemDetails.attackBonus * invItem.level;
            totalDefense += itemDetails.defenseBonus * invItem.level;
            totalHp += itemDetails.hpBonus * invItem.level;
            card.onclick = () => { unequipItem(invItem); };
        } else {
            unequippedItemsDiv.appendChild(card);
            card.onclick = () => { equipItem(invItem); };
        }
    });

    // ステータス更新
    const baseAttack = 10;
    const baseDefense = 5;
    const baseHp = 100;
    userData.attack = baseAttack + totalAttack;
    userData.defense = baseDefense + totalDefense;
    userData.maxHp = baseHp + totalHp;
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }
    
    document.getElementById('character-status').innerHTML = `
        <h3>ステータス</h3>
        <p>体力: ${userData.hp} / ${userData.maxHp}</p>
        <p>攻撃力: ${userData.attack}</p>
        <p>防御力: ${userData.defense}</p>
    `;
    
    saveData();
}

function equipItem(invItem) {
    const itemDetails = items.find(item => item.id === invItem.id);
    // 同じタイプの装備をすべて解除
    userData.inventory.forEach(item => {
        const detail = items.find(i => i.id === item.id);
        if (detail.type === itemDetails.type) {
            item.isEquipped = false;
        }
    });
    // 新しいアイテムを装備
    invItem.isEquipped = true;
    updateInventoryUI();
}

function unequipItem(invItem) {
    invItem.isEquipped = false;
    updateInventoryUI();
}

// --- 敵との戦闘ロジック ---
function spawnEnemies() {
    if (currentEnemies.length === 0) {
        const stageEnemies = [enemies[0], enemies[1], enemies[2]]; // ゴブリン、オーク、スケルトンを初期敵とする
        currentEnemies = stageEnemies.sort(() => 0.5 - Math.random()).slice(0, 3).map(e => ({...e})); // HPを個別に管理するため複製
    }
}

function updateEnemyUI() {
    const enemyContainer = document.getElementById('enemy-container');
    enemyContainer.innerHTML = '';
    
    currentEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
            const card = document.createElement('div');
            card.className = 'enemy-card';
            card.innerHTML = `
                <img src="${enemy.imageUrl}" alt="${enemy.name}">
                <h4>${enemy.name}</h4>
                <p>HP: <span id="hp-${enemy.id}">${enemy.hp}</span></p>
                <button onclick="attackEnemy(${enemy.id})">攻撃</button>
            `;
            enemyContainer.appendChild(card);
        }
    });
    
    if (currentEnemies.every(e => e.hp <= 0)) {
        document.getElementById('battle-log').textContent = '全ての敵を倒しました！';
        currentEnemies = []; // 敵をリセット
        spawnEnemies();
    }
}

function attackEnemy(enemyId) {
    const enemy = currentEnemies.find(e => e.id === enemyId);
    if (!enemy || enemy.hp <= 0) return;
    
    // 自分の攻撃
    const userAttack = userData.attack;
    enemy.hp -= userAttack;
    document.getElementById('battle-log').textContent = `${enemy.name}に${userAttack}ダメージ！`;
    
    // 敵の反撃
    if (enemy.hp > 0) {
        let enemyAttack = enemy.attack;
        if (enemy.isBoss) {
            enemyAttack *= 2; // ボスは2回攻撃
        }
        const damageToUser = Math.max(1, enemyAttack - userData.defense);
        userData.hp -= damageToUser;
        document.getElementById('battle-log').textContent += ` 敵の攻撃で${damageToUser}ダメージ受けた！`;
    }
    
    // ユーザーのHPが0以下になったらゲームオーバー
    if (userData.hp <= 0) {
        document.getElementById('battle-log').textContent += ' あなたは倒れてしまった...';
    }
    
    updateEnemyUI();
    saveData();
}

// --- カレンダーロジック ---
function updateCalendarUI() {
    const logList = document.getElementById('study-log-list');
    logList.innerHTML = '';
    
    const sortedDates = Object.keys(gachaLog).sort().reverse();
    
    sortedDates.forEach(date => {
        const log = gachaLog[date];
        const item = document.createElement('li');
        const studyContent = log.studyContent.length > 0 ? log.studyContent.join(', ') : '記録なし';
        item.textContent = `${date}: ${studyContent}`;
        logList.appendChild(item);
    });
}

// --- 初期化 ---
window.onload = () => {
    loadData();
    showTab('gacha');
};
