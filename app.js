// --------------------------------------------------------------------------
// 🌟 Ver0.14: ガチャ回数ロジックの修正 🌟
// --------------------------------------------------------------------------

// --- 初期データと変数 ---
const today = new Date().toISOString().slice(0, 10);
// 🚨 修正: MAX_GACHA_COUNTは使わないが、初期化のために残しておく
const MAX_GACHA_COUNT_INITIAL = 5; 
const BASE_STATS_HP = 100;
const BASE_STATS_ATTACK = 10;
const BASE_STATS_DEFENSE = 5;
const ENHANCEMENT_RATE = 1.2;
const PET_GROWTH_RATE = 0.001;

// プレイヤーのメインステータスと持ち物 (変更なし)
let userData = {
    hp: BASE_STATS_HP,
    maxHp: BASE_STATS_HP,
    baseAttack: BASE_STATS_ATTACK,
    baseDefense: BASE_STATS_DEFENSE,
    attack: BASE_STATS_ATTACK,
    defense: BASE_STATS_DEFENSE,
    inventory: [] 
};

// 日別スタンプ記録とガチャ回数
// 🚨 修正: gachaLog[today].count を「今日利用できるガチャ回数」として扱う
let gachaLog = {}; 

// --- 戦闘関連データ (変更なし) ---
let currentStage = 1;
let enemiesDefeatedInStage = 0; 
const ENEMY_DEFEAT_COUNT_TO_BOSS = 15; 

const items = [ /* ... 変更なし ... */ ];
const enemies = { /* ... 変更なし ... */ };
let currentEnemy = null;


// --- データほぞん・よみこみ関数 ---

function saveData() {
    // ... 変更なし ...
}

function loadData() {
    // ... (userData, currentStage, enemiesDefeatedInStage のロードは変更なし) ...

    const savedGachaLog = localStorage.getItem('gachaLog');
    if (savedGachaLog) {
        gachaLog = JSON.parse(savedGachaLog);
    }
    
    // 🚨 修正: 今日のログがない場合、初期化とHP回復
    if (!gachaLog[today]) {
        userData.hp = userData.maxHp; 
        // 🚨 初期化時、ガチャ回数を0、スタンプ記録を空に
        gachaLog[today] = { count: 0, studyContent: [] }; 
    }
    
    // 🚨 過去のログの日付が残っているが、今日の回数だけを使う
    // gachaLog[today].count が設定されていない場合（古いデータ構造の場合など）も 0 に初期化
    gachaLog[today].count = gachaLog[today].count || 0;
}


// --- 共通の計算ロジック, インベントリ操作ロジック, UI更新とステータス計算 (変更なし) ---
// ... (変更なし) ...

/** 画面全体に関わるUI更新関数 */
function updateUI() {
    // 1. ガチャ回数更新 
    // 🚨 修正: gachaCountは gachaLog[today].count をそのまま使用
    const gachaCount = gachaLog[today] ? gachaLog[today].count : 0;
    document.getElementById('gacha-count').textContent = gachaCount;

    // 2. ガチャボタンの有効/無効化
    const isDisabled = gachaCount <= 0;
    const weaponButton = document.getElementById('gacha-roll-weapon');
    const petButton = document.getElementById('gacha-roll-pet');

    if (weaponButton) weaponButton.disabled = isDisabled;
    if (petButton) petButton.disabled = isDisabled;

    // 3. スタンプボタンの有効/無効化
    // 🚨 修正: スタンプの有効/無効化ロジックを変更 (スタンプは何度でも押せるが、記録済みは色を変える)
    const stampsToday = gachaLog[today] ? gachaLog[today].studyContent : [];
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        const content = button.getAttribute('data-content');
        if (stampsToday.includes(content)) {
            // スタンプは押せるが、色を変える
            button.classList.add('bg-gray-400');
            button.classList.remove('bg-green-500'); 
        } else {
            // 未記録のスタンプは通常色
            button.classList.remove('bg-gray-400');
            button.classList.add('bg-green-500'); 
        }
        button.disabled = false; // スタンプは常に押せるように
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
        if (button.classList.contains('study-stamp-button') && !button.disabled) {
            const content = button.getAttribute('data-content');
            
            // 🚨 修正: スタンプを押すとガチャ回数が1回増える
            gachaLog[today].count += 1; 
            
            // 🚨 修正: スタンプは一度押したら記録する
            if (!gachaLog[today].studyContent.includes(content)) {
                gachaLog[today].studyContent.push(content); 
            }
            
            showModal('スタンプゲット！', `「${content}」を記録しました！<br>ガチャ回数が **1回** 増えたよ！`);
            
            updateUI(); 
        }
    });

    // 3. ガチャ機能のイベントリスナー
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('gacha-roll-button') && !button.disabled) {
            const currentGachaCount = gachaLog[today] ? gachaLog[today].count : 0;

            if (currentGachaCount > 0) {
                // 🚨 修正: ガチャを回すとガチャ回数が1回減る
                gachaLog[today].count -= 1; 
                
                // ... (ガチャ実行ロジックは変更なし) ...
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


// ------------------ 戦闘ロジック (ボスボーナス部分のみ修正) ------------------

window.attackEnemy = () => {
    if (!currentEnemy || userData.hp <= 0) { return; }
    
    const logElement = document.getElementById('battle-log');
    let log = '';

    // 1. プレイヤーの攻撃 (ダメージ計算は変更なし)
    const playerDamage = Math.max(1, userData.attack - currentEnemy.defense);
    currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - playerDamage);
    log += `プレイヤーの攻撃！${currentEnemy.name} に ${playerDamage} のダメージを与えた。<br>`;
    
    // ... (アニメーション、HP更新は変更なし) ...
    
    // 2. 勝利判定
    if (currentEnemy.currentHp <= 0) {
        log += `**${currentEnemy.name} を倒した！🎉**<br>`;
        enemiesDefeatedInStage++;
        
        log += `経験値 ${currentEnemy.xp} と ${currentEnemy.gold} G を手に入れた。<br>`;

        if (currentEnemy.isBoss) {
            // 🚨 修正: ボス撃破時にガチャ回数を3回増やす
            const bossBonus = 3;
            gachaLog[today].count += bossBonus; // ガチャ回数にボーナス加算
            
            log += `**ステージ ${currentStage} クリア！** 次のステージへ。<br>`;
            currentStage++;
            enemiesDefeatedInStage = 0;
            
            showModal('🎉 ボス撃破ボーナス！', `おめでとう！ボスをたおしたよ！ガチャボーナス＋${bossBonus}だよ！`);
        }

        currentEnemy = null; 
        logElement.innerHTML = log + logElement.innerHTML; 
        updateUI(); 
        updateEnemyUI(); 
        return;
    }

    // 3. 敵の反撃 (変更なし)
    // 4. 敗北判定 (変更なし)

    // ... (ログ表示とUI更新は変更なし) ...
};

// ------------------ その他の関数 (変更なし) ------------------
// ... (loadData, showTab, updateCalendarLogUI などは変更なし) ...
