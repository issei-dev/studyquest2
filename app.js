// --------------------------------------------------------------------------
// 🌟 Ver0.30: 全てのアイテム/ペット/敵データと機能修正を反映 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const BASE_STATS_HP = 100;
const BASE_STATS_ATTACK = 10;
const BASE_STATS_DEFENSE = 5;
const ENHANCEMENT_RATE = 1.2;
const PET_GROWTH_RATE = 0.001;

// 🚨 新規追加: ガチャのレアリティ抽選確率を定義（合計100%になるように調整）
const GACHA_RARITY_GROUPS = {
    'weapon': { 'N': 50, 'R': 30, 'SR': 15, 'UR': 4, 'LE': 1 },
    'pet': { 'N': 40, 'R': 35, 'SR': 20, 'UR': 4, 'LE': 1 },
    'armor': { 'N': 50, 'R': 30, 'SR': 15, 'UR': 4, 'LE': 1 }
};

// 🚨 新規追加: 敵のカテゴリー別ドロップ率と強化アイテムの対応
const ENEMY_DROP_GROUPS = {
    'A': { 'N': 95, 'R': 5, 'SR': 0, 'UR': 0 }, // N:95%, R:5%
    'B': { 'N': 50, 'R': 40, 'SR': 10, 'UR': 0 }, // N:50%, R:40%, SR:10%
    'C': { 'N': 0, 'R': 90, 'SR': 10, 'UR': 0 }  // R:90%, SR:10%
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

// --- アイテムデータ ---
const items = [
    // 武器 (Weapon)
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 2, defenseBonus: 0, hpBonus: 0, rarity: 'N', image: 'https://placehold.co/80x80/a0522d/ffffff?text=木剣' },
    { id: 'W002', name: '木の斧', type: 'weapon', attackBonus: 1, defenseBonus: 1, hpBonus: 0, rarity: 'N', image: 'https://placehold.co/80x80/a0522d/ffffff?text=木斧' },
    { id: 'W003', name: '木の杖', type: 'weapon', attackBonus: 1, defenseBonus: 0, hpBonus: 1, rarity: 'N', image: 'https://placehold.co/80x80/a0522d/ffffff?text=木杖' },
    { id: 'W004', name: '木の盾', type: 'weapon', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'https://placehold.co/80x80/a0522d/ffffff?text=木盾' },
    { id: 'W005', name: '石の剣', type: 'weapon', attackBonus: 1, defenseBonus: 0, hpBonus: 1, rarity: 'N', image: 'https://placehold.co/80x80/7e7e7e/ffffff?text=石剣' },
    { id: 'W006', name: '石の斧', type: 'weapon', attackBonus: 0, defenseBonus: 1, hpBonus: 1, rarity: 'N', image: 'https://placehold.co/80x80/7e7e7e/ffffff?text=石斧' },
    { id: 'W007', name: '石の槍', type: 'weapon', attackBonus: 0, defenseBonus: 0, hpBonus: 2, rarity: 'N', image: 'https://placehold.co/80x80/7e7e7e/ffffff?text=石槍' },
    { id: 'W008', name: '石の盾', type: 'weapon', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'https://placehold.co/80x80/7e7e7e/ffffff?text=石盾' },
    
    { id: 'W009', name: '鉄の剣', type: 'weapon', attackBonus: 8, defenseBonus: 0, hpBonus: 0, rarity: 'R', image: 'https://placehold.co/80x80/808080/ffffff?text=鉄剣' },
    { id: 'W010', name: '鉄の斧', type: 'weapon', attackBonus: 4, defenseBonus: 4, hpBonus: 0, rarity: 'R', image: 'https://placehold.co/80x80/808080/ffffff?text=鉄斧' },
    { id: 'W011', name: '鉄の槍', type: 'weapon', attackBonus: 4, defenseBonus: 0, hpBonus: 4, rarity: 'R', image: 'https://placehold.co/80x80/808080/ffffff?text=鉄槍' },
    { id: 'W012', name: '鉄の盾', type: 'weapon', attackBonus: 0, defenseBonus: 8, hpBonus: 0, rarity: 'R', image: 'https://placehold.co/80x80/808080/ffffff?text=鉄盾' },
    { id: 'W013', name: '金の剣', type: 'weapon', attackBonus: 32, defenseBonus: 0, hpBonus: 0, rarity: 'SR', image: 'https://placehold.co/80x80/FFD700/000000?text=金剣' },
    { id: 'W014', name: '金の斧', type: 'weapon', attackBonus: 16, defenseBonus: 16, hpBonus: 0, rarity: 'SR', image: 'https://placehold.co/80x80/FFD700/000000?text=金斧' },
    { id: 'W015', name: '金の槍', type: 'weapon', attackBonus: 16, defenseBonus: 0, hpBonus: 16, rarity: 'SR', image: 'https://placehold.co/80x80/FFD700/000000?text=金槍' },
    { id: 'W016', name: '金の盾', type: 'weapon', attackBonus: 0, defenseBonus: 32, hpBonus: 0, rarity: 'SR', image: 'https://placehold.co/80x80/FFD700/000000?text=金盾' },
    
    { id: 'W017', name: 'ダイヤモンドの剣', type: 'weapon', attackBonus: 128, defenseBonus: 0, hpBonus: 0, rarity: 'UR', image: 'https://placehold.co/80x80/B9F2FF/000000?text=💎剣' },
    { id: 'W018', name: 'ダイヤモンドの斧', type: 'weapon', attackBonus: 64, defenseBonus: 64, hpBonus: 0, rarity: 'UR', image: 'https://placehold.co/80x80/B9F2FF/000000?text=💎斧' },
    { id: 'W019', name: 'ダイヤモンドの槍', type: 'weapon', attackBonus: 64, defenseBonus: 0, hpBonus: 64, rarity: 'UR', image: 'https://placehold.co/80x80/B9F2FF/000000?text=💎槍' },
    { id: 'W020', name: 'ダイヤモンドの盾', type: 'weapon', attackBonus: 0, defenseBonus: 128, hpBonus: 0, rarity: 'UR', image: 'https://placehold.co/80x80/B9F2FF/000000?text=💎盾' },
    
    { id: 'W021', name: 'ブラッククリスタルの剣', type: 'weapon', attackBonus: 512, defenseBonus: 0, hpBonus: 0, rarity: 'LE', image: 'https://placehold.co/80x80/333333/ffffff?text=BC剣' },
    { id: 'W022', name: 'ブラッククリスタルの斧', type: 'weapon', attackBonus: 256, defenseBonus: 256, hpBonus: 0, rarity: 'LE', image: 'https://placehold.co/80x80/333333/ffffff?text=BC斧' },
    { id: 'W023', name: 'ブラッククリスタルの槍', type: 'weapon', attackBonus: 256, defenseBonus: 0, hpBonus: 256, rarity: 'LE', image: 'https://placehold.co/80x80/333333/ffffff?text=BC槍' },
    { id: 'W024', name: 'ブラッククリスタルの盾', type: 'weapon', attackBonus: 0, defenseBonus: 512, hpBonus: 0, rarity: 'LE', image: 'https://placehold.co/80x80/333333/ffffff?text=BC盾' },
    
    // 防具 (Armor)
    { id: 'A001', name: '木の鎧', type: 'armor', attackBonus: 0, defenseBonus: 1, hpBonus: 10, rarity: 'N', image: 'https://placehold.co/80x80/a0522d/ffffff?text=木鎧' },
    { id: 'A002', name: '鉄の鎧', type: 'armor', attackBonus: 0, defenseBonus: 4, hpBonus: 40, rarity: 'R', image: 'https://placehold.co/80x80/808080/ffffff?text=鉄鎧' },
    { id: 'A003', name: '金の鎧', type: 'armor', attackBonus: 0, defenseBonus: 16, hpBonus: 160, rarity: 'SR', image: 'https://placehold.co/80x80/FFD700/000000?text=金鎧' },
    { id: 'A004', name: 'ダイヤモンドの鎧', type: 'armor', attackBonus: 0, defenseBonus: 64, hpBonus: 640, rarity: 'UR', image: 'https://placehold.co/80x80/B9F2FF/000000?text=💎鎧' },
    { id: 'A005', name: 'ブラッククリスタルの鎧', type: 'armor', attackBonus: 0, defenseBonus: 256, hpBonus: 2560, rarity: 'LE', image: 'https://placehold.co/80x80/333333/ffffff?text=BC鎧' },
    { id: 'A006', name: '布の鎧', type: 'armor', attackBonus: 0, defenseBonus: 0, hpBonus: 20, rarity: 'N', image: 'https://placehold.co/80x80/d2b48c/ffffff?text=布鎧' },
    { id: 'A007', name: '葉っぱの鎧', type: 'armor', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'https://placehold.co/80x80/556B2F/ffffff?text=葉鎧' },
    { id: 'A008', name: '火の鎧', type: 'armor', attackBonus: 2, defenseBonus: 4, hpBonus: 20, rarity: 'R', image: 'https://placehold.co/80x80/FF4500/ffffff?text=火鎧' },
    { id: 'A009', name: '水の鎧', type: 'armor', attackBonus: 4, defenseBonus: 2, hpBonus: 20, rarity: 'R', image: 'https://placehold.co/80x80/4682B4/ffffff?text=水鎧' },
    { id: 'A010', name: '風の鎧', type: 'armor', attackBonus: 4, defenseBonus: 4, hpBonus: 0, rarity: 'R', image: 'https://placehold.co/80x80/90EE90/000000?text=風鎧' },
    { id: 'A011', name: '雷の鎧', type: 'armor', attackBonus: 2, defenseBonus: 4, hpBonus: 20, rarity: 'R', image: 'https://placehold.co/80x80/DAA520/000000?text=雷鎧' },
    { id: 'A012', name: '石の鎧', type: 'armor', attackBonus: 0, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'https://placehold.co/80x80/7e7e7e/ffffff?text=石鎧' },

    // ペット (Pet - Percent Bonusとして設定)
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.02, defensePercentBonus: 0.00, hpPercentBonus: 0.00, rarity: 'N', image: 'https://placehold.co/80x80/87ceeb/ffffff?text=スライム' }, 
    { id: 'P002', name: 'リトルキャット', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.00, hpPercentBonus: 0.02, rarity: 'N', image: 'https://placehold.co/80x80/E9967A/ffffff?text=🐈' },
    { id: 'P003', name: 'リトルドッグ', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.02, hpPercentBonus: 0.00, rarity: 'N', image: 'https://placehold.co/80x80/DEB887/ffffff?text=🐕' },
    { id: 'P004', name: 'ヒヨコ', type: 'pet', attackPercentBonus: 0.01, defensePercentBonus: 0.00, hpPercentBonus: 0.01, rarity: 'N', image: 'https://placehold.co/80x80/FFD700/000000?text=🐣' },
    { id: 'P005', name: 'リトルラビット', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.01, hpPercentBonus: 0.01, rarity: 'N', image: 'https://placehold.co/80x80/F08080/ffffff?text=🐇' },
    { id: 'P006', name: 'シープ', type: 'pet', attackPercentBonus: 0.01, defensePercentBonus: 0.01, hpPercentBonus: 0.00, rarity: 'N', image: 'https://placehold.co/80x80/F5F5DC/000000?text=🐑' },
    { id: 'P007', name: 'ホース', type: 'pet', attackPercentBonus: 0.01, defensePercentBonus: 0.00, hpPercentBonus: 0.01, rarity: 'N', image: 'https://placehold.co/80x80/A0522D/ffffff?text=🐴' },
    
    { id: 'P008', name: 'ひのせいれい', type: 'pet', attackPercentBonus: 0.04, defensePercentBonus: 0.04, hpPercentBonus: 0.00, rarity: 'R', image: 'https://placehold.co/80x80/FF4500/ffffff?text=🔥精' },
    { id: 'P009', name: 'みずのせいれい', type: 'pet', attackPercentBonus: 0.04, defensePercentBonus: 0.00, hpPercentBonus: 0.04, rarity: 'R', image: 'https://placehold.co/80x80/4682B4/ffffff?text=💧精' },
    { id: 'P010', name: 'かぜのせいれい', type: 'pet', attackPercentBonus: 0.08, defensePercentBonus: 0.00, hpPercentBonus: 0.00, rarity: 'R', image: 'https://placehold.co/80x80/90EE90/000000?text=🍃精' },
    { id: 'P011', name: 'つちのせいれい', type: 'pet', attackPercentBonus: 0.00, defensePercentBonus: 0.00, hpPercentBonus: 0.08, rarity: 'R', image: 'https://placehold.co/80x80/8B4513/ffffff?text=⛰️精' },
    
    { id: 'P012', name: 'グリフォン', type: 'pet', attackPercentBonus: 0.15, defensePercentBonus: 0.07, hpPercentBonus: 0.10, rarity: 'SR', image: 'https://placehold.co/80x80/FFB6C1/000000?text=グリ' },
    { id: 'P013', name: 'キメラ', type: 'pet', attackPercentBonus: 0.11, defensePercentBonus: 0.10, hpPercentBonus: 0.11, rarity: 'SR', image: 'https://placehold.co/80x80/DAA520/000000?text=キメ' },
    { id: 'P014', name: 'リトルドラゴン', type: 'pet', attackPercentBonus: 0.10, defensePercentBonus: 0.15, hpPercentBonus: 0.07, rarity: 'SR', image: 'https://placehold.co/80x80/ff4500/ffffff?text=幼竜' },
    
    { id: 'P015', name: 'ケルベロス', type: 'pet', attackPercentBonus: 0.64, defensePercentBonus: 0.32, hpPercentBonus: 0.32, rarity: 'UR', image: 'https://placehold.co/80x80/404040/ffffff?text=🐕🐕🐕' },
    { id: 'P016', name: 'ユニコーン', type: 'pet', attackPercentBonus: 0.32, defensePercentBonus: 0.32, hpPercentBonus: 0.64, rarity: 'UR', image: 'https://placehold.co/80x80/ADD8E6/000000?text=🦄' },
    
    { id: 'P017', name: 'フェニックス', type: 'pet', attackPercentBonus: 0.32, defensePercentBonus: 0.32, hpPercentBonus: 0.64, rarity: 'LE', image: 'https://placehold.co/80x80/FF6347/ffffff?text=不死鳥' }, 

    // 強化アイテム (Material)
    { id: 'M001', name: 'きょうかのかけら（小）', type: 'material', rarity: 'N', levelBonus: 1, image: 'https://placehold.co/80x80/CD853F/ffffff?text=小破片' },
    { id: 'M002', name: 'きょうかのかけら（中）', type: 'material', rarity: 'R', levelBonus: 2, image: 'https://placehold.co/80x80/A0522D/ffffff?text=中破片' },
    { id: 'M003', name: 'きょうかのかけら（大）', type: 'material', rarity: 'SR', levelBonus: 3, image: 'https://placehold.co/80x80/8B4513/ffffff?text=大破片' },
    { id: 'M004', name: 'きょうかのかたまり（小）', type: 'material', rarity: 'UR', levelBonus: 4, image: 'https://placehold.co/80x80/5C4033/ffffff?text=小塊' }
];

// --- 戦闘関連データ ---
let currentStage = 1;
let enemiesDefeatedInStage = 0; 
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; 

// 🚨 修正: 敵データ (ステージ1に統合。グループは廃止し、ドロップ判定用のCategoryは維持)
const enemies = {
    // ステージ1の雑魚敵リスト
    1: [ 
        // Category A (N:95%, R:5%)
        { id: 1, name: 'ゴブリン', hp: 10, attack: 10, defense: 0, category: 'A', attackCount: 1, isBoss: false, image: 'ゴブリン' }, 
        { id: 2, name: 'オーク', hp: 20, attack: 15, defense: 0, category: 'A', attackCount: 1, isBoss: false, image: 'オーク' },
        { id: 3, name: 'スケルトン', hp: 30, attack: 20, defense: 0, category: 'A', attackCount: 1, isBoss: false, image: 'スケルトン' },
        { id: 4, name: 'まほうつかい', hp: 50, attack: 20, defense: 5, category: 'A', attackCount: 1, isBoss: false, image: 'まほうつかい' },
        { id: 5, name: 'ゴースト', hp: 10, attack: 25, defense: 15, category: 'A', attackCount: 1, isBoss: false, image: 'ゴースト' },
        
        // Category B (N:50%, R:40%, SR:10%)
        { id: 6, name: 'きょじん', hp: 100, attack: 30, defense: 10, category: 'B', attackCount: 1, isBoss: false, image: 'きょじん' },
        { id: 7, name: 'てつのかめん', hp: 30, attack: 13, defense: 10, category: 'B', attackCount: 1, isBoss: false, image: 'てつのかめん' }
    ],
    // ステージ1のボス (Category C: R:90%, SR:10%)
    '1_boss': { 
        id: 8, name: 'ドラゴン', hp: 500, attack: 100, defense: 20, category: 'C', attackCount: 2, isBoss: true, image: 'ドラゴン' 
    }
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
// ... (以降の関数は変更なし)
}

function updateMaterialInventoryUI() {
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


// 装備・解除機能
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
        const equippedCount = userData.inventory.filter(invItem => {
            const currentItemData = items.find(i => i.id === invItem.id);
            return currentItemData && currentItemData.type === type && invItem.isEquipped;
        }).length;

        if (equippedCount >= maxEquip) {
            // 上限に達している場合、最も古い（または最初の）装備品を自動で解除する
            const firstEquippedIndex = userData.inventory.findIndex(invItem => {
                const currentItemData = items.find(i => i.id === invItem.id);
                return currentItemData && currentItemData.type === type && invItem.isEquipped;
            });

            if (firstEquippedIndex !== -1 && maxEquip > 0) {
                userData.inventory[firstEquippedIndex].isEquipped = false;
            } else if (maxEquip === 0) {
                 showModal('装備エラー', `${itemData.name} (${type === 'weapon' ? '武器' : type === 'pet' ? 'ペット' : '防具'})は装備できません。`);
                 return;
            }
        }
        
        // 新しいアイテムを装備
        targetItem.isEquipped = true;
    }
    updateUI(); 
};
};

// 強化モーダル表示（強化アイテムの選択機能付き）
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
    // --- ガチャロジック関連関数 ---

/**
 * 確率テーブルに基づき、レアリティを抽選する
 * @param {string} type - 'weapon' または 'pet'
 * @returns {string} 抽選されたレアリティ ('N', 'R', 'SR', 'UR', 'LE')
 */
function drawRarity(type) {
    const rarityGroups = GACHA_RARITY_GROUPS[type];
    if (!rarityGroups) return 'N'; // デフォルト

    const totalWeight = Object.values(rarityGroups).reduce((sum, weight) => sum + weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const rarity in rarityGroups) {
        randomNum -= rarityGroups[rarity];
        if (randomNum <= 0) {
            return rarity;
        }
    }
    return 'N'; // 安全策
}

/**
 * 抽選されたレアリティとタイプに基づき、ランダムなアイテムを1つ選ぶ
 * @param {string} type - 'weapon' または 'pet'
 * @returns {object|null} 抽選されたアイテムデータ
 */
function getRandomItem(type) {
    const drawnRarity = drawRarity(type);

    // 抽選されたレアリティとタイプに一致するアイテムをフィルタリング
    const availableItems = items.filter(item => 
        item.type === type && item.rarity === drawnRarity
    );

    if (availableItems.length === 0) {
        // もし該当アイテムがなければ、同じタイプで一つ上のレアリティを再検索 (緊急措置)
        return items.find(item => item.type === type) || null;
    }

    // フィルタリングされたアイテムからランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * availableItems.length);
    return availableItems[randomIndex];
}
};

window.hideEnhanceModal = () => {
    document.getElementById('enhance-modal').classList.remove('visible');
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
            
            updateUI(); 

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
        updateCharacterStatsUI(); 
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
    /**
 * ガチャを引く処理を実行する
 * @param {string} type - 'weapon' または 'pet'
 */
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
    
    // インベントリにアイテムを追加
    const newItem = {
        id: resultItemData.id,
        level: 1, // 初期レベルは1
        isEquipped: false
    };
    userData.inventory.push(newItem);

    // レアリティカラー設定 (モーダル用)
    let rarityColorClass = '';
    if (resultItemData.rarity === 'R') rarityColorClass = 'text-blue-500';
    else if (resultItemData.rarity === 'SR') rarityColorClass = 'text-purple-500';
    else if (resultItemData.rarity === 'UR') rarityColorClass = 'text-yellow-500';
    else if (resultItemData.rarity === 'LE') rarityColorClass = 'text-red-500';
    
    // 結果モーダルを表示
    showModal(
        'ガチャ結果！', 
        `<div class="text-center">
            <img src="${resultItemData.image}" alt="${resultItemData.name}" class="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-dashed ${rarityColorClass.replace('text', 'border')}">
            <p class="font-bold text-lg">🎉 ${resultItemData.rarity} ゲット！ 🎉</p>
            <p class="text-xl ${rarityColorClass}">${resultItemData.name}</p>
        </div>`
    );

    updateUI(); 
};
      // 3. ガチャ機能のイベントリスナーを修正
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const weaponButton = event.target.closest('#gacha-roll-weapon');
        const petButton = event.target.closest('#gacha-roll-pet');

        if (weaponButton) {
            window.rollGacha('weapon'); // 武器・防具ガチャを実行
        } else if (petButton) {
            window.rollGacha('pet'); // ペットガチャを実行
        }
    });

    updateUI(); 
    
    // 画面ロード時に最初のタブ（ガチャ）を強制的に表示
    window.showTab(document.querySelector('.tab-button.active'), 'gacha');
    /**
 * ガチャを引く処理を実行する
 * @param {string} type - 'weapon' または 'pet'
 */
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

    // 🚨 修正ロジック: インベントリをチェックし、同一IDのアイテムがあればレベルアップ
    let isDuplicate = false;
    let enhancedItem = null;

    // 既に持っているアイテムの中から、同一IDのものを探す（ここでは最初に見つかったものを対象とする）
    const existingItemIndex = userData.inventory.findIndex(invItem => invItem.id === resultItemData.id);

    if (existingItemIndex !== -1) {
        // 1. 同一アイテムを発見した場合、レベルを+1
        enhancedItem = userData.inventory[existingItemIndex];
        enhancedItem.level = (enhancedItem.level || 1) + 1;
        isDuplicate = true;
    } else {
        // 2. 新規アイテムとしてインベントリに追加
        const newItem = {
            id: resultItemData.id,
            level: 1, // 初期レベルは1
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
        // 重複時のメッセージ
        modalMessage = `<div class="text-center">
            <img src="${resultItemData.image}" alt="${resultItemData.name}" class="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-dashed ${rarityColorClass.replace('text', 'border')}">
            <p class="font-bold text-lg">✨ レベルアップ！ ✨</p>
            <p class="text-xl ${rarityColorClass}">${resultItemData.name}</p>
            <p class="mt-2 text-sm text-gray-700">現在のレベル: **+${enhancedItem.level - 1}** が **+${enhancedItem.level}** に！</p>
        </div>`;
    } else {
        // 新規獲得時のメッセージ
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
}
