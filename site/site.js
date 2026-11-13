const { CHARS, SKINS, ACCS, palette, mix } = PipPet;
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = (id) => CHARS.find((c) => c.id === id);
const pick = { char: 'blob', skin: 'coral', acc: 'none' };

// ---- the page has one accent: the colour of the pet you pick ----
function theme() {
  const p = palette(pick.skin), dark = p.ink !== '#261c2c', r = document.documentElement.style;
  r.setProperty('--accent', p.body);
  r.setProperty('--tint', mix(p.body, '#ffffff', dark ? 0.78 : 0.68));
  r.setProperty('--tint-2', mix(p.body, '#f6f5f4', dark ? 0.9 : 0.84));
  r.setProperty('--on-accent', dark ? '#ffffff' : '#000000');
}

// ---- pets that follow the current pick ----
const hero = $('hero-pet'), presence = $('presence-pet'), cast = $('cast-pet'), many = $('many-pet');
const tells = [...document.querySelectorAll('.stage .pet[data-mood]')];
const moodOf = (n) => n.querySelector('.pip')?.dataset.mood || 'idle';
function draw() {
  for (const n of [hero, presence, cast, many]) PipPet.mount(n, { ...pick, mood: moodOf(n) });
  for (const n of tells) PipPet.mount(n, { ...pick, mood: n.dataset.mood });
  tiles.forEach((b, i) => b.setAttribute('aria-pressed', CHARS[i].id === pick.char));
  for (const b of $('marks').children) b.setAttribute('aria-pressed', b.dataset.id === pick.char);
  const c = byId(pick.char), name = $('cast-name');
  if (name.textContent !== c.name) { name.textContent = c.name; name.classList.remove('swap'); void name.offsetWidth; name.classList.add('swap'); }
  $('cast-blurb').textContent = c.blurb;
  $('colour-label').textContent = c.fixed ? 'Page colour' : 'Colour';
  $('colour-name').textContent = SKINS.find((s) => s.id === pick.skin).name;
  $('fixed-note').hidden = !c.fixed;
  $('fixed-note').textContent = c.fixed ? `${c.name} keeps their own colours. The colour you pick still sets the page and the app theme.` : '';
  for (const b of $('swatches').children) b.setAttribute('aria-pressed', b.dataset.id === pick.skin);
  for (const b of $('chips').children) b.setAttribute('aria-pressed', b.dataset.id === pick.acc);
  theme();
}

// character tiles (all), avatar marks (the drawn cast), swatches, chips
const choose = (id) => { pick.char = id; draw(); PipPet.pet(cast); };
const tiles = CHARS.map((c) => {
  const b = el('button', null, 'tile'), p = el('div', null, 'pet');
  PipPet.mount(p, { char: c.id, skin: 'coral' });
  b.append(p, el('span', c.name));
  b.addEventListener('click', () => choose(c.id));
  $('tiles').append(b);
  return b;
});
const RINGS = ['#097fe8', '#f64932', '#ffb110', '#62aef0'];
['blob', 'simba', 'zuck', 'david', 'lucy', 'geralt', 'sage'].map(byId).filter(Boolean).forEach((c, i) => {
  const b = el('button', null, 'mark');
  b.dataset.id = c.id; b.setAttribute('aria-label', c.name); b.title = c.name;
  b.style.setProperty('--ring', RINGS[i % RINGS.length]);
  if (c.id === 'blob') b.style.setProperty('--crop', '-14%');
  PipPet.mount(b, { char: c.id, skin: 'coral' });
  b.addEventListener('click', () => { pick.char = c.id; draw(); PipPet.pet(hero); });
  $('marks').append(b);
});
for (const s of SKINS) {
  const b = el('button'); b.dataset.id = s.id; b.style.setProperty('--c', s.body); b.setAttribute('aria-label', s.name); b.title = s.name;
  b.addEventListener('click', () => { pick.skin = s.id; draw(); });
  $('swatches').append(b);
}
for (const a of ACCS) {
  const b = el('button', a.name); b.dataset.id = a.id;
  b.addEventListener('click', () => { pick.acc = a.id; draw(); });
  $('chips').append(b);
}
const free = CHARS.filter((c) => !c.fixed).length, total = (free * SKINS.length + (CHARS.length - free)) * ACCS.length;
$('combo').textContent = `${CHARS.length} characters, ${SKINS.length} colours and ${ACCS.length} things to wear or hold. That is ${total.toLocaleString('en')} pets, and this page takes its colour from the one you choose.`;

// ---- hero: a terminal session with the pet in its corner; cycles until you take over ----
const TERM = {
  working: [['> fix the flaky checkout test', 'b'], [''], ['Reading tests/checkout.spec.ts'], ['Running npm test', 'dim']],
  done: [['> fix the flaky checkout test', 'b'], [''], ['42 tests pass.'], ['The retry was racing the mock clock. Fixed in 2 files.', 'dim']],
  needs: [['> clean up the build output', 'b'], [''], ['Claude wants to run:'], ['  rm -rf dist', 'b'], ['Allow?   Yes   No', 'dim']],
  sleep: [['>', 'b'], [''], ['No sessions running.', 'dim']],
};
const SAY = { done: ['api-server is done', 'All 42 tests pass.'], needs: ['api-server needs you', 'Wants to use Bash'] };
let auto = !reduced;
function setHero(mood) {
  PipPet.setMood(hero, mood);
  for (const b of $('moods').children) b.setAttribute('aria-pressed', b.dataset.mood === mood);
  $('term').replaceChildren(...TERM[mood].flatMap(([text, cls]) => [el(cls === 'b' ? 'b' : 'span', text, cls === 'dim' ? 'dim' : ''), '\n']));
  $('hero-dots').replaceChildren(...(mood === 'sleep' ? [] : [el('i', null, mood)]));
  const say = $('say'), line = SAY[mood];
  say.hidden = !line;
  if (line) { say.replaceChildren(el('b', line[0]), el('span', line[1])); say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop'); }
}
$('moods').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { auto = false; setHero(b.dataset.mood); } });
const order = ['working', 'done', 'working', 'needs', 'working', 'sleep'];
let step = 0;
setInterval(() => { if (auto && !document.hidden && !hero.classList.contains('offscreen')) setHero(order[++step % order.length]); }, 3600);
hero.addEventListener('click', () => { PipPet.pet(hero); if (SAY[moodOf(hero)]) { auto = false; setHero('working'); } });
cast.addEventListener('click', () => PipPet.pet(cast));

// ---- presence demo: the same show and hide rules as the app ----
const sw = { app: $('sw-app'), term: $('sw-term'), full: $('sw-full') }, desk = $('desk');
const on = (k) => sw[k].getAttribute('aria-checked') === 'true';
let alertOn = false, leaving;
function applyPresence(why) {
  const claude = on('app') || on('term'), full = on('full');
  clearTimeout(leaving);
  if (alertOn) { desk.classList.remove('away'); PipPet.setMood(presence, 'done'); }
  else if (full || !claude) {
    PipPet.setMood(presence, 'idle');
    if (why === 'claude' && !full && !reduced) { PipPet.greet(presence, 'bye'); leaving = setTimeout(() => desk.classList.add('away'), 1400); } // a goodbye only when Claude closed
    else desk.classList.add('away');
  } else {
    const was = desk.classList.contains('away');
    desk.classList.remove('away'); PipPet.setMood(presence, 'idle');
    if (was && why === 'claude') PipPet.greet(presence, 'hello');
  }
  $('presence-status').textContent = alertOn ? 'A session finished. Pip shows up over anything to tell you.'
    : !claude ? 'Claude is closed. Pip waved goodbye and left.'
    : full ? 'Fullscreen. Pip is out of the way.' : 'Claude is open. Pip is on your desktop.';
}
for (const k of Object.keys(sw)) sw[k].addEventListener('click', () => {
  sw[k].setAttribute('aria-checked', !on(k)); alertOn = false; applyPresence(k === 'full' ? 'full' : 'claude');
});
$('finish').addEventListener('click', () => { alertOn = true; applyPresence('alert'); setTimeout(() => { if (alertOn) { alertOn = false; applyPresence('alert'); } }, 4000); });
applyPresence();

// ---- many sessions demo (sample data) ----
const rows = [
  { name: 'api-server', state: 'working', t: '4m' },
  { name: 'docs-site', state: 'working', t: '11m' },
  { name: 'mobile-app', state: 'done', t: '2m' },
  { name: 'data-pipeline', state: 'working', t: '26m' },
];
const LABEL = { working: 'working', done: 'done', needs: 'needs you' };
const SCRIPT = [[0, 'done'], [1, 'needs'], [2, 'working'], [1, 'working'], [3, 'done'], [0, 'working'], [3, 'working'], [2, 'done']];
let beat = 0;
function drawRows(changed) {
  $('rows').replaceChildren(...rows.map((r, i) => {
    const row = el('div', null, 'row ' + r.state + (i === changed ? ' changed' : ''));
    row.append(el('i'), el('b', r.name), el('span', `${LABEL[r.state]}, ${r.t}`));
    return row;
  }));
  $('many-dots').replaceChildren(...rows.map((r) => el('i', null, r.state)));
  PipPet.setMood(many, changed == null ? 'working' : rows[changed].state);
}
if (!reduced) setInterval(() => {
  if (document.hidden || many.classList.contains('offscreen')) return;
  const [i, state] = SCRIPT[beat++ % SCRIPT.length];
  rows[i].state = state; rows[i].t = 'just now';
  drawRows(i);
}, 2600);

// ---- closing line-up, each in its own colour ----
['blob', 'simba', 'zuck', 'david', 'lucy', 'geralt', 'kage', 'duck'].map(byId).filter(Boolean).forEach((c, i) => {
  const n = el('div', null, 'pet');
  PipPet.mount(n, { char: c.id, skin: SKINS[(i * 3 + 9) % SKINS.length].id, acc: ACCS[(i * 2 + 1) % ACCS.length].id, mood: i % 3 === 0 ? 'done' : 'idle' });
  $('parade').append(n);
});

draw();
drawRows();
setHero('working');

// ---- every pet watches the cursor; pets off screen pause ----
const pets = [...document.querySelectorAll('.pet')];
addEventListener('pointermove', (e) => {
  const c = (v) => Math.max(-1, Math.min(1, v));
  for (const n of pets) {
    if (n.classList.contains('offscreen')) continue;
    const r = n.getBoundingClientRect();
    PipPet.look(n, c((e.clientX - r.left - r.width / 2) / 340), c((e.clientY - r.top - r.height / 2) / 340));
  }
}, { passive: true });
const vis = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('offscreen', !e.isIntersecting)), { rootMargin: '120px' });
pets.forEach((n) => vis.observe(n));
