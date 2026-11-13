const { CHARS, SKINS, ACCS, palette, mix } = PipPet;
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
const preview = $('preview');
let S = null, drawn = '', mood = 'idle';

const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; };
const LABEL = { working: 'working', done: 'done', needs: 'needs you', error: 'error', idle: 'idle' };

// ---- build the pickers once ----
const charBtns = CHARS.map((c) => {
  const b = el('button', null, 'pet'); b.setAttribute('aria-label', c.name); b.title = c.name;
  b.addEventListener('click', () => pip.save({ char: c.id }));
  $('chars').append(b);
  return b;
});
for (const s of SKINS) {
  const b = el('button'); b.dataset.id = s.id; b.style.background = s.body; b.setAttribute('aria-label', s.name); b.title = s.name;
  b.addEventListener('click', () => pip.save({ skin: s.id }));
  $('swatches').append(b);
}
for (const a of ACCS) {
  const b = el('button', a.name); b.dataset.id = a.id;
  b.addEventListener('click', () => pip.save({ acc: a.id }));
  $('accs').append(b);
}
const press = (box, id) => { for (const b of box.children) b.setAttribute('aria-pressed', b.dataset.id === id); };

function theme(skin) {
  const p = palette(skin), dark = p.ink !== '#261c2c', r = document.documentElement.style;
  r.setProperty('--ground', mix(p.body, '#ffffff', dark ? 0.88 : 0.84));
  r.setProperty('--ground-2', mix(p.body, '#ffffff', dark ? 0.74 : 0.66));
  r.setProperty('--skin', dark ? mix(p.body, '#ffffff', 0.6) : p.body);
}

function render() {
  const st = S.settings, key = [st.char, st.skin, st.acc].join('/');
  if (key !== drawn) {
    drawn = key;
    PipPet.mount(preview, { ...st, mood });
    charBtns.forEach((b, i) => { PipPet.mount(b, { char: CHARS[i].id, skin: st.skin, acc: st.acc }); b.setAttribute('aria-pressed', CHARS[i].id === st.char); });
    const c = CHARS.find((c) => c.id === st.char) || CHARS[0], name = $('name');
    if (name.textContent !== c.name) { name.textContent = c.name; name.classList.remove('swap'); void name.offsetWidth; name.classList.add('swap'); }
    $('blurb').textContent = c.blurb;
    $('colour-name').textContent = (SKINS.find((s) => s.id === st.skin) || SKINS[0]).name + (c.fixed ? `. ${c.name} keeps their own colours; this sets the theme.` : '');
    press($('swatches'), st.skin); press($('accs'), st.acc);
    theme(st.skin);
  }
  press($('modes'), st.mode); press($('sizes'), st.size);
  $('update').hidden = !S.info.latest;
  if (S.info.latest) $('update').textContent = `Update to ${S.info.latest}`;
  $('sound').setAttribute('aria-checked', !!st.sound);
  $('enabled').setAttribute('aria-checked', !!st.enabled);
  $('follow').setAttribute('aria-checked', !!st.follow);
  $('login').setAttribute('aria-checked', !!S.info.login);
  $('version').textContent = 'Version ' + S.info.version;

  const hook = S.note || (S.info.hooks ? 'Connected to Claude Code. New sessions show up here on their own.' : 'Not connected to Claude Code yet. Install the hooks in Settings.');
  $('hook-status').textContent = hook; $('hook-status-2').textContent = hook;

  const list = S.sessions;
  $('count').textContent = list.length || '';
  if (!list.length) {
    const e = el('div', null, 'empty'); e.append(el('b', 'Nothing running'), el('p', 'Start claude in any terminal and it appears here.'));
    $('rows').replaceChildren(e);
  } else {
    $('rows').replaceChildren(...list.map((s) => {
      const row = el('div', null, 'row ' + s.state);
      row.append(el('i'), el('b', s.name), el('span', `${LABEL[s.state]}, ${ago(s.since)}`));
      if (s.msg) row.append(el('em', s.msg));
      return row;
    }));
  }
}

// ---- wiring ----
pip.onState((s) => { S = s; render(); });
$('tabs').addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  for (const b of $('tabs').children) b.setAttribute('aria-selected', b === t);
  for (const id of ['pet', 'sessions', 'settings']) $('tab-' + id).hidden = id !== t.dataset.tab;
  document.querySelector('.panels').scrollTop = 0;
});
$('moods').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  mood = b.dataset.mood; PipPet.setMood(preview, mood);
  for (const x of $('moods').children) x.setAttribute('aria-pressed', x === b);
});
$('modes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pip.save({ mode: b.dataset.id }); });
$('sizes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pip.save({ size: b.dataset.id }); });
$('enabled').addEventListener('click', () => pip.save({ enabled: !S.settings.enabled }));
$('follow').addEventListener('click', () => pip.save({ follow: !S.settings.follow }));
$('sound').addEventListener('click', () => pip.save({ sound: !S.settings.sound }));
$('login').addEventListener('click', () => pip.login(!S.info.login));
$('hooks-install').addEventListener('click', () => pip.hooks('install'));
$('hooks-remove').addEventListener('click', () => pip.hooks('remove'));
$('forget').addEventListener('click', () => pip.forget());
$('demo').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pip.demo(b.dataset.ev); });
document.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) pip.open(b.dataset.open); });
preview.addEventListener('click', () => PipPet.pet(preview));
addEventListener('pointermove', (e) => {
  const r = preview.getBoundingClientRect(), c = (v) => Math.max(-1, Math.min(1, v));
  PipPet.look(preview, c((e.clientX - r.left - r.width / 2) / 300), c((e.clientY - r.top - r.height / 2) / 300));
}, { passive: true });
setInterval(() => { if (S) render(); }, 30000);
pip.ready();
