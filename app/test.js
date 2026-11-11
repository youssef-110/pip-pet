const test = require('node:test');
const assert = require('node:assert');
const { apply, mood, bubble, newer } = require('./sessions');
const { withHooks, withoutHooks, EVENTS } = require('./hooks');

const ev = (name, extra = {}) => ({ session_id: 'a', cwd: 'C:\\Users\\me\\api-server', hook_event_name: name, ...extra });

test('session lifecycle', () => {
  const m = new Map();
  assert.equal(apply(m, ev('UserPromptSubmit')), null);
  assert.equal(mood([...m.values()]), 'working');
  assert.equal(m.get('a').name, 'api-server');

  const need = apply(m, ev('PermissionRequest', { tool_name: 'Bash' }));
  assert.equal(need.state, 'needs');
  assert.equal(apply(m, ev('Notification', { notification_type: 'permission_prompt', message: 'x' })), null, 'no double alert');
  assert.equal(apply(m, ev('PostToolUse')), null);
  assert.equal(mood([...m.values()]), 'working');

  const done = apply(m, ev('Stop', { last_assistant_message: '**All**   tests pass' }));
  assert.equal(done.msg, 'All tests pass');
  assert.equal(mood([...m.values()]), 'done');
  assert.equal(apply(m, ev('Notification', { notification_type: 'idle_prompt' })), null);
  assert.equal(apply(m, ev('SessionStart')), null, 'resume does not downgrade');
  assert.equal(m.get('a').state, 'done');

  m.get('a').acked = true;
  assert.equal(mood([...m.values()]), 'idle');
  apply(m, ev('SessionEnd'));
  assert.equal(mood([...m.values()]), 'sleep');
  assert.equal(apply(m, { hook_event_name: 'Stop' }), null, 'no session id');
});

test('version comparison', () => {
  assert.equal(newer('1.10.0', '1.9.3'), true);
  assert.equal(newer('1.2.0', '1.2.0'), false);
  assert.equal(newer('1.1.9', '1.2.0'), false);
});

test('needs outranks done across sessions', () => {
  const m = new Map();
  apply(m, ev('Stop'), 1);
  apply(m, { ...ev('PermissionRequest'), session_id: 'b' }, 2);
  apply(m, { ...ev('Stop'), session_id: 'c' }, 3);
  const list = [...m.values()];
  assert.equal(mood(list), 'needs');
  assert.equal(bubble(list).id, 'b');
});

test('hook install is idempotent and uninstall leaves other hooks alone', () => {
  const mine = { hooks: [{ type: 'command', command: 'echo hi' }] };
  const base = { model: 'x', hooks: { Stop: [mine] } };
  const once = withHooks(base);
  assert.deepEqual(withHooks(once), once);
  assert.equal(once.hooks.Stop.length, 2);
  assert.equal(Object.keys(once.hooks).length, EVENTS.length);
  assert.deepEqual(withoutHooks(once), base);
  assert.deepEqual(withoutHooks(withHooks({ model: 'x' })), { model: 'x' });
});
