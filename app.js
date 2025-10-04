// --------------------------------------------------------------------------
// 🌟 Ver0.13: 戦闘ロジックの強化とボスボーナス実装 🌟
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
// 🚨 修正: ボスを出すまでに倒すべき敵の数を15体に変更
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; 

const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, defenseBonus: 0, hpBonus: 0, rarity: 1 },
    { id: 'A001', name: '皮のよろい', type: 'armor', attackBonus: 0, defenseBonus: 3, hpBonus: 10, rarity: 1 },
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.0, defensePercentBonus: 0.0, hpPercentBonus: 0.1, rarity: 2 },
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, defenseBonus: 0, hpBonus: 0, rarity: 3 },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, defensePercentBonus: 0.0, hpPercentBonus: 0.0, rarity: 4 }
];

// 敵のデータ
const enemies = {
    // Stage 1: 通常の敵グループ
    1: [
        { name: 'スライム', hp: 50, attack: 5, defense: 2, xp: 5, gold: 10, isBoss: false, image: 'スライム' },
        { name: 'ゴブリン', hp: 80, attack: 10, defense: 5, xp: 8, gold: 15, isBoss: false, image: 'ゴブリン' },
        { name: 'マンドラゴラ', hp: 60, attack: 7, defense: 8, xp: 6, gold: 12, isBoss: false, image: 'マンドラゴラ' }
    ],
    // Stage 1 Boss
    '1_boss': { name: 'ミノタウロス', hp: 200, attack: 25, defense: 15, xp: 50, gold: 100, isBoss: true, image: 'ミノタウロス' },
    
    // Stage 2: （今後追加予定）
    // 2: [...]
    // '2_boss': {...}
};

// 現在戦っている敵
let currentEnemy = null;


// --- データほぞん・よみこみ関数 (変更なし) ---

function saveData() {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('gachaLog', JSON.stringify(gachaLog));
    localStorage.setItem('currentStage', currentStage);
    localStorage.setItem('enemiesDefeatedInStage', enemiesDefeatedInStage);
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
window.toggleEquipItem = (itemIndex) => { /* ... 変更なし ... */ updateUI(); };
window.enhanceItem = (itemIndex) => { /* ... 変更なし ... */ updateUI(); };


// --- UI更新とステータス計算 (変更なし) ---
function updateInventoryUI() { 
    // ... (前回の実装を維持) ...
    // ステータス計算とHTML生成ロジックは変更ありません。
}

/**
 * 敵をランダムに選出し、currentEnemyにセットする
 */
function selectEnemy() {
    // ボス判定: 現在のステージにボスデータがあり、規定数以上敵を倒していたらボス
    const isBossTime = enemiesDefeatedInStage >= ENEMY_DEFEAT_COUNT_TO_BOSS && enemies[`${currentStage}_boss`];
    const stageKey = isBossTime ? `${currentStage}_boss` : String(currentStage);

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
        // 通常の敵グループの場合
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

    if (!currentEnemy && currentStage === 1) { // ステージ1の敵が存在しない場合
        showModal('🎉 ゲームクリア！', '現在のコンテンツをすべてクリアしました！新しいステージの更新をお待ちください。');
    }
}


/**
 * 敵のHPバーを更新する (変更なし)
 */
function updateEnemyHPBar(enemy, container) {
    const hpBar = container.querySelector('.hp-bar');
    if (!hpBar) return;

    const percent = (enemy.currentHp / enemy.maxHp) * 100;
    hpBar.style.width = `${percent}%`;
    hpBar.textContent = `${enemy.currentHp} / ${enemy.maxHp}`;
    
    if (percent > 50) {
        hpBar.style.backgroundColor = '#28a745'; 
    } else if (percent > 20) {
        hpBar.style.backgroundColor = '#ffc107';
    } else {
        hpBar.style.backgroundColor = '#dc3545';
    }
}


/**
 * 「たたかう」タブのUIを更新する (変更なし)
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
    // 🚨 修正: ダメージ計算を (攻撃力 - 防御力) または 1 の大きい方に設定
    const playerDamage = Math.max(1, userData.attack - currentEnemy.defense);
    currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - playerDamage);
    log += `プレイヤーの攻撃！${currentEnemy.name} に ${playerDamage} のダメージを与えた。<br>`;
    
    // 敵カードに揺れアニメーション (変更なし)
    const enemyCard = document.getElementById('active-enemy');
    if (enemyCard) {
        enemyCard.classList.add('shake-enemy');
        setTimeout(() => enemyCard.classList.remove('shake-enemy'), 500);
    }
    
    updateEnemyHPBar(currentEnemy, enemyCard);
    
    // 2. 勝利判定
    if (currentEnemy.currentHp <= 0) {
        log += `**${currentEnemy.name} を倒した！🎉**<br>`;
        enemiesDefeatedInStage++;
        
        log += `経験値 ${currentEnemy.xp} と ${currentEnemy.gold} G を手に入れた。<br>`;

        if (currentEnemy.isBoss) {
            // 🚨 ボス撃破時の処理を追加
            const bossBonus = 3;
            // ガチャ回数を増やす（今日の最大スタンプ数を増やすことで実現）
            // 注意: これは現在の日のログに影響するため、MAX_GACHA_COUNT自体は増やさず、
            // 今日のスタンプ可能回数を増やします。
            const todayLog = gachaLog[today] || { count: 0, studyContent: [] };
            todayLog.count = Math.max(0, todayLog.count - bossBonus); 
            gachaLog[today] = todayLog; // ログを更新

            log += `**ステージ ${currentStage} クリア！** 次のステージへ。<br>`;
            currentStage++;
            enemiesDefeatedInStage = 0;
            
            showModal('🎉 ボス撃破ボーナス！', `おめでとう！ボスをたおしたよ！ガチャボーナス＋${bossBonus}だよ！`);
        }

        currentEnemy = null; // 敵をリセット
        logElement.innerHTML = log + logElement.innerHTML; // ログを追記
        updateUI(); 
        updateEnemyUI(); 
        return;
    }

    // 3. 敵の反撃
    // 敵のダメージも最低1を適用
    const enemyDamage = Math.max(1, currentEnemy.attack - userData.defense);
    userData.hp = Math.max(0, userData.hp - enemyDamage);
    log += `${currentEnemy.name} の反撃！プレイヤーは ${enemyDamage} のダメージを受けた。<br>`;
    
    // 4. 敗北判定
    if (userData.hp <= 0) {
        log += '**プレイヤーは倒れてしまった...**<br>';
        userData.hp = 1; 
        currentEnemy = null; 
        showModal('ゲームオーバー', '残念ながら負けてしまいました。アイテムを強化して再挑戦しましょう！');
    }

    // ログの表示とUI更新
    logElement.innerHTML = log + logElement.innerHTML;
    updateUI();
    updateEnemyUI();
};


/** 画面全体に関わるUI更新関数 (変更なし) */
function updateUI() {
    // 1. ガチャ回数更新 
    const gachaCount = gachaLog[today] ? MAX_GACHA_COUNT - gachaLog[today].count : MAX_GACHA_COUNT;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化 (省略)
    // 3. スタンプボタンの有効/無効化 (省略)
    
    // 4. ステータス計算とインベントリUIの更新
    updateInventoryUI(); 

    // 5. データ保存
    saveData();
}


// --- イベントハンドラーとメインロジック (変更なし) ---
document.addEventListener('DOMContentLoaded', () => { /* ... 変更なし ... */ });


// ------------------ グローバル関数 (HTMLから呼び出される関数) ------------------

// タブ切り替え機能 (変更なし)
window.showTab = (clickedButton, tabId) => {
    // ... (前回の実装を維持) ...
    document.querySelectorAll('.tab-button').forEach(button => { button.classList.remove('active'); });
    clickedButton.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => { content.style.display = 'none'; });
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) { selectedContent.style.display = 'block'; }

    if (tabId === 'inventory') { updateInventoryUI(); }
    if (tabId === 'calendar') { updateCalendarLogUI(); }
    if (tabId === 'enemy') { updateEnemyUI(); }
};

// カスタムポップアップ機能 (変更なし)
window.showModal = (title = 'お知らせ', message = '') => { /* ... 変更なし ... */ };
window.hideModal = () => { /* ... 変更なし ... */ };

// きろくタブのUI更新 (変更なし)
function updateCalendarLogUI() { /* ... 変更なし ... */ }
