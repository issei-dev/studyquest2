// --------------------------------------------------------------------------
// 🌟 Ver0.32: 戦闘ロジック実装 (findEnemy, attackEnemy) と自動回復ロジック追加 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const BASE_STATS_HP = 100;
const BASE_STATS_ATTACK = 10;
const BASE_STATS_DEFENSE = 5;
const ENHANCEMENT_RATE = 1.2;
const PET_GROWTH_RATE = 0.001;
const MAX_ENEMIES_PER_BATTLE = 3; // 同時に出現する雑魚敵の最大数

// ガチャのレアリティ抽選確率を定義（合計100%になるように調整）
const GACHA_RARITY_GROUPS = {
    'weapon': { 'N': 50, 'R': 30, 'SR': 15, 'UR': 4, 'LE': 1 },
    'pet': { 'N': 40, 'R': 35, 'SR': 20, 'UR': 4, 'LE': 1 },
    'armor': { 'N': 50, 'R': 30, 'SR': 15, 'UR': 4, 'LE': 1 }
};

// 敵のカテゴリー別ドロップ率と強化アイテムの対応
const ENEMY_DROP_GROUPS = {
    'A': { 'N': 95, 'R': 5, 'SR': 0, 'UR': 0 }, // N:95%, R:5%
    'B': { 'N': 50, 'R': 40, 'SR': 10, 'UR': 0 }, // N:50%, R:40%, SR:10%
    'C': { 'N': 0, 'R': 90, 'SR': 10, 'UR': 0 } // R:90%, SR:10%
};
const REINFORCEMENT_ITEMS_BY_RARITY = {
    'N': { name: 'きょうかのかけら（小）', levelBonus: 1, itemId: 'M001' },
    'R': { name: 'きょうかのかけら（中）', levelBonus: 2, itemId: 'M002' },
    'SR': { name: 'きょうかのかけら（大）', levelBonus: 3, itemId: 'M003' },
    'UR': { name: 'きょうかのかたまり（小）', levelBonus: 4, itemId: 'M004' }
};

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
let lastPlayedDate = today; // 最終プレイ日を保持する変数を追加

// --- アイテムデータ (画像URLをSQ2-w001.pngシリーズに統一) ---
const items = [
    // 武器 (Weapon)
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 2, defenseBonus: 0, hpBonus: 0, rarity: 'N', image: 'SQ2-w001.png' },
    { id: 'W002', name: '木の斧', type: 'weapon', attackBonus: 1, defenseBonus: 1, hpBonus: 0, rarity: 'N', image: 'SQ2-w002.png' },
    { id: 'W003', name: '木の杖', type: 'weapon', attackBonus: 1, defenseBonus: 0, hpBonus: 1, rarity: 'N', image: 'SQ2-w003.png' },
    { id: 'W004', name: '木の盾', type: 'weapon', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'SQ2-w004.png' },
    { id: 'W005', name: '石の剣', type: 'weapon', attackBonus: 1, defenseBonus: 0, hpBonus: 1, rarity: 'N', image: 'SQ2-w005.png' },
    { id: 'W006', name: '石の斧', type: 'weapon', attackBonus: 0, defenseBonus: 1, hpBonus: 1, rarity: 'N', image: 'SQ2-w006.png' },
    { id: 'W007', name: '石の槍', type: 'weapon', attackBonus: 0, defenseBonus: 0, hpBonus: 2, rarity: 'N', image: 'SQ2-w007.png' },
    { id: 'W008', name: '石の盾', type: 'weapon', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'SQ2-w008.png' },
    
    { id: 'W009', name: '鉄の剣', type: 'weapon', attackBonus: 8, defenseBonus: 0, hpBonus: 0, rarity: 'R', image: 'SQ2-w009.png' },
    { id: 'W010', name: '鉄の斧', type: 'weapon', attackBonus: 4, defenseBonus: 4, hpBonus: 0, rarity: 'R', image: 'SQ2-w010.png' },
    { id: 'W011', name: '鉄の槍', type: 'weapon', attackBonus: 4, defenseBonus: 0, hpBonus: 4, rarity: 'R', image: 'SQ2-w011.png' },
    { id: 'W012', name: '鉄の盾', type: 'weapon', attackBonus: 0, defenseBonus: 8, hpBonus: 0, rarity: 'R', image: 'SQ2-w012.png' },
    { id: 'W013', name: '金の剣', type: 'weapon', attackBonus: 32, defenseBonus: 0, hpBonus: 0, rarity: 'SR', image: 'SQ2-w013.png' },
    { id: 'W014', name: '金の斧', type: 'weapon', attackBonus: 16, defenseBonus: 16, hpBonus: 0, rarity: 'SR', image: 'SQ2-w014.png' },
    { id: 'W015', name: '金の槍', type: 'weapon', attackBonus: 16, defenseBonus: 0, hpBonus: 16, rarity: 'SR', image: 'SQ2-w015.png' },
    { id: 'W016', name: '金の盾', type: 'weapon', attackBonus: 0, defenseBonus: 32, hpBonus: 0, rarity: 'SR', image: 'SQ2-w016.png' },
    
    { id: 'W017', name: 'ダイヤモンドの剣', type: 'weapon', attackBonus: 128, defenseBonus: 0, hpBonus: 0, rarity: 'UR', image: 'SQ2-w017.png' },
    { id: 'W018', name: 'ダイヤモンドの斧', type: 'weapon', attackBonus: 64, defenseBonus: 64, hpBonus: 0, rarity: 'UR', image: 'SQ2-w018.png' },
    { id: 'W019', name: 'ダイヤモンドの槍', type: 'weapon', attackBonus: 64, defenseBonus: 0, hpBonus: 64, rarity: 'UR', image: 'SQ2-w019.png' },
    { id: 'W020', name: 'ダイヤモンドの盾', type: 'weapon', attackBonus: 0, defenseBonus: 128, hpBonus: 0, rarity: 'UR', image: 'SQ2-w020.png' },
    
    { id: 'W021', name: 'ブラッククリスタルの剣', type: 'weapon', attackBonus: 512, defenseBonus: 0, hpBonus: 0, rarity: 'LE', image: 'SQ2-w021.png' },
    { id: 'W022', name: 'ブラッククリスタルの斧', type: 'weapon', attackBonus: 256, defenseBonus: 256, hpBonus: 0, rarity: 'LE', image: 'SQ2-w022.png' },
    { id: 'W023', name: 'ブラッククリスタルの槍', type: 'weapon', attackBonus: 256, defenseBonus: 0, hpBonus: 256, rarity: 'LE', image: 'SQ2-w023.png' },
    { id: 'W024', name: 'ブラッククリスタルの盾', type: 'weapon', attackBonus: 0, defenseBonus: 512, hpBonus: 0, rarity: 'LE', image: 'SQ2-w024.png' },
    
    // 防具 (Armor)
    { id: 'A001', name: '木の鎧', type: 'armor', attackBonus: 0, defenseBonus: 1, hpBonus: 10, rarity: 'N', image: 'SQ2-a001.png' },
    { id: 'A002', name: '鉄の鎧', type: 'armor', attackBonus: 0, defenseBonus: 4, hpBonus: 40, rarity: 'R', image: 'SQ2-a002.png' },
    { id: 'A003', name: '金の鎧', type: 'armor', attackBonus: 0, defenseBonus: 16, hpBonus: 160, rarity: 'SR', image: 'SQ2-a003.png' },
    { id: 'A004', name: 'ダイヤモンドの鎧', type: 'armor', attackBonus: 0, defenseBonus: 64, hpBonus: 640, rarity: 'UR', image: 'SQ2-a004.png' },
    { id: 'A005', name: 'ブラッククリスタルの鎧', type: 'armor', attackBonus: 0, defenseBonus: 256, hpBonus: 2560, rarity: 'LE', image: 'SQ2-a005.png' },
    { id: 'A006', name: '布の鎧', type: 'armor', attackBonus: 0, defenseBonus: 0, hpBonus: 20, rarity: 'N', image: 'SQ2-a006.png' },
    { id: 'A007', name: '葉っぱの鎧', type: 'armor', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'SQ2-a007.png' },
    { id: 'A008', name: '火の鎧', type: 'armor', attackBonus: 2, defenseBonus: 4, hpBonus: 20, rarity: 'R', image: 'SQ2-a008.png' },
    { id: 'A009', name: '水の鎧', type: 'armor', attackBonus: 4, defenseBonus: 2, hpBonus: 20, rarity: 'R', image: 'SQ2-a009.png' },
    { id: 'A010', name: '風の鎧', type: 'armor', attackBonus: 4, defenseBonus: 4, hpBonus: 0, rarity: 'R', image: 'SQ2-a010.png' },
    { id: 'A011', name: '雷の鎧', type: 'armor', attackBonus: 2, defenseBonus: 4, hpBonus: 20, rarity: 'R', image: 'SQ2-a011.png' },
    { id: 'A012', name: '石の鎧', type: 'armor', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'SQ2-a012.png' },

    // ペット (Pet)
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.02, defensePercentBonus: 0.00, hpPercentBonus: 0.00, rarity: 'N', image: 'SQ2-p001.png' },
    { id: 'P002', name: 'リトルキャット', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.00, hpPercentBonus: 0.02, rarity: 'N', image: 'SQ2-p002.png' },
    { id: 'P003', name: 'リトルドッグ', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.02, hpPercentBonus: 0.00, rarity: 'N', image: 'SQ2-p003.png' },
    { id: 'P004', name: 'ヒヨコ', type: 'pet', attackPercentBonus: 0.01, defensePercentBonus: 0.00, hpPercentBonus: 0.01, rarity: 'N', image: 'SQ2-p004.png' },
    { id: 'P005', name: 'リトルラビット', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.01, hpPercentBonus: 0.01, rarity: 'N', image: 'SQ2-p005.png' },
    { id: 'P006', name: 'シープ', type: 'pet', attackPercentBonus: 0.01, defensePercentBonus: 0.01, hpPercentBonus: 0.00, rarity: 'N', image: 'SQ2-p006.png' },
    { id: 'P007', name: 'ホース', type: 'pet', attackPercentBonus: 0.01, defensePercentBonus: 0.00, hpPercentBonus: 0.01, rarity: 'N', image: 'SQ2-p007.png' },
    
    { id: 'P008', name: 'ひのせいれい', type: 'pet', attackPercentBonus: 0.04, defensePercentBonus: 0.04, hpPercentBonus: 0.00, rarity: 'R', image: 'SQ2-p008.png' },
    { id: 'P009', name: 'みずのせいれい', type: 'pet', attackPercentBonus: 0.04, defensePercentBonus: 0.00, hpPercentBonus: 0.04, rarity: 'R', image: 'SQ2-p009.png' },
    { id: 'P010', name: 'かぜのせいれい', type: 'pet', attackPercentBonus: 0.08, defensePercentBonus: 0.00, hpPercentBonus: 0.00, rarity: 'R', image: 'SQ2-p010.png' },
    { id: 'P011', name: 'つちのせいれい', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.00, hpPercentBonus: 0.08, rarity: 'R', image: 'SQ2-p011.png' },
    
    { id: 'P012', name: 'グリフォン', type: 'pet', attackPercentBonus: 0.15, defensePercentBonus: 0.07, hpPercentBonus: 0.10, rarity: 'SR', image: 'SQ2-p012.png' },
    { id: 'P013', name: 'キメラ', type: 'pet', attackPercentBonus: 0.11, defensePercentBonus: 0.10, hpPercentBonus: 0.11, rarity: 'SR', image: 'SQ2-p013.png' },
    { id: 'P014', name: 'リトルドラゴン', type: 'pet', attackPercentBonus: 0.10, defensePercentBonus: 0.15, hpPercentBonus: 0.07, rarity: 'SR', image: 'SQ2-p014.png' },
    
    { id: 'P015', name: 'ケルベロス', type: 'pet', attackPercentBonus: 0.64, defensePercentBonus: 0.32, hpPercentBonus: 0.32, rarity: 'UR', image: 'SQ2-p015.png' },
    { id: 'P016', name: 'ユニコーン', type: 'pet', attackPercentBonus: 0.32, defensePercentBonus: 0.32, hpPercentBonus: 0.64, rarity: 'UR', image: 'SQ2-p016.png' },
    
    { id: 'P017', name: 'フェニックス', type: 'pet', attackPercentBonus: 0.32, defensePercentBonus: 0.32, hpPercentBonus: 0.64, rarity: 'LE', image: 'SQ2-p017.png' },

    // 強化アイテム (Material)
    { id: 'M001', name: 'きょうかのかけら（小）', type: 'material', rarity: 'N', levelBonus: 1, image: 'SQ2-m001.png' },
    { id: 'M002', name: 'きょうかのかけら（中）', type: 'material', rarity: 'R', levelBonus: 2, image: 'SQ2-m002.png' },
    { id: 'M003', name: 'きょうかのかけら（大）', type: 'material', rarity: 'SR', levelBonus: 3, image: 'SQ2-m003.png' },
    { id: 'M004', name: 'きょうかのかたまり（小）', type: 'material', rarity: 'UR', levelBonus: 4, image: 'SQ2-m004.png' }
];

// --- 戦闘関連データ ---
let currentStage = 1;
let enemiesDefeatedInStage = 0;
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15;

// 敵データ
const enemies = {
    // ステージ1の雑魚敵リスト
    1: [
        // Category A (N:95%, R:5%)
        { id: 1, name: 'ゴブリン', hp: 10, attack: 10, defense: 0, category: 'A', attackCount: 1, isBoss: false, image: 'SQ2-e001.png' },
        { id: 2, name: 'オーク', hp: 20, attack: 15, defense: 0, category: 'A', attackCount: 1, isBoss: false, image: 'SQ2-e002.png' },
        { id: 3, name: 'スケルトン', hp: 30, attack: 20, defense: 0, category: 'A', attackCount: 1, isBoss: false, image: 'SQ2-e003.png' },
        { id: 4, name: 'まほうつかい', hp: 50, attack: 20, defense: 5, category: 'A', attackCount: 1, isBoss: false, image: 'SQ2-e004.png' },
        { id: 5, name: 'ゴースト', hp: 10, attack: 25, defense: 15, category: 'A', attackCount: 1, isBoss: false, image: 'SQ2-e005.png' },
        
        // Category B (N:50%, R:40%, SR:10%)
        { id: 6, name: 'きょじん', hp: 100, attack: 30, defense: 10, category: 'B', attackCount: 1, isBoss: false, image: 'SQ2-e006.png' },
        { id: 7, name: 'てつのかめん', hp: 30, attack: 13, defense: 10, category: 'B', attackCount: 1, isBoss: false, image: 'SQ2-e007.png' }
    ],
    // ステージ1のボス (Category C: R:90%, SR:10%)
    '1_boss': {
        id: 8, name: 'ドラゴン', hp: 500, attack: 100, defense: 20, category: 'C', attackCount: 2, isBoss: true, image: 'SQ2-e008.png'
    },
    // ステージ2以降のデータは省略...
};
let currentEnemies = []; // 🚨 複数敵対応のため、配列に変更


// --- データほぞん・よみこみ関数 ---
function saveData() {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('gachaLog', JSON.stringify(gachaLog));
    localStorage.setItem('currentStage', currentStage);
    localStorage.setItem('enemiesDefeatedInStage', enemiesDefeatedInStage);
    localStorage.setItem('currentEnemies', JSON.stringify(currentEnemies)); // 敵の状態を保存
    localStorage.setItem('lastPlayedDate', lastPlayedDate); // 最終プレイ日を保存
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
    // 🚨 敵の状態をロード
    const savedEnemies = localStorage.getItem('currentEnemies');
    if (savedEnemies) {
        currentEnemies = JSON.parse(savedEnemies);
    }
    
    // 🚨 最終プレイ日をロード
    const savedLastPlayedDate = localStorage.getItem('lastPlayedDate');
    if (savedLastPlayedDate) {
        lastPlayedDate = savedLastPlayedDate;
    }
    
    // 🚨 自動回復チェック
    handleAutoHeal();

    if (!gachaLog[today] || gachaLog[today].count === undefined || gachaLog[today].studyContent === undefined) {
        // gachaLogは毎日リセットする
        gachaLog[today] = { count: 0, studyContent: [] };
    }
    gachaLog[today].count = Number(gachaLog[today].count) || 0;
}

// 🚨 自動回復ロジック
function handleAutoHeal() {
    // 最終プレイ日と今日の日付が異なるかチェック
    if (lastPlayedDate !== today) {
        if (userData.hp < userData.maxHp || currentEnemies.length > 0) {
            userData.hp = userData.maxHp; // 全回復
            currentEnemies = []; // 戦闘リセット
            log('日付が変わったため、HPが全回復し、戦闘がリセットされました。');
        }
        // 最終プレイ日を更新
        lastPlayedDate = today;
    }
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

    const finalMaxHp = Math.round(BASE_STATS_HP + totalMaxHpBonus);
    const finalAttack = Math.round(userData.baseAttack + totalAttackBonus);
    const finalDefense = Math.round(userData.baseDefense + totalDefenseBonus);

    userData.attack = Math.round(finalAttack * (1 + totalAttackPercentBonus));
    userData.defense = Math.round(finalDefense * (1 + totalDefensePercentBonus));
    
    // HP計算時にmaxHpを更新
    const newMaxHp = Math.round(finalMaxHp * (1 + totalHpPercentBonus));
    
    // 現在のHP/MaxHP比率を維持してHPを更新
    if (userData.maxHp > 0) {
        const hpRatio = userData.hp / userData.maxHp;
        userData.hp = Math.min(Math.round(newMaxHp * hpRatio), newMaxHp);
    } else {
        userData.hp = newMaxHp;
    }
    userData.maxHp = newMaxHp;
    
}

// --- UI表示関連関数 ---

// ログ表示ヘルパー
function log(message, className = 'text-gray-700') {
    const battleLog = document.getElementById('battle-log');
    if (battleLog) {
        const newLog = document.createElement('p');
        newLog.className = `text-xs ${className}`;
        newLog.innerHTML = `[${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}] ${message}`;
        battleLog.prepend(newLog);

        // ログの最大表示数を制限
        while (battleLog.children.length > 50) {
            battleLog.removeChild(battleLog.lastChild);
        }
    }
}

// タブ切り替え
window.showTab = (button, tabId) => {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tabId).style.display = 'block';
    button.classList.add('active');
};

// 共通モーダル表示
window.showModal = (title, message) => {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-message').innerHTML = message;
    modal.classList.add('visible');
};

// 共通モーダル非表示
window.hideModal = () => {
    document.getElementById('custom-modal').classList.remove('visible');
};

// 強化モーダル非表示
window.hideEnhanceModal = () => {
    document.getElementById('enhance-modal').classList.remove('visible');
};


// --- ステータスUI更新関数 ---
function updateCharacterStatsUI() {
    calculateTotalStats();

    // HPバーの更新 (character-hp-bar-fill, character-hp-text)
    const hpPercent = (userData.hp / userData.maxHp) * 100;
    const hpBar = document.getElementById('character-hp-bar-fill');
    const hpText = document.getElementById('character-hp-text');

    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    if (hpText) hpText.textContent = `${Math.max(0, userData.hp)} / ${userData.maxHp}`; // HPが0未満にならないように調整

    // 攻撃力、防御力の数値更新 (character-attack, character-defense)
    const attackText = document.getElementById('character-attack');
    const defenseText = document.getElementById('character-defense');
    
    if (attackText) attackText.textContent = userData.attack;
    if (defenseText) defenseText.textContent = userData.defense;

    // たたかうタブのステータス更新
    const enemyTabHp = document.getElementById('enemy-tab-hp');
    const enemyTabAttack = document.getElementById('enemy-tab-attack');
    const stageCount = document.getElementById('current-stage');
    const defeatedCount = document.getElementById('enemies-defeated-count');

    if(enemyTabHp) enemyTabHp.textContent = `${Math.max(0, userData.hp)} / ${userData.maxHp}`;
    if(enemyTabAttack) enemyTabAttack.textContent = userData.attack;
    if(stageCount) stageCount.textContent = currentStage;
    if(defeatedCount) defeatedCount.textContent = `${enemiesDefeatedInStage} / ${ENEMY_DEFEAT_COUNT_TO_BOSS}`;

    // HPが0の場合、攻撃ボタンを無効化
    document.getElementById('attack-button').disabled = userData.hp <= 0 || currentEnemies.length === 0;
    document.getElementById('find-enemy-button').disabled = currentEnemies.length > 0;
}

// 🚨 敵のUI更新関数 (複数敵対応)
function updateEnemyUI() {
    const enemyArea = document.getElementById('enemy-area');
    const attackButton = document.getElementById('attack-button');
    const findButton = document.getElementById('find-enemy-button');

    if (!enemyArea) return;

    if (currentEnemies.length === 0) {
        enemyArea.innerHTML = `<p class="text-gray-500 mb-4 text-center">敵がいません。下の「敵を探す」ボタンを押して探索開始！</p>`;
        attackButton.disabled = true;
        findButton.disabled = userData.hp <= 0 ? true : false;
        return;
    }

    enemyArea.innerHTML = '';
    currentEnemies.forEach((enemy, index) => {
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;
        const isBossClass = enemy.isBoss ? 'border-red-500' : 'border-blue-500';
        const nameClass = enemy.isBoss ? 'font-extrabold text-red-700' : 'font-bold';

        enemyArea.innerHTML += `
            <div class="p-3 border rounded-lg bg-white mb-2 shadow-md w-full">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${enemy.image}" alt="${enemy.name}" class="w-12 h-12 mr-3 rounded-full ${isBossClass} border-2">
                        <div>
                            <h4 class="${nameClass} text-base">${enemy.name} ${enemy.isBoss ? '👑' : ''}</h4>
                            <p class="text-xs text-gray-600">攻撃: ${enemy.attack} / 防御: ${enemy.defense}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-semibold">HP: <span id="enemy-hp-text-${index}">${Math.max(0, enemy.hp)} / ${enemy.maxHp}</span></p>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div id="enemy-hp-bar-fill-${index}" class="bg-red-500 h-3 rounded-full transition-all duration-300" style="width: ${hpPercent}%"></div>
                </div>
            </div>
        `;
    });
    
    attackButton.disabled = userData.hp <= 0;
    findButton.disabled = true;
}


// --- インベントリUI更新関数 (省略) ---

function updateInventoryUI() {
    // 既存のインベントリUI更新ロジックを維持
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    // 装備スロットの初期化
    const weaponContainers = [
        document.getElementById('equipped-weapon-container-1'), 
        document.getElementById('equipped-weapon-container-2')
    ];
    const armorContainer = document.getElementById('equipped-armor-container-1');
    const petContainers = [
        document.getElementById('equipped-pet-container-1'),
        document.getElementById('equipped-pet-container-2'),
        document.getElementById('equipped-pet-container-3')
    ];

    // 初期化表示
    if (armorContainer) armorContainer.innerHTML = '<div class="text-gray-500 text-sm">なし</div>';
    weaponContainers.forEach((c, i) => { if (c) c.innerHTML = `<div class="text-gray-500 text-sm">スロット ${i+1}: なし</div>`; });
    petContainers.forEach((c, i) => { if (c) c.innerHTML = `<div class="text-gray-500 text-sm">スロット ${i+1}: なし</div>`; });


    let weaponSlotIndex = 0;
    let petSlotIndex = 0;

    userData.inventory.forEach((invItem, index) => {
        const itemData = items.find(i => i.id === invItem.id);
        if (!itemData || itemData.type === 'material') return; // 素材はリストに表示しない

        const level = invItem.level || 1;
        const enhancementLevel = level - 1;

        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 border-b';
        
        // レアリティカラー設定 (簡易版)
        let rarityColor = '';
        if (itemData.rarity === 'R') rarityColor = 'text-blue-500';
        else if (itemData.rarity === 'SR') rarityColor = 'text-purple-500';
        else if (itemData.rarity === 'UR') rarityColor = 'text-yellow-500';
        else if (itemData.rarity === 'LE') rarityColor = 'text-red-500';

        let itemHtml = `<div class="flex items-center">
            <img src="${itemData.image}" alt="${itemData.name}" class="w-10 h-10 mr-3 rounded-full">
            <div>
                <span class="font-bold ${rarityColor}">${itemData.name} +${enhancementLevel}</span>
                <span class="text-sm text-gray-500 block">(${itemData.type === 'pet' ? 'ペット' : itemData.type === 'weapon' ? '武器' : '防具'})</span>
            </div>
        </div>`;
        
        let buttonHtml = '<div>';
        if (itemData.type !== 'material') {
             const isEquipped = invItem.isEquipped;
             const equipText = itemData.type === 'pet' ? 'セット' : '装備';
             buttonHtml += `<button onclick="toggleEquipItem(${index})" class="text-xs p-1 rounded ${isEquipped ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} mr-2">
                 ${isEquipped ? '解除' : equipText}
             </button>`;
        }
        buttonHtml += `<button onclick="showEnhanceModal(${index})" class="text-xs p-1 rounded bg-yellow-500 text-white">
            強化
        </button></div>`;

        li.innerHTML = itemHtml + buttonHtml;
        inventoryList.appendChild(li);

        // 装備/ペットの表示を更新 (複数スロット対応)
        if (invItem.isEquipped) {
            const equippedHtml = `<div class="flex items-center">
                <img src="${itemData.image}" alt="${itemData.name}" class="w-12 h-12 mr-3 rounded-full border-2 border-yellow-400">
                <span class="font-bold ${rarityColor}">${itemData.name} +${enhancementLevel}</span>
            </div>`;
            
            if (itemData.type === 'pet' && petSlotIndex < petContainers.length) {
                if (petContainers[petSlotIndex]) {
                    petContainers[petSlotIndex].innerHTML = equippedHtml;
                    petSlotIndex++;
                }
            } else if (itemData.type === 'weapon' && weaponSlotIndex < weaponContainers.length) {
                 if (weaponContainers[weaponSlotIndex]) {
                     weaponContainers[weaponSlotIndex].innerHTML = equippedHtml;
                     weaponSlotIndex++;
                 }
            } else if (itemData.type === 'armor' && armorContainer) {
                 // 防具は一つだけなので、index 0を使用
                 armorContainer.innerHTML = equippedHtml;
            }
        }
    });
    
    // 素材リストの更新
    updateMaterialInventoryUI();
}

function updateMaterialInventoryUI() {
    // 既存の素材UI更新ロジックを維持
    const materialList = document.getElementById('material-list');
    if (!materialList) return;
    materialList.innerHTML = '';
    
    // 素材アイテムをカウント
    const materialCounts = {};
    userData.inventory.filter(item => {
        const itemData = items.find(i => i.id === item.id);
        return itemData && itemData.type === 'material';
    }).forEach(item => {
        materialCounts[item.id] = (materialCounts[item.id] || 0) + 1;
    });

    Object.keys(REINFORCEMENT_ITEMS_BY_RARITY).reverse().forEach(rarity => {
        const matData = REINFORCEMENT_ITEMS_BY_RARITY[rarity];
        const count = materialCounts[matData.itemId] || 0;
        
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 border-b text-sm';
        
        // レアリティカラー設定 (簡易版)
        let rarityColor = '';
        if (rarity === 'R') rarityColor = 'text-blue-500';
        else if (rarity === 'SR') rarityColor = 'text-purple-500';
        else if (rarity === 'UR') rarityColor = 'text-yellow-500';
        
        li.innerHTML = `
            <span class="${rarityColor} font-bold">${matData.name}</span>
            <span>所持数: ${count}</span>
        `;
        materialList.appendChild(li);
    });
}

// --- その他のUI・装備・ガチャロジック (省略) ---

// 装備・解除機能 (維持)
window.toggleEquipItem = (itemIndex) => {
    const targetItem = userData.inventory[itemIndex];
    if (!targetItem) return;

    const itemData = items.find(i => i.id === targetItem.id);
    if (!itemData || itemData.type === 'material') return;

    const type = itemData.type;
    const maxEquip = type === 'weapon' ? 2 : type === 'pet' ? 3 : 1; // 武器:2, ペット:3, 防具:1

    if (targetItem.isEquipped) {
        // 解除
        targetItem.isEquipped = false;
    } else {
        // 装備
        // 現在装備中の同種アイテム数をカウント
        const equippedItems = userData.inventory.filter(invItem => {
            const currentItemData = items.find(i => i.id === invItem.id);
            return currentItemData && currentItemData.type === type && invItem.isEquipped;
        });

        if (equippedItems.length >= maxEquip) {
            // 上限に達している場合、最も古い（または最初の）装備品を自動で解除する
            if (maxEquip > 0) {
                 const firstEquippedIndex = userData.inventory.findIndex(invItem => {
                     const currentItemData = items.find(i => i.id === invItem.id);
                     return currentItemData && currentItemData.type === type && invItem.isEquipped;
                 });
                 if (firstEquippedIndex !== -1) {
                     userData.inventory[firstEquippedIndex].isEquipped = false;
                 }
            } else {
                 showModal('装備エラー', `${itemData.name} (${type === 'weapon' ? '武器' : type === 'pet' ? 'ペット' : '防具'})は装備できません。`);
                 return;
            }
        }
        
        // 新しいアイテムを装備
        targetItem.isEquipped = true;
    }
    updateUI();
};


// 強化モーダル表示（維持）
window.showEnhanceModal = (itemIndex) => {
    const targetItem = userData.inventory[itemIndex];
    if (!targetItem) return;

    const itemData = items.find(i => i.id === targetItem.id);
    if (!itemData) return;

    const modal = document.getElementById('enhance-modal');
    const modalTargetItem = document.getElementById('enhance-modal-target-item');
    const materialOptions = document.getElementById('enhance-material-options');

    // ターゲットアイテムの表示
    const level = targetItem.level || 1;
    let rarityColor = '';
    if (itemData.rarity === 'R') rarityColor = 'text-blue-500';
    else if (itemData.rarity === 'SR') rarityColor = 'text-purple-500';
    else if (itemData.rarity === 'UR') rarityColor = 'text-yellow-500';
    else if (itemData.rarity === 'LE') rarityColor = 'text-red-500';
    
    modalTargetItem.innerHTML = `<span class="${rarityColor} font-bold">${itemData.name}</span> 現在のレベル: ${level}`;

    // 素材オプションの表示
    materialOptions.innerHTML = '';
    const materialCounts = {};
    userData.inventory.filter(item => {
        const matData = items.find(i => i.id === item.id);
        return matData && matData.type === 'material';
    }).forEach(item => {
        materialCounts[item.id] = (materialCounts[item.id] || 0) + 1;
    });

    Object.keys(REINFORCEMENT_ITEMS_BY_RARITY).forEach(rarity => {
        const mat = REINFORCEMENT_ITEMS_BY_RARITY[rarity];
        const count = materialCounts[mat.itemId] || 0;
        
        if (count > 0) {
             const button = document.createElement('button');
             button.className = 'w-full p-2 mb-2 rounded bg-yellow-600 text-white disabled:bg-gray-400';
             button.textContent = `${mat.name} (+${mat.levelBonus}Lv) 所持: ${count}`;
             
             // 強化実行関数にアイテムインデックスと素材IDを渡す
             button.onclick = () => enhanceItem(itemIndex, mat.itemId);
             
             materialOptions.appendChild(button);
        }
    });

    if (materialOptions.innerHTML === '') {
        materialOptions.innerHTML = '<p class="text-center text-gray-500">強化素材がありません。</p>';
    }

    // モーダル表示
    modal.classList.add('visible');
};


window.enhanceItem = (itemIndex, materialId) => {
    const targetItem = userData.inventory[itemIndex];
    if (!targetItem) return;

    // 1. 素材がインベントリにあるか確認し、インデックスを取得
    const materialIndex = userData.inventory.findIndex(invItem => invItem.id === materialId);
    if (materialIndex === -1) {
        showModal('エラー', '指定された強化素材が見つかりません。');
        return;
    }
    
    // 2. 素材のレベルボーナスを取得
    const materialData = items.find(i => i.id === materialId);
    if (!materialData || materialData.type !== 'material') return;

    const levelBonus = materialData.levelBonus || 0;
    
    // 3. ターゲットアイテムのレベルを上げる
    targetItem.level = (targetItem.level || 1) + levelBonus;

    // 4. 素材をインベントリから削除（消費）
    userData.inventory.splice(materialIndex, 1);
    
    // 5. UIを更新
    showModal('強化完了！', `${items.find(i => i.id === targetItem.id).name} が **+${levelBonus}レベル** アップした！<br>現在のレベル: ${targetItem.level}`);
    
    window.hideEnhanceModal();
    updateUI();
};

// ガチャロジック (維持)
function drawRarity(type) {
    const rarityGroups = GACHA_RARITY_GROUPS[type];
    if (!rarityGroups) return 'N'; 

    const totalWeight = Object.values(rarityGroups).reduce((sum, weight) => sum + weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const rarity in rarityGroups) {
        randomNum -= rarityGroups[rarity];
        if (randomNum <= 0) {
            return rarity;
        }
    }
    return 'N'; 
}

function getRandomItem(type) {
    const drawnRarity = drawRarity(type);

    const availableItems = items.filter(item => 
        item.type === type && item.rarity === drawnRarity
    );

    if (availableItems.length === 0) {
        return items.find(item => item.type === type) || null;
    }

    const randomIndex = Math.floor(Math.random() * availableItems.length);
    return availableItems[randomIndex];
}

window.rollGacha = (type) => {
    if ((gachaLog[today]?.count || 0) <= 0) {
        showModal('エラー', 'ガチャ回数が足りません。勉強スタンプを押して回数を増やしましょう！');
        return;
    }
    
    const resultItemData = getRandomItem(type);
    
    if (!resultItemData) {
        showModal('エラー', 'アイテムが見つかりませんでした。');
        return;
    }
    
    // ガチャ回数を1回消費
    gachaLog[today].count -= 1;

    // インベントリをチェックし、同一IDのアイテムがあればレベルアップ
    let isDuplicate = false;
    let enhancedItem = null;

    const existingItemIndex = userData.inventory.findIndex(invItem => invItem.id === resultItemData.id);

    if (existingItemIndex !== -1) {
        enhancedItem = userData.inventory[existingItemIndex];
        enhancedItem.level = (enhancedItem.level || 1) + 1;
        isDuplicate = true;
    } else {
        const newItem = {
            id: resultItemData.id,
            level: 1, 
            isEquipped: false
        };
        userData.inventory.push(newItem);
        enhancedItem = newItem;
    }

    // レアリティカラー設定 (モーダル用)
    let rarityColorClass = '';
    if (resultItemData.rarity === 'R') rarityColorClass = 'text-blue-500';
    else if (resultItemData.rarity === 'SR') rarityColorClass = 'text-purple-500';
    else if (resultItemData.rarity === 'UR') rarityColorClass = 'text-yellow-500';
    else if (resultItemData.rarity === 'LE') rarityColorClass = 'text-red-500';
    
    let modalMessage = '';
    if (isDuplicate) {
        modalMessage = `<div class="text-center">
            <img src="${resultItemData.image}" alt="${resultItemData.name}" class="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-dashed ${rarityColorClass.replace('text', 'border')}">
            <p class="font-bold text-lg">✨ レベルアップ！ ✨</p>
            <p class="text-xl ${rarityColorClass}">${resultItemData.name}</p>
            <p class="mt-2 text-sm text-gray-700">現在のレベル: **+${enhancedItem.level - 1}** が **+${enhancedItem.level}** に！</p>
        </div>`;
    } else {
        modalMessage = `<div class="text-center">
            <img src="${resultItemData.image}" alt="${resultItemData.name}" class="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-dashed ${rarityColorClass.replace('text', 'border')}">
            <p class="font-bold text-lg">🎉 ${resultItemData.rarity} ゲット！ 🎉</p>
            <p class="text-xl ${rarityColorClass}">${resultItemData.name}</p>
        </div>`;
    }

    // 結果モーダルを表示
    showModal('ガチャ結果！', modalMessage);

    updateUI();
};


// 🚨 敵を探すロジック
window.findEnemy = () => {
    if (userData.hp <= 0) {
        log('HPが0のため、戦闘を開始できません。日付が変わるのを待ちましょう。', 'text-red-600 font-bold');
        return;
    }

    // 既に戦闘中の場合は何もしない
    if (currentEnemies.length > 0) {
        log('既に敵と遭遇しています。', 'text-yellow-600');
        return;
    }
    
    const stageEnemies = enemies[currentStage];
    if (!stageEnemies && enemiesDefeatedInStage < ENEMY_DEFEAT_COUNT_TO_BOSS) {
        log(`ステージ${currentStage}の雑魚敵データが見つかりません。`, 'text-red-600');
        return;
    }

    currentEnemies = [];
    const stageMultiplier = Math.pow(1.5, currentStage - 1); // ステージ補正

    if (enemiesDefeatedInStage >= ENEMY_DEFEAT_COUNT_TO_BOSS) {
        // ボス出現
        const bossData = enemies[`${currentStage}_boss`];
        if (!bossData) {
            log(`ステージ${currentStage}のボスデータが見つかりません。ステージ進行を中止します。`, 'text-red-600');
            return;
        }

        // ボスのステータスをステージ補正
        const boss = {
            id: `boss-${currentStage}`,
            name: bossData.name,
            image: bossData.image,
            maxHp: Math.round(bossData.hp * stageMultiplier),
            hp: Math.round(bossData.hp * stageMultiplier),
            attack: Math.round(bossData.attack * stageMultiplier),
            defense: Math.round(bossData.defense * stageMultiplier),
            category: bossData.category,
            attackCount: bossData.attackCount,
            isBoss: true,
            stage: currentStage
        };
        currentEnemies.push(boss);
        log(`🚨 **ステージ${currentStage}のボス、${boss.name}が出現！**`, 'text-red-700 font-bold');

    } else {
        // 雑魚敵出現
        const enemyCount = Math.floor(Math.random() * MAX_ENEMIES_PER_BATTLE) + 1; // 1体から最大3体
        let names = [];

        for (let i = 0; i < enemyCount; i++) {
            const randomIndex = Math.floor(Math.random() * stageEnemies.length);
            const selectedEnemyData = stageEnemies[randomIndex];

            // 敵のステータスをステージ補正
            const newEnemy = {
                id: `${selectedEnemyData.id}-${Date.now()}-${i}`, // ユニークID
                name: selectedEnemyData.name,
                image: selectedEnemyData.image,
                maxHp: Math.round(selectedEnemyData.hp * stageMultiplier),
                hp: Math.round(selectedEnemyData.hp * stageMultiplier),
                attack: Math.round(selectedEnemyData.attack * stageMultiplier),
                defense: Math.round(selectedEnemyData.defense * stageMultiplier),
                category: selectedEnemyData.category,
                attackCount: selectedEnemyData.attackCount,
                isBoss: false,
                stage: currentStage
            };
            currentEnemies.push(newEnemy);
            names.push(newEnemy.name);
        }
        log(`⚔️ ${names.join('と')} (${enemyCount}体) が出現した！`, 'text-blue-600 font-bold');
    }

    updateUI();
};


// 🚨 敵を攻撃するロジック (ターン制バトル)
window.attackEnemy = () => {
    if (currentEnemies.length === 0 || userData.hp <= 0) {
        document.getElementById('attack-button').disabled = true;
        log('戦闘が終了しているか、HPがありません。', 'text-red-500');
        return;
    }
    
    // --- 1. プレイヤーの攻撃 ---
    // HPが最も低い敵をターゲットにする
    const targetEnemy = currentEnemies.reduce((prev, current) => (prev.hp < current.hp ? prev : current));

    const playerDamage = Math.max(1, userData.attack - targetEnemy.defense);
    targetEnemy.hp = Math.max(0, targetEnemy.hp - playerDamage);
    log(`**あなた**の攻撃！ ${targetEnemy.name}に **${playerDamage}** のダメージ！`, 'text-blue-700');
    
    let enemiesKilled = [];

    if (targetEnemy.hp <= 0) {
        // 撃破処理（ドロップ、討伐数カウント）
        const defeatLog = handleDefeat(targetEnemy);
        log(defeatLog.message, defeatLog.class);
        enemiesKilled.push(targetEnemy.id);
    }
    
    // 撃破された敵をリストから除去
    currentEnemies = currentEnemies.filter(e => !enemiesKilled.includes(e.id));
    
    // --- 2. 敵の反撃 ---
    if (currentEnemies.length > 0 && userData.hp > 0) {
        currentEnemies.forEach(enemy => {
            for (let i = 0; i < enemy.attackCount; i++) {
                if (userData.hp <= 0) break; // 既に敗北していたら中断
                
                const enemyDamage = Math.max(1, enemy.attack - userData.defense);
                userData.hp = Math.max(0, userData.hp - enemyDamage);
                log(`${enemy.name}の反撃${enemy.attackCount > 1 ? `(${i+1}/${enemy.attackCount})` : ''}！ あなたは **${enemyDamage}** のダメージを受けた。`, 'text-red-600');
            }
        });
    }

    // --- 3. 勝敗判定と更新 ---
    if (userData.hp <= 0) {
        // プレイヤー敗北
        userData.hp = 0;
        currentEnemies = []; // 戦闘終了
        log('💀 **敗北...** あなたは力尽きた。HPは明日回復します。', 'text-red-800 font-bold');
    } else if (currentEnemies.length === 0) {
        // プレイヤー勝利 (残りの敵も倒した場合)
        log('🎉 **戦闘に勝利した！**', 'text-yellow-600 font-bold');
    }

    updateUI(); // UIを更新して、敵のHP、プレイヤーのHP、ボタンの状態を反映
};

/**
 * 敵を倒したときの処理（報酬ドロップ、ステージ進行）
 * @param {object} defeatedEnemy - 倒した敵のデータ
 * @returns {object} ログメッセージとクラス
 */
function handleDefeat(defeatedEnemy) {
    let logMessage = `🎯 **${defeatedEnemy.name}**を撃破した！`;
    let logClass = 'text-green-600 font-bold';
    
    // 敵に応じたドロップ抽選
    const dropResult = rollDrop(defeatedEnemy.category);
    if (dropResult) {
        // 強化素材をインベントリに追加（個数としてカウント）
        const existingMaterialIndex = userData.inventory.findIndex(item => item.id === dropResult.itemId);
        if (existingMaterialIndex !== -1) {
            // 素材は1個ずつインベントリに追加されているため、spliceして新しいアイテムとして追加する
            // 🚨 ここでは簡単化のため、同じitemIdのアイテムをすべて個数としてカウントするロジックに変更
            // インベントリの各アイテムを単体として扱う構造のため、素材は単純に追加
            userData.inventory.push({ id: dropResult.itemId, level: 1, isEquipped: false });
        } else {
            userData.inventory.push({ id: dropResult.itemId, level: 1, isEquipped: false });
        }
        
        logMessage += `<br>✨ **報酬ゲット！** ${dropResult.name}をドロップした！`;
    }

    if (defeatedEnemy.isBoss) {
        // ボス撃破時
        currentStage++;
        enemiesDefeatedInStage = 0;
        logMessage += `<br>🏆 **ステージ${defeatedEnemy.stage}をクリア！** 次のステージへ進みます。`;
        logClass = 'text-purple-600 font-extrabold';
    } else {
        // 雑魚敵撃破時
        enemiesDefeatedInStage++;
        if (enemiesDefeatedInStage === ENEMY_DEFEAT_COUNT_TO_BOSS) {
            logMessage += `<br>ボスが出現する準備が整いました！`;
        }
    }
    
    return { message: logMessage, class: logClass };
}

/** 敵のカテゴリーに基づくドロップ抽選 */
function rollDrop(category) {
    const dropRates = ENEMY_DROP_GROUPS[category];
    if (!dropRates) return null;

    const totalWeight = Object.values(dropRates).reduce((sum, weight) => sum + weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const rarity in dropRates) {
        randomNum -= dropRates[rarity];
        if (randomNum <= 0) {
            return REINFORCEMENT_ITEMS_BY_RARITY[rarity];
        }
    }
    return null;
}

// --- 初期化処理 ---
function updateUI() {
    updateCharacterStatsUI();
    updateInventoryUI();
    updateEnemyUI(); 
    saveData();
}

// 初期ロード時にUIを更新
window.onload = () => {
    loadData();
    // ページロード時のタブ表示を「たたかう」にする
    const battleButton = document.querySelector('.tab-button[onclick*="battle"]');
    if(battleButton) {
        window.showTab(battleButton, 'battle');
    }
    updateUI();
};
