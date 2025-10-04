// --------------------------------------------------------------------------
// 🚨 注意: このコードは、他のHTML要素や外部関数（itemsデータ、showModal, hideModalなど）が
// index.html, style.css、およびアプリの実行環境で定義されていることを前提としています。
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
const MAX_GACHA_COUNT = 5; // スタンプ回数の上限
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
let gachaLog = {}; // 例: { "2025-10-04": { count: 3, studyContent: ["そろタッチ", "レッスン"] } }

// ステージと戦闘情報（LocalStorageで保存）
let currentStage = 1;
let enemiesDefeatedInStage = 0;

// 🚨 ダミーデータ: アイテム情報 (ガチャとインベントリUIに必要)
const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, defenseBonus: 0, hpBonus: 0, rarity: 1 },
    { id: 'A001', name: '皮のよろい', type: 'armor', attackBonus: 0, defenseBonus: 3, hpBonus: 10, rarity: 1 },
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.0, defensePercentBonus: 0.0, hpPercentBonus: 0.1, rarity: 2 },
    // レアなアイテム
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, defenseBonus: 0, hpBonus: 0, rarity: 3 },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, defensePercentBonus: 0.0, hpPercentBonus: 0.0, rarity: 4 }
];


// --- データほぞん・よみこみ関数 (LocalStorage) ---

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


// --- 共通の計算ロジック ---

function calculateWeaponArmorBonus(baseBonus, level) {
    // レベル1はボーナスなし、レベル2からENHANCEMENT_RATE倍
    return Math.round(baseBonus * Math.pow(ENHANCEMENT_RATE, level - 1));
}

function calculatePetPercentBonus(basePercent, level) {
    // PET_GROWTH_RATEは0.001 (0.1%)など、パーセントではない値
    return basePercent + (level - 1) * PET_GROWTH_RATE;
}


// ------------------ 🌟 インベントリ操作ロジック 🌟 ------------------

/**
 * 装備状態を切り替える (同タイプは排他)
 * @param {number} itemIndex - userData.inventory 内のインデックス
 */
window.toggleEquipItem = (itemIndex) => {
    const invItem = userData.inventory[itemIndex];
    if (!invItem) return;

    const itemDetails = items.find(i => i.id === invItem.id);
    if (!itemDetails) return;

    if (invItem.isEquipped) {
        // 解除
        invItem.isEquipped = false;
        showModal('装備解除', `${itemDetails.name} の装備を解除しました。`);
    } else {
        // 装備処理 (同タイプは排他)
        userData.inventory.forEach((otherItem, index) => {
            if (index !== itemIndex && otherItem.isEquipped) {
                const otherDetails = items.find(i => i.id === otherItem.id);
                if (otherDetails && otherDetails.type === itemDetails.type) {
                    otherItem.isEquipped = false; // 同じタイプのアイテムを強制解除
                }
            }
        });

        // 装備
        invItem.isEquipped = true;
        showModal('装備！', `${itemDetails.name} を装備しました。ステータスが更新されます。`);
    }
    
    updateUI();
};

/**
 * アイテムを強化する (レベル+1)
 * @param {number} itemIndex - userData.inventory 内のインデックス
 */
window.enhanceItem = (itemIndex) => {
    const invItem = userData.inventory[itemIndex];
    if (!invItem) return;

    // 🚨 強化コストや成功率のロジックは省略。ここでは単純にレベルを上げる。
    invItem.level = (invItem.level || 1) + 1;

    const itemDetails = items.find(i => i.id === invItem.id);
    showModal('強化成功！', `${itemDetails.name} のレベルが **${invItem.level}** にアップしました！`);
    
    updateUI();
};


// ------------------ UI更新とステータス計算 ------------------

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
    const unequippedItems = userData.inventory.filter(item => !item.isEquipped);
    
    // 装備スロットの情報を保持
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
    
    unequippedItems.forEach((invItem, originalIndex) => {
        // originalIndex は userData.inventory でのインデックス
        const itemIndex = userData.inventory.findIndex((item, idx) => item.id === invItem.id && !item.isEquipped && idx >= originalIndex);
        const itemDetails = items.find(i => i.id === invItem.id);
        if (!itemDetails) return;

        unequippedHtml += `
            <div class="item-card">
                <p class="font-bold">${itemDetails.name}</p>
                <p class="text-xs text-gray-500">${itemDetails.type}</p>
                <p class="text-sm">Lv: ${invItem.level || 1}</p>
                <button onclick="toggleEquipItem(${itemIndex})" class="bg-green-600">装備する</button>
                <button onclick="enhanceItem(${itemIndex})" class="bg-yellow-600">強化</button>
            </div>
        `;
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

/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 1. ガチャ回数更新 
    const gachaCount = gachaLog[today] ? MAX_GACHA_COUNT - gachaLog[today].count : MAX_GACHA_COUNT;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化 (省略)

    // 3. スタンプボタンの有効/無効化 (省略)

    // 4. ステータス計算とインベントリUIの更新
    updateInventoryUI(); 

    // 5. データ保存 (UI更新後にデータを永続化)
    saveData();
}


// --- イベントハンドラーとメインロジック (簡略化) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. データロード
    loadData();

    // 2. スタンプ機能のイベントリスナー (変更なし)
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

    // 3. ガチャ機能のイベントリスナー (変更なし)
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
