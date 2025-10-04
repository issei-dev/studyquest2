// --------------------------------------------------------------------------
// 🌟 Ver0.12: 戦闘機能の実装 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5; 
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
    inventory: [] // { id: 'W001', level: 1, isEquipped: true } の形式
};

// 日別スタンプ記録とガチャ回数を兼ねる
let gachaLog = {}; 

// --- 戦闘関連データ ---
let currentStage = 1;
let enemiesDefeatedInStage = 0; // そのステージで倒した敵の数
const ENEMY_DEFEAT_COUNT_TO_BOSS = 3; // ボスを出すまでに倒すべき敵の数

const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, defenseBonus: 0, hpBonus: 0, rarity: 1 },
    { id: 'A001', name: '皮のよろい', type: 'armor', attackBonus: 0, defenseBonus: 3, hpBonus: 10, rarity: 1 },
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.0, defensePercentBonus: 0.0, hpPercentBonus: 0.1, rarity: 2 },
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, defenseBonus: 0, hpBonus: 0, rarity: 3 },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, defensePercentBonus: 0.0, hpPercentBonus: 0.0, rarity: 4 }
];

// 敵のデータ
const enemies = {
    // Stage 1
    1: [
        { name: 'スライム', hp: 50, attack: 5, defense: 2, xp: 5, gold: 10, isBoss: false, image: 'スライム' },
        { name: 'ゴブリン', hp: 80, attack: 10, defense: 5, xp: 8, gold: 15, isBoss: false, image: 'ゴブリン' },
        { name: 'マンドラゴラ', hp: 60, attack: 7, defense: 8, xp: 6, gold: 12, isBoss: false, image: 'マンドラゴラ' }
    ],
    // Stage 1 Boss
    '1_boss': { name: 'ミノタウロス', hp: 200, attack: 25, defense: 15, xp: 50, gold: 100, isBoss: true, image: 'ミノタウロス' }
};

// 現在戦っている敵
let currentEnemy = null;


// --- データほぞん・よみこみ関数 (LocalStorage) ---

function saveData() {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('gachaLog', JSON.stringify(gachaLog));
    localStorage.setItem('currentStage', currentStage);
    localStorage.setItem('enemiesDefeatedInStage', enemiesDefeatedInStage);
    // currentEnemy は戦闘中のデータのため永続化しない
    console.log("Data saved to LocalStorage.");
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
    
    // 今日のログがない場合、初期化とHP回復
    if (!gachaLog[today]) {
        userData.hp = userData.maxHp; 
        gachaLog[today] = { count: 0, studyContent: [] };
    }
    
    console.log("Data loaded from LocalStorage.");
}


// --- 共通の計算ロジック (変更なし) ---

function calculateWeaponArmorBonus(baseBonus, level) {
    return Math.round(baseBonus * Math.pow(ENHANCEMENT_RATE, level - 1));
}

function calculatePetPercentBonus(basePercent, level) {
    return basePercent + (level - 1) * PET_GROWTH_RATE;
}


// --- インベントリ操作ロジック (変更なし) ---

window.toggleEquipItem = (itemIndex) => {
    // ... (前回の実装を維持) ...
    const invItem = userData.inventory[itemIndex];
    if (!invItem) return;

    const itemDetails = items.find(i => i.id === invItem.id);
    if (!itemDetails) return;

    if (invItem.isEquipped) {
        invItem.isEquipped = false;
        showModal('装備解除', `${itemDetails.name} の装備を解除しました。`);
    } else {
        userData.inventory.forEach((otherItem, index) => {
            if (index !== itemIndex && otherItem.isEquipped) {
                const otherDetails = items.find(i => i.id === otherItem.id);
                if (otherDetails && otherDetails.type === itemDetails.type) {
                    otherItem.isEquipped = false;
                }
            }
        });

        invItem.isEquipped = true;
        showModal('装備！', `${itemDetails.name} を装備しました。ステータスが更新されます。`);
    }
    
    updateUI();
};

window.enhanceItem = (itemIndex) => {
    const invItem = userData.inventory[itemIndex];
    if (!invItem) return;

    invItem.level = (invItem.level || 1) + 1;

    const itemDetails = items.find(i => i.id === invItem.id);
    showModal('強化成功！', `${itemDetails.name} のレベルが **${invItem.level}** にアップしました！`);
    
    updateUI();
};


// ------------------ UI更新とステータス計算 ------------------

function updateInventoryUI() {
    // ... (ステータス計算部分は変更なし) ...
    const invDiv = document.getElementById('inventory');
    if (!invDiv) return;

    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpBonus = 0;
    let totalAttackPercent = 0;
    let totalDefensePercent = 0;
    let totalHpPercent = 0;

    const equippedItems = userData.inventory.filter(item => item.isEquipped);
    const unequippedItems = userData.inventory.filter(item => !item.isEquipped);
    
    const equippedItemsMap = {}; 
    equippedItems.forEach(invItem => {
        const itemDetails = items.find(i => i.id === invItem.id);
        if (itemDetails) {
             equippedItemsMap[itemDetails.type] = invItem;
        }
    });

    // --- ステータスボーナス計算 ---
    equippedItems.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id); 
        if (!itemDetails) return;
        
        if (itemDetails.type === 'weapon' || itemDetails.type === 'armor') {
            const attackBoost = calculateWeaponArmorBonus(itemDetails.attackBonus || 0, invItem.level || 1);
            const defenseBoost = calculateWeaponArmorBonus(itemDetails.defenseBonus || 0, invItem.level || 1);
            const hpBoost = calculateWeaponArmorBonus(itemDetails.hpBonus || 0, invItem.level || 1);
            
            totalAttackBonus += attackBoost;
            totalDefenseBonus += defenseBoost;
            totalHpBonus += hpBoost;
            
        } else if (itemDetails.type === 'pet') {
            const attackP = calculatePetPercentBonus(itemDetails.attackPercentBonus || 0, invItem.level || 1);
            const defenseP = calculatePetPercentBonus(itemDetails.defensePercentBonus || 0, invItem.level || 1);
            const hpP = calculatePetPercentBonus(itemDetails.hpPercentBonus || 0, invItem.level || 1);
            
            totalAttackPercent += attackP;
            totalDefensePercent += defenseP;
            totalHpPercent += hpP;
        }
    });

    // 1. 固定値補正を適用した暫定ステータスを計算
    const interimAttack = Number(userData.baseAttack) + Number(totalAttackBonus);
    const interimDefense = Number(userData.baseDefense) + Number(totalDefenseBonus);
    const interimMaxHp = Number(BASE_STATS_HP) + Number(totalHpBonus); 
    
    // 2. パーセント補正を適用し、userDataを更新
    userData.attack = Math.round(interimAttack * (1 + totalAttackPercent)); 
    userData.defense = Math.round(interimDefense * (1 + totalDefensePercent));
    userData.maxHp = Math.round(interimMaxHp * (1 + totalHpPercent));
    
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }


    // --- 装備スロットのHTML生成 ---
    const equipSlots = ['weapon', 'armor', 'pet'];
    let mainEquipHtml = '<div style="display: flex; gap: 20px;">';
    
    equipSlots.forEach(type => {
        const equippedItem = equippedItemsMap[type];
        let cardHtml;
        if (equippedItem) {
            const itemDetails = items.find(i => i.id === equippedItem.id);
            const itemIndex = userData.inventory.findIndex(item => item.id === equippedItem.id && item.isEquipped);

            cardHtml = `
                <div class="item-card equipped-card" onclick="toggleEquipItem(${itemIndex})">
                    <p class="font-bold text-lg">${itemDetails.name}</p>
                    <p class="text-sm">Lv: ${equippedItem.level || 1} / ${itemDetails.type === 'pet' ? '率' : '値'}UP</p>
                    <button onclick="event.stopPropagation(); enhanceItem(${itemIndex});" class="bg-yellow-600 text-white p-1 text-xs">強化</button>
                </div>
            `;
        } else {
            cardHtml = `<div class="item-card empty-slot">装備なし (${type})</div>`;
        }
        mainEquipHtml += cardHtml;
    });
    mainEquipHtml += '</div>';

    // --- 未装備アイテムのHTML生成 ---
    let unequippedHtml = '<h3>もちもの</h3><div class="item-list">';
    
    // インベントリの全アイテムをループし、未装備アイテムのみ表示
    userData.inventory.forEach((invItem, index) => {
        if (!invItem.isEquipped) {
            const itemDetails = items.find(i => i.id === invItem.id);
            if (!itemDetails) return;

            unequippedHtml += `
                <div class="item-card">
                    <p class="font-bold">${itemDetails.name}</p>
                    <p class="text-xs text-gray-500">${itemDetails.type}</p>
                    <p class="text-sm">Lv: ${invItem.level || 1}</p>
                    <button onclick="toggleEquipItem(${index})" class="bg-green-600">装備する</button>
                    <button onclick="enhanceItem(${index})" class="bg-yellow-600">強化</button>
                </div>
            `;
        }
    });

    unequippedHtml += '</div>';


    // ステータス表示のHTMLを生成
    const statusHtml = `
        <h2>キャラクターと アイテムいちらん</h2>
        <div id="character-status" style="margin-bottom: 20px;">
            <h3>ステータス</h3>
            <p>たいりょく: ${userData.hp} / ${userData.maxHp}</p>
            <p>こうげき力: ${userData.attack} (きほん: ${userData.baseAttack} + ぶきぼうぐ: ${totalAttackBonus} + ペット: +${(totalAttackPercent * 100).toFixed(1)}%)</p>
            <p>ぼうぎょ力: ${userData.defense} (きほん: ${userData.baseDefense} + ぶきぼうぐ: ${totalDefenseBonus} + ペット: +${(totalDefensePercent * 100).toFixed(1)}%)</p>
        </div>
        <hr>
        <h3>そうび</h3>
        ${mainEquipHtml}
        <hr>
        ${unequippedHtml}
    `;
    
    invDiv.innerHTML = statusHtml;
    // saveData() は updateUI() の最後で呼び出される
}

/**
 * 敵をランダムに選出し、currentEnemyにセットする
 */
function selectEnemy() {
    const stageKey = enemiesDefeatedInStage >= ENEMY_DEFEAT_COUNT_TO_BOSS ? `${currentStage}_boss` : String(currentStage);
    
    if (stageKey.endsWith('_boss')) {
        // ボスの場合
        const bossData = enemies[stageKey];
        if (bossData) {
            currentEnemy = { 
                ...bossData, 
                currentHp: bossData.hp, 
                maxHp: bossData.hp,
                isBoss: true
            };
        }
    } else {
        // 通常の敵の場合
        const normalEnemies = enemies[stageKey];
        if (normalEnemies && normalEnemies.length > 0) {
            const randomIndex = Math.floor(Math.random() * normalEnemies.length);
            const selectedEnemy = normalEnemies[randomIndex];
            currentEnemy = { 
                ...selectedEnemy, 
                currentHp: selectedEnemy.hp, 
                maxHp: selectedEnemy.hp,
                isBoss: false
            };
        }
    }

    if (!currentEnemy) {
        // 次のステージに進む、またはゲームクリア
        showModal('🎉 ゲームクリア！', 'すべてのステージをクリアしました！');
    }
}


/**
 * 敵のHPバーを更新する
 * @param {object} enemy - 敵オブジェクト
 * @param {HTMLElement} container - HPバーの親要素
 */
function updateEnemyHPBar(enemy, container) {
    const hpBar = container.querySelector('.hp-bar');
    if (!hpBar) return;

    const percent = (enemy.currentHp / enemy.maxHp) * 100;
    hpBar.style.width = `${percent}%`;
    hpBar.textContent = `${enemy.currentHp} / ${enemy.maxHp}`;
    
    // HPによって色を変える
    if (percent > 50) {
        hpBar.style.backgroundColor = '#28a745'; // Green
    } else if (percent > 20) {
        hpBar.style.backgroundColor = '#ffc107'; // Yellow
    } else {
        hpBar.style.backgroundColor = '#dc3545'; // Red
    }
}


/**
 * 「たたかう」タブのUIを更新する
 */
function updateEnemyUI() {
    const enemyContainer = document.getElementById('enemy-container');
    const playerStatusElement = document.getElementById('player-status-enemy-tab');
    
    if (!enemyContainer || !playerStatusElement) return;

    // プレイヤーのステータス表示
    playerStatusElement.innerHTML = `
        プレイヤー: HP ${userData.hp}/${userData.maxHp}, 攻撃力 ${userData.attack}, 防御力 ${userData.defense}
    `;

    // 敵の選出と表示
    if (!currentEnemy || currentEnemy.currentHp <= 0) {
        selectEnemy(); // 次の敵を選ぶ
    }

    if (currentEnemy) {
        const isBoss = currentEnemy.isBoss;
        const enemyName = currentEnemy.name;
        
        enemyContainer.innerHTML = `
            <div id="active-enemy" class="enemy-card ${isBoss ? 'boss-card' : ''}" style="width: 100%;">
                <h3 class="font-extrabold text-xl ${isBoss ? 'text-red-700' : ''}">${enemyName} ${isBoss ? ' (BOSS)' : ''}</h3>
                <img src="https://placehold.co/100x100/ef5350/ffffff?text=${currentEnemy.image}" alt="${enemyName}" class="mx-auto mb-2 rounded">
                
                <div class="hp-bar-container mt-3">
                    <div class="hp-bar" style="width: 100%;">HP</div>
                </div>
                
                <p class="text-sm mt-1">攻撃: ${currentEnemy.attack}, 防御: ${currentEnemy.defense}</p>
                
                <button class="attack-button bg-red-600 text-white px-5 py-2 rounded-md mt-4 text-lg" onclick="attackEnemy()">攻撃！</button>
            </div>
        `;
        // HPバーの初期表示
        updateEnemyHPBar(currentEnemy, document.getElementById('active-enemy'));
    } else {
        enemyContainer.innerHTML = '<p>敵がいません。ステージをクリアしました！</p>';
    }
}

/**
 * 攻撃ロジックを実行する (HTMLのボタンから呼び出される)
 */
window.attackEnemy = () => {
    if (!currentEnemy || userData.hp <= 0) {
        return;
    }
    
    const logElement = document.getElementById('battle-log');
    let log = '';

    // 1. プレイヤーの攻撃
    const playerDamage = Math.max(0, userData.attack - currentEnemy.defense);
    currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - playerDamage);
    log += `プレイヤーの攻撃！${currentEnemy.name} に ${playerDamage} のダメージを与えた。<br>`;
    
    // 敵カードに揺れアニメーション
    const enemyCard = document.getElementById('active-enemy');
    if (enemyCard) {
        enemyCard.classList.add('shake-enemy');
        setTimeout(() => enemyCard.classList.remove('shake-enemy'), 500);
    }
    
    // 敵のHP更新
    updateEnemyHPBar(currentEnemy, enemyCard);
    
    // 2. 勝利判定
    if (currentEnemy.currentHp <= 0) {
        log += `**${currentEnemy.name} を倒した！🎉**<br>`;
        enemiesDefeatedInStage++;
        
        // 経験値やゴールドの処理（簡略化）
        log += `経験値 ${currentEnemy.xp} と ${currentEnemy.gold} G を手に入れた。<br>`;

        if (currentEnemy.isBoss) {
            log += `**ステージ ${currentStage} クリア！** 次のステージへ。<br>`;
            currentStage++;
            enemiesDefeatedInStage = 0;
        }

        currentEnemy = null; // 敵をリセット
        logElement.innerHTML = log + logElement.innerHTML; // ログを追記
        updateUI(); // ステージ更新のためUI全体を更新
        updateEnemyUI(); // 次の敵を表示
        return;
    }

    // 3. 敵の反撃
    const enemyDamage = Math.max(0, currentEnemy.attack - userData.defense);
    userData.hp = Math.max(0, userData.hp - enemyDamage);
    log += `${currentEnemy.name} の反撃！プレイヤーは ${enemyDamage} のダメージを受けた。<br>`;
    
    // 4. 敗北判定
    if (userData.hp <= 0) {
        log += '**プレイヤーは倒れてしまった...**<br>';
        userData.hp = 1; // 復活（簡略化）
        currentEnemy = null; // 敵をリセット
        showModal('ゲームオーバー', '残念ながら負けてしまいました。アイテムを強化して再挑戦しましょう！');
    }

    // ログの表示とUI更新
    logElement.innerHTML = log + logElement.innerHTML;
    updateUI();
    updateEnemyUI();
};


/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 1. ガチャ回数更新 (変更なし)
    const gachaCount = gachaLog[today] ? MAX_GACHA_COUNT - gachaLog[today].count : MAX_GACHA_COUNT;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化 (省略)

    // 3. スタンプボタンの有効/無効化 (省略)

    // 4. ステータス計算とインベントリUIの更新
    updateInventoryUI(); 

    // 5. データ保存 (UI更新後にデータを永続化)
    saveData();
}


// --- イベントハンドラーとメインロジック (変更なし) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. データロード
    loadData();

    // 2. スタンプ機能のイベントリスナー (省略)
    document.getElementById('study-stamps').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('study-stamp-button') && !button.disabled) {
            const content = button.getAttribute('data-content');
            
            if (gachaLog[today].count < MAX_GACHA_COUNT) {
                gachaLog[today].count += 1; 
                gachaLog[today].studyContent.push(content); 
                showModal('スタンプゲット！', `「${content}」を記録しました！`);
                updateUI(); 
            } else {
                showModal('上限です', '今日はこれ以上スタンプを押せません！');
            }
        }
    });

    // 3. ガチャ機能のイベントリスナー (省略)
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('gacha-roll-button') && !button.disabled) {
            const currentGachaCount = MAX_GACHA_COUNT - gachaLog[today].count;

            if (currentGachaCount > 0) {
                gachaLog[today].count -= 1; 
                
                const type = button.id.includes('weapon') ? 'ぶき' : 'ペット';
                const resultElement = document.getElementById('gacha-result');
                
                const rollItems = items.filter(i => (type === 'ぶき' ? i.type !== 'pet' : i.type === 'pet'));
                const rolledItem = rollItems[Math.floor(Math.random() * rollItems.length)];
                
                userData.inventory.push({ 
                    id: rolledItem.id, 
                    level: 1, 
                    isEquipped: false
                });
                
                resultElement.innerHTML = `<p class="text-xl font-bold text-red-600 mb-2">🎉 ${type}ガチャ 結果発表 🎉</p><p class="text-lg">「${rolledItem.name}」を手に入れた！</p>`;

                updateUI();
            } else {
                showModal('回数が足りません', 'スタンプを押してガチャ回数を増やしましょう！');
            }
        }
    });

    // 4. 初回UI更新
    updateUI(); 
});


// ------------------ グローバル関数 (HTMLから呼び出される関数) ------------------

// タブ切り替え機能
window.showTab = (clickedButton, tabId) => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    clickedButton.classList.add('active');

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

    // 🚨 「たたかう」タブが開かれたら敵UIを更新・表示する
    if (tabId === 'enemy') {
        updateEnemyUI();
    }
};

// カスタムポップアップ機能 (省略)
window.showModal = (title = 'お知らせ', message = '') => {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (modalTitle) modalTitle.innerHTML = title;
    if (modalMessage) modalMessage.innerHTML = message;
    if (modal) modal.classList.add('visible');
}

window.hideModal = () => {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.remove('visible');
}

// きろくタブのUI更新
function updateCalendarLogUI() {
    const logList = document.getElementById('study-log-list');
    if (!logList) return;
    
    let html = '';
    const sortedDates = Object.keys(gachaLog).sort().reverse();
    
    sortedDates.forEach(date => {
        const log = gachaLog[date];
        if (log && log.studyContent && log.studyContent.length > 0) {
            const stampCount = log.studyContent.length;
            const contents = log.studyContent.join(', ');
            
            html += `<li class="p-2 border-b border-gray-200">
                        <span class="font-bold text-gray-800">${date}</span>: 
                        <span class="text-green-600 font-medium">スタンプ ${stampCount}個</span> (内容: ${contents})
                    </li>`;
        }
    });
    
    logList.innerHTML = html || '<li class="p-2 text-gray-500">まだ記録がありません。スタンプを押して勉強を記録しましょう！</li>';
}
