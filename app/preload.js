const { contextBridge, ipcRenderer } = require('electron');

const on = (ch) => (cb) => ipcRenderer.on(ch, (_e, v) => cb(v));
contextBridge.exposeInMainWorld('pip', {
  onState: on('state'), onCursor: on('cursor'), onVis: on('vis'), onChime: on('chime'),
  ready: () => ipcRenderer.send('ready'),
  ignore: (v) => ipcRenderer.send('ignore', v),
  ack: (id) => ipcRenderer.send('ack', id),
  menu: () => ipcRenderer.send('menu'),
  drag: (v) => ipcRenderer.send('drag', v),
  // app window
  openUi: () => ipcRenderer.send('ui'),
  save: (patch) => ipcRenderer.send('save', patch),
  login: (on) => ipcRenderer.send('login', on),
  hooks: (action) => ipcRenderer.send('hooks', action),
  forget: () => ipcRenderer.send('forget'),
  demo: (name) => ipcRenderer.send('demo', name),
  open: (what) => ipcRenderer.send('open', what),
});
