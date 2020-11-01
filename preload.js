const { contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
    // タイマーの開始
    TimerStart: () =>
        ipcRenderer.invoke("ipc-timer-start")
            .then(result => result)
            .catch(err => console.log(err)),
    // タイマーの停止
    TimerStop: () => ipcRenderer.send("ipc-timer-stop"),
    // タイマーのリセット（ミリ秒を最大の初期値へ戻す）
    TimerReset: () => ipcRenderer.send("ipc-timer-reset"),
    // 現在のタイマーの値（ミリ秒）をレンダラープロセスへ投げて表示させる
    DisplayTimer: (listener) => {
      ipcRenderer.on("ipc-display-timer", (event, arg) => listener(arg));
    }
    // send: (channel, data) => { // レンダラーからの送信用
    //   ipcRenderer.send(channel, data);
    // },
    // on: (channel, func) => { // メインプロセスからの受信用
    //   ipcRenderer.on(channel, (event, ...args) => func(...args));
    // }
  }
);
