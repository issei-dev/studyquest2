// --------------------------------------------------------------------------
// 🌟 Ver0.36: ユーザー指定データに基づく完全リファクタリング 🌟
// --------------------------------------------------------------------------

// --- 定数定義 ---
const today = new Date().toISOString().slice(0, 10);
const BASE_STATS_HP = 100;
const BASE_STATS_ATTACK = 10;
const BASE_STATS_DEFENSE = 5;
const ENHANCEMENT_RATE = 1.2; // 強化時の倍率
const MAX_ENEMIES_PER_BATTLE = 3; // 同時に出現する雑魚敵の最大数
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; // ボス出現に必要な雑魚敵撃破数

// --- ユーザー指定データ定義 ---

// 強化アイテムの定義（ユーザー指定データ）
const REINFORCEMENT_ITEMS_BY_RARITY = {
    'N': { name: 'きょうかのかけら（小）', levelBonus: 1, itemId: 'M001' },
    'R': { name: 'きょうかのかけら（中）', levelBonus: 2, itemId: 'M002' },
    'SR': { name: 'きょうかのかけら（大）', levelBonus: 3, itemId: 'M003' },
    'UR': { name: 'きょうかのかたまり（小）', levelBonus: 4, itemId: 'M004' }
    // LEはURと同じ扱いとする
};

// プレイヤーのメインステータスと持ち物 (データ構造を gameData に統合)
// let userData = { ... };

// --- アイテムデータ (ユーザー指定データ) ---
const ITEM_DB = [
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
    { id: 'A007', name: '葉っぱの鎧', type: 'armor', attackBonus: 2, defenseBonus: 2, hpBonus: 0, rarity: 'N', image: 'SQ2-a007.png' }, // defenseBonus: 2に修正
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

// --- 戦闘関連データ (ユーザー指定データ) ---

// 敵データ
const ENEMY_DB = {
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

// 敵のカテゴリー別ドロップ率 (素材アイテムID)
const ENEMY_DROP_GROUPS = {
    'A': { 'M001': 80, 'M002': 15, 'M003': 5 }, // Nが出やすい
    'B': { 'M002': 60, 'M003': 30, 'M004': 10 },           // R, SRが出やすい
    'C': { 'M003': 70, 'M004': 30 }                        // SR, URが出やすい
};

// ガチャのレアリティ抽選確率
const GACHA_RARITY_GROUPS = {
    'weapon': { 'N': 50, 'R': 40, 'SR': 7, 'UR': 2.5, 'LE': 0.5 },
    'armor': { 'N': 50, 'R': 40, 'SR': 7, 'UR': 2.5, 'LE': 0.5 },
    'pet': { 'N': 50, 'R': 40, 'SR': 7, 'UR': 2.5, 'LE': 0.5 }
};

// --- グローバル変数 (ゲームデータ) ---
let gameData = {};
let currentEnemies = []; // 現在の戦闘にいる敵の配列
let battleLog = [];      // 戦闘ログを格納する配列


// --- データ初期化・ロード・セーブ ---

function getInitialGameData() {
    return {
        // ユーザー指定データから移行
        lastPlayed: today,
        gold: 0,
        player: {
            level: 1,
            exp: 0,
            baseHp: BASE_STATS_HP,
            currentHp: BASE_STATS_HP,
            baseAttack: BASE_STATS_ATTACK,
            baseDefense: BASE_STATS_DEFENSE,
            equippedWeapon: null,
            equippedArmor: null,
            equippedPet: null,
        },
        inventory: [], // ユーザー指定データから移行
        pets: [],
        gachaTickets: 0,
        stage: 1, // ユーザー指定データから移行
        enemiesDefeatedInStage: 0, // ユーザー指定データから移行
        studyStamps: []
    };
}

function loadData() {
    const savedData = localStorage.getItem('questCompanionData');
    if (savedData) {
        gameData = JSON.parse(savedData);
        // 最終プレイ日のチェックとHP回復、スタンプ判定
        if (gameData.lastPlayed !== today) {
            gameData.lastPlayed = today;
            const stats = getCalculatedStats();
            gameData.player.currentHp = stats.maxHp;
            currentEnemies = [];
            
            checkAndApplyStudyStamp();
        }
    } else {
        gameData = getInitialGameData();
        checkAndApplyStudyStamp();
    }
    
    // データ構造の補完
    if (!gameData.pets) gameData.pets = [];
    if (!gameData.studyStamps) gameData.studyStamps = [];
    if (!gameData.player.equippedPet) gameData.player.equippedPet = null;
    
    saveData();
    updateUI();
    
    // 初期敵配置
    if (currentEnemies.length === 0 && gameData.player.currentHp > 0) {
        findEnemy();
    } else if (gameData.player.currentHp <= 0) {
        battleLog.push("☠️ HPが0です。街で休むと回復します。");
    }
}

function saveData() {
    localStorage.setItem('questCompanionData', JSON.stringify(gameData));
}


// --- ステータスと計算 ---

function getCalculatedStats() {
    let maxHp = gameData.player.baseHp;
    let attack = gameData.player.baseAttack;
    let defense = gameData.player.baseDefense;
    
    let totalHpPercentBonus = 0;
    let totalAttackPercentBonus = 0;
    let totalDefensePercentBonus = 0;

    // レベル補正
    const levelFactor = 1 + (gameData.player.level - 1) * 0.1;
    maxHp = Math.floor(maxHp * levelFactor);
    attack = Math.floor(attack * levelFactor);
    defense = Math.floor(defense * levelFactor);

    // 装備補正 (固定値ボーナス)
    [gameData.player.equippedWeapon, gameData.player.equippedArmor].forEach(id => {
        if (id !== null) {
            const item = gameData.inventory.find(i => i.instanceId === id);
            if (item) {
                maxHp += item.stats.hpBonus;
                attack += item.stats.attackBonus;
                defense += item.stats.defenseBonus;
            }
        }
    });

    // ペット補正 (パーセントボーナス蓄積)
    if (gameData.player.equippedPet !== null) {
        const pet = gameData.pets.find(p => p.instanceId === gameData.player.equippedPet);
        if (pet) {
            totalHpPercentBonus += pet.stats.hpPercentBonus;
            totalAttackPercentBonus += pet.stats.attackPercentBonus;
            totalDefensePercentBonus += pet.stats.defensePercentBonus;
        }
    }
    
    // ペット補正を適用
    maxHp = Math.round(maxHp * (1 + totalHpPercentBonus));
    attack = Math.round(attack * (1 + totalAttackPercentBonus));
    defense = Math.round(defense * (1 + totalDefensePercentBonus));
    
    // 次のレベルまでの必要経験値
    const expToNextLevel = gameData.player.level * 100;

    // HP上限を超えないように調整
    gameData.player.currentHp = Math.min(gameData.player.currentHp, maxHp);

    return { maxHp, attack, defense, expToNextLevel };
}

/**
 * 装備品のレベルアップ時のステータス計算
 * 装備品は (基本値 * (強化倍率)^(Level-1)) + レベル毎ボーナス で計算。
 */
function calculateItemStats(itemData, level) {
    const power = Math.pow(ENHANCEMENT_RATE, level - 1);
    const hpBonus = Math.round(itemData.hpBonus * power);
    const attackBonus = Math.round(itemData.attackBonus * power);
    const defenseBonus = Math.round(itemData.defenseBonus * power);
    
    return { hpBonus, attackBonus, defenseBonus };
}

/**
 * ペットのレベルアップ時のステータス計算
 * ペットは (基本ボーナス * (強化倍率)^(Level-1)) で計算。
 */
function calculatePetStats(petData, level) {
    const power = Math.pow(ENHANCEMENT_RATE, level - 1);
    return {
        hpPercentBonus: petData.hpPercentBonus * power,
        attackPercentBonus: petData.attackPercentBonus * power,
        defensePercentBonus: petData.defensePercentBonus * power,
    };
}


// --- 経験値とレベルアップ ---

function gainExp(amount) {
    gameData.player.exp += amount;
    
    // レベルアップループ
    while (true) {
        const stats = getCalculatedStats();
        if (gameData.player.exp < stats.expToNextLevel) {
            break;
        }

        gameData.player.exp -= stats.expToNextLevel;
        gameData.player.level++;
        
        // ステータス再計算とHP回復
        const newStats = getCalculatedStats();
        gameData.player.currentHp += (newStats.maxHp - stats.maxHp);
        
        battleLog.push(`🎉 プレイヤーが**Lv.${gameData.player.level}**にレベルアップ！HP、ATK、DEFが上昇しました！`);
    }
    
    updateUI();
}

// --- 敵と戦闘 ---

function findEnemy() {
    if (gameData.player.currentHp <= 0) {
        battleLog.push("☠️ プレイヤーのHPがありません。回復してから再度挑戦しましょう。");
        updateBattleUI();
        return;
    }
    if (currentEnemies.length > 0) {
        battleLog.push("👀 現在、戦闘中です。");
        updateBattleUI();
        return;
    }
    
    const stage = gameData.stage;
    const enemiesToDefeat = gameData.enemiesDefeatedInStage;
    
    let isBoss = enemiesToDefeat >= ENEMY_DEFEAT_COUNT_TO_BOSS;
    
    if (isBoss) {
        // ボス
        const bossData = ENEMY_DB[`${stage}_boss`];
        if (bossData) {
            currentEnemies = [generateEnemy(bossData, stage * 10)]; // ボスはレベルを高く設定
            battleLog.push(`⚔️ **ステージ ${stage} ボス戦** 開始！${bossData.name}が出現！`);
        } else {
            // ステージデータが尽きた場合
            battleLog.push("🎉 すべてのステージをクリアしました！");
            return;
        }
    } else {
        // 雑魚敵
        const potentialEnemies = ENEMY_DB[stage];
        if (!potentialEnemies || potentialEnemies.length === 0) {
            battleLog.push("💡 敵が見つかりませんでした。(ステージデータ不足)");
            return;
        }
        
        const numEnemies = Math.min(MAX_ENEMIES_PER_BATTLE, Math.floor(Math.random() * potentialEnemies.length) + 1);
        currentEnemies = [];
        for (let i = 0; i < numEnemies; i++) {
            const enemyData = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
            currentEnemies.push(generateEnemy(enemyData, stage * 5));
        }
        battleLog.push(`⚔️ **ステージ ${stage}** にて戦闘開始！`);
    }

    updateBattleUI();
    saveData();
}

function generateEnemy(enemyData, baseLevel) {
    const level = baseLevel + Math.floor(Math.random() * 5); // レベルにランダム性を持たせる
    const levelFactor = 1 + (level - 1) * 0.15;
    
    const maxHp = Math.round(enemyData.hp * levelFactor);
    const attack = Math.round(enemyData.attack * levelFactor);
    const defense = Math.round(enemyData.defense * levelFactor);

    return {
        ...enemyData,
        level: level,
        maxHp: maxHp,
        currentHp: maxHp,
        attack: attack,
        defense: defense,
    };
}

function attackEnemy() {
    if (gameData.player.currentHp <= 0) {
        battleLog.push("☠️ プレイヤーは戦闘不能です。街で休憩しましょう。");
        updateBattleUI();
        return;
    }
    if (currentEnemies.length === 0) {
        findEnemy();
        return;
    }

    const playerStats = getCalculatedStats();

    // プレイヤーの攻撃（HPが最も低い敵をターゲット）
    currentEnemies.sort((a, b) => a.currentHp - b.currentHp);
    let targetEnemy = currentEnemies[0];

    const playerDamage = Math.max(1, playerStats.attack - targetEnemy.defense);
    targetEnemy.currentHp = Math.max(0, targetEnemy.currentHp - playerDamage);
    battleLog.push(`👊 **Lv.${gameData.player.level} 勇者** の攻撃！ ${targetEnemy.name} に ${playerDamage} ダメージ！`);

    // 敵撃破判定
    if (targetEnemy.currentHp <= 0) {
        processEnemyDefeat(targetEnemy);
        currentEnemies = currentEnemies.filter(e => e.currentHp > 0);
    }
    
    // 敵の反撃（生き残った敵全員）
    if (currentEnemies.length > 0) {
        currentEnemies.forEach(enemy => {
            const enemyDamage = Math.max(1, enemy.attack - playerStats.defense);
            gameData.player.currentHp = Math.max(0, gameData.player.currentHp - enemyDamage);
            battleLog.push(`😈 **${enemy.name}** の反撃！ プレイヤーに ${enemyDamage} ダメージ！`);
        });
    }

    // 戦闘終了判定
    if (gameData.player.currentHp <= 0) {
        battleLog.push("💀 **プレイヤー** は戦闘不能になりました。街に戻ります...");
        currentEnemies = [];
    } else if (currentEnemies.length === 0) {
        battleLog.push('✅ すべての敵を撃破しました！');
        findEnemy();
    }

    updateUI();
    updateBattleUI();
    saveData();
}

function processEnemyDefeat(enemy) {
    battleLog.push(`✨ ${enemy.name} を撃破しました！`);
    
    const expGain = enemy.level * (enemy.isBoss ? 50 : 5);
    const goldGain = enemy.level * (enemy.isBoss ? 50 : 10);
    gainExp(expGain);
    gameData.gold += goldGain;
    battleLog.push(`💰 ${goldGain} ゴールド と ${expGain} 経験値 を獲得！`);
    
    if (!enemy.isBoss) {
        gameData.enemiesDefeatedInStage++;
    }

    // アイテムドロップ（強化素材）
    const dropItem = rollDropItem(enemy.category);
    if (dropItem) {
        addItemToInventory(dropItem);
        battleLog.push(`💎 **${dropItem.name}** をドロップしました！`);
    }

    // ボス撃破時の処理 (ステージクリア)
    if (enemy.isBoss) {
        battleLog.push(`🎉 **ステージ ${gameData.stage}** をクリア！次のステージへ！`);
        gameData.stage++;
        gameData.enemiesDefeatedInStage = 0;
        gameData.gachaTickets += 5;
        battleLog.push(`🎁 ボス報酬として**ガチャチケット x5** を獲得！`);
    }
}

function rollDropItem(category) {
    const dropRates = ENEMY_DROP_GROUPS[category];
    if (!dropRates) return null;

    let total = 0;
    for (const rate in dropRates) {
        total += dropRates[rate];
    }
    
    let roll = Math.random() * total;
    let current = 0;
    for (const itemId in dropRates) {
        current += dropRates[itemId];
        if (roll < current) {
            const itemData = ITEM_DB.find(item => item.id === itemId);
            return itemData;
        }
    }
    return null;
}

// --- インベントリ、装備、ペット、強化、ガチャ、スタンプ機能は前回のコードとほぼ同じロジックで動作します ---
// (※ただし、ステータス計算関数 `calculateItemStats` と `calculatePetStats` は新しいデータ構造に合わせて修正済み)

// [以下の関数は省略しますが、前回のコードブロックの内容に基づき、
//  新しいデータ構造 (attackBonus, defenseBonus, hpBonus, attackPercentBonusなど)
//  に合わせて内部を調整して完全動作するように統合します。]

// - addItemToInventory
// - updateInventoryUI
// - isEquipped, sellItem
// - updateEquipmentUI, equipItem, unequipItem
// - showEnhancePopup, closeEnhancePopup, enhanceItem (強化処理は新しいREINFORCEMENT_ITEMS_BY_RARITYに準拠)
// - updateGachaUI, drawGacha, rollRarity
// - addPet, updatePetUI, equipPet, unequipPet, showPetEnhancePopup, closePetEnhancePopup, enhancePet, sellPet
// - checkAndApplyStudyStamp, updateStudyUI
// - updateUI, updateStatsUI, updateBattleUI, showTab
// - DOMContentLoaded, resetGameData

// -----------------------------------------------------------
// 🌟 UI/インベントリ/その他の関数定義 (上記ロジックに続く) 🌟
// -----------------------------------------------------------

// --- UI更新 ---

function updateUI() {
    updateStatsUI();
    updateInventoryUI();
    updateEquipmentUI();
    updatePetUI();
    updateGachaUI();
    updateStudyUI();
}

function updateStatsUI() {
    const stats = getCalculatedStats();
    document.getElementById('player-level').textContent = gameData.player.level;
    document.getElementById('player-exp').textContent = `${gameData.player.exp} / ${stats.expToNextLevel}`;
    document.getElementById('player-hp').textContent = `${gameData.player.currentHp} / ${stats.maxHp}`;
    document.getElementById('player-attack').textContent = stats.attack;
    document.getElementById('player-defense').textContent = stats.defense;
    document.getElementById('player-gold').textContent = gameData.gold;
    document.getElementById('gacha-tickets').textContent = gameData.gachaTickets;
    
    // ステージ情報
    document.getElementById('stage-info').textContent = `ステージ ${gameData.stage} | 撃破数: ${gameData.enemiesDefeatedInStage} / ${ENEMY_DEFEAT_COUNT_TO_BOSS}`;
    
    // 経験値バー
    const expPercentage = (gameData.player.exp / stats.expToNextLevel) * 100;
    document.getElementById('exp-bar-fill').style.width = `${expPercentage}%`;
}

function updateBattleUI() {
    const battleContainer = document.getElementById('battle-enemy-container');
    const logElement = document.getElementById('battle-log');
    battleContainer.innerHTML = '';
    
    currentEnemies.forEach((enemy, index) => {
        const enemyElement = document.createElement('div');
        enemyElement.className = 'enemy-card';
        enemyElement.dataset.index = index;
        
        const imagePath = enemy.image || 'default-enemy.png';
        
        enemyElement.innerHTML = `
            <img src="${imagePath}" alt="${enemy.name}" class="enemy-img">
            <p>Lv.${enemy.level} ${enemy.name}</p>
            <p>HP: <span id="enemy-hp-${index}">${enemy.currentHp}</span> / ${enemy.maxHp}</p>
            <p>ATK: ${enemy.attack}, DEF: ${enemy.defense}</p>
        `;
        battleContainer.appendChild(enemyElement);
    });

    logElement.innerHTML = battleLog.slice(-5).map(log => `<p>${log}</p>`).join('');
    logElement.scrollTop = logElement.scrollHeight;
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');

    if (tabId === 'inventory') { updateInventoryUI(); } 
    else if (tabId === 'equipment') { updateEquipmentUI(); } 
    else if (tabId === 'pet') { updatePetUI(); } 
    else if (tabId === 'gacha') { updateGachaUI(); } 
    else if (tabId === 'study') { updateStudyUI(); }
}

// --- インベントリ ---

function addItemToInventory(itemData, itemLevel = 1, itemInstanceId = Date.now()) {
    if (itemData.type === 'material') {
        const existingItem = gameData.inventory.find(i => i.id === itemData.id && i.type === 'material');
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            gameData.inventory.push({
                instanceId: itemInstanceId, id: itemData.id, name: itemData.name, type: itemData.type, rarity: itemData.rarity, image: itemData.image, quantity: 1,
            });
        }
    } else {
        const stats = calculateItemStats(itemData, itemLevel);
        gameData.inventory.push({
            instanceId: itemInstanceId, id: itemData.id, name: itemData.name, type: itemData.type, rarity: itemData.rarity, image: itemData.image, level: itemLevel, stats: stats, baseItem: itemData
        });
    }
    updateInventoryUI();
    saveData();
}

function updateInventoryUI() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    const sortedInventory = [...gameData.inventory].sort((a, b) => {
        if (a.type === 'material' && b.type !== 'material') return 1;
        if (a.type !== 'material' && b.type === 'material') return -1;
        return 0;
    });

    sortedInventory.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `item-card rarity-${item.rarity.toLowerCase()}`;
        
        let statsHtml = '';
        if (item.type !== 'material') {
            statsHtml = `<p>ATK: ${item.stats.attackBonus}, DEF: ${item.stats.defenseBonus}, HP: ${item.stats.hpBonus}</p>`;
        }
        
        const levelHtml = item.level ? `<span class="item-level">Lv.${item.level}</span>` : '';
        const quantityHtml = item.quantity ? `<span class="item-quantity">x${item.quantity}</span>` : '';

        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-info">
                <p class="item-name">${item.name} ${levelHtml}</p>
                <p class="rarity-text">${item.rarity}</p>
                ${statsHtml}
                ${quantityHtml}
            </div>
            <div class="item-actions">
                ${item.type !== 'material' ? `<button onclick="showEnhancePopup(${item.instanceId})">強化</button>` : ''}
                ${item.type !== 'material' && !isEquipped(item.instanceId) ? `<button onclick="equipItem(${item.instanceId}, '${item.type}')">装備</button>` : ''}
                <button onclick="sellItem(${item.instanceId})">売却</button>
            </div>
        `;
        container.appendChild(itemElement);
    });
}

function isEquipped(instanceId) {
    return gameData.player.equippedWeapon === instanceId || gameData.player.equippedArmor === instanceId;
}

function sellItem(instanceId) {
    const index = gameData.inventory.findIndex(item => item.instanceId === instanceId);
    if (index === -1) return;

    const item = gameData.inventory[index];
    const rarityMultiplier = { 'N': 1, 'R': 5, 'SR': 20, 'UR': 50, 'LE': 100 };
    let sellPrice = (rarityMultiplier[item.rarity] || 1) * 10;
    if (item.type === 'material') { sellPrice *= (item.quantity || 1); }
    else { sellPrice += (item.level - 1) * 5; }
    
    gameData.inventory.splice(index, 1);
    gameData.gold += sellPrice;
    
    if (gameData.player.equippedWeapon === instanceId) gameData.player.equippedWeapon = null;
    if (gameData.player.equippedArmor === instanceId) gameData.player.equippedArmor = null;

    updateUI();
    alert(`${item.name} を ${sellPrice} ゴールドで売却しました。`);
}

// --- 装備 ---

function updateEquipmentUI() {
    const weaponContainer = document.getElementById('equipped-weapon');
    const armorContainer = document.getElementById('equipped-armor');

    function renderEquipment(container, equippedId, type) {
        container.innerHTML = '';
        if (equippedId !== null) {
            const item = gameData.inventory.find(i => i.instanceId === equippedId);
            if (item) {
                let statsHtml = `<p>ATK: ${item.stats.attackBonus}, DEF: ${item.stats.defenseBonus}, HP: ${item.stats.hpBonus}</p>`;
                
                container.className = `item-card rarity-${item.rarity.toLowerCase()} equipped`;
                container.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-info">
                        <p class="item-name">${item.name} <span class="item-level">Lv.${item.level}</span></p>
                        <p class="rarity-text">${item.rarity}</p>
                        ${statsHtml}
                    </div>
                    <button onclick="unequipItem('${type}')">解除</button>
                `;
                return;
            }
        }
        container.className = 'item-card empty';
        container.innerHTML = `<p>${type === 'weapon' ? '武器' : '防具'}スロット</p>`;
    }

    renderEquipment(weaponContainer, gameData.player.equippedWeapon, 'weapon');
    renderEquipment(armorContainer, gameData.player.equippedArmor, 'armor');
    updateStatsUI();
}

function equipItem(instanceId, type) {
    if (type === 'weapon') { gameData.player.equippedWeapon = instanceId; } 
    else if (type === 'armor') { gameData.player.equippedArmor = instanceId; }
    updateEquipmentUI(); updateInventoryUI(); saveData(); alert('装備しました！');
}

function unequipItem(type) {
    if (type === 'weapon') { gameData.player.equippedWeapon = null; } 
    else if (type === 'armor') { gameData.player.equippedArmor = null; }
    updateEquipmentUI(); updateInventoryUI(); saveData(); alert('装備を解除しました。');
}

// --- 強化 ---

function showEnhancePopup(instanceId) {
    const item = gameData.inventory.find(i => i.instanceId === instanceId);
    if (!item || item.type === 'material') return;

    const rarityKey = item.rarity === 'LE' ? 'UR' : item.rarity; // LEはUR素材を使うと仮定
    const requiredMaterialData = REINFORCEMENT_ITEMS_BY_RARITY[rarityKey];
    if (!requiredMaterialData) return;
    
    const material = gameData.inventory.find(i => i.id === requiredMaterialData.itemId && i.type === 'material');

    document.getElementById('enhance-item-name').textContent = `${item.name} Lv.${item.level}`;
    
    let materialHtml = '';
    if (material && material.quantity > 0) {
        materialHtml = `<p>${material.name} x${material.quantity} <button onclick="enhanceItem(${item.instanceId}, '${material.id}')">強化する</button></p>`;
    } else {
        materialHtml = `<p>**${requiredMaterialData.name}** が不足しています。</p>`;
    }

    document.getElementById('enhance-materials-list').innerHTML = materialHtml;
    document.getElementById('enhance-popup').style.display = 'flex';
}

function closeEnhancePopup() {
    document.getElementById('enhance-popup').style.display = 'none';
}

function enhanceItem(itemInstanceId, materialId) {
    const item = gameData.inventory.find(i => i.instanceId === itemInstanceId);
    const material = gameData.inventory.find(i => i.id === materialId && i.type === 'material');

    if (!item || !material || (material.quantity || 0) < 1) {
        alert("アイテムまたは素材が不足しています。");
        return;
    }
    
    item.level = (item.level || 1) + 1;
    item.stats = calculateItemStats(item.baseItem, item.level);

    material.quantity--;
    if (material.quantity <= 0) {
        gameData.inventory = gameData.inventory.filter(i => i.instanceId !== material.instanceId);
    }

    alert(`${item.name} が Lv.${item.level} に強化されました！`);

    updateUI(); closeEnhancePopup(); saveData();
}

// --- ガチャシステム ---

function updateGachaUI() {
    document.getElementById('gacha-tickets').textContent = gameData.gachaTickets;
}

function rollRarity(rarityGroup) {
    let total = 0;
    for (const key in rarityGroup) { total += rarityGroup[key]; }
    
    let roll = Math.random() * total;
    let current = 0;
    for (const rarity in rarityGroup) {
        current += rarityGroup[rarity];
        if (roll < current) { return rarity; }
    }
    return Object.keys(rarityGroup)[0];
}

function drawGacha() {
    if (gameData.gachaTickets < 1) {
        alert("ガチャチケットが不足しています！");
        return;
    }

    gameData.gachaTickets--;
    
    const itemTypes = ['weapon', 'pet', 'armor'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const rarity = rollRarity(GACHA_RARITY_GROUPS[itemType]);
    
    const potentialItems = ITEM_DB.filter(i => i.type === itemType && i.rarity === rarity);
    const itemData = potentialItems[Math.floor(Math.random() * potentialItems.length)];
    
    if (!itemData) {
        gameData.gachaTickets++; alert('ガチャエラー: アイテムデータが見つかりませんでした。');
        updateGachaUI(); saveData(); return;
    }

    if (itemType === 'pet') {
        addPet(itemData);
        alert(`🎉 **${rarity}** のペット **${itemData.name}** を獲得！`);
    } else {
        addItemToInventory(itemData);
        alert(`🎉 **${rarity}** の装備 **${itemData.name}** を獲得！`);
    }

    updateGachaUI(); saveData();
}

// --- ペットシステム ---

function addPet(petData, petLevel = 1, instanceId = Date.now()) {
    const stats = calculatePetStats(petData, petLevel);
    gameData.pets.push({
        instanceId: instanceId, id: petData.id, name: petData.name, rarity: petData.rarity, image: petData.image, level: petLevel, stats: stats, basePet: petData
    });
    updatePetUI(); saveData();
}

function updatePetUI() {
    const petListContainer = document.getElementById('pet-list');
    const equippedPetContainer = document.getElementById('equipped-pet-slot');
    petListContainer.innerHTML = '';
    
    let equippedPet = gameData.pets.find(p => p.instanceId === gameData.player.equippedPet);

    if (equippedPet) {
        equippedPetContainer.className = `item-card rarity-${equippedPet.rarity.toLowerCase()} equipped`;
        equippedPetContainer.innerHTML = `
            <img src="${equippedPet.image}" alt="${equippedPet.name}">
            <div class="item-info">
                <p class="item-name">${equippedPet.name} <span class="item-level">Lv.${equippedPet.level}</span></p>
                <p class="rarity-text">${equippedPet.rarity}</p>
                <p>ATK: ${Math.round(equippedPet.stats.attackPercentBonus * 1000) / 10}%, DEF: ${Math.round(equippedPet.stats.defensePercentBonus * 1000) / 10}%, HP: ${Math.round(equippedPet.stats.hpPercentBonus * 1000) / 10}%</p>
            </div>
            <button onclick="unequipPet()">解除</button>
        `;
    } else {
        equippedPetContainer.className = 'item-card empty';
        equippedPetContainer.innerHTML = `<p>ペットスロット</p>`;
    }

    gameData.pets.forEach(pet => {
        const isEquipped = gameData.player.equippedPet === pet.instanceId;
        const petElement = document.createElement('div');
        petElement.className = `item-card rarity-${pet.rarity.toLowerCase()}`;
        if (isEquipped) petElement.classList.add('equipped');

        petElement.innerHTML = `
            <img src="${pet.image}" alt="${pet.name}">
            <div class="item-info">
                <p class="item-name">${pet.name} <span class="item-level">Lv.${pet.level}</span></p>
                <p class="rarity-text">${pet.rarity}</p>
                <p>ATK: ${Math.round(pet.stats.attackPercentBonus * 1000) / 10}%, DEF: ${Math.round(pet.stats.defensePercentBonus * 1000) / 10}%, HP: ${Math.round(pet.stats.hpPercentBonus * 1000) / 10}%</p>
            </div>
            <div class="item-actions">
                ${!isEquipped ? `<button onclick="equipPet(${pet.instanceId})">装備</button>` : ''}
                <button onclick="showPetEnhancePopup(${pet.instanceId})">強化</button>
                <button onclick="sellPet(${pet.instanceId})">売却</button>
            </div>
        `;
        petListContainer.appendChild(petElement);
    });
}

function equipPet(instanceId) {
    gameData.player.equippedPet = instanceId;
    updatePetUI(); updateStatsUI(); saveData(); alert('ペットを装備しました！');
}

function unequipPet() {
    gameData.player.equippedPet = null;
    updatePetUI(); updateStatsUI(); saveData(); alert('ペットの装備を解除しました。');
}

function showPetEnhancePopup(instanceId) {
    const pet = gameData.pets.find(p => p.instanceId === instanceId);
    if (!pet) return;

    const rarityKey = pet.rarity === 'LE' ? 'UR' : pet.rarity;
    const requiredMaterialData = REINFORCEMENT_ITEMS_BY_RARITY[rarityKey];
    if (!requiredMaterialData) return;

    const material = gameData.inventory.find(i => i.id === requiredMaterialData.itemId && i.type === 'material');

    document.getElementById('pet-enhance-name').textContent = `${pet.name} Lv.${pet.level}`;
    
    let materialHtml = '';
    if (material && material.quantity > 0) {
        materialHtml = `<p>${material.name} x${material.quantity} <button onclick="enhancePet(${pet.instanceId}, '${material.id}')">強化する</button></p>`;
    } else {
        materialHtml = `<p>**${requiredMaterialData.name}** が不足しています。</p>`;
    }

    document.getElementById('pet-enhance-materials-list').innerHTML = materialHtml;
    document.getElementById('pet-enhance-popup').style.display = 'flex';
}

function closePetEnhancePopup() {
    document.getElementById('pet-enhance-popup').style.display = 'none';
}

function enhancePet(petInstanceId, materialId) {
    const pet = gameData.pets.find(p => p.instanceId === petInstanceId);
    const material = gameData.inventory.find(i => i.id === materialId && i.type === 'material');

    if (!pet || !material || (material.quantity || 0) < 1) {
        alert("ペットまたは素材が不足しています。");
        return;
    }
    
    pet.level = (pet.level || 1) + 1;
    pet.stats = calculatePetStats(pet.basePet, pet.level);

    material.quantity--;
    if (material.quantity <= 0) {
        gameData.inventory = gameData.inventory.filter(i => i.instanceId !== material.instanceId);
    }

    alert(`${pet.name} が Lv.${pet.level} に強化されました！`);

    updateUI(); closePetEnhancePopup(); saveData();
}

function sellPet(instanceId) {
    const index = gameData.pets.findIndex(pet => pet.instanceId === instanceId);
    if (index === -1) return;

    const pet = gameData.pets[index];
    const rarityMultiplier = { 'N': 5, 'R': 25, 'SR': 100, 'UR': 250, 'LE': 500 };
    let sellPrice = (rarityMultiplier[pet.rarity] || 1) * 10 + (pet.level - 1) * 10;
    
    gameData.pets.splice(index, 1);
    gameData.gold += sellPrice;
    
    if (gameData.player.equippedPet === instanceId) gameData.player.equippedPet = null;

    updateUI(); alert(`${pet.name} を ${sellPrice} ゴールドで売却しました。`);
}

// --- スタンプ・勉強機能 ---

function checkAndApplyStudyStamp() {
    const lastStampDate = gameData.studyStamps.length > 0 ? gameData.studyStamps[gameData.studyStamps.length - 1].date : '';
    
    if (lastStampDate !== today) {
        gameData.studyStamps.push({ date: today });
        gameData.gachaTickets += 1;
        
        battleLog.push("✅ 本日のスタンプを獲得！ガチャチケットを1枚GET！");
    }
}

function updateStudyUI() {
    const stampContainer = document.getElementById('study-stamp-calendar');
    stampContainer.innerHTML = '';
    
    const maxStamps = 7;
    const currentStamps = gameData.studyStamps.length;
    
    for (let i = 1; i <= maxStamps; i++) {
        const stampElement = document.createElement('div');
        stampElement.className = 'stamp-slot';
        
        if (i <= currentStamps) {
            stampElement.classList.add('stamped');
            stampElement.innerHTML = '✅';
        } else {
            stampElement.innerHTML = '□';
        }
        stampContainer.appendChild(stampElement);
    }
    
    if (currentStamps >= maxStamps) {
        document.getElementById('stamp-message').textContent = `7日連続達成！ボーナスでガチャチケットを5枚獲得！`;
        gameData.gachaTickets += 5;
        gameData.studyStamps = [];
        battleLog.push("🎁 7日連続ボーナス！ガチャチケット x5 を獲得！");
    } else {
        document.getElementById('stamp-message').textContent = `連続ログイン中！あと ${maxStamps - currentStamps} 日でボーナスGET！`;
    }
    
    updateGachaUI(); saveData();
}

// --- イベントリスナーと初期化 ---

document.addEventListener('DOMContentLoaded', () => {
    showTab('battle');
    loadData();
    if (currentEnemies.length === 0 && gameData.player.currentHp > 0) {
        findEnemy();
    }
});

function resetGameData() {
    if(confirm("ゲームデータを完全にリセットしますか？")) {
        localStorage.removeItem('questCompanionData');
        window.location.reload();
    }
}
