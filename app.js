// --------------------------------------------------------------------------
// 🚨 注意: このコードは、他のHTML要素や外部関数（itemsデータ、showModal, hideModalなど）が
// index.html または別ファイルで定義されていることを前提としています。
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
// 実際にはもっと多くのアイテムが必要です
const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, rarity: 1 },
    { id: 'A001', name: '皮のよろい', type: 'armor', defenseBonus: 3, rarity: 1 },
    { id: 'P001', name: 'スライム', type: 'pet', hpPercentBonus: 0.1, rarity: 2 },
    // レアなアイテム
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, rarity: 3 },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, rarity: 4 }
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


// --- 共通の計算ロジック (既存コードから復元) ---

function calculateWeaponArmorBonus(baseBonus, level) {
    return Math.round(baseBonus * Math.pow(ENHANCEMENT_RATE, level - 1));
}

function calculatePetPercentBonus(basePercent, level) {
    // basePercentは小数(0.1=10%)。PET_GROWTH_RATEは小数(0.001=0.1%)
    return Math.round((basePercent + (level - 1) * PET_GROWTH_RATE) * 100) / 100;
}


// --- UI更新とステータス計算 (既存コードから復元) ---

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

        if (!equippedItemsMap[itemDetails.type]) {
            equippedItemsMap[itemDetails.type] = [];
        }
        equippedItemsMap[itemDetails.type].push(invItem);
    });

    // 1. 固定値補正を適用した暫定ステータスを計算
    const interimAttack = Number(userData.baseAttack) + Number(totalAttackBonus);
    const interimDefense = Number(userData.baseDefense) + Number(totalDefenseBonus);
    const interimMaxHp = Number(BASE_STATS_HP) + Number(totalHpBonus); 
    
    // 2. パーセント補正を適用し、userDataを更新
    userData.attack = Math.round(interimAttack * (1 + totalAttackPercent)); // calculatePetPercentBonusが既に100で割られた値 (例: 0.05) を返すと仮定
    userData.defense = Math.round(interimDefense * (1 + totalDefensePercent));
    userData.maxHp = Math.round(interimMaxHp * (1 + totalHpPercent));
    
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }
    
    // --- UI生成ロジック ---
    // 🚨 省略: 装備品表示のHTML生成ロジックは元のコードからそのままコピーが必要です。

    let mainEquipHtml = '<div style="display: flex; gap: 20px;">[装備品のHTMLをここに生成]</div>';
    let unequippedHtml = '<h3>もちもの</h3><div class="item-list">[未装備品のHTMLをここに生成]</div>';


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
        ${mainEquipHtml}
        <hr>
        ${unequippedHtml}
    `;
    
    invDiv.innerHTML = statusHtml;
    // saveData() は updateUI() の最後で呼び出すか、スタンプ・ガチャのイベントハンドラ内で呼び出す
}

/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 1. ガチャ回数更新 (gachaLogのcountを使用)
    const gachaCount = gachaLog[today] ? MAX_GACHA_COUNT - gachaLog[today].count : MAX_GACHA_COUNT;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化
    const isDisabled = gachaCount <= 0;
    document.getElementById('gacha-roll-weapon').disabled = isDisabled;
    document.getElementById('gacha-roll-pet').disabled = isDisabled;

    // 3. スタンプボタンの有効/無効化
    const stampsToday = gachaLog[today] ? gachaLog[today].studyContent : [];
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        const content = button.getAttribute('data-content');
        if (stampsToday.includes(content)) {
            button.disabled = true;
            button.classList.add('bg-gray-400');
            button.classList.remove('bg-green-500'); 
        } else {
            button.disabled = false;
            button.classList.remove('bg-gray-400');
            button.classList.add('bg-green-500'); 
        }
    });

    // 4. ステータス計算とインベントリUIの更新
    updateInventoryUI(); 

    // 5. データ保存 (UI更新後にデータを永続化)
    saveData();
}


// --- イベントハンドラーとメインロジック ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. データロード
    loadData();

    // 2. スタンプ機能のイベントリスナー
    document.getElementById('study-stamps').addEventListener('click', (event) => {
        const button = event.target;
        // スタンプ回数がMAXに達していないか、内容がまだ記録されていないかを確認
        if (button.classList.contains('study-stamp-button') && !button.disabled) {
            const content = button.getAttribute('data-content');
            
            if (gachaLog[today].count < MAX_GACHA_COUNT) {
                // ローカルStateの更新
                gachaLog[today].count += 1; 
                gachaLog[today].studyContent.push(content); 

                showModal('スタンプゲット！', `「${content}」を記録しました！<br>のこりガチャ回数: ${MAX_GACHA_COUNT - gachaLog[today].count}`);
                
                updateUI(); // UI更新とデータ保存
            } else {
                showModal('上限です', '今日はこれ以上スタンプを押せません！');
            }
        }
    });

    // 3. ガチャ機能のイベントリスナー
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('gacha-roll-button') && !button.disabled) {
            const currentGachaCount = MAX_GACHA_COUNT - gachaLog[today].count;

            if (currentGachaCount > 0) {
                // ローカルStateの更新
                gachaLog[today].count -= 1; // スタンプ回数（=ガチャ回数）を減らす

                const type = button.id.includes('weapon') ? 'ぶき' : 'ペット';
                const resultElement = document.getElementById('gacha-result');
                
                // ガチャ実行ロジック (ダミー)
                const rollItems = items.filter(i => (type === 'ぶき' ? i.type !== 'pet' : i.type === 'pet'));
                const rolledItem = rollItems[Math.floor(Math.random() * rollItems.length)];
                
                // inventory に追加
                userData.inventory.push({ 
                    id: rolledItem.id, 
                    level: 1, 
                    isEquipped: false // デフォルトは未装備
                });
                
                resultElement.innerHTML = `<p class="text-xl font-bold text-red-600 mb-2">🎉 ${type}ガチャ 結果発表 🎉</p>
                                           <p class="text-lg">「${rolledItem.name}」を手に入れた！</p>`;

                updateUI(); // UI更新とデータ保存
            } else {
                showModal('回数が足りません', 'スタンプを押してガチャ回数を増やしましょう！');
            }
        }
    });

    // 4. 初回UI更新
    updateUI(); 
});


// ------------------ グローバル関数 (HTMLから呼び出される関数) ------------------

// タブ切り替え機能 (index.htmlのonclick属性から呼び出される)
window.showTab = (clickedButton, tabId) => {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; // CSSでdisplay:noneを操作
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block'; // 表示を元に戻す
        
        // ★特定のタブを開いたときにUIを更新 (特にインベントリ)
        if (tabId === 'inventory') {
            updateInventoryUI();
        }
        
        if (tabId === 'calendar') {
            updateCalendarLogUI(); // 次のステップで実装する関数
        }
    }
    clickedButton.classList.add('active');
};

// カスタムポップアップ機能 (HTMLから呼び出される)
window.showModal = (title = 'お知らせ', message = '') => {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    modalTitle.innerHTML = title;
    modalMessage.innerHTML = message;
    modal.classList.add('visible');
}

window.hideModal = () => {
    document.getElementById('custom-modal').classList.remove('visible');
}

// 🚨 ダミー関数: きろくタブのUI更新 (次のステップで実装)
function updateCalendarLogUI() {
    const logList = document.getElementById('study-log-list');
    if (!logList) return;
    
    let html = '';
    // gachaLog のデータを日付順にリスト化
    const sortedDates = Object.keys(gachaLog).sort().reverse();
    
    sortedDates.forEach(date => {
        const log = gachaLog[date];
        if (log.studyContent.length > 0) {
            html += `<li>${date}: ${log.studyContent.join(', ')} (スタンプ ${log.studyContent.length}個)</li>`;
        }
    });
    
    logList.innerHTML = html || '<li>まだ記録がありません。</li>';
}
