const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sessions = require('./sessions');
const hooks = require('./hooks');
const { CHARS, SKINS, ACCS } = require('./renderer/pet.js');

const W = 300, H = 340, DONE_MS = 20000;
const map = new Map();
let hooksOk = false;
let win, ui, tray, watcher, settings, fullscreen = false, shown = false, hideTimer, dragOff, hookNote = '';
const ackTimers = new Map();

// A second copy must do nothing except hand over to the first one, which then opens the app window.
const primary = app.requestSingleInstanceLock();
if (!primary) app.quit();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  let s = {};
  try { s = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch {}
  return { char: 'blob', skin: 'coral', acc: 'none', mode: 'auto', sound: true, ...s };
}
// Settings arrive from the app window, so only known keys with known values are accepted.
const ALLOWED = {
  char: CHARS.map((c) => c.id), skin: SKINS.map((s) => s.id), acc: ACCS.map((a) => a.id),
  mode: ['always', 'auto', 'shy'], sound: [true, false],
};
function save(patch) {
  for (const k of Object.keys(patch)) if (k !== 'pos' && !(ALLOWED[k] || []).includes(patch[k])) delete patch[k];
  Object.assign(settings, patch);
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  buildMenu(); emit();
}

// ---- state -> renderer ----
function emit() {
  const list = [...map.values()];
  const info = { version: app.getVersion(), login: app.getLoginItemSettings().openAtLogin, hooks: hooksOk };
  const state = { sessions: list, mood: sessions.mood(list), bubble: sessions.bubble(list), settings, note: hookNote, info };
  for (const w of [win, ui]) if (w && !w.isDestroyed()) w.webContents.send('state', state);
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
    // Only Claude Code's hook client may post: exact JSON type, no browser Origin, loopback Host (blocks CSRF and DNS rebinding).
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const local = req.headers.host === `127.0.0.1:${hooks.PORT}` || req.headers.host === `localhost:${hooks.PORT}`;
    if (req.method !== 'POST' || req.url !== '/hook' || type !== 'application/json' || req.headers.origin || !local) {
      res.writeHead(req.url === '/health' ? 200 : 404).end('pip'); return;
    }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
      try { onEvent(JSON.parse(body)); } catch {}
    });
  }).on('error', (e) => { hookNote = `Port ${hooks.PORT} is busy, I cannot hear Claude.`; console.error(e.message); emit(); })
    .listen(hooks.PORT, '127.0.0.1', installHooks); // hooks are only installed once Pip really owns the port
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
const DEMO = {
  working: ['UserPromptSubmit'], done: ['Stop', { last_assistant_message: 'All 42 tests pass. Ready when you are.' }],
  needs: ['PermissionRequest', { tool_name: 'Bash' }], end: ['SessionEnd'],
};
const LINKS = { releases: 'https://github.com/youssef-110/pip-pet/releases/latest', site: 'https://pip-pet.vercel.app', repo: 'https://github.com/youssef-110/pip-pet' };
const demo = (name, extra) => () => onEvent({ session_id: 'demo', cwd: 'C:\\demo\\my-project', hook_event_name: name, ...extra });
function buildMenu() {
  const radio = (key, items) => items.map((i) => ({ label: i.name, type: 'radio', checked: settings[key] === i.id, click: () => save({ [key]: i.id }) }));
  const menu = Menu.buildFromTemplate([
    { label: 'Open Pip', click: showUi },
    { type: 'separator' },
    { label: 'Character', submenu: radio('char', CHARS) },
    { label: 'Colour', submenu: radio('skin', SKINS) },
    { label: 'Wearing', submenu: radio('acc', ACCS) },
    { label: 'Show', submenu: radio('mode', [
      { id: 'always', name: 'Always' },
      { id: 'auto', name: 'Hide while I am in fullscreen' },
      { id: 'shy', name: 'Only when Claude is done or needs me' },
    ]) },
    { label: 'Sound', type: 'checkbox', checked: settings.sound, click: (i) => save({ sound: i.checked }) },
    { label: 'Start with Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (i) => setLogin(i.checked) },
    { type: 'separator' },
    { label: 'Try it', submenu: [
      { label: 'Working', click: demo('UserPromptSubmit') },
      { label: 'Done', click: demo('Stop', { last_assistant_message: 'All 42 tests pass. Ready when you are.' }) },
      { label: 'Needs you', click: demo('PermissionRequest', { tool_name: 'Bash' }) },
      { label: 'End demo', click: demo('SessionEnd') },
    ] },
    { label: 'Claude Code hooks', submenu: [
      { label: 'Install / repair', click: () => installHooks() },
      { label: 'Remove', click: removeHooks },
    ] },
    { label: 'Forget all sessions', click: () => { map.clear(); emit(); } },
    { type: 'separator' },
    { label: 'Quit Pip', click: () => app.quit() },
  ]);
  if (tray) tray.setContextMenu(menu);
  return menu;
}
function installHooks() {
  try { hooks.install(); hookNote = ''; hooksOk = true; }
  catch (e) { hookNote = 'I could not read your Claude settings, so hooks are not installed.'; console.error(e.message); }
  emit();
}

function removeHooks() {
  try { hooks.uninstall(); hooksOk = false; } catch (e) { console.error(e.message); }
  emit();
}
// --hidden keeps the app window closed when Windows starts Pip at login
function setLogin(on) { app.setLoginItemSettings({ openAtLogin: !!on, args: ['--hidden'] }); buildMenu(); emit(); }

// ---- app window: pick a character, watch sessions, change settings ----
function showUi() {
  if (ui && !ui.isDestroyed()) { if (ui.isMinimized()) ui.restore(); ui.show(); ui.focus(); return; }
  ui = new BrowserWindow({
    width: 1060, height: 740, minWidth: 820, minHeight: 600, title: 'Pip', backgroundColor: '#fdebe6', autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'), webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  ui.setMenu(null);
  ui.loadFile(path.join(__dirname, 'renderer', 'ui.html'));
  ui.on('closed', () => { ui = null; });
  // dev only: PIP_SHOT=<file.png> saves a screenshot of the app window for the README
  if (process.env.PIP_SHOT) ui.webContents.once('did-finish-load', () => setTimeout(async () => fs.writeFileSync(process.env.PIP_SHOT, (await ui.webContents.capturePage()).toPNG()), 2500));
}

// ---- pet window ----
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

ipcMain.on('ready', () => emit());
ipcMain.on('ui', showUi);
ipcMain.on('save', (_e, patch) => { if (patch && typeof patch === 'object') { delete patch.pos; save({ ...patch }); } });
ipcMain.on('login', (_e, on) => setLogin(on));
ipcMain.on('hooks', (_e, action) => (action === 'remove' ? removeHooks() : installHooks()));
ipcMain.on('forget', () => { map.clear(); emit(); });
ipcMain.on('demo', (_e, name) => { if (DEMO[name]) demo(...DEMO[name])(); });
ipcMain.on('open', (_e, what) => { if (LINKS[what]) shell.openExternal(LINKS[what]); });
ipcMain.on('ignore', (_e, on) => win.setIgnoreMouseEvents(on, { forward: true }));
ipcMain.on('ack', (_e, id) => ack(id));
ipcMain.on('menu', () => buildMenu().popup({ window: win }));
ipcMain.on('drag', (_e, on) => {
  if (on) { const p = screen.getCursorScreenPoint(), b = win.getBounds(); dragOff = { x: p.x - b.x, y: p.y - b.y }; }
  else if (dragOff) { dragOff = null; const b = win.getBounds(); save({ pos: { x: b.x, y: b.y } }); }
});

app.whenReady().then(() => {
  if (!primary) return;
  settings = loadSettings();
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png')));
  tray.setToolTip('Pip');
  tray.on('click', showUi);
  buildMenu();
  createWindow();
  startServer();
  startWatcher();
  if (!process.argv.includes('--hidden')) showUi();
});
// Launching Pip again opens the app window instead of silently doing nothing.
app.on('second-instance', () => { if (app.isReady()) showUi(); });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (win && !win.isDestroyed()) win.destroy(); });
app.on('quit', () => { if (watcher) watcher.kill(); });
