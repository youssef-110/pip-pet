// Turns Claude Code hook events into per-session state. Pure: no Electron, no I/O.
const path = require('path');

const WORK = new Set(['UserPromptSubmit', 'PreToolUse', 'PostToolUse']);
const NEEDS = new Set(['permission_prompt', 'elicitation_dialog', 'elicitation_url_dialog', 'agent_needs_input']);
const ALERT = new Set(['done', 'needs', 'error']);
const STALE_MS = 12 * 60 * 60 * 1000;

const clean = (s) => String(s || '').replace(/[`*_#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 110);

// Applies one hook event. Returns the session when it just entered an alert state, else null.
function apply(map, ev, now = Date.now()) {
  const id = ev && ev.session_id;
  if (typeof id !== 'string' || !id) return null;
  const e = ev.hook_event_name;
  if (e === 'SessionEnd') { map.delete(id); return null; }

  let next, msg = '';
  if (WORK.has(e)) next = 'working';
  else if (e === 'Stop') { next = 'done'; msg = ev.last_assistant_message; }
  else if (e === 'StopFailure') { next = 'error'; msg = ev.error || 'Stopped with an error'; }
  else if (e === 'PermissionRequest') { next = 'needs'; msg = ev.tool_name ? `Wants to use ${ev.tool_name}` : ''; }
  else if (e === 'Notification') { if (!NEEDS.has(ev.notification_type)) return null; next = 'needs'; msg = ev.message; }
  else if (e === 'SessionStart') next = 'idle';
  else return null;

  let s = map.get(id);
  if (!s) { s = { id, name: 'session', state: 'idle', acked: true, since: now, seen: now, msg: '' }; map.set(id, s); }
  if (typeof ev.cwd === 'string' && ev.cwd) s.name = path.win32.basename(ev.cwd.replace(/\//g, '\\')) || s.name;
  s.seen = now;
  if (next === 'idle') return null; // SessionStart also fires on resume/compact: never downgrade
  if (s.state === next) { if (msg) s.msg = clean(msg); return null; }
  s.state = next; s.since = now; s.msg = clean(msg); s.acked = !ALERT.has(next);
  return s.acked ? null : s;
}

function prune(map, now = Date.now()) {
  for (const [id, s] of map) if (now - s.seen > STALE_MS) map.delete(id);
}

const unacked = (list) => list.filter((s) => !s.acked);

function mood(list) {
  const u = unacked(list);
  if (u.some((s) => s.state === 'needs')) return 'needs';
  if (u.some((s) => s.state === 'error')) return 'error';
  if (u.some((s) => s.state === 'done')) return 'done';
  if (list.some((s) => s.state === 'working')) return 'working';
  return list.length ? 'idle' : 'sleep';
}

// The session the speech bubble should talk about: needs first, then newest.
function bubble(list) {
  const u = unacked(list).sort((a, b) => (b.state !== 'done') - (a.state !== 'done') || b.since - a.since);
  return u[0] || null;
}

module.exports = { apply, prune, mood, bubble, unacked };
