// Firebase 関連のグローバル変数を使用
// These variables are provided by the canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global Firebase variables
let app, db, auth;
let userId = 'loading';
let isAuthReady = false;

// --- ゲーム設定 ---
const MAX_GACHA_COUNT = 5;
const DEFEAT_COUNT_FOR_BOSS = 5;
const EQUIP_SLOTS = {
    weapon: 2, // 武器スロットを2つに設定
    armor: 1,  // 防具スロットを1つに設定
    pet: 3,    // ペットスロットを3つに設定
};

// --- ユーザーデータ (初期値) ---
let userData = {
    // ユーザーの基本ステータス
    baseAttack: 10, // 基本攻撃力
    baseDefense: 5, // 基本防御力
    attack: 10,     // 装備込みの現在の攻撃力
    defense: 5,     // 装備込みの現在の防御力
    maxHp: 100,     // 最大HP
    hp: 100,        // 現在HP
    gachaCount: MAX_GACHA_COUNT, // 今日のガチャ残り回数
    lastGachaDate: new Date().toISOString().split('T')[0], // 最終ガチャ日

    // ゲーム進行状況
    stage: 1,       // 現在のステージ
    enemiesDefeatedInStage: 0, // 現在のステージで倒した敵の数
    battleLog: [],  // 戦闘ログ

    // アイテムと記録
    inventory: [],  // 所持アイテム ({id: number, level: number, isEquipped: boolean, bonus: {attack, defense, hp}})
    studyLog: [],   // べんきょうログ [{date: string, content: string, itemReceived: string}]
    itemIdCounter: 1, // インベントリアイテムIDのカウンター
};

// --- アイテムマスターデータ ---
// ボーナス値は基本値。レベルアップで倍率がかかる。
const items = [
    // 武器ガチャ
    { id: 101, name: "木の剣", type: 'weapon', rarity: 'N', attackBonus: 3, defenseBonus: 0, hpBonus: 0, imageUrl: "https://placehold.co/50x50/B8860B/FFFFFF?text=W1" },
    { id: 102, name: "鉄の剣", type: 'weapon', rarity: 'R', attackBonus: 7, defenseBonus: 1, hpBonus: 0, imageUrl: "https://placehold.co/50x50/708090/FFFFFF?text=W2" },
    { id: 103, name: "伝説の剣", type: 'weapon', rarity: 'SSR', attackBonus: 20, defenseBonus: 5, hpBonus: 0, imageUrl: "https://placehold.co/50x50/FFD700/000000?text=W3" },
    
    // 防具（ぼうぐ）
    { id: 201, name: "ボロい服", type: 'armor', rarity: 'N', attackBonus: 0, defenseBonus: 2, hpBonus: 10, imageUrl: "https://placehold.co/50x50/8B4513/FFFFFF?text=A1" },
    { id: 202, name: "鋼の鎧", type: 'armor', rarity: 'R', attackBonus: 1, defenseBonus: 8, hpBonus: 20, imageUrl: "https://placehold.co/50x50/4682B4/FFFFFF?text=A2" },
    
    // ペットガチャ
    { id: 301, name: "スライム", type: 'pet', rarity: 'N', attackBonus: 1, defenseBonus: 1, hpBonus: 5, imageUrl: "https://placehold.co/50x50/00FF00/000000?text=P1" },
    { id: 302, name: "妖精", type: 'pet', rarity: 'R', attackBonus: 4, defenseBonus: 2, hpBonus: 10, imageUrl: "https://placehold.co/50x50/FF69B4/FFFFFF?text=P2" },
    { id: 303, name: "ドラゴン", type: 'pet', rarity: 'SSR', attackBonus: 15, defenseBonus: 10, hpBonus: 30, imageUrl: "https://placehold.co/50x50/DC143C/FFFFFF?text=P3" },
];

// --- 敵マスターデータ ---
// ステージごとに敵のステータスが増加
const enemies = [
    { name: "眠気", baseHp: 15, baseAttack: 5, stageMultiplier: 1.2, isBoss: false, image: "https://placehold.co/50x50/800080/FFFFFF?text=Zzz" },
    { name: "誘惑", baseHp: 20, baseAttack: 8, stageMultiplier: 1.2, isBoss: false, image: "https://placehold.co/50x50/FF4500/FFFFFF?text=!" },
    { name: "サボリ魔王", baseHp: 50, baseAttack: 15, stageMultiplier: 1.5, isBoss: true, image: "https://placehold.co/50x50/000000/FF0000?text=BOSS" },
];

// --- Firebase/Firestore 関連関数 ---

/**
 * Firestoreのデータパスを取得
 * @param {string} uid ユーザーID
 * @returns {string} ドキュメントパス
 */
function getUserDocPath(uid) {
    // データは /artifacts/{appId}/users/{userId}/data/rpg_user_data に保存
    return `artifacts/${appId}/users/${uid}/data/rpg_user_data`;
}

/**
 * データをFirestoreに保存する
 */
async function saveData() {
    if (!isAuthReady || userId === 'loading') {
        console.error("Authentication not ready. Cannot save data.");
        return;
    }
    try {
        const userDocRef = doc(db, getUserDocPath(userId));
        // 保存前に、computedなデータ(attack, defenseなど)を除外したコピーを作成
        const dataToSave = { ...userData };
        delete dataToSave.attack;
        delete dataToSave.defense;
        
        await setDoc(userDocRef, dataToSave, { merge: true });
        console.log("Data saved successfully for user:", userId);
    } catch (e) {
        console.error("Error saving data: ", e);
    }
}

/**
 * データをFirestoreからロードし、リアルタイムリスナーを設定する
 */
function loadData() {
    if (!isAuthReady || userId === 'loading') return;

    const userDocRef = doc(db, getUserDocPath(userId));

    // リアルタイムリスナーを設定
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const loadedData = docSnap.data();
            
            // データをマージして更新 (inventoryの配列は上書き)
            userData = { ...userData, ...loadedData };

            // HPが最大HPを超えないように調整
            if (userData.hp > userData.maxHp) {
                userData.hp = userData.maxHp;
            }

            // 今日のガチャ回数のリセットチェック
            checkGachaReset();

            // UIをすべて更新
            updateAllUI();
            console.log("Data loaded/updated from Firestore.");
        } else {
            // 初回アクセスの場合、初期データを保存
            console.log("No initial data found. Saving default data.");
            saveData(); 
            // 初回ロード時もUIを更新
            updateAllUI();
        }
    }, (error) => {
        console.error("Error setting up data listener:", error);
    });
}

// --- 初期化処理 ---
/**
 * Firebaseと認証を初期化する
 */
async function initializeFirebase() {
    if (!firebaseConfig) {
        console.error("Firebase configuration is missing.");
        return;
    }
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // 認証状態の変更を監視
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // 初回ロード時またはログアウト時
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } else {
                // ユーザーが認証された
                userId = user.uid;
                isAuthReady = true;
                console.log("Firebase authenticated. User ID:", userId);
                
                // データをロード
                loadData();
            }
        });
        
        // Firestoreログレベルをデバッグに設定
        // import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        // setLogLevel('debug');
        
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}

// --- UI / タブ関連 ---

/**
 * すべてのUIを更新する
 */
function updateAllUI() {
    // 装備ボーナスを再計算し、ステータスを更新
    calculateStatus();
    
    // 各タブのUIを更新
    updateGachaUI();
    updateInventoryUI();
    updateEnemyUI();
    updateCalendarUI();
    
    // 現在アクティブなタブを再表示
    const activeTabId = document.querySelector('.tab-content.active')?.id || 'gacha';
    showTab(activeTabId);
}

/**
 * タブを切り替える
 * @param {string} tabId 切り替え先のタブID
 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

/**
 * HPバーの表示を更新する
 * @param {string} elementId HPバーのHTML要素ID
 * @param {number} currentHp 現在HP
 * @param {number} maxHp 最大HP
 */
function updateHpBar(elementId, currentHp, maxHp) {
    const bar = document.getElementById(elementId);
    if (bar) {
        const percentage = (currentHp / maxHp) * 100;
        bar.style.width = `${percentage}%`;
        bar.textContent = `${currentHp}/${maxHp}`;
        
        // HPの残量によって色を変える
        if (percentage > 50) {
            bar.style.backgroundColor = '#4CAF50'; // Green
        } else if (percentage > 20) {
            bar.style.backgroundColor = '#FFC107'; // Yellow
        } else {
            bar.style.backgroundColor = '#F44336'; // Red
        }
    }
}

// --- ステータスと装備 ---

/**
 * 装備アイテムから合計ボーナスを計算し、ユーザーのステータスを更新する
 */
function calculateStatus() {
    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalHpBonus = 0;
    
    // 装備中のアイテムのボーナスを集計
    userData.inventory.filter(item => item.isEquipped).forEach(invItem => {
        const baseItem = items.find(i => i.id === invItem.id);
        if (baseItem) {
            // ボーナスは (基本値 * レベル) で計算する
            const bonusMultiplier = invItem.level || 1;
            totalAttackBonus += baseItem.attackBonus * bonusMultiplier;
            totalDefenseBonus += baseItem.defenseBonus * bonusMultiplier;
            totalHpBonus += baseItem.hpBonus * bonusMultiplier;
        }
    });

    // ユーザーデータに反映
    userData.attack = userData.baseAttack + totalAttackBonus;
    userData.defense = userData.baseDefense + totalDefenseBonus;
    userData.maxHp = 100 + totalHpBonus; 
    
    // HPが最大HPを超えないように調整
    if (userData.hp > userData.maxHp) {
        userData.hp = userData.maxHp;
    }
}

/**
 * インベントリタブのUIを更新する
 */
function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    if (!invDiv) return;

    // 最新のステータスを再計算
    calculateStatus();
    
    // ステータスの表示に必要な値を取得
    const totalAttackBonus = userData.attack - userData.baseAttack;
    const totalDefenseBonus = userData.defense - userData.baseDefense;
    const totalHpBonus = userData.maxHp - 100;

    // --- 装備スロットのHTML生成 (ご要望のレイアウト) ---
    const equippedItemsMap = {}; // 装備されているアイテムをタイプごとに分類
    userData.inventory.filter(item => item.isEquipped).forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        if (!itemDetails) return;
        
        if (!equippedItemsMap[itemDetails.type]) {
            equippedItemsMap[itemDetails.type] = [];
        }
        equippedItemsMap[itemDetails.type].push(invItem);
    });

    let mainEquipHtml = '<div style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center;">'; 

    // A. ぶき (2枠) と ぼうぐ (1枠) の列
    let columnA = `
        <div style="flex: 1; max-width: 320px; background: #f0f8ff; padding: 10px; border-radius: 8px;">
            <h3>ぶき・ぼうぐ (最大 3つ)</h3>
            <div class="item-list" style="display: flex; flex-wrap: wrap; gap: 10px;">
    `;
    const slotOrderA = ['weapon', 'weapon', 'armor'];
    let usedWeaponSlots = 0;
    let usedArmorSlots = 0;

    slotOrderA.forEach(type => {
        let invItem = null;
        let slotName = type === 'weapon' ? `ぶき ${usedWeaponSlots + 1}` : 'ぼうぐ';

        if (type === 'weapon' && usedWeaponSlots < EQUIP_SLOTS.weapon && equippedItemsMap.weapon && equippedItemsMap.weapon.length > usedWeaponSlots) {
            invItem = equippedItemsMap.weapon[usedWeaponSlots];
            usedWeaponSlots++;
        } else if (type === 'armor' && usedArmorSlots < EQUIP_SLOTS.armor && equippedItemsMap.armor && equippedItemsMap.armor.length > usedArmorSlots) {
            invItem = equippedItemsMap.armor[usedArmorSlots];
            usedArmorSlots++;
        }

        if (invItem) {
            const itemDetails = items.find(item => item.id === invItem.id);
            columnA += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.itemIdCounter})" 
                     title="クリックでそうびをはずす" style="width: 90px; cursor: pointer;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em; font-weight: bold;">${itemDetails.name}</p>
                    <p style="font-size: 0.7em;">Lv.${invItem.level} (${slotName})</p>
                </div>
            `;
        } else {
             columnA += `
                <div class="item-card empty-slot" style="width: 90px;">
                    <p style="font-size: 0.8em; color: #888;">${slotName}</p>
                    <p style="font-size: 0.7em;">(あき)</p>
                </div>
            `;
        }
    });
    columnA += '</div></div>';


    // B. ペット (3枠) の列
    let columnB = `
        <div style="flex: 1; max-width: 320px; background: #f0f8ff; padding: 10px; border-radius: 8px;">
            <h3>ペット (最大 3つ)</h3>
            <div class="item-list" style="display: flex; flex-wrap: wrap; gap: 10px;">
    `;
    const slotOrderB = ['pet', 'pet', 'pet'];
    let usedPetSlots = 0;

    slotOrderB.forEach((type, index) => {
        let invItem = null;
        let slotName = `ペット ${index + 1}`;

        if (usedPetSlots < EQUIP_SLOTS.pet && equippedItemsMap.pet && equippedItemsMap.pet.length > usedPetSlots) {
            invItem = equippedItemsMap.pet[usedPetSlots];
            usedPetSlots++;
        }
        
        if (invItem) {
            const itemDetails = items.find(item => item.id === invItem.id);
            columnB += `
                <div class="item-card equipped-card" onclick="unequipItem(${invItem.itemIdCounter})" 
                     title="クリックでそうびをはずす" style="width: 90px; cursor: pointer;">
                    <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                    <p style="font-size: 0.8em; font-weight: bold;">${itemDetails.name}</p>
                    <p style="font-size: 0.7em;">Lv.${invItem.level} (${slotName})</p>
                </div>
            `;
        } else {
             columnB += `
                <div class="item-card empty-slot" style="width: 90px;">
                    <p style="font-size: 0.8em; color: #888;">${slotName}</p>
                    <p style="font-size: 0.7em;">(あき)</p>
                </div>
            `;
        }
    });
    columnB += '</div></div>';

    mainEquipHtml += columnA + columnB + '</div>'; // 2つの列を結合

    // --- 未装備アイテムのHTML生成 ---
    let unequippedHtml = '<h3>もちもの (クリックでそうび・きょうか)</h3><div class="item-list">';
    userData.inventory.filter(item => !item.isEquipped).forEach(invItem => {
        const itemDetails = items.find(item => item.id === invItem.id);
        const bonusMultiplier = invItem.level || 1;
        
        // 装備可能かチェック
        const equippedCount = userData.inventory.filter(i => i.isEquipped && items.find(it => it.id === i.id)?.type === itemDetails.type).length;
        const canEquip = equippedCount < EQUIP_SLOTS[itemDetails.type];
        
        // 装備ボタンと強化ボタン
        const actionButton = canEquip 
            ? `<button onclick="equipItem(${invItem.itemIdCounter})" class="equip-button">そうび</button>`
            : `<button disabled class="equip-button" style="background: #ccc;">スロットなし</button>`;
            
        const enhanceButton = `<button onclick="showEnhanceModal(${invItem.itemIdCounter})" class="enhance-button">きょうか</button>`;
        
        unequippedHtml += `
            <div class="item-card" style="width: 140px;">
                <img src="${itemDetails.imageUrl}" alt="${itemDetails.name}">
                <p style="font-weight: bold;">${itemDetails.name}</p>
                <p>Lv: ${invItem.level}</p>
                <p style="font-size: 0.8em; color: #007bff;">
                    ${itemDetails.attackBonus > 0 ? `攻撃+${itemDetails.attackBonus * bonusMultiplier}` : ''}
                    ${itemDetails.defenseBonus > 0 ? `防御+${itemDetails.defenseBonus * bonusMultiplier}` : ''}
                    ${itemDetails.hpBonus > 0 ? `HP+${itemDetails.hpBonus * bonusMultiplier}` : ''}
                </p>
                <div style="display: flex; gap: 5px; justify-content: center;">
                    ${actionButton}
                    ${enhanceButton}
                </div>
            </div>
        `;
    });
    unequippedHtml += '</div>';

    const statusHtml = `
        <h2>キャラクターと アイテムいちらん</h2>
        <p style="font-size: 0.8em; color: #555;">ユーザーID: ${userId}</p>
        <div id="character-status" style="margin-bottom: 20px; padding: 15px; border: 2px solid #007bff; border-radius: 8px;">
            <h3 style="color: #007bff;">ステータス</h3>
            <p><strong>たいりょく:</strong> ${userData.hp} / ${userData.maxHp} (きほん: 100 + ほせい: ${totalHpBonus})</p>
            <p><strong>こうげき力:</strong> ${userData.attack} (きほん: ${userData.baseAttack} + ほせい: ${totalAttackBonus})</p>
            <p><strong>ぼうぎょ力:</strong> ${userData.defense} (きほん: ${userData.baseDefense} + ほせい: ${totalDefenseBonus})</p>
        </div>
        <hr>
        <h3>そうびちゅう</h3>
        ${mainEquipHtml}
        <hr>
        ${unequippedHtml}
        <div id="enhancement-modal" class="modal"></div>
    `;
    
    invDiv.innerHTML = statusHtml;
    saveData();
}

/**
 * アイテムを装備する
 * @param {number} invItemId インベントリアイテムのユニークID
 */
function equipItem(invItemId) {
    const invItem = userData.inventory.find(item => item.itemIdCounter === invItemId);
    if (!invItem) return;

    const itemDetails = items.find(i => i.id === invItem.id);
    if (!itemDetails) return;

    // 現在装備している同タイプのアイテム数をチェック
    const equippedCount = userData.inventory.filter(i => 
        i.isEquipped && items.find(it => it.id === i.id)?.type === itemDetails.type
    ).length;

    // スロット上限を超えていないか確認
    if (equippedCount < EQUIP_SLOTS[itemDetails.type]) {
        invItem.isEquipped = true;
        
        // UIを更新し、データを保存
        updateInventoryUI();
        // 戦闘タブのHPバーとステータスも更新が必要
        updateEnemyUI(); 
        
    } else {
        alert("これいじょう このタイプの アイテムは そうびできません。"); // アラートの代わりにカスタムモーダルを使用することを推奨
    }
    saveData();
}

/**
 * 装備をはずす
 * @param {number} invItemId インベントリアイテムのユニークID
 */
function unequipItem(invItemId) {
    const invItem = userData.inventory.find(item => item.itemIdCounter === invItemId && item.isEquipped);
    if (invItem) {
        invItem.isEquipped = false;
    }
    
    // UIを更新し、データを保存
    updateInventoryUI();
    // 戦闘タブのHPバーとステータスも更新が必要
    updateEnemyUI(); 
    saveData();
}

// --- 強化機能 ---

/**
 * 強化モーダルを表示する
 * @param {number} invItemId インベントリアイテムのユニークID
 */
function showEnhanceModal(invItemId) {
    const modal = document.getElementById('enhancement-modal');
    const invItem = userData.inventory.find(item => item.itemIdCounter === invItemId);

    if (!modal || !invItem) return;

    const itemDetails = items.find(i => i.id === invItem.id);
    const cost = (invItem.level || 1) * 10;
    
    // 強化ボーナス
    const nextLevel = invItem.level + 1;
    const currentAttack = itemDetails.attackBonus * invItem.level;
    const nextAttack = itemDetails.attackBonus * nextLevel;
    const currentDefense = itemDetails.defenseBonus * invItem.level;
    const nextDefense = itemDetails.defenseBonus * nextLevel;
    const currentHp = itemDetails.hpBonus * invItem.level;
    const nextHp = itemDetails.hpBonus * nextLevel;

    modal.innerHTML = `
        <div class="modal-content">
            <h3>${itemDetails.name} Lv.${invItem.level} のきょうか</h3>
            <p>つぎのレベル: Lv.${nextLevel}</p>
            
            <p>きょうかコスト: スタンプ ${cost} こ</p>
            
            <p><strong>ステータスへんか:</strong></p>
            <ul>
                ${itemDetails.attackBonus > 0 ? `<li>こうげき力: ${currentAttack} $\\rightarrow$ ${nextAttack} (+${itemDetails.attackBonus})</li>` : ''}
                ${itemDetails.defenseBonus > 0 ? `<li>ぼうぎょ力: ${currentDefense} $\\rightarrow$ ${nextDefense} (+${itemDetails.defenseBonus})</li>` : ''}
                ${itemDetails.hpBonus > 0 ? `<li>HP: ${currentHp} $\\rightarrow$ ${nextHp} (+${itemDetails.hpBonus})</li>` : ''}
            </ul>
            
            <button onclick="applyEnhancement(${invItemId}, ${cost})" style="background: #28a745;">きょうかをじっこう</button>
            <button onclick="document.getElementById('enhancement-modal').style.display='none'">キャンセル</button>
        </div>
    `;
    modal.style.display = 'block';
}

/**
 * 強化を適用する
 * @param {number} invItemId インベントリアイテムのユニークID
 * @param {number} cost 強化コスト
 */
function applyEnhancement(invItemId, cost) {
    const invItem = userData.inventory.find(item => item.itemIdCounter === invItemId);
    const modal = document.getElementById('enhancement-modal');

    if (userData.gachaCount < cost) {
        modal.innerHTML = `
            <div class="modal-content">
                <h3>エラー</h3>
                <p>スタンプが たりません! (ひつよう: ${cost}, げんざい: ${userData.gachaCount})</p>
                <button onclick="document.getElementById('enhancement-modal').style.display='none'">とじる</button>
            </div>
        `;
        return;
    }

    userData.gachaCount -= cost;
    invItem.level = (invItem.level || 1) + 1;
    
    // 装備中の場合、ステータスを再計算してHPバーも更新
    if(invItem.isEquipped) {
        calculateStatus();
    }
    
    modal.style.display = 'none';
    updateInventoryUI();
    updateGachaUI(); // スタンプ数の更新
    updateEnemyUI(); // 戦闘タブのステータスとHPバーの更新
    
    // カスタムメッセージ
    document.getElementById('gacha-result').innerHTML = `<p style="color: green;">きょうか せいこう! ${invItem.name} が Lv.${invItem.level} に なった!</p>`;
    
    saveData();
}


// --- ガチャとログ ---

/**
 * ガチャUIを更新する
 */
function updateGachaUI() {
    document.getElementById('gacha-count').textContent = userData.gachaCount;
}

/**
 * 今日の日付と最終ガチャ日を比較し、ガチャ回数をリセットする
 */
function checkGachaReset() {
    const today = new Date().toISOString().split('T')[0];
    if (userData.lastGachaDate !== today) {
        userData.gachaCount = MAX_GACHA_COUNT;
        userData.lastGachaDate = today;
        updateGachaUI();
        saveData();
        // ログアウト状態などでリセットされた場合のメッセージを出すことも可能
    }
}

/**
 * ガチャを実行し、スタディログを記録する
 */
async function performGacha(event) {
    event.preventDefault();
    
    const studyContent = document.getElementById('study-content').value.trim();
    const gachaType = document.getElementById('gacha-type').value;
    const resultDiv = document.getElementById('gacha-result');

    if (!studyContent) {
        resultDiv.innerHTML = '<p style="color: red;">べんきょうないようを かいてね!</p>';
        return;
    }

    if (userData.gachaCount <= 0) {
        resultDiv.innerHTML = '<p style="color: red;">きょうの ガチャは おわりだよ!</p>';
        return;
    }
    
    userData.gachaCount--;
    
    // 1. アイテム抽選
    let availableItems = items.filter(i => i.type === gachaType);
    if (gachaType === 'weapon' || gachaType === 'armor') {
        availableItems = items.filter(i => i.type === 'weapon' || i.type === 'armor'); // 武器/防具ガチャ
    } else if (gachaType === 'pet') {
        availableItems = items.filter(i => i.type === 'pet'); // ペットガチャ
    }
    
    // レアリティごとの確率 (N: 70%, R: 25%, SSR: 5%)
    const rand = Math.random() * 100;
    let rarity;
    if (rand < 5) {
        rarity = 'SSR';
    } else if (rand < 30) { // 5 + 25 = 30
        rarity = 'R';
    } else {
        rarity = 'N';
    }
    
    const candidates = availableItems.filter(item => item.rarity === rarity);
    const receivedItemDetails = candidates[Math.floor(Math.random() * candidates.length)];
    
    // 2. アイテムをインベントリに追加
    const newItem = {
        itemIdCounter: userData.itemIdCounter++, // ユニークなインベントリID
        id: receivedItemDetails.id, 
        level: 1, 
        isEquipped: false,
    };
    userData.inventory.push(newItem);
    
    // 3. べんきょうログを記録
    const today = new Date().toISOString().split('T')[0];
    userData.studyLog.unshift({
        date: today,
        content: studyContent,
        itemReceived: receivedItemDetails.name
    });
    
    // 4. UI更新と保存
    updateGachaUI();
    updateInventoryUI();
    updateCalendarUI();

    resultDiv.innerHTML = `
        <p style="color: ${rarity === 'SSR' ? 'gold' : rarity === 'R' ? 'purple' : 'inherit'}; font-weight: bold;">
            ${receivedItemDetails.name} を ゲットした! (${rarity})
        </p>
        <p>のこり ${userData.gachaCount} かい</p>
    `;

    // 入力フォームをリセット
    document.getElementById('study-content').value = '';
    
    saveData();
}

// --- 戦闘関連 ---

/**
 * 敵タブのUIを更新する
 */
function updateEnemyUI() {
    const enemyContainer = document.getElementById('enemy-container');
    const playerStatusDiv = document.getElementById('player-status-enemy-tab');
    if (!enemyContainer || !playerStatusDiv) return;

    // ステージと敵の決定
    const stage = userData.stage;
    const isBossStage = userData.enemiesDefeatedInStage >= DEFEAT_COUNT_FOR_BOSS;
    const currentEnemyMaster = isBossStage ? enemies.find(e => e.isBoss) : enemies.find(e => !e.isBoss);
    if (!currentEnemyMaster) return; // エラー回避

    const stageText = isBossStage ? `ステージ ${stage} ボスせん` : `ステージ ${stage} せんとう`;

    // プレイヤーのステータスを表示 (装備効果が反映された最新値)
    playerStatusDiv.innerHTML = `
        <h3>${stageText}</h3>
        <p>たおしたてきの数: ${userData.enemiesDefeatedInStage} / ${DEFEAT_COUNT_FOR_BOSS}たい</p>
        <p>じぶんの たいりょく:</p>
        <div class="hp-bar-container" style="margin-bottom: 10px;">
            <div id="player-hp-bar" class="hp-bar" style="height: 25px;"></div>
        </div>
        <p>こうげき力: <strong>${userData.attack}</strong> / ぼうぎょ力: <strong>${userData.defense}</strong></p>
        <button onclick="startBattle()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">たたかう!</button>
    `;
    updateHpBar('player-hp-bar', userData.hp, userData.maxHp);

    // 敵のステータスを計算
    const enemyHp = Math.floor(currentEnemyMaster.baseHp * (currentEnemyMaster.stageMultiplier ** stage));
    const enemyAttack = Math.floor(currentEnemyMaster.baseAttack * (currentEnemyMaster.stageMultiplier ** stage));

    // 敵のカードを表示
    enemyContainer.innerHTML = `
        <div class="enemy-card">
            <h4>てき: ${currentEnemyMaster.name}</h4>
            <img src="${currentEnemyMaster.image}" alt="${currentEnemyMaster.name}" style="width: 70px; height: 70px; margin: 10px;">
            <p>HP: ${enemyHp}</p>
            <p>こうげき力: ${enemyAttack}</p>
            <p>ぼうぎょ力: ステージ ${stage} の べんきょう</p>
        </div>
    `;

    // ログの表示
    const battleLogDiv = document.getElementById('battle-log');
    if (battleLogDiv) {
        battleLogDiv.innerHTML = '<h3>せんとうログ</h3>' + userData.battleLog.slice(0, 5).map(log => `<p class="log-entry">${log}</p>`).join('');
    }
}

/**
 * 戦闘を開始する（プレイヤーのHP回復処理）
 */
function startBattle() {
    // 戦闘前にHPを全回復
    userData.hp = userData.maxHp;
    userData.battleLog = [];
    
    // 戦闘開始
    fightEnemy();
    saveData();
}

/**
 * 敵と戦闘するロジック
 */
function fightEnemy() {
    const stage = userData.stage;
    const isBossStage = userData.enemiesDefeatedInStage >= DEFEAT_COUNT_FOR_BOSS;
    const currentEnemyMaster = isBossStage ? enemies.find(e => e.isBoss) : enemies.find(e => !e.isBoss);
    if (!currentEnemyMaster) return;

    // 敵のステータスを計算 (敵の防御力は0として扱い、プレイヤーの防御力でダメージを軽減)
    let enemyHp = Math.floor(currentEnemyMaster.baseHp * (currentEnemyMaster.stageMultiplier ** stage));
    const enemyAttack = Math.floor(currentEnemyMaster.baseAttack * (currentEnemyMaster.stageMultiplier ** stage));
    
    // ログに初期メッセージを追加
    userData.battleLog.unshift(`ステージ ${stage}: ${currentEnemyMaster.name} が あらわれた!`);
    
    let turns = 0;
    let playerWon = false;
    
    while (userData.hp > 0 && enemyHp > 0 && turns < 50) { // 50ターンで強制終了 (無限ループ防止)
        turns++;
        
        // 1. プレイヤーの攻撃
        const playerDamageToEnemy = Math.max(1, userData.attack - 1); // 敵の防御力は1とする
        enemyHp -= playerDamageToEnemy;
        userData.battleLog.unshift(`[ターン${turns}] じぶんの こうげき! ${currentEnemyMaster.name} に ${playerDamageToEnemy} の ダメージ! (のこりHP: ${enemyHp})`);
        
        if (enemyHp <= 0) {
            playerWon = true;
            break;
        }

        // 2. 敵の攻撃
        const enemyDamageToPlayer = Math.max(1, enemyAttack - userData.defense);
        userData.hp -= enemyDamageToPlayer;
        userData.battleLog.unshift(`[ターン${turns}] ${currentEnemyMaster.name} の こうげき! ${enemyDamageToPlayer} の ダメージを うけた! (のこりHP: ${userData.hp})`);
    }

    // --- 戦闘結果の処理 ---
    
    if (playerWon) {
        userData.battleLog.unshift(`${currentEnemyMaster.name} を たおした!`);
        
        if (isBossStage) {
            userData.battleLog.unshift(`ボス せいばつ! ステージ ${stage} クリア!`);
            userData.stage++;
            userData.enemiesDefeatedInStage = 0;
            userData.battleLog.unshift(`つぎの ステージ ${userData.stage} へ すすむ!`);
        } else {
            userData.enemiesDefeatedInStage++;
        }
    } else {
        // 敗北（HPが0以下になった場合）
        userData.hp = 1; // 負けてもHPは1残るようにする (ペナルティは無し)
        userData.battleLog.unshift(`せんとうに まけた... HPが ぜんかい ふっかつした! もういちど がんばろう!`);
    }

    // UIを更新して結果を表示
    updateEnemyUI();
    saveData();
}

// --- カレンダー / ログ ---

/**
 * カレンダー（べんきょうログ）UIを更新する
 */
function updateCalendarUI() {
    const logList = document.getElementById('study-log-list');
    if (!logList) return;
    
    logList.innerHTML = '';
    
    // 最新のログから最大100件を表示
    userData.studyLog.slice(0, 100).forEach(log => {
        const li = document.createElement('li');
        li.className = 'study-log-item';
        li.innerHTML = `
            <strong>${log.date}</strong>: ${log.content} 
            <span style="color: #007bff; font-size: 0.9em;">(アイテム: ${log.itemReceived})</span>
        `;
        logList.appendChild(li);
    });
}

// --- イベントリスナーの設定 ---
document.addEventListener('DOMContentLoaded', () => {
    // フォームのイベントリスナーを設定
    const gachaForm = document.getElementById('gacha-form');
    if (gachaForm) {
        gachaForm.addEventListener('submit', performGacha);
    }

    // 初期化とデータロードを開始
    initializeFirebase();

    // デフォルトでガチャタブを表示
    showTab('gacha');
});
