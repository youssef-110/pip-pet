// Renders the app and tray icons from Pip's own drawing, so the icon always matches the character.
// Run with `npm run icon`. Uses Electron's offscreen renderer; no image libraries.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { svg, palette } = require('./renderer/pet.js');

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 512, height: 512, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
  const css = fs.readFileSync(path.join(__dirname, 'renderer', 'pet.css'), 'utf8');
  const vars = Object.entries(palette('coral')).map(([k, v]) => `--${k}:${v}`).join(';');
  // Head, ears and scarf only: at 32px a whole body is a smudge.
  const head = svg('blob').replace('viewBox="0 0 200 200"', 'viewBox="32 0 136 136"');
  const html = `<style>${css} html,body{margin:0;background:transparent;overflow:hidden} .pip *{animation:none!important} .plume,.shadow,.fx,.arm{display:none}</style><div style="width:512px;height:512px;${vars}">${head}</div>`;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 500));
  const img = await win.webContents.capturePage();
  const dir = path.join(__dirname, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'icon.png'), img.resize({ width: 256, height: 256, quality: 'best' }).toPNG());
  fs.writeFileSync(path.join(dir, 'tray.png'), img.resize({ width: 32, height: 32, quality: 'best' }).toPNG());
  app.quit();
});
