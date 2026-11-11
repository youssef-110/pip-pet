const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sessions = require('./sessions');
const hooks = require('./hooks');
const { CHARS, SKINS, ACCS } = require('./renderer/pet.js');

const W = 300, H = 340, DONE_MS = 20000;
const map = new Map();
let win, tray, watcher, settings, fullscreen = false, shown = false, hideTimer, dragOff, hookNote = '';
const ackTimers = new Map();

if (!app.requestSingleInstanceLock()) app.quit();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  let s = {};
  try { s = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch {}
  return { char: 'blob', skin: 'coral', acc: 'none', mode: 'auto', sound: true, ...s };
}
function save(patch) {
  Object.assign(settings, patch);
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  buildMenu(); emit();
}

// ---- state -> renderer ----
function emit() {
  const list = [...map.values()];
  if (win && !win.isDestroyed()) {
    win.webContents.send('state', { sessions: list, mood: sessions.mood(list), bubble: sessions.bubble(list), settings, note: hookNote });
  }
  updateVisibility(list);
}
function updateVisibility(list = [...map.values()]) {
  const alert = sessions.unacked(list).length > 0;
  const want = alert || settings.mode === 'always' || (settings.mode === 'auto' && !fullscreen);
  if (want === shown || !win) return;
  shown = want;
  clearTimeout(hideTimer);
  if (want) { win.showInactive(); win.setAlwaysOnTop(true, 'screen-saver'); win.webContents.send('vis', true); }
  else { win.webContents.send('vis', false); hideTimer = setTimeout(() => win.hide(), 320); }
}
function ack(id) {
  for (const s of map.values()) if (!id || s.id === id) s.acked = true;
  emit();
}
function onEvent(ev) {
  const hit = sessions.apply(map, ev);
  sessions.prune(map);
  if (hit) {
    win.webContents.send('chime', hit.state);
    clearTimeout(ackTimers.get(hit.id));
    // "done" clears itself; "needs you" stays until you deal with it
    if (hit.state === 'done') ackTimers.set(hit.id, setTimeout(() => ack(hit.id), DONE_MS));
  }
  emit();
}

// ---- hook receiver (loopback only; JSON content-type required so web pages cannot post to it) ----
function startServer() {
  http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/hook' || !/application\/json/.test(req.headers['content-type'] || '')) {
      res.writeHead(req.url === '/health' ? 200 : 404).end('pip'); return;
    }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
      try { onEvent(JSON.parse(body)); } catch {}
    });
  }).on('error', (e) => { hookNote = `Port ${hooks.PORT} is busy, I cannot hear Claude.`; console.error(e.message); emit(); })
    .listen(hooks.PORT, '127.0.0.1');
}

// ---- fullscreen watcher: Windows reports BUSY / D3D fullscreen / presentation as 2 / 3 / 4 ----
function startWatcher() {
  if (process.platform !== 'win32') return;
  const ps = `$t=Add-Type -MemberDefinition '[DllImport("shell32.dll")] public static extern int SHQueryUserNotificationState(out int s);' -Name Q -Namespace Pip -PassThru;` +
    `while($true){$s=0;[void]$t::SHQueryUserNotificationState([ref]$s);[Console]::Out.WriteLine($s);Start-Sleep -Milliseconds 1500}`;
  watcher = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
  watcher.stdout.on('data', (d) => {
    const n = parseInt(String(d).trim().split(/\s+/).pop(), 10);
    const fs_ = n >= 2 && n <= 4;
    if (fs_ !== fullscreen) { fullscreen = fs_; updateVisibility(); }
  });
  watcher.on('error', () => {});
}

// ---- menu ----
const demo = (name, extra) => () => onEvent({ session_id: 'demo', cwd: 'C:\\demo\\my-project', hook_event_name: name, ...extra });
function buildMenu() {
  const radio = (key, items) => items.map((i) => ({ label: i.name, type: 'radio', checked: settings[key] === i.id, click: () => save({ [key]: i.id }) }));
  const menu = Menu.buildFromTemplate([
    { label: 'Character', submenu: radio('char', CHARS) },
    { label: 'Colour', submenu: radio('skin', SKINS) },
    { label: 'Wearing', submenu: radio('acc', ACCS) },
    { label: 'Show', submenu: radio('mode', [
      { id: 'always', name: 'Always' },
      { id: 'auto', name: 'Hide while I am in fullscreen' },
      { id: 'shy', name: 'Only when Claude is done or needs me' },
    ]) },
    { label: 'Sound', type: 'checkbox', checked: settings.sound, click: (i) => save({ sound: i.checked }) },
    { label: 'Start with Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (i) => app.setLoginItemSettings({ openAtLogin: i.checked }) },
    { type: 'separator' },
    { label: 'Try it', submenu: [
      { label: 'Working', click: demo('UserPromptSubmit') },
      { label: 'Done', click: demo('Stop', { last_assistant_message: 'All 42 tests pass. Ready when you are.' }) },
      { label: 'Needs you', click: demo('PermissionRequest', { tool_name: 'Bash' }) },
      { label: 'End demo', click: demo('SessionEnd') },
    ] },
    { label: 'Claude Code hooks', submenu: [
      { label: 'Install / repair', click: () => installHooks() },
      { label: 'Remove', click: () => { try { hooks.uninstall(); } catch (e) { console.error(e.message); } } },
    ] },
    { label: 'Forget all sessions', click: () => { map.clear(); emit(); } },
    { type: 'separator' },
    { label: 'Quit Pip', click: () => app.quit() },
  ]);
  if (tray) tray.setContextMenu(menu);
  return menu;
}
function installHooks() {
  try { hooks.install(); hookNote = ''; }
  catch (e) { hookNote = 'I could not read your Claude settings, so hooks are not installed.'; console.error(e.message); }
  emit();
}

// ---- window ----
function createWindow() {
  const wa = screen.getPrimaryDisplay().workArea;
  let { x, y } = settings.pos || { x: wa.x + wa.width - W - 24, y: wa.y + wa.height - H - 8 };
  const onScreen = screen.getAllDisplays().some((d) => x >= d.bounds.x - W / 2 && x < d.bounds.x + d.bounds.width - W / 2 && y >= d.bounds.y && y < d.bounds.y + d.bounds.height - 60);
  if (!onScreen) { x = wa.x + wa.width - W - 24; y = wa.y + wa.height - H - 8; }
  win = new BrowserWindow({
    width: W, height: H, x, y, show: false, frame: false, transparent: true, resizable: false, hasShadow: false,
    skipTaskbar: true, alwaysOnTop: true, focusable: false, fullscreenable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  setInterval(() => {
    if (!shown || win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint(), b = win.getBounds();
    win.webContents.send('cursor', { x: p.x - b.x, y: p.y - b.y });
    if (dragOff) win.setBounds({ x: p.x - dragOff.x, y: p.y - dragOff.y, width: W, height: H }); // fixed size: setPosition drifts on scaled displays
  }, 33);
}

ipcMain.on('ready', () => { installHooks(); emit(); });
ipcMain.on('ignore', (_e, on) => win.setIgnoreMouseEvents(on, { forward: true }));
ipcMain.on('ack', (_e, id) => ack(id));
ipcMain.on('menu', () => buildMenu().popup({ window: win }));
ipcMain.on('drag', (_e, on) => {
  if (on) { const p = screen.getCursorScreenPoint(), b = win.getBounds(); dragOff = { x: p.x - b.x, y: p.y - b.y }; }
  else if (dragOff) { dragOff = null; const b = win.getBounds(); save({ pos: { x: b.x, y: b.y } }); }
});

app.whenReady().then(() => {
  settings = loadSettings();
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png')));
  tray.setToolTip('Pip');
  buildMenu();
  createWindow();
  startServer();
  startWatcher();
});
app.on('second-instance', () => { if (win) { shown = false; updateVisibility(); } });
app.on('window-all-closed', () => app.quit());
app.on('quit', () => { if (watcher) watcher.kill(); });
