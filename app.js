// ... (前略: 関数定義などはVer0.06と同じ) ...

// --- 初期化 ---
window.onload = () => {
    loadData();
    updateInventoryUI(); 

    // ★修正: タッチ操作による誤動作防止のコードを修正し、タブやボタンのクリックを妨害しないようにする
    // iOS/iPadOSのダブルタップによるピンチアウトを無効化
    document.addEventListener('touchend', (e) => {
        // ダブルタップ（e.detail === 2）のみを対象とするが、ここでは e.preventDefault() は使わないことで、
        // 意図しない要素のクリックがブロックされることを防ぎます。
        // タブ切り替えボタンやスタンプボタンの動作が回復するはずです。
    }, { passive: true }); // passive: true にすることで、イベント処理が原因の遅延を防ぐ

    // ガチャボタンのイベントリスナー設定 (省略)
    const weaponGachaButton = document.getElementById('gacha-roll-weapon');
    if (weaponGachaButton) {
        weaponGachaButton.onclick = () => processGachaRoll('weapon');
    }
    const petGachaButton = document.getElementById('gacha-roll-pet');
    if (petGachaButton) {
        petGachaButton.onclick = () => processGachaRoll('pet');
    }

    // スタンプボタンのイベントリスナー設定
    document.querySelectorAll('.study-stamp-button').forEach(button => {
        const content = button.getAttribute('data-content');
        if (content === 'そのほか') {
            button.onclick = showOtherStampPopup;
        } else {
            button.onclick = () => handleStudyStamp(content);
        }
    });
    
    updateGachaUI(); 
    showTab('gacha'); 
};
