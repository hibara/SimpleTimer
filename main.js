'use strict';

const {app, Menu, BrowserWindow, ipcMain, Tray, nativeTheme} = require('electron');
const path = require('path');
const nativeImage = require('electron').nativeImage

const MAX_MILLI_SECONDS = 3*60*1000;
// const MAX_MILLI_SECONDS = 10*1000;  // デバッグ
let milliseconds = MAX_MILLI_SECONDS;
// トレイアイコン
let tray = null;
// メインウィンドウ
let mainWindow;
// タイマー動作中フラグ
let isWorking = false;
// タイマーID
let idTimer;
// ダークテーマ
let isDarkTheme = false;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    title: app.name,
    width: 1024,
    height: 640,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      worldSafeExecuteJavaScript: true, // In Electron 12, the default will be changed to true.
      nodeIntegration: true, // XSS対策としてnodeモジュールをレンダラープロセスで使えなくする
      nodeIntegrationInWorker: true,
      contextIsolation: true, // レンダラープロセスに公開するAPIのファイル
      preload: path.resolve(`${__dirname}/preload.js`)
    },
    // icon: iconPath
  });
  // load a local HTML file
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  // debug: ディベロッパーツールの表示
  mainWindow.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}
// メイン・メニューの生成
const createMainMenu = () => {
  const { shell } = require('electron')
  const isMac = process.platform === 'darwin'
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'View',
      submenu: [
        { role: 'reload', enabled: false },
        { role: 'forcereload', enabled: false },
        { role: 'toggledevtools', accelerator: 'CmdOrCtrl+Alt+I' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/hibara/Erectron-Dark-Mode-Test')
          }
        },
        {
          label: "Qiitaの記事",
          click: async () => {
            await shell.openExternal('https://qiita.com/hibara')
          }
        },
        {
          label: "作者ウェブサイト",
          click: async () => {
            await shell.openExternal('https://hibara.org/')
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
// トレイアイコンを生成する
const createTrayIcon = () => {
  let imgFilePath;
  if (process.platform === 'win32') {
    imgFilePath = __dirname + '/images/tray-icon/white/100.ico';
  }
  else{
    imgFilePath = __dirname + '/images/tray-icon/black/100.png';
    if ( nativeTheme.shouldUseDarkColors === true ){
      isDarkTheme = true;
      imgFilePath = __dirname + '/images/tray-icon/white/100.png';
    }
  }
  const contextMenu = Menu.buildFromTemplate([
    { label: '終了', role: 'quit' }
  ]);
  tray = new Tray(imgFilePath);
  tray.setToolTip(app.name);
  tray.setContextMenu(contextMenu)
}
// タイマーの表示
const displayTimer = (valMilliSeconds) => {
  mainWindow.webContents.send("ipc-display-timer", valMilliSeconds);
  // タスクトレイのアイコン表示
  let percent = Math.floor((valMilliSeconds / MAX_MILLI_SECONDS) * 100);
  // 5の倍数で丸める
  let multipleOfFive =  Math.round(percent / 5) * 5;

  let imgFilePath;
  let imgFileName = ('000' + multipleOfFive).slice(-3) + (process.platform === 'win32' ? '.ico' : '.png');
  if ( process.platform === 'win32' || isDarkTheme === true ) {
    imgFilePath = __dirname + '/images/tray-icon/white/' + imgFileName;
  }
  else {
    imgFilePath = __dirname + '/images/tray-icon/black/' + imgFileName;
  }

  tray.setImage(nativeImage.createFromPath(imgFilePath));
  tray.setToolTip(percent + "% - " + app.name);
};
// タイマー開始
const StartTimer = () => {
  idTimer = setInterval(() => {
    milliseconds-=100;
    displayTimer(milliseconds);
    if ( milliseconds <= 0) {
      StopTimer();
    }
  }, 100);
}
// タイマー停止
const StopTimer = () => {
  isWorking = false;
  clearInterval(idTimer);
}
// タイマーリセット
const ResetTimer = () => {
  milliseconds = MAX_MILLI_SECONDS;
  displayTimer(milliseconds);
}
// システムカラーの変更イベント
if ( process.platform === 'darwin' ) { 
  nativeTheme.on("updated", () => {
    isDarkTheme = nativeTheme.shouldUseDarkColors === true;
  });
}

app.on('ready', () => {
  // create window
  createWindow();
  createMainMenu();
  createTrayIcon();
});
app.on('window-all-closed', () => {
  StopTimer();
  clearInterval(idTimer);
  if (process.platform !== 'darwin') {  // macOS以外
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
    ResetTimer();
  }
});

// タイマー開始（レンダラープロセスからのIPC通信：invokeメソッド）
ipcMain.handle("ipc-timer-start", () => {
  if ( isWorking === true ) {
    return true
  }
  else {
    StartTimer();
    isWorking = true;
  }
  return true;
});
// タイマー停止（レンダラープロセスからのIPC通信）
ipcMain.on("ipc-timer-stop", () => {
  StopTimer();
});
// タイマーのリセット（レンダラープロセスからのIPC通信）
ipcMain.on("ipc-timer-reset", () => {
  ResetTimer();
});

