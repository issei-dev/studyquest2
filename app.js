// --- 初期データと変数 (変更なし) ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5; // スタンプ回数の上限
const BASE_STATS_HP = 100;
const BASE_STATS_ATTACK = 10; // ★明示的に初期値を定義
const BASE_STATS_DEFENSE = 5; // ★明示的に初期値を定義
const ENHANCEMENT_RATE = 1.2; // 武器・防具のレベルアップ時のステータス成長率
const PET_GROWTH_RATE = 0.001; // ペットのレベルアップ時のパーセント成長率 (0.1% = 0.001)

let userData = {
    hp: BASE_STATS_HP,
    maxHp: BASE_STATS_HP,
    baseAttack: BASE_STATS_ATTACK, // 10
    baseDefense: BASE_STATS_DEFENSE, // 5
    attack: BASE_STATS_ATTACK,
    defense: BASE_STATS_DEFENSE,
    inventory: [] 
};
// ... (その他の変数とアイテムデータは省略)

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
        
        // ★修正: 読み込んだデータに基本ステータスがない場合や、不正な値の場合にデフォルト値を設定
        userData.baseAttack = userData.baseAttack || BASE_STATS_ATTACK;
        userData.baseDefense = userData.baseDefense || BASE_STATS_DEFENSE;
        // HPも最大HPを基準に再設定
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
}
// ... (その他の UI 関数、スタンプ・ガチャロジックは省略)

// --- インベントリーロジック (装備枠と強化機能) ---

// ... (calculateWeaponArmorBonus, calculatePetPercentBonus は省略)

function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    if (!invDiv) return;

    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpBonus = 0;
    
    let totalAttackPercent = 0;
    let totalDefensePercent = 0;
    let totalHpPercent = 0;

    const equippedItems = userData.inventory.filter(item => item.isEquipped);
    const equippedItemsMap = {}; 

    equippedItems.forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;
        
        if (itemDetails.type === 'weapon' || itemDetails.type === 'armor') {
            const attackBoost = calculateWeaponArmorBonus(itemDetails.attackBonus || 0, invItem.level);
            const defenseBoost = calculateWeaponArmorBonus(itemDetails.defenseBonus || 0, invItem.level);
            const hpBoost = calculateWeaponArmorBonus(itemDetails.hpBonus || 0, invItem.level);
            
            totalAttackBonus += attackBoost;
            totalDefenseBonus += defenseBoost;
            totalHpBonus += hpBoost;
            
        } else if (itemDetails.type === 'pet') {
            const attackP = calculatePetPercentBonus(itemDetails.attackPercentBonus || 0, invItem.level);
            const defenseP = calculatePetPercentBonus(itemDetails.defensePercentBonus || 0, invItem.level);
            const hpP = calculatePetPercentBonus(itemDetails.hpPercentBonus || 0, invItem.level);
            
            totalAttackPercent += attackP;
            totalDefensePercent += defenseP;
            totalHpPercent += hpP;
        }

        if (!equippedItemsMap[itemDetails.type]) {
            equippedItemsMap[itemDetails.type] = [];
        }
        equippedItemsMap[itemDetails.type].push(invItem);
    });

    // ★修正: 計算の起点に userData.baseAttack/Defense, BASE_STATS_HP を明示的に使用し、NaNを防ぐ
    const interimAttack = Number(userData.baseAttack) + Number(totalAttackBonus);
    const interimDefense = Number(userData.baseDefense) + Number(totalDefenseBonus);
    const interimMaxHp = Number(BASE_STATS_HP) + Number(totalHpBonus); 
    
    // パーセント補正を適用
    userData.attack = Math.round(interimAttack * (1 + totalAttackPercent / 100));
    userData.defense = Math.round(interimDefense * (1 + totalDefensePercent / 100));
    userData.maxHp = Math.round(interimMaxHp * (1 + totalHpPercent / 100));
    
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }
    
    // ... (装備品表示のHTML生成ロジックは省略) ...
    let mainEquipHtml = '<div style="display: flex; gap: 20px;">'; 
    // ... (columnA, columnB のHTML生成ロジックは省略) ...
    mainEquipHtml += '</div>';
    
    let unequippedHtml = '<h3>もちもの</h3><div class="item-list">';
    // ... (unequippedItems のHTML生成ロジックは省略) ...
    unequippedHtml += '</div>';


    // ★修正: ステータス表示の基本値と補正値を明確に表示
    const statusHtml = `
        <h2>キャラクターと アイテムいちらん</h2>
        <div id="character-status" style="margin-bottom: 20px;">
            <h3>ステータス</h3>
            <p>たいりょく: ${userData.hp} / ${userData.maxHp}</p>
            <p>こうげき力: ${userData.attack} (きほん: ${userData.baseAttack} + ぶきぼうぐ: ${totalAttackBonus} + ペット: +${totalAttackPercent}%)</p>
            <p>ぼうぎょ力: ${userData.defense} (きほん: ${userData.baseDefense} + ぶきぼうぐ: ${totalDefenseBonus} + ペット: +${totalDefensePercent}%)</p>
        </div>
        <hr>
        ${mainEquipHtml}
        <hr>
        ${unequippedHtml}
    `;
    
    invDiv.innerHTML = statusHtml;
    saveData();
}

// ... (装備・強化・戦闘ロジック、初期化関数は省略)
