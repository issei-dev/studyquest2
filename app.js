// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5;

let userData = {
    hp: 100,
    maxHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    attack: 10,
    defense: 5,
    inventory: [] // { id: 1, level: 1, isEquipped: false } 形式
};

let currentStage = 1;
let enemiesDefeatedInStage = 0; // 現在のステージで倒した敵の数
const DEFEAT_COUNT_FOR_BOSS = 15;

let gachaLog = {};
let currentEnemies = [];

// --- アイテムデータ ---
// 強化アイテムもここに定義します
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
    1: [ // ステージ1の敵
        { id: 1, name: 'ゴブリン', hp: 20, maxHp: 20, attack: 10, defense: 3, isBoss: false, category: 'A', imageUrl: 'https://placehold.jp/200x200.png?text=ゴブリン' },
        { id: 2, name: 'オーク', hp: 50, maxHp: 50, attack: 15, defense: 5, isBoss: false, category: 'B', imageUrl: 'https://placehold.jp/200x200.png?text=オーク' },
        { id: 3, name: 'スケルトン', hp: 30, maxHp: 30, attack: 8, defense: 2, isBoss: false, category: 'A', imageUrl: 'https://placehold.jp/200x200.png?text=スケルトン' },
    ],
    // ... (ステージ2以降も同様にカテゴリーを定義)
    2: [
        { id: 10, name: 'まほうつかい', hp: 60, maxHp: 60, attack: 25, defense: 8, isBoss: false, category: 'C', imageUrl: 'https://placehold.jp/200x200.png?text=まほうつかい' },
        { id: 11, name: 'ゴースト', hp: 40, maxHp: 40, attack: 18, defense: 10, isBoss: false, category: 'B', imageUrl: 'https://placehold.jp/200x200.png?text=ゴースト' },
        { id: 12, name: 'きょじん', hp: 80, maxHp: 80, attack: 30, defense: 15, isBoss: false, category: 'C', imageUrl: 'https://placehold.jp/200x200.png?text=きょじん' },
    ],
    'boss': { id: 99, name: 'ドラゴン', hp: 500, maxHp: 500, attack: 50, defense: 20, isBoss: true, category: 'Z', attackCount: 2, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴン' },
};

// --- ドロップ率の定義 ---
const DROP_RATES = {
    // カテゴリーA: かけら（小）がほとんど
    'A': [
        { id: 100, rate: 95 }, // きょうかのかけら（小）
        { id: 101, rate: 5 },  // きょうかのかけら（中）
    ],
    // カテゴリーB: かけら（中）も出やすい
    'B': [
        { id: 100, rate: 70 },
        { id: 101, rate: 25 },
        { id: 102, rate: 5 },  // きょうかのかけら（大）
    ],
    // カテゴリーC: かたまりも出る
    'C': [
        { id: 101, rate: 50 },
        { id: 102, rate: 40 },
        { id: 103, rate: 10 }, // きょうかのかたまり（小）
    ],
    // カテゴリーZ: ボス（例としてドロップなし、または特殊アイテム）
    'Z': [],
};

// ... (loadData, saveData, showTab, updateGachaUI, gacha-form submit, rollGacha, updateHpBar 関数は変更なし) ...

// --- インベントリーロジック (装備枠と強化機能の追加) ---
function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    if (!invDiv) return;

    // 装備ステータスの再計算
    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpBonus = 0;

    // 装備アイテムのHTMLを生成
    let equippedHtml = '<h3>そうび</h3><div class="item-list">';
    const equippedItems = userData.inventory.filter(item => item.isEquipped);
    
    // 装備スロットごとのアイテム数をカウント
    const equippedCount = { weapon: 0, armor: 0, pet: 0 };

    equippedItems.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;

        equippedCount[itemDetails.type]++;

        // ステータスボーナスを加算
        totalAttackBonus += itemDetails.attackBonus * invItem.level;
        totalDefenseBonus += itemDetails.defenseBonus * invItem.level;
        totalHpBonus += itemDetails.hpBonus * invItem.level;

        equippedHtml += `
            <div class="item-card equipped-card" onclick="unequipItem(${invItem.id})">
                <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                <p>${itemDetails.name} Lv.${invItem.level}</p>
                <p>そうびちゅう (${itemDetails.type})</p>
            </div>
        `;
    });
    
    // 空きスロットの表示
    ['weapon', 'armor', 'pet'].forEach(type => {
        for (let i = equippedCount[type]; i < EQUIP_SLOTS[type]; i++) {
            equippedHtml += `
                <div class="item-card empty-slot">
                    <p>${type} ${i + 1} わく (あき)</p>
                </div>
            `;
        }
    });

    equippedHtml += '</div>';

    // もちもの（未装備アイテム）のHTMLを生成
    let unequippedHtml = '<h3>もちもの</h3><div class="item-list">';
    const unequippedItems = userData.inventory.filter(item => !item.isEquipped);
    
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
            actions += `<button onclick="showEnhanceModal(${invItem.id})">つかう</button>`;
        }
        
        unequippedHtml += `
            <div class="item-card">
                <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                <p>${itemDetails.name} ${!isMaterial ? `Lv.${invItem.level}` : ''}</p>
                ${actions}
            </div>
        `;
    });
    unequippedHtml += '</div>';

    // ステータスの更新と表示
    userData.attack = userData.baseAttack + totalAttackBonus;
    userData.defense = userData.baseDefense + totalDefenseBonus;
    userData.maxHp = 100 + totalHpBonus; 
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }

    const statusHtml = `
        <h2>キャラクターと アイテムいちらん</h2>
        <div id="character-status" style="margin-bottom: 20px;">
            <h3>ステータス</h3>
            <p>たいりょく: ${userData.hp} / ${userData.maxHp}</p>
            <p>こうげき力: ${userData.attack}</p>
            <p>ぼうぎょ力: ${userData.defense}</p>
        </div>
        <hr>
        ${equippedHtml}
        <hr>
        ${unequippedHtml}
    `;
    
    invDiv.innerHTML = statusHtml;
    saveData();
}

// 装備ロジックの修正
function equipItem(invItemId) {
    const invItem = userData.inventory.find(item => item.id === invItemId && !item.isEquipped);
    if (!invItem) return;

    const itemDetails = items.find(item => item.id === invItem.id);
    const itemType = itemDetails.type;
    
    const equippedCount = userData.inventory.filter(item => {
        const details = items.find(i => i.id === item.id);
        return item.isEquipped && details.type === itemType;
    }).length;

    if (equippedCount >= EQUIP_SLOTS[itemType]) {
        alert(`${itemType}わくはもう いっぱいです！ほかのそうびを はずしてね。`);
        return;
    }
    
    invItem.isEquipped = true;
    updateInventoryUI();
}

function unequipItem(invItemId) {
    const invItem = userData.inventory.find(item => item.id === invItemId && item.isEquipped);
    if (invItem) {
        invItem.isEquipped = false;
    }
    updateInventoryUI();
}

// 強化アイテム使用モーダルの表示 (簡易版)
function showEnhanceModal(materialId) {
    const materialItem = userData.inventory.find(item => item.id === materialId && !item.isEquipped);
    if (!materialItem) return;

    const materialDetails = items.find(item => item.id === materialId);
    const equipableItems = userData.inventory.filter(item => items.find(i => i.id === item.id).type !== 'material');
    
    if (equipableItems.length === 0) {
        alert('つよくなれる アイテムが ありません。');
        return;
    }

    let selectHtml = `
        <div id="enhance-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 20px; border-radius: 10px;">
                <h3>${materialDetails.name}を つかって つよくする</h3>
                <p>${materialDetails.name}は レベルを +${materialDetails.levelIncrease} します。</p>
                <select id="target-item-select">
                    ${equipableItems.map(item => {
                        const details = items.find(i => i.id === item.id);
                        return `<option value="${item.id}">${details.name} Lv.${item.level} (あと${details.maxLevel - item.level}レベル)</option>`;
                    }).join('')}
                </select>
                <button onclick="applyEnhancement(${materialId})">けってい</button>
                <button onclick="document.getElementById('enhance-modal').remove()">やめる</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', selectHtml);
}

// 強化アイテムの適用ロジック
function applyEnhancement(materialId) {
    const targetItemId = parseInt(document.getElementById('target-item-select').value);
    const materialDetails = items.find(item => item.id === materialId);
    const targetItem = userData.inventory.find(item => item.id === targetItemId);
    const targetItemDetails = items.find(item => item.id === targetItemId);

    if (!targetItem || !materialDetails) {
        alert('エラーがおきました。');
        return;
    }

    let levelUp = materialDetails.levelIncrease;
    
    if (targetItem.level + levelUp > targetItemDetails.maxLevel) {
        levelUp = targetItemDetails.maxLevel - targetItem.level;
    }

    if (levelUp <= 0) {
        alert(`${targetItemDetails.name}は さいだいレベルなので、つかえません。`);
        return;
    }
    
    targetItem.level += levelUp;

    // 強化アイテムをインベントリから削除
    userData.inventory = userData.inventory.filter(item => item.id !== materialId);
    
    alert(`${targetItemDetails.name}のレベルが ${targetItem.level}に なりました！`);
    
    document.getElementById('enhance-modal').remove();
    updateInventoryUI();
}

// ... (getStageEnemies, spawnEnemies, updateEnemyUI, calculateDamage 関数は変更なし) ...

// --- ドロップアイテムの抽選ロジック ---
function rollDropItem(category) {
    const drops = DROP_RATES[category];
    if (!drops || drops.length === 0) return null;

    let totalRate = drops.reduce((sum, drop) => sum + drop.rate, 0);
    let rand = Math.floor(Math.random() * totalRate);

    for (const drop of drops) {
        if (rand < drop.rate) {
            // ドロップしたアイテムのIDを返す
            return drop.id;
        }
        rand -= drop.rate;
    }
    return null; // 予期せぬエラー
}

// ターン管理と攻撃ロジック (ドロップアイテムの追加)
async function attackEnemy(enemyId) {
    const enemy = currentEnemies.find(e => e.id === enemyId);
    const battleLog = document.getElementById('battle-log');
    
    if (!enemy || enemy.hp <= 0 || userData.hp <= 0) {
        battleLog.textContent = 'もうこうげきできないよ。';
        return;
    }

    // --- 1. 自分の攻撃 ---
    // ... (自分の攻撃ロジックは変更なし)
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
            
            // 強化アイテムはインベントリに追加
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
    // ... (モンスターの反撃ロジックは変更なし)
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

// ... (handleBattleEnd, updateCalendarUI, window.onload 関数は変更なし) ...
