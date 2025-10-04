body {
    font-family: sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f4f9;
    color: #333;
    /* iOS/iPadOSのダブルタップ/ピンチアウトを無効化 */
    touch-action: manipulation;
    -ms-touch-action: manipulation; 
}

h1 {
    color: #007bff;
    text-align: center;
}

/* --- タブスタイリング --- */
.tabs {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #ccc;
}

.tab-button {
    padding: 10px 15px;
    border: none;
    background-color: #e9ecef;
    cursor: pointer;
    font-weight: bold;
    border-radius: 5px 5px 0 0;
    transition: background-color 0.3s;
    flex-grow: 1;
}

.tab-button:hover {
    background-color: #dee2e6;
}

/* --- コンテンツ --- */
.tab-content {
    display: none;
    padding: 20px;
    border: 1px solid #ccc;
    border-top: none;
    background-color: white;
    min-height: 400px;
    border-radius: 0 0 5px 5px;
}

.tab-content.active {
    display: block;
}

/* --- HPバー --- */
.hp-bar-container {
    width: 100%;
    background-color: #eee;
    border: 1px solid #333;
    border-radius: 5px;
    margin: 5px 0;
    overflow: hidden;
}

.hp-bar {
    height: 20px;
    line-height: 20px;
    text-align: right;
    padding-right: 5px;
    color: white;
    transition: width 0.5s;
    background-color: green; /* デフォルト */
}

/* --- アイテムカード --- */
.item-list {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 10px 0;
}

.item-card {
    border: 1px solid #ddd;
    padding: 10px;
    width: 120px;
    text-align: center;
    border-radius: 8px;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    background-color: #f9f9f9;
}

.item-card img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    margin-bottom: 5px;
    border-radius: 5px;
}

.item-card button {
    margin-top: 8px;
    padding: 5px 10px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
}

.equipped-card {
    border: 2px solid #ffcc00; /* 装備中を強調 */
    cursor: pointer;
    background-color: #fffbe6;
}

.empty-slot {
    border: 2px dashed #ccc;
    background-color: #e9e9e9;
    height: 140px;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* --- 敵カード --- */
.enemy-card {
    border: 2px solid #cc0000;
    padding: 15px;
    width: 150px;
    text-align: center;
    border-radius: 8px;
    box-shadow: 3px 3px 8px rgba(0,0,0,0.2);
    background-color: #ffe6e6;
}

.enemy-card img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    margin-bottom: 10px;
    border-radius: 5px;
}

.enemy-card button {
    background-color: #dc3545;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
}

/* --- アニメーション --- */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.shake-enemy {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake-body {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-10px, -10px); }
    50% { transform: translate(10px, 10px); }
    75% { transform: translate(-10px, 10px); }
}

.shake-screen {
    animation: shake-body 0.3s ease-in-out;
}
