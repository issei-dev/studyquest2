// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5;

let userData = {
// ... (他のuserDataプロパティは変更なし)
    hp: 100,
    maxHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    attack: 10,
    defense: 5,
    inventory: []
};

let currentStage = 1;
let enemiesDefeatedInStage = 0; // 現在のステージで倒した敵の数
const DEFEAT_COUNT_FOR_BOSS = 15; // ★ここを15に変更しました★

let gachaLog = {};
let currentEnemies = [];

// ... (items, ENEMY_GROUPS の定義は変更なし) ...
const items = [
    // 武器 (weapon) - 攻撃力が高い
    { id: 1, name: 'きのつるぎ', type: 'weapon', rarity: 'N', attackBonus: 5, defenseBonus: 1, hpBonus: 0, maxLevel: 5, imageUrl: 'https://placehold.jp/200x200.png?text=きのつるぎ' },
    { id: 4, name: 'てつのつるぎ', type: 'weapon', rarity: 'R', attackBonus: 10, defenseBonus: 2, hpBonus: 0, maxLevel: 10, imageUrl: 'https://placehold.jp/200x200.png?text=てつのつるぎ' },
    { id: 6, name: 'ほのおのつるぎ', type: 'weapon', rarity: 'SR', attackBonus: 25, defenseBonus: 5, hpBonus: 0, maxLevel: 25, imageUrl: 'https://placehold.jp/200x200.png?text=ほのおのつるぎ' },
    // 防具 (armor) - 防御力が高い
    { id: 2, name: 'いしのたて', type: 'armor', rarity: 'N', attackBonus: 1, defenseBonus: 3, hpBonus: 0, maxLevel: 5, imageUrl: 'https://placehold.jp/200x200.png?text=いしのたて' },
    { id: 5, name: 'かわのよろい', type: 'armor', rarity: 'R', attackBonus: 2, defenseBonus: 7, hpBonus: 0, maxLevel: 10, imageUrl: 'https://placehold.jp/200x200.png?text=かわのよろい' },
    { id: 7, name: 'ドラゴンのたて', type: 'armor', rarity: 'SSR', attackBonus: 0, defenseBonus: 30, hpBonus: 0, maxLevel: 50, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴンのたて' },
    // ペット (pet) - HPとバランス
    { id: 3, name: 'スライム', type: 'pet', rarity: 'N', attackBonus: 2, defenseBonus: 2, hpBonus: 5, maxLevel: 5, imageUrl: 'https://placehold.jp/200x200.png?text=スライム' },
];

const ENEMY_GROUPS = {
    1: [ // ステージ1の敵
        { id: 1, name: 'ゴブリン', hp: 20, maxHp: 20, attack: 10, defense: 3, isBoss: false, imageUrl: 'https://placehold.jp/200x200.png?text=ゴブリン' },
        { id: 2, name: 'オーク', hp: 50, maxHp: 50, attack: 15, defense: 5, isBoss: false, imageUrl: 'https://placehold.jp/200x200.png?text=オーク' },
        { id: 3, name: 'スケルトン', hp: 30, maxHp: 30, attack: 8, defense: 2, isBoss: false, imageUrl: 'https://placehold.jp/200x200.png?text=スケルトン' },
    ],
    2: [ // ステージ2の敵 (例)
        { id: 10, name: 'まほうつかい', hp: 60, maxHp: 60, attack: 25, defense: 8, isBoss: false, imageUrl: 'https://placehold.jp/200x200.png?text=まほうつかい' },
        { id: 11, name: 'ゴースト', hp: 40, maxHp: 40, attack: 18, defense: 10, isBoss: false, imageUrl: 'https://placehold.jp/200x200.png?text=ゴースト' },
        { id: 12, name: 'きょじん', hp: 80, maxHp: 80, attack: 30, defense: 15, isBoss: false, imageUrl: 'https://placehold.jp/200x200.png?text=きょじん' },
    ],
    'boss': { id: 99, name: 'ドラゴン', hp: 500, maxHp: 500, attack: 50, defense: 20, isBoss: true, attackCount: 2, imageUrl: 'https://placehold.jp/200x200.png?text=ドラゴン' },
};


// ... (loadData, showTab, updateGachaUI, gacha-form submit, rollGacha, updateInventoryUI, equipItem, unequipItem は変更なし) ...


// --- てきとのたたかいロジック (ステージ管理、ターン制、ダメージ計算を修正) ---

// 現在のステージの敵グループを取得 (ボス出現判定も含む)
function getStageEnemies() {
    if (enemiesDefeatedInStage >= DEFEAT_COUNT_FOR_BOSS && ENEMY_GROUPS['boss']) {
        // ボス出現
        return [{...ENEMY_GROUPS['boss']}]; // ボスは1体
    }
    
    const group = ENEMY_GROUPS[currentStage] || ENEMY_GROUPS[1]; // ステージの敵がいなければステージ1の敵
    return group;
}

function spawnEnemies() {
    if (currentEnemies.length > 0 && currentEnemies.every(e => e.hp <= 0)) {
        // 全滅した場合
        currentEnemies = [];
    }
    
    if (currentEnemies.length === 0) {
        const stageEnemies = getStageEnemies();

        if (stageEnemies.some(e => e.isBoss)) {
            // ボス出現の場合
            currentEnemies.push({...stageEnemies[0], id: Date.now()});
        } else {
            // 通常敵の出現
            const availableEnemies = stageEnemies;
            for (let i = 0; i < 3; i++) {
                const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                currentEnemies.push({...randomEnemy, originalId: randomEnemy.id, id: Date.now() + i}); // ユニークIDを付与
            }
        }
    }
}

function updateEnemyUI() {
    const enemyContainer = document.getElementById('enemy-container');
    enemyContainer.innerHTML = '';
    
    // プレイヤーのステータスとステージ数の表示
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

    currentEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
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
    
    if (currentEnemies.every(e => e.hp <= 0)) {
        handleBattleEnd();
    }
}

// ダメージ計算関数
function calculateDamage(attackerAttack, defenderDefense) {
    const rawDamage = attackerAttack - defenderDefense;
    return Math.max(1, rawDamage); // 防御が攻撃を上回る場合は固定1ダメージ
}

// ターン管理と攻撃ロジック
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
    
    // モンスター揺れアニメーション
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
    }
    
    if (currentEnemies.every(e => e.hp <= 0)) {
        saveData(); // 敵を倒した数を保存
        updateEnemyUI();
        handleBattleEnd();
        return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 800)); // 自分のターン終了待ち

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
            
            // 画面揺れアニメーション
            document.body.classList.add('shake-screen');
            await new Promise(resolve => setTimeout(resolve, 300));
            document.body.classList.remove('shake-screen');
            updateHpBar('player-hp-bar', userData.hp, userData.maxHp);
            await new Promise(resolve => setTimeout(resolve, 500)); // 攻撃間の待ち時間
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
    const isBossDefeated = currentEnemies.some(e => e.isBoss && e.hp <= 0);
    
    if (isBossDefeated) {
        document.getElementById('battle-log').textContent = 'ボスをたおした！つぎのステージへ！🎉';
        currentStage++;
        enemiesDefeatedInStage = 0;
        currentEnemies = [];
        setTimeout(() => {
            spawnEnemies();
            updateEnemyUI();
        }, 2000);
    } else if (currentEnemies.every(e => e.hp <= 0)) {
        document.getElementById('battle-log').textContent = 'ぜんぶのてきをたおしました！';
        currentEnemies = [];
        setTimeout(() => {
            // ボス出現条件を満たしていたらボスをスポーン
            spawnEnemies();
            updateEnemyUI();
        }, 2000);
    }
}

// ... (updateCalendarUI, window.onload は変更なし) ...
