window.onload = () => {
  // 表示の初期化
  window.api.TimerReset();  // contextBridge
  // 「開始」ボタンをクリック
  document.getElementById('button-start').addEventListener('click', async () => {
    const result = await window.api.TimerStart(); // contextBridge
    if (result === true) {
      document.getElementById('button-reset').textContent = "停止";
    }
    else {
      document.getElementById('button-reset').textContent = "リセット";
    }
  });
  // 「リセット」or「停止」ボタンをクリック
  document.getElementById('button-reset').addEventListener('click', async () => {
    if ( document.getElementById('button-reset').textContent === "停止" ) {
      document.getElementById('button-reset').textContent = "リセット";
      window.api.TimerStop(); // contextBridge
    }
    else {
      window.api.TimerReset();  // contextBridge
    }
  });
}
// タイマー（ミリ秒）の受け取り
window.api.DisplayTimer((milliseconds) => { // contextBridge
  // console.log("ipc-display-timer: " + arg);
  if (milliseconds <= 0){
    document.getElementById('button-reset').textContent = "リセット";
  }
  let min = parseInt((milliseconds / 1000) / 60);
  let sec = parseInt(milliseconds / 1000) % 60;
  document.getElementById('timer-number').textContent =
      ('00' + min).slice(-2) + ':' + ('00' + sec).slice(-2);
});
