const { contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
    TimerStart: () =>
        ipcRenderer.invoke("ipc-timer-start")
            .then(result => result)
            .catch(err => console.log(err)),

    TimerStop: () => ipcRenderer.send("ipc-timer-stop"),

    TimerReset: () => ipcRenderer.send("ipc-timer-reset"),

    DisplayTimer: (channel, listener) => {
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
