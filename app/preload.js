const { contextBridge, ipcRenderer } = require('electron');

const on = (ch) => (cb) => ipcRenderer.on(ch, (_e, v) => cb(v));
contextBridge.exposeInMainWorld('pip', {
  onState: on('state'), onCursor: on('cursor'), onVis: on('vis'), onChime: on('chime'),
  ready: () => ipcRenderer.send('ready'),
  ignore: (v) => ipcRenderer.send('ignore', v),
  ack: (id) => ipcRenderer.send('ack', id),
  menu: () => ipcRenderer.send('menu'),
  drag: (v) => ipcRenderer.send('drag', v),
});
