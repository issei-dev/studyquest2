import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, updateDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firestoreのデバッグログを有効にする (開発用)
setLogLevel('Debug');

// Canvas環境変数を使用するための定数定義
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebaseサービスのインスタンスと状態管理
let app;
let db;
let auth;
let userId = null;
let isAuthReady = false; // 認証とデータロードの準備完了フラグ

// ------------------ アプリの状態 (State) ------------------
let state = {
    gachaCount: 0,
    stampsToday: [],
    // 初回初期化時に設定される項目
    inventory: [],
    characterStats: { level: 1, exp: 0, hp: 100, attack: 10 }
};

// ------------------ 初期化と認証処理 ------------------
async function initializeFirebase() {
    if (!firebaseConfig) {
        console.error("Firebase config is missing.");
        return;
    }

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            console.log("Authenticated with UID:", userId);
            await loadAppData(); 
        } else {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase Authentication failed:", error);
            }
        }
    });
}

// ------------------ データ永続化の基盤関数 ------------------

/** ユーザー固有のメインデータドキュメントへの参照を返す */
function getPlayerDataDocRef() {
    if (!userId || !db) return null;
    return doc(db, `artifacts/${appId}/users/${userId}/data/player_data`, 'main_status');
}

/** 🚨 変更点1: データをFirestoreに保存する関数を実装 */
async function savePlayerStatus() {
    const docRef = getPlayerDataDocRef();
    if (!docRef) {
        console.error("Doc reference is not ready. Skipping save.");
        return;
    }

    // stateからFirestoreに保存したいデータを選別
    const dataToSave = {
        gachaCount: state.gachaCount,
        stampsToday: state.stampsToday,
        inventory: state.inventory,
        characterStats: state.characterStats,
        lastUpdated: new Date()
    };

    try {
        await updateDoc(docRef, dataToSave);
        console.log("Player status saved successfully.");
    } catch (e) {
        console.error("Error saving document: ", e);
        // ドキュメントが存在しない場合に備えて setDoc も試みる
        try {
            await setDoc(docRef, dataToSave, { merge: true });
            console.log("Player status created/merged successfully.");
        } catch (e2) {
            console.error("Error creating document after failed update: ", e2);
        }
    }
}

/** Firestoreからユーザーデータをロードし、リアルタイムで監視する */
async function loadAppData() {
    console.log("Setting up snapshot listener...");
    const docRef = getPlayerDataDocRef();
    if (!docRef) {
        console.error("Doc reference could not be created.");
        isAuthReady = true;
        updateUI();
        return;
    }

    onSnapshot(docRef, async (docSnap) => {
        if (!userId) return;

        if (docSnap.exists()) {
            // データが存在する場合、stateを更新
            const data = docSnap.data();
            state.gachaCount = data.gachaCount || 0;
            state.stampsToday = Array.isArray(data.stampsToday) ? data.stampsToday : []; 
            
            // その他のステータスもロード
            state.inventory = Array.isArray(data.inventory) ? data.inventory : [];
            state.characterStats = data.characterStats || { level: 1, exp: 0, hp: 100, attack: 10 };

            console.log("Data loaded/updated:", state);
        } else {
            // 初回アクセス時：初期データを作成して保存
            console.log("Player data not found. Creating initial data.");
            const initialData = {
                gachaCount: 0,
                stampsToday: [],
                inventory: [],
                characterStats: { level: 1, exp: 0, hp: 100, attack: 10 }
            };
            try {
                await setDoc(docRef, initialData);
                Object.assign(state, initialData);
            } catch (e) {
                console.error("Error creating initial document: ", e);
            }
        }
        
        isAuthReady = true; 
        updateUI(); 
    }, (error) => {
        console.error("Error setting up snapshot listener:", error);
        isAuthReady = true; 
        updateUI();
    });
}

// ------------------ UI更新関数 ------------------

function updateUI() {
    if (!isAuthReady) return; 

    // 1. ガチャ回数更新
    document.getElementById('gacha-count').textContent = state.gachaCount;

    // 2. ガチャボタンの有効/無効化
    const isDisabled = state.gachaCount <= 0;
    document.getElementById('gacha-roll-weapon').disabled = isDisabled;
    document.getElementById('gacha-roll-pet').disabled = isDisabled;

    // 3. スタンプボタンの有効/無効化
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        const content = button.getAttribute('data-content');
        if (state.stampsToday.includes(content)) {
            button.disabled = true;
            button.classList.add('bg-gray-400');
            button.classList.remove('bg-green-500'); 
        } else {
            button.disabled = false;
            button.classList.remove('bg-gray-400');
            button.classList.add('bg-green-500'); 
        }
    });
    
    // 4. ユーザーIDの表示 (デバッグ用)
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay) {
        const uidShort = userId ? userId.substring(0, 8) + '...' : 'Loading...';
        versionDisplay.innerHTML = `Ver0.09 | UID: ${uidShort}`;
    }
}

// ------------------ イベントハンドラー ------------------

// グローバル関数として公開
window.showTab = (clickedButton, tabId) => {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
    clickedButton.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. スタンプ機能のイベントリスナー
    document.getElementById('study-stamps').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('study-stamp-button') && !button.disabled) {
            const content = button.getAttribute('data-content');
            
            // ローカルStateの更新
            state.gachaCount += 1; 
            state.stampsToday.push(content); 

            showModal('スタンプゲット！', `「${content}」を記録しました！<br>ガチャ回数が 1 増えました。`);
            
            // UIの即時更新と、Firestoreへの保存
            updateUI();
            savePlayerStatus(); // 🚨 変更点2: データ保存処理を呼び出し
        }
    });

    // 2. ガチャ機能のイベントリスナー
    document.getElementById('gacha-controls').addEventListener('click', (event) => {
        const button = event.target;
        if (button.classList.contains('gacha-roll-button') && !button.disabled) {
            if (state.gachaCount > 0) {
                // ローカルStateの更新
                state.gachaCount -= 1; 

                const type = button.id.includes('weapon') ? 'ぶき' : 'ペット';
                const resultElement = document.getElementById('gacha-result');
                
                // ダミーのガチャ結果とローカルState（inventory）の更新
                const itemName = (Math.random() > 0.5) ? `レア${type}ソード` : `ノーマル${type}グローブ`;
                state.inventory.push({ name: itemName, type: type, timestamp: new Date() });
                
                resultElement.innerHTML = `<p class="text-xl font-bold text-red-600 mb-2">🎉 ${type}ガチャ 結果発表 🎉</p>
                                           <p class="text-lg">「${itemName}」を手に入れた！</p>`;

                // UIの即時更新と、Firestoreへの保存
                updateUI();
                savePlayerStatus(); // 🚨 変更点3: データ保存処理を呼び出し
            } else {
                showModal('回数が足りません', 'スタンプを押してガチャ回数を増やしましょう！');
            }
        }
    });
    
    // 3. Firebase初期化
    initializeFirebase(); 
});

// ------------------ カスタムポップアップ機能 ------------------

// グローバル関数として公開 (index.htmlから呼び出すため)
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
