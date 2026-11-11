// Adds / removes Pip's HTTP hooks in Claude Code's user settings. Never touches other hooks.
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 47821;
const URL = `http://127.0.0.1:${PORT}/hook`;
const EVENTS = ['UserPromptSubmit', 'PostToolUse', 'PermissionRequest', 'Notification', 'Stop', 'StopFailure', 'SessionEnd'];
const SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');

const isOurs = (h) => h && h.type === 'http' && h.url === URL;

function withHooks(settings) {
  const out = { ...settings, hooks: { ...(settings.hooks || {}) } };
  for (const ev of EVENTS) {
    const groups = out.hooks[ev] || [];
    if (groups.some((g) => (g.hooks || []).some(isOurs))) continue;
    out.hooks[ev] = [...groups, { hooks: [{ type: 'http', url: URL, timeout: 2 }] }];
  }
  return out;
}

function withoutHooks(settings) {
  if (!settings.hooks) return settings;
  const hooks = {};
  for (const [ev, groups] of Object.entries(settings.hooks)) {
    const kept = groups
      .map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !isOurs(h)) }))
      .filter((g) => g.hooks.length);
    if (kept.length) hooks[ev] = kept;
  }
  const out = { ...settings, hooks };
  if (!Object.keys(hooks).length) delete out.hooks;
  return out;
}

// Returns 'changed' | 'unchanged'. Throws if settings.json exists but is not valid JSON (we never overwrite that).
function update(transform, file = SETTINGS) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '{}';
  const next = JSON.stringify(transform(JSON.parse(before)), null, 2) + '\n';
  if (JSON.stringify(JSON.parse(before)) === JSON.stringify(JSON.parse(next))) return 'unchanged';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && !fs.existsSync(file + '.pip-backup')) fs.copyFileSync(file, file + '.pip-backup');
  fs.writeFileSync(file, next);
  return 'changed';
}

function installed(file = SETTINGS) {
  try { const h = JSON.parse(fs.readFileSync(file, 'utf8')).hooks || {}; return EVENTS.every((ev) => (h[ev] || []).some((g) => (g.hooks || []).some(isOurs))); }
  catch { return false; }
}

module.exports = {
  installed,
  PORT, URL, EVENTS, SETTINGS, withHooks, withoutHooks,
  install: (file) => update(withHooks, file),
  uninstall: (file) => update(withoutHooks, file),
};
