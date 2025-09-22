import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firestoreのデバッグログを有効化（開発用）
setLogLevel('Debug');

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;
let userData = {
    gold: 0,
    items: [],
    equipped: {
        head: null,
        body: null,
        leg: null,
        weapon: null,
        pets: [null, null, null],
    },
    playerStats: {
        level: 1,
        exp: 0,
        gachaCount: 0,
        enemyCount: 0
    },
    calendar: {}, // 新しいカレンダーデータ
    treasureBoxCount: 0, // 今日の宝箱を開けた回数
    lastLoginDate: '' // 最後にログインした日付
};

// スキルマスタデータ
const SKILL_MASTER_DATA = {
    'こうげききょうか': { baseEffect: 0.05, stat: '攻撃力' },
    'ぼうぎょきょうか': { baseEffect: 0.05, stat: '防御力' },
    'たいりょくきょうか': { baseEffect: 0.05, stat: '体力' },
    'めいちゅうきょうか': { baseEffect: 0.02, description: '与えるダメージが1.5倍になる' },
    'きあいきょうか': { baseEffect: 0.02, description: '体力が0になる際に1残る' }
};

// レアリティごとのレベル上限
const MAX_LEVELS = {
    'N': 5,
    'R': 10,
    'SR': 20,
    'SSR': 30,
    'UR': 50
};

// キャラクターの基本ステータス
const CHARACTER_BASE_STATS = {
    attack: 10,
    defense: 10,
    health: 100
};

// 武器マスタデータ
const WEAPON_MASTER_DATA = [
    { id: 'w_001', name: '木の剣', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f9f9f9/222?text=木の剣', attack: 5, skill: [{name: 'こうげききょうか', level: 1}], type: 'weapon'},
    { id: 'w_002', name: '石の剣', rarity: 'R', imageUrl: 'https://placehold.co/128x128/e9e9e9/222?text=石の剣', attack: 15, skill: [{name: 'こうげききょうか', level: 1}], type: 'weapon'},
    { id: 'w_003', name: '銅の剣', rarity: 'SR', imageUrl: 'https://placehold.co/128x128/c9c9c9/222?text=銅の剣', attack: 30, skill: [{name: 'こうげききょうか', level: 1}], type: 'weapon'},
    { id: 'w_004', name: '銀の剣', rarity: 'SSR', imageUrl: 'https://placehold.co/128x128/a9a9a9/222?text=銀の剣', attack: 50, skill: [{name: 'こうげききょうか', level: 1}], type: 'weapon'},
    { id: 'w_005', name: '伝説の聖剣', rarity: 'UR', imageUrl: 'https://placehold.co/128x128/ffe4b5/222?text=伝説の聖剣', attack: 100, skill: [{name: 'こうげききょうか', level: 1}, {name: 'めいちゅうきょうか', level: 1}], type: 'weapon'}
];

// 防具マスタデータ
const ARMOR_MASTER_DATA = [
    { id: 'a_001', name: 'ボロボロの兜', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f9f9f9/222?text=ボロボロの兜', defense: 2, health: 5, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'head'},
    { id: 'a_002', name: 'ボロボロの鎧', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f9f9f9/222?text=ボロボロの鎧', defense: 3, health: 10, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'body'},
    { id: 'a_003', name: 'ボロボロの足甲', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f9f9f9/222?text=ボロボロの足甲', defense: 1, health: 3, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'leg'},
    { id: 'a_004', name: '鉄の兜', rarity: 'R', imageUrl: 'https://placehold.co/128x128/e9e9e9/222?text=鉄の兜', defense: 5, health: 15, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'head'},
    { id: 'a_005', name: '鉄の鎧', rarity: 'R', imageUrl: 'https://placehold.co/128x128/e9e9e9/222?text=鉄の鎧', defense: 8, health: 25, skill: [{name: 'たいりょくきょうか', level: 1}], type: 'body'},
    { id: 'a_006', name: '鉄の足甲', rarity: 'R', imageUrl: 'https://placehold.co/128x128/e9e9e9/222?text=鉄の足甲', defense: 4, health: 10, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'leg'},
    { id: 'a_007', name: '銀の兜', rarity: 'SSR', imageUrl: 'https://placehold.co/128x128/a9a9a9/222?text=銀の兜', defense: 15, health: 40, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'head'},
    { id: 'a_008', name: '銀の鎧', rarity: 'SSR', imageUrl: 'https://placehold.co/128x128/a9a9a9/222?text=銀の鎧', defense: 25, health: 70, skill: [{name: 'たいりょくきょうか', level: 1}, {name: 'きあいきょうか', level: 1}], type: 'body'},
    { id: 'a_009', name: '銀の足甲', rarity: 'SSR', imageUrl: 'https://placehold.co/128x128/a9a9a9/222?text=銀の足甲', defense: 10, health: 25, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'leg'},
    { id: 'a_010', name: '神聖な王冠', rarity: 'UR', imageUrl: 'https://placehold.co/128x128/ffe4b5/222?text=神聖な王冠', defense: 30, health: 80, skill: [{name: 'こうげききょうか', level: 1}, {name: 'たいりょくきょうか', level: 1}], type: 'head'},
    { id: 'a_011', name: '伝説の鎧', rarity: 'UR', imageUrl: 'https://placehold.co/128x128/ffe4b5/222?text=伝説の鎧', defense: 50, health: 150, skill: [{name: 'こうげききょうか', level: 1}, {name: 'ぼうぎょきょうか', level: 1}], type: 'body'},
    { id: 'a_012', name: '伝説の靴', rarity: 'UR', imageUrl: 'https://placehold.co/128x128/ffe4b5/222?text=伝説の靴', defense: 20, health: 60, skill: [{name: 'こうげききょうか', level: 1}, {name: 'めいちゅうきょうか', level: 1}], type: 'leg'},
];

// ペットマスタデータ
const PET_MASTER_DATA = [
    { id: 'p_001', name: 'スライム', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f0fff0/1e40af?text=スライム', health: 10, skill: [{name: 'たいりょくきょうか', level: 1}], type: 'pet'},
    { id: 'p_002', name: '小さい猫', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f0fff0/1e40af?text=小さい猫', health: 8, skill: [{name: 'めいちゅうきょうか', level: 1}], type: 'pet'},
    { id: 'p_003', name: '子犬', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f0fff0/1e40af?text=子犬', health: 9, skill: [{name: 'きあいきょうか', level: 1}], type: 'pet'},
    { id: 'p_004', name: 'ヒヨコ', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f0fff0/1e40af?text=ヒヨコ', health: 7, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'pet'},
    { id: 'p_005', name: '小さなウサギ', rarity: 'N', imageUrl: 'https://placehold.co/128x128/f0fff0/1e40af?text=小さなウサギ', health: 8, skill: [{name: 'たいりょくきょうか', level: 1}], type: 'pet'},
    { id: 'p_006', name: '火の精霊', rarity: 'R', imageUrl: 'https://placehold.co/128x128/ffefef/ef4444?text=火の精霊', health: 15, skill: [{name: 'こうげききょうか', level: 1}], type: 'pet'},
    { id: 'p_007', name: '水の精霊', rarity: 'R', imageUrl: 'https://placehold.co/128x128/eff0ff/3b82f6?text=水の精霊', health: 15, skill: [{name: 'たいりょくきょうか', level: 1}], type: 'pet'},
    { id: 'p_008', name: '風の精霊', rarity: 'R', imageUrl: 'https://placehold.co/128x128/f0ffff/008080?text=風の精霊', health: 15, skill: [{name: 'きあいきょうか', level: 1}], type: 'pet'},
    { id: 'p_009', name: '土の精霊', rarity: 'R', imageUrl: 'https://placehold.co/128x128/f5f5dc/8b4513?text=土の精霊', health: 18, skill: [{name: 'ぼうぎょきょうか', level: 1}], type: 'pet'},
    { id: 'p_010', name: 'フェニックス', rarity: 'SR', imageUrl: 'https://placehold.co/128x128/ffbf00/8b4513?text=フェニックス', health: 30, skill: [{name: 'たいりょくきょうか', level: 1}], type: 'pet'},
    { id: 'p_011', name: 'グリフォン', rarity: 'SR', imageUrl: 'https://placehold.co/128x128/ccffcc/008000?text=グリフォン', health: 35, skill: [{name: 'こうげききょうか', level: 1}, {name: 'めいちゅうきょうか', level: 1}], type: 'pet'},
    { id: 'p_012', name: 'ドラゴン', rarity: 'SR', imageUrl: 'https://placehold.co/128x128/a9a9a9/8b0000?text=ドラゴン', health: 40, skill: [{name: 'きあいきょうか', level: 1}], type: 'pet'},
    { id: 'p_013', name: '幻獣キメラ', rarity: 'SSR', imageUrl: 'https://placehold.co/128x128/f0f8ff/4169e1?text=幻獣キメラ', health: 50, skill: [{name: 'こうげききょうか', level: 1}, {name: 'ぼうぎょきょうか', level: 1}], type: 'pet'},
    { id: 'p_014', name: '伝説のユニコーン', rarity: 'SSR', imageUrl: 'https://placehold.co/128x128/e6e6fa/8a2be2?text=伝説のユニコーン', health: 60, skill: [{name: 'たいりょくきょうか', level: 1}, {name: 'きあいきょうか', level: 1}], type: 'pet'},
    { id: 'p_015', name: '神獣ケルベロス', rarity: 'UR', imageUrl: 'https://placehold.co/128x128/2c3e50/ecf0f1?text=神獣ケルベロス', health: 100, skill: [{name: 'こうげききょうか', level: 1}, {name: 'ぼうぎょきょうか', level: 1}, {name: 'きあいきょうか', level: 1}], type: 'pet'}
];

// 強化アイテムマスタ
const UPGRADE_ITEM_MASTER = {
    id: 'up_001',
    name: '強化アイテム',
    imageUrl: 'https://placehold.co/128x128/fff2f2/ef4444?text=強化',
    description: '武器を強化するアイテム',
};

// レアガチャデータ
const RARE_GACHA_DATA = [...WEAPON_MASTER_DATA, ...ARMOR_MASTER_DATA, ...PET_MASTER_DATA];
const WEAPON_ARMOR_GACHA_DATA = [...WEAPON_MASTER_DATA, ...ARMOR_MASTER_DATA];

// アプリの初期化とユーザー認証
async function initApp() {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        userId = auth.currentUser.uid;
        document.getElementById('user-id').textContent = userId;
        setupFirestoreListener();
    } catch (error) {
        console.error("Firebase Auth Error:", error);
    }
}

// Firestoreのリアルタイムリスナーを設定
function setupFirestoreListener() {
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/user_data/main`);
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            userData = docSnap.data();
            // 日付が変わったら宝箱の回数をリセット
            const today = new Date().toISOString().split('T')[0];
            if (userData.lastLoginDate !== today) {
                userData.treasureBoxCount = 0;
                userData.lastLoginDate = today;
                updateFirestore({
                    treasureBoxCount: 0,
                    lastLoginDate: today
                });
            }
        } else {
            const today = new Date().toISOString().split('T')[0];
            setDoc(docRef, { ...userData, lastLoginDate: today });
        }
        updateUI();
    });
}

// Firestoreのデータを更新
async function updateFirestore(data) {
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/user_data/main`);
    try {
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Firestore update failed:", error);
    }
}

// 総合ステータスの計算
function calculateTotalStats() {
    let totalAttack = CHARACTER_BASE_STATS.attack + (userData.playerStats.level - 1) * 2;
    let totalDefense = CHARACTER_BASE_STATS.defense + (userData.playerStats.level - 1) * 1;
    let totalHealth = CHARACTER_BASE_STATS.health + (userData.playerStats.level - 1) * 10;
    
    const equipped = [
        userData.equipped.head,
        userData.equipped.body,
        userData.equipped.leg,
        userData.equipped.weapon,
        ...userData.equipped.pets
    ].filter(Boolean);

    equipped.forEach(item => {
        if (item.attack) totalAttack += Math.round(item.attack * Math.pow(1.25, item.level - 1));
        if (item.defense) totalDefense += Math.round(item.defense * Math.pow(1.25, item.level - 1));
        if (item.health) totalHealth += Math.round(item.health * Math.pow(1.25, item.level - 1));

        if (item.skill) {
            item.skill.forEach(skill => {
                const skillInfo = SKILL_MASTER_DATA[skill.name];
                if (skillInfo.stat === '攻撃力') totalAttack += Math.round(totalAttack * (skill.level * skillInfo.baseEffect));
                if (skillInfo.stat === '防御力') totalDefense += Math.round(totalDefense * (skill.level * skillInfo.baseEffect));
                if (skillInfo.stat === '体力') totalHealth += Math.round(totalHealth * (skill.level * skillInfo.baseEffect));
            });
        }
    });

    return {
        attack: totalAttack,
        defense: totalDefense,
        health: totalHealth
    };
}

// UIの更新
const updateUI = () => {
    document.getElementById('user-gold').textContent = userData.gold;
    document.getElementById('player-level').textContent = userData.playerStats.level;
    document.getElementById('enemy-count').textContent = userData.playerStats.enemyCount;
    document.getElementById('treasure-box-count').textContent = 5 - userData.treasureBoxCount;

    // 現在アクティブなタブに基づいてUIを更新
    const activeTabId = document.querySelector('.tab-button.active').id;
    if (activeTabId === 'character-tab') {
        renderStatusScreen();
        renderItemInventory();
    } else if (activeTabId === 'stamp-tab') {
        renderCalendar();
    }
};

// レベルアップのチェックと実行
const checkLevelUp = async () => {
    const currentLevel = userData.playerStats.level;
    const nextLevelExp = currentLevel * 10;
    
    if (userData.playerStats.exp >= nextLevelExp) {
        await updateFirestore({
            playerStats: {
                ...userData.playerStats,
                level: currentLevel + 1,
                exp: 0,
            }
        });
        const modal = document.getElementById('level-up-modal');
        document.getElementById('level-up-message').textContent = `レベルが ${currentLevel + 1} に上がりました！`;
        modal.style.display = 'flex';
    }
};

// 経験値を加算し、レベルアップをチェック
const addExp = async (amount) => {
    const newExp = userData.playerStats.exp + amount;
    await updateFirestore({
        playerStats: {
            ...userData.playerStats,
            exp: newExp,
        }
    });
    checkLevelUp();
};

// ガチャを引く
const drawGacha = async (type, cost) => {
    if (userData.gold < cost) {
        const modal = document.getElementById('result-modal');
        modal.style.display = 'flex';
        document.getElementById('result-title').textContent = 'エラー';
        document.getElementById('result-name').textContent = 'Gが足りません！';
        document.getElementById('result-rarity').textContent = 'もっとGを貯めてね';
        document.getElementById('result-image').src = '';
        document.getElementById('result-stats').textContent = '';
        document.getElementById('result-skills').innerHTML = '';
        return;
    }

    let gachaData;
    let drawChances = {};
    if (type === 'weapon_and_armor') {
        gachaData = WEAPON_ARMOR_GACHA_DATA;
        drawChances = { 'N': 35, 'R': 30, 'SR': 24, 'SSR': 10, 'UR': 1 };
    } else if (type === 'pet') {
        gachaData = PET_MASTER_DATA;
        drawChances = { 'N': 35, 'R': 30, 'SR': 24, 'SSR': 10, 'UR': 1 };
    } else if (type === 'rare') {
        gachaData = RARE_GACHA_DATA;
        drawChances = { 'SR': 55, 'SSR': 40, 'UR': 5 };
    }

    const random = Math.random() * 100;
    let accumulatedChance = 0;
    let drawnItem = null;

    for (const rarity in drawChances) {
        accumulatedChance += drawChances[rarity];
        if (random <= accumulatedChance) {
            const itemsInRarity = gachaData.filter(item => item.rarity === rarity);
            drawnItem = itemsInRarity[Math.floor(Math.random() * itemsInRarity.length)];
            break;
        }
    }
    
    let newItems = [...userData.items];
    let modalTitle = '獲得アイテム';
    if (drawnItem) {
        const existingItemIndex = newItems.findIndex(item => item.id === drawnItem.id);
        
        if (existingItemIndex !== -1) {
            const existingItem = newItems[existingItemIndex];
            if (existingItem.level < MAX_LEVELS[existingItem.rarity]) {
                existingItem.level += 1;
                modalTitle = 'レベルアップ！';
            } else {
                modalTitle = 'レベル上限に到達しました';
            }
        } else {
            newItems.push({...drawnItem, level: 1});
        }
        
        const displayedItem = newItems.find(item => item.id === drawnItem.id);
        document.getElementById('result-title').textContent = modalTitle;
        document.getElementById('result-image').src = displayedItem.imageUrl;
        document.getElementById('result-name').textContent = displayedItem.name;
        document.getElementById('result-rarity').textContent = `レアリティ: ${displayedItem.rarity} (Lv.${displayedItem.level})`;
        
        const stats = [];
        if (displayedItem.attack) stats.push(`攻撃力: ${Math.round(displayedItem.attack * Math.pow(1.25, displayedItem.level - 1))}`);
        if (displayedItem.defense) stats.push(`防御力: ${Math.round(displayedItem.defense * Math.pow(1.25, displayedItem.level - 1))}`);
        if (displayedItem.health) stats.push(`体力: ${Math.round(displayedItem.health * Math.pow(1.25, displayedItem.level - 1))}`);
        document.getElementById('result-stats').textContent = stats.join(' / ');

        const skillsEl = document.getElementById('result-skills');
        skillsEl.innerHTML = '';
        if (displayedItem.skill && displayedItem.skill.length > 0) {
            const skillTitle = document.createElement('p');
            skillTitle.textContent = 'スキル:';
            skillTitle.className = 'font-bold mt-2';
            skillsEl.appendChild(skillTitle);
            displayedItem.skill.forEach(s => {
                const skillInfo = SKILL_MASTER_DATA[s.name];
                const effectText = skillInfo.stat 
                    ? `${skillInfo.stat} ${s.level * skillInfo.baseEffect * 100}%上昇`
                    : skillInfo.description
                        ? `${skillInfo.description} (${s.level * skillInfo.baseEffect * 100}%)`
                        : '';
                const skillEl = document.createElement('p');
                skillEl.textContent = `・${s.name} (Lv.${s.level}): ${effectText}`;
                skillsEl.appendChild(skillEl);
            });
        }
        document.getElementById('result-modal').style.display = 'flex';
    }

    const newPlayerStats = {
        ...userData.playerStats,
        gachaCount: userData.playerStats.gachaCount + 1,
    };
    
    await updateFirestore({
        gold: userData.gold - cost,
        items: newItems,
        playerStats: newPlayerStats,
    });
    await addExp(1);
};

// アイテムを装備
const equipItem = async (itemId) => {
    const itemToEquip = userData.items.find((item) => item.id === itemId);
    if (!itemToEquip) return;
    
    const newEquipped = { ...userData.equipped };

    if (itemToEquip.type === 'pet') {
        const emptySlotIndex = newEquipped.pets.findIndex(slot => slot === null);
        if (emptySlotIndex !== -1) {
            newEquipped.pets[emptySlotIndex] = itemToEquip;
        } else {
            // 3枠目が埋まっている場合は、1枠目を上書きする
            newEquipped.pets[0] = itemToEquip;
        }
    } else {
        newEquipped[itemToEquip.type] = itemToEquip;
    }

    await updateFirestore({ equipped: newEquipped });
};

// アイテムを強化
const upgradeItem = async (itemId) => {
    const itemToUpgrade = userData.items.find(item => item.id === itemId);
    const upgradeItemIndex = userData.items.findIndex(item => item.id === UPGRADE_ITEM_MASTER.id);
    
    if (!itemToUpgrade || upgradeItemIndex === -1) {
        const modal = document.getElementById('result-modal');
        modal.style.display = 'flex';
        document.getElementById('result-title').textContent = 'エラー';
        document.getElementById('result-name').textContent = '強化アイテムがありません';
        return;
    }

    if (itemToUpgrade.level < MAX_LEVELS[itemToUpgrade.rarity]) {
        const newItems = [...userData.items];
        newItems.splice(upgradeItemIndex, 1); // 強化アイテムを1つ消費
        
        const itemIndexToUpdate = newItems.findIndex(item => item.id === itemId);
        if (itemIndexToUpdate !== -1) {
            newItems[itemIndexToUpdate].level += 1;
            await updateFirestore({ items: newItems });
        }
    } else {
        const modal = document.getElementById('result-modal');
        modal.style.display = 'flex';
        document.getElementById('result-title').textContent = 'レベル上限';
        document.getElementById('result-name').textContent = 'これ以上強化できません';
    }
};

// ステータス画面の描画
const renderStatusScreen = () => {
    const statusContainer = document.getElementById('status-container');
    const totalStats = calculateTotalStats();

    const equippedSlots = [
        { name: 'あたま', item: userData.equipped.head, defaultImg: 'https://placehold.co/128x128/ccc/222?text=あたま' },
        { name: 'からだ', item: userData.equipped.body, defaultImg: 'https://placehold.co/128x128/ccc/222?text=からだ' },
        { name: 'あし', item: userData.equipped.leg, defaultImg: 'https://placehold.co/128x128/ccc/222?text=あし' },
        { name: '武器', item: userData.equipped.weapon, defaultImg: 'https://placehold.co/128x128/ccc/222?text=武器' },
    ];
    
    const petSlots = userData.equipped.pets.map((item, index) => ({
        name: `ペット${index + 1}`,
        item,
        defaultImg: 'https://placehold.co/128x128/ccc/222?text=ペット'
    }));

    statusContainer.innerHTML = `
        <div class="p-6 bg-white rounded-xl shadow-lg mb-6">
            <h2 class="text-2xl font-bold mb-4">キャラクターのステータス</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div>
                    <p class="text-lg font-bold">レベル</p>
                    <p class="text-2xl font-bold text-purple-600">${userData.playerStats.level}</p>
                </div>
                <div>
                    <p class="text-lg font-bold">総合ステータス</p>
                    <p class="text-xl font-bold text-red-600">攻撃力: ${totalStats.attack}</p>
                    <p class="text-xl font-bold text-blue-600">防御力: ${totalStats.defense}</p>
                    <p class="text-xl font-bold text-green-600">体力: ${totalStats.health}</p>
                </div>
            </div>
            <div class="mt-6 border-t pt-4">
                <h3 class="text-xl font-bold mb-4">装備品</h3>
                <div class="flex flex-wrap justify-center gap-4">
                    ${equippedSlots.map(slot => `
                        <div class="equipment-slot">
                            <span class="equipment-slot-label">${slot.name}</span>
                            <img src="${slot.item ? slot.item.imageUrl : slot.defaultImg}" alt="${slot.name}">
                        </div>
                    `).join('')}
                </div>
                <h3 class="text-xl font-bold mb-4 mt-6">ペット</h3>
                <div class="flex flex-wrap justify-center gap-4">
                    ${petSlots.map(slot => `
                        <div class="equipment-slot">
                            <span class="equipment-slot-label">${slot.name}</span>
                            <img src="${slot.item ? slot.item.imageUrl : slot.defaultImg}" alt="${slot.name}">
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

// アイテムインベントリの描画
const renderItemInventory = () => {
    const inventoryContainer = document.getElementById('inventory-list');
    inventoryContainer.innerHTML = '';
    
    const equippableItems = userData.items.filter(item => item.type);
    const upgradeItems = userData.items.filter(item => item.id === UPGRADE_ITEM_MASTER.id);
    const upgradeItemCount = upgradeItems.length;

    if (upgradeItemCount > 0) {
        const upgradeItemEl = document.createElement('div');
        upgradeItemEl.className = `card p-4 flex justify-between items-center mb-2`;
        upgradeItemEl.innerHTML = `
            <div class="flex items-center">
                <img src="${UPGRADE_ITEM_MASTER.imageUrl}" class="w-12 h-12 rounded-lg mr-4">
                <div>
                    <p class="font-bold">${UPGRADE_ITEM_MASTER.name} <span class="text-sm font-normal text-gray-500">x${upgradeItemCount}</span></p>
                    <p class="text-xs text-gray-700">${UPGRADE_ITEM_MASTER.description}</p>
                </div>
            </div>
        `;
        inventoryContainer.appendChild(upgradeItemEl);
    }

    equippableItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `card p-4 flex justify-between items-center mb-2`;
        itemEl.innerHTML = `
            <div class="flex items-center">
                <img src="${item.imageUrl}" class="w-12 h-12 rounded-lg mr-4">
                <div>
                    <p class="font-bold">${item.name} <span class="text-sm font-normal text-gray-500">(Lv.${item.level})</span></p>
                    <p class="text-xs text-gray-700">レアリティ: ${item.rarity}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-full equip-btn" data-item-id="${item.id}">装備</button>
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-3 rounded-full upgrade-btn" data-item-id="${item.id}">強化</button>
            </div>
        `;
        inventoryContainer.appendChild(itemEl);
    });
    
    document.querySelectorAll('.equip-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            equipItem(e.currentTarget.dataset.itemId);
        });
    });
    document.querySelectorAll('.upgrade-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            upgradeItem(e.currentTarget.dataset.itemId);
        });
    });
};

// カレンダーの描画
const renderCalendar = () => {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

    const todayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 空のセルを挿入
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'w-10 h-10 border rounded-lg';
        calendarGrid.appendChild(emptyCell);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const studyContent = userData.calendar[dateString] || [];
        
        const cell = document.createElement('div');
        cell.className = `w-10 h-10 border rounded-lg flex flex-col items-center justify-center relative text-xs p-1 ${studyContent.length > 0 ? 'bg-yellow-300' : 'bg-gray-100'} ${dateString === todayString ? 'border-2 border-yellow-500' : ''}`;
        cell.textContent = i;
        calendarGrid.appendChild(cell);

        if (studyContent.length > 0) {
            const contentIndicator = document.createElement('span');
            contentIndicator.textContent = '✏️';
            contentIndicator.className = 'absolute bottom-1 right-1 text-sm';
            cell.appendChild(contentIndicator);
            
            // ツールチップ表示機能 (ここでは仮の表示)
            cell.title = studyContent.join('\n');
        }
    }
};

// タブ切り替え
const switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabId.split('-')[0]}-tab`).classList.add('active');
};

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    document.getElementById('gacha-tab').addEventListener('click', () => {
        switchTab('gacha-content');
        updateUI();
    });
    
    document.getElementById('character-tab').addEventListener('click', () => {
        switchTab('character-content');
        updateUI();
    });

    document.getElementById('stamp-tab').addEventListener('click', () => {
        switchTab('stamp-content');
        updateUI();
    });
    
    document.getElementById('add-enemy-btn').addEventListener('click', async () => {
        const newEnemyCount = userData.playerStats.enemyCount + 1;
        await updateFirestore({
            playerStats: {
                ...userData.playerStats,
                enemyCount: newEnemyCount
            }
        });
        await addExp(2); // 敵を倒すと経験値2を獲得
    });

    document.getElementById('open-treasure-box-btn').addEventListener('click', async () => {
        if (userData.treasureBoxCount >= 5) {
            const modal = document.getElementById('result-modal');
            modal.style.display = 'flex';
            document.getElementById('result-title').textContent = '宝箱は空です';
            document.getElementById('result-name').textContent = '今日の分はもうありません';
            document.getElementById('result-rarity').textContent = '';
            document.getElementById('result-image').src = 'https://placehold.co/128x128/f0f0f0/888?text=EMPTY';
            document.getElementById('result-stats').textContent = '';
            document.getElementById('result-skills').innerHTML = '';
            return;
        }

        document.getElementById('study-input-modal').style.display = 'flex';
    });
    
    document.getElementById('submit-study-content-btn').addEventListener('click', async () => {
        const studyContent = document.getElementById('study-content-input').value;
        if (!studyContent.trim()) {
            return; // 何も入力されていなければ何もしない
        }
        
        const today = new Date().toISOString().split('T')[0];
        const newCalendar = { ...userData.calendar };
        if (!newCalendar[today]) {
            newCalendar[today] = [];
        }
        newCalendar[today].push(studyContent);

        const newTreasureBoxCount = userData.treasureBoxCount + 1;
        
        await updateFirestore({
            gold: userData.gold + 300,
            calendar: newCalendar,
            treasureBoxCount: newTreasureBoxCount
        });
        
        document.getElementById('study-input-modal').style.display = 'none';
        document.getElementById('study-content-input').value = '';

        const modal = document.getElementById('result-modal');
        modal.style.display = 'flex';
        document.getElementById('result-title').textContent = '宝箱ゲット！';
        document.getElementById('result-name').textContent = '300G獲得しました！';
        document.getElementById('result-rarity').textContent = `今日の宝箱 (残り${5 - newTreasureBoxCount}回)`;
        document.getElementById('result-image').src = 'https://placehold.co/128x128/ffe4b5/222?text=GET';
        document.getElementById('result-stats').textContent = '';
        document.getElementById('result-skills').innerHTML = '';
    });
    
    document.getElementById('close-study-input-modal').addEventListener('click', () => {
        document.getElementById('study-input-modal').style.display = 'none';
        document.getElementById('study-content-input').value = '';
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('result-modal').style.display = 'none';
    });
    
    document.getElementById('close-level-up-modal').addEventListener('click', () => {
        document.getElementById('level-up-modal').style.display = 'none';
    });
    
    document.querySelectorAll('.draw-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const cost = parseInt(e.currentTarget.dataset.cost, 10);
            const type = e.currentTarget.dataset.type;
            drawGacha(type, cost);
        });
    });
});
