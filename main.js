/*
 * COPA — 桌面场景伴侣框架
 * ============================
 *
 * 名字：C-O-P-A（四个字母，念起来像猫爪轻叩桌面）
 *
 * 四个解释（非官方，都是真的）：
 *   1. COmpanion + OPA（开放式个人AI）——最正式的解释
 *   2. 西班牙语「copa」= 杯子 ——风暴城堡干杯
 *   3. companion 的前四个字母 ——最直接的解释
 *   4. 猫爪叩两下：CO-PA，CO-PA ——最可爱的解释
 *
 * 作者：AlantHSY（法瑞斯）、Gideon-Ofnir（基甸·奥夫尼尔）、CYC
 * 许可：MIT
 */

const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let currentMode = 'transparent'; // 'transparent' | 'scene' | 'hall'
let ignoreMouseEvents = true; // 默认穿透空白区域

function getWindowConfig(mode) {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const configs = {
    transparent: {
      width: 200,
      height: 250,
      x: sw - 220,
      y: sh - 280,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      hasShadow: false,
    },
    scene: {
      width: 300,
      height: 580,
      x: sw - 320,
      y: Math.round((sh - 580) / 2),
      transparent: true,
      alwaysOnTop: false,
      resizable: false,
      hasShadow: true,
    },
    hall: {
      width: 800,
      height: 500,
      x: Math.round((sw - 800) / 2),
      y: Math.round((sh - 500) / 2),
      transparent: true,
      alwaysOnTop: false,
      resizable: true,
      hasShadow: true,
    },
  };
  return configs[mode] || configs.transparent;
}

function createWindow() {
  const config = getWindowConfig(currentMode);

  win = new BrowserWindow({
    ...config,
    frame: false,
    skipTaskbar: currentMode === 'transparent',
    type: currentMode === 'transparent' ? 'toolbar' : 'normal',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 开发模式开devtools
  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  // 设置鼠标穿透（透明桌宠模式下空白区域穿透）
  win.setIgnoreMouseEvents(ignoreMouseEvents, { forward: true });

  win.on('closed', () => { win = null; });
}

function createTray() {
  // 先用一个简单的1x1透明像素，后期换图标
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '模式',
      submenu: [
        {
          label: '🦊 透明桌宠',
          type: 'radio',
          checked: currentMode === 'transparent',
          click: () => switchMode('transparent'),
        },
        {
          label: '📖 场景陪伴',
          type: 'radio',
          checked: currentMode === 'scene',
          click: () => switchMode('scene'),
        },
        {
          label: '🏰 大场景群聊',
          type: 'radio',
          checked: currentMode === 'hall',
          click: () => switchMode('hall'),
        },
      ],
    },
    { type: 'separator' },
    {
      label: '切换鼠标穿透',
      type: 'checkbox',
      checked: ignoreMouseEvents,
      click: (item) => {
        ignoreMouseEvents = item.checked;
        if (win) win.setIgnoreMouseEvents(ignoreMouseEvents, { forward: true });
      },
    },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]);

  tray.setToolTip('桌面伴侣');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win) {
      win.isVisible() ? win.hide() : win.show();
    }
  });
}

function switchMode(mode) {
  if (!win || currentMode === mode) return;

  currentMode = mode;
  const config = getWindowConfig(mode);

  win.setBounds({ x: config.x, y: config.y, width: config.width, height: config.height });
  win.setAlwaysOnTop(config.alwaysOnTop);
  win.setResizable(config.resizable);

  // toolbar类型切换需要重建窗口
  win.webContents.send('mode-changed', mode);

  // 更新穿透状态
  ignoreMouseEvents = (mode === 'transparent');
  win.setIgnoreMouseEvents(ignoreMouseEvents, { forward: true });

  // 任务栏显示
  win.setSkipTaskbar(mode === 'transparent');
}

// IPC handlers
ipcMain.handle('get-mode', () => currentMode);
ipcMain.handle('switch-mode', (_, mode) => switchMode(mode));
ipcMain.handle('set-ignore-mouse', (_, ignore) => {
  ignoreMouseEvents = ignore;
  if (win) win.setIgnoreMouseEvents(ignore, { forward: true });
});

ipcMain.on('move-window', (_, { x, y }) => {
  if (win) {
    const [wx, wy] = win.getPosition();
    win.setPosition(wx + x, wy + y);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // 不退出，留在托盘
});

app.on('activate', () => {
  if (!win) createWindow();
});