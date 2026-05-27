const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companionAPI', {
  // 模式切换
  getMode: () => ipcRenderer.invoke('get-mode'),
  switchMode: (mode) => ipcRenderer.invoke('switch-mode', mode),

  // 鼠标穿透控制
  setIgnoreMouse: (ignore) => ipcRenderer.invoke('set-ignore-mouse', ignore),

  // 窗口拖动（从渲染进程发起）
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { x: dx, y: dy }),

  // 监听主进程发来的模式切换
  onModeChanged: (callback) => {
    ipcRenderer.on('mode-changed', (_, mode) => callback(mode));
  },

  // LLM API调用（通过fetch，不走主进程——减少耦合）
  // 渲染进程直接用fetch调Gateway
});
