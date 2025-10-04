// --------------------------------------------------------------------------
// 🌟 Ver0.17: スタンプボタンとタブ切り替えの動作保証 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
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
    inventory: [] 
};

// 日別スタンプ記録とガチャ回数 (countは利用可能回数)
let gachaLog = {}; 

// --- 戦闘関連データ ---
let currentStage = 1;
let enemiesDefeatedInStage = 0; 
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; 

const items = [
    { id: 'W001', name: '木の剣', type: 'weapon', attackBonus: 5, defenseBonus: 0, hpBonus: 0, rarity: 1 },
    { id: 'A001', name: '皮のよろい', type: 'armor', attackBonus: 0, defenseBonus: 3, hpBonus: 10, rarity: 1 },
    { id: 'P001', name: 'スライム', type: 'pet', attackPercentBonus: 0.0, defensePercentBonus: 0.0, hpPercentBonus: 0.1, rarity: 2 },
    { id: 'W002', name: '鋼鉄の剣', type: 'weapon', attackBonus: 15, defenseBonus: 0, hpBonus: 0, rarity: 3 },
    { id: 'P002', name: 'ドラゴン', type: 'pet', attackPercentBonus: 0.5, defensePercentBonus: 0.0, hpPercentBonus: 0.0, rarity: 4 }
];
const enemies = {
    1: [
        { name: 'スライム', hp: 50, attack: 5, defense: 2, xp: 5, gold: 10, isBoss: false, image: 'スライム' },
        { name: 'ゴブリン', hp: 80, attack: 10, defense: 5, xp: 8, gold: 15, isBoss: false, image: 'ゴブリン' },
        { name: 'マンドラゴラ', hp: 60, attack: 7, defense: 8, xp: 6, gold: 12, isBoss: false, image: 'マンドラゴラ' }
    ],
    '1_boss': { name: 'ミノタウロス', hp: 200, attack: 25, defense: 15, xp: 50, gold: 100, isBoss: true, image: 'ミノタウロス' }
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
    
    // 今日のログの初期化を確実に実行
    if (!gachaLog[today] || gachaLog[today].count === undefined || gachaLog[today].studyContent === undefined) { 
        userData.hp = userData.maxHp; 
        gachaLog[today] = { count: 0, studyContent: [] };
    }
    gachaLog[today].count = Number(gachaLog[today].count) || 0;
}


// --- 共通の計算ロジック, インベントリ操作ロジック, UI更新とステータス計算 (省略) ---
function calculateWeaponArmorBonus(baseBonus, level) { /* ... */ return Math.round(baseBonus * Math.pow(ENHANCEMENT_RATE, level - 1)); }
function calculatePetPercentBonus(basePercent, level) { /* ... */ return basePercent + (level - 1) * PET_GROWTH_RATE; }
window.toggleEquipItem = (itemIndex) => { /* ... */ updateUI(); };
window.enhanceItem = (itemIndex) => { /* ... */ updateUI(); };
function updateInventoryUI() { /* ... */ }
function selectEnemy() { /* ... */ }
function updateEnemyHPBar(enemy, container) { /* ... */ }
function updateEnemyUI() { /* ... */ }
window.attackEnemy = () => { /* ... */ };


/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 1. ガチャ回数更新 
    const gachaCount = gachaLog[today] ? gachaLog[today].count : 0;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化
    const isDisabled = gachaCount <= 0;
    const weaponButton = document.getElementById('gacha-roll-weapon');
    const petButton = document.getElementById('gacha-roll-pet');

    if (weaponButton) weaponButton.disabled = isDisabled;
    if (petButton) petButton.disabled = isDisabled;

    // 3. スタンプボタンの有効/無効化
    // 🚨 修正: スタンプボタンは常に有効（disabled=false）にし、
    // 記録済みのものは色だけ変更するようにします。
    const stampsToday = gachaLog[today] ? gachaLog[today].studyContent : [];
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        const content = button.getAttribute('data-content');
        
        // 記録済みなら色を変更
        if (stampsToday.includes(content)) {
            button.classList.add('bg-gray-400');
            button.classList.remove('bg-green-500'); 
        } else {
            button.classList.remove('bg-gray-400');
            button.classList.add('bg-green-500'); 
        }
        
        // 🚨 ここでボタンを強制的に活性化します
        button.disabled = false;
    });

    // 4. ステータス計算とインベントリUIの更新
    updateInventoryUI(); 

    // 5. データ保存
    saveData();
}


// --- イベントハンドラーとメインロジック ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. データロード
    loadData();

    // 2. スタンプ機能のイベントリスナー
    document.getElementById('study-stamps').addEventListener('click', (event) => {
        const button = event.target;
        // 🚨 修正: ここでbutton.disabledをチェックする必要はないが、コード構造として維持
        if (button.classList.contains('study-stamp-button')) {
            const content = button.getAttribute('data-content');
            
            gachaLog[today].count += 1; 
            
            if (!gachaLog[today].studyContent.includes(content)) {
                gachaLog[today].studyContent.push(content); 
            }
            
            showModal('スタンプゲット！', `今日もがんばったね！<br>ガチャ回数が **1回** 増えたよ！`);
            
            updateUI(); 
        }
    });

    // 3. ガチャ機能のイベントリスナー
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const button = event.target;
        // 🚨 修正: 確実にgacha-roll-buttonクラスとdisabled状態を確認
        if (button.classList.contains('gacha-roll-button') && !button.disabled) {
            const currentGachaCount = gachaLog[today] ? gachaLog[today].count : 0;

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
            }
        }
    });

    // 4. 初回UI更新
    updateUI(); 
});


// ------------------ グローバル関数 (HTMLから呼び出される関数) ------------------

// 🚨 修正: windowにアタッチして、HTMLから確実に呼び出せるようにします。
window.showTab = (clickedButton, tabId) => {
    // アクティブなボタンの切り替え
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    // 🚨 修正: clickedButtonが存在することを確認
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // コンテンツの切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none'; 
    });
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.style.display = 'block'; 
    }

    // 特定のタブを開いたときにUIを更新
    if (tabId === 'inventory') {
        updateInventoryUI();
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

function updateCalendarLogUI() { /* ... */ }
