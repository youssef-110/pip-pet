const { CHARS, SKINS, ACCS, palette, mix } = PipPet;
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = { char: 'blob', skin: 'coral', acc: 'none' };
const charOf = (id) => CHARS.find((c) => c.id === id) || CHARS[0];

// ---- the corner pet: one pet for the whole page, standing where the app stands on your screen ----
const buddy = $('buddy'), pet = $('pet'), say = $('say'), dots = $('dots');
const LINES = {
  done: ['api-server is done', 'All 42 tests pass. Ready when you are.'],
  needs: ['docs-site needs you', 'Wants to use Bash'],
};
function speak(title, msg) {
  say.hidden = !title;
  if (!title) return;
  say.replaceChildren(el('b', title), ...(msg ? [el('span', msg)] : []));
  say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop');
}
function act(mood, title, msg) { PipPet.setMood(pet, mood); speak(title, msg); }
const show = (mood) => act(mood, ...(LINES[mood] || []));
// hello / bye arrive with the newer pet.js; older builds fall back to the petting squish
const greet = (kind) => { if (PipPet.greet) PipPet.greet(pet, kind); else if (kind === 'hello') PipPet.pet(pet); };

// ---- headline: split into words so each one rises on load ----
const h1 = $('h1');
h1.setAttribute('aria-label', h1.textContent);
h1.replaceChildren(...h1.textContent.split(' ').flatMap((word, i) => {
  const w = el('span', null, 'w'), inner = el('span', word);
  w.style.setProperty('--i', i); w.setAttribute('aria-hidden', 'true'); w.append(inner);
  return [w, ' '];
}));

// ---- the page takes its colours from the pet you pick: ground from its accent, highlights from its body ----
function theme() {
  const p = palette(pick.skin), dark = p.ink !== '#261c2c', r = document.documentElement.style, a = p.accent || p.body;
  r.setProperty('--ground', mix(a, '#ffffff', 0.82));
  r.setProperty('--ground-2', mix(a, '#ffffff', 0.62));
  r.setProperty('--skin', p.body);
  r.setProperty('--on-skin', dark ? '#fff4de' : '#221a28');
  r.setProperty('--on-skin-text', dark ? '#221a28' : '#ffffff');
}

// ---- picker ----
const shelf = $('shelf');
const picks = CHARS.map((c) => {
  const b = el('button', null, 'pick'), p = el('div', null, 'pet');
  b.type = 'button'; p.setAttribute('aria-hidden', 'true'); b.append(p, el('span', c.name)); // the name under the picture is the label
  b.addEventListener('click', () => { pick.char = c.id; draw(); PipPet.pet(pet); });
  shelf.append(b);
  return { b, p, c };
});
for (const s of SKINS) {
  const b = el('button'); b.type = 'button'; b.dataset.id = s.id; b.style.background = s.body; b.setAttribute('aria-label', s.name); b.title = s.name;
  b.addEventListener('click', () => { pick.skin = s.id; draw(); });
  $('swatches').append(b);
}
for (const a of ACCS) {
  const b = el('button', a.name); b.type = 'button'; b.dataset.id = a.id;
  b.addEventListener('click', () => { pick.acc = a.id; draw(); });
  $('chips').append(b);
}
{ // counts come from the data, so they stay right when characters are added
  const fixed = CHARS.filter((c) => c.fixed).length, things = ACCS.filter((a) => a.id !== 'none').length;
  const pets = ((CHARS.length - fixed) * SKINS.length + fixed) * ACCS.length;
  $('combo').textContent = `${CHARS.length} characters, ${SKINS.length} colours and ${things} things to wear. That is ${pets.toLocaleString('en')} different pets, and this whole page follows the one you choose.`;
}

function draw() {
  const c = charOf(pick.char), name = $('cast-name');
  PipPet.mount(pet, { ...pick, mood: pet.querySelector('.pip')?.dataset.mood || 'idle' });
  pet.setAttribute('aria-label', 'Pet ' + c.name);
  for (const { b, p, c: k } of picks) { PipPet.mount(p, { char: k.id, skin: pick.skin, acc: pick.acc }); b.setAttribute('aria-pressed', k.id === pick.char); }
  if (name.textContent !== c.name) { name.textContent = c.name; name.classList.remove('swap'); void name.offsetWidth; name.classList.add('swap'); }
  $('cast-blurb').textContent = c.blurb;
  // characters with their own colours keep them: the swatches then only recolour the page
  $('colour-label').textContent = c.fixed ? 'Page colour' : 'Colour';
  $('fixed-note').hidden = !c.fixed;
  $('fixed-note').textContent = `${c.name} comes in its own colours, so the swatches only change the page.`;
  $('colour-name').textContent = (SKINS.find((s) => s.id === pick.skin) || SKINS[0]).name;
  for (const b of $('swatches').children) b.setAttribute('aria-pressed', b.dataset.id === pick.skin);
  for (const b of $('chips').children) b.setAttribute('aria-pressed', b.dataset.id === pick.acc);
  theme();
}

// ---- presence: three switches and one button that follow the same rules as the app ----
const presence = $('presence'), switches = [...presence.querySelectorAll('.switch')];
const sw = { app: true, term: true, full: false };
let alertOn = false, byeT, alertT;
function applyPresence(changed) {
  const claude = sw.app || sw.term, there = alertOn || (claude && !sw.full), wasGone = buddy.classList.contains('gone');
  presence.classList.toggle('full', sw.full);
  $('finish').disabled = !claude;
  clearTimeout(byeT);
  if (there) {
    buddy.classList.remove('gone');
    show(alertOn ? 'done' : 'idle');
    if (wasGone && (changed === 'app' || changed === 'term')) greet('hello');
  } else if (!wasGone) {
    show('idle');
    // closing the last Claude gets a goodbye wave; fullscreen and a finished alert just duck out
    if (changed === 'app' || changed === 'term') { greet('bye'); byeT = setTimeout(() => buddy.classList.add('gone'), PipPet.greet && !reduced ? 1500 : 200); }
    else buddy.classList.add('gone');
  }
  $('presence-status').textContent = alertOn ? 'A session finished, so Pip is here to tell you.' + (sw.full ? ' Then it leaves again.' : '')
    : !claude ? 'Nothing from Claude is open. Pip waved goodbye and left.'
    : sw.full ? 'You are in fullscreen. Pip is out of the way.'
    : 'Claude is open. Pip is on your desktop.';
}
function resetPresence() {
  Object.assign(sw, { app: true, term: true, full: false });
  alertOn = false; clearTimeout(byeT); clearTimeout(alertT);
  for (const b of switches) b.setAttribute('aria-checked', sw[b.dataset.sw]);
  buddy.classList.remove('gone');
  applyPresence();
}
for (const b of switches) b.addEventListener('click', () => {
  enter(presence);
  sw[b.dataset.sw] = !sw[b.dataset.sw];
  b.setAttribute('aria-checked', sw[b.dataset.sw]);
  applyPresence(b.dataset.sw);
});
$('finish').addEventListener('click', () => {
  enter(presence);
  alertOn = true; applyPresence('alert');
  clearTimeout(alertT);
  alertT = setTimeout(() => { alertOn = false; applyPresence('alert'); }, 4200);
});

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
  $('panel').replaceChildren(...rows.map((r, i) => {
    const row = el('div', null, 'row ' + r.state + (i === changed ? ' changed' : ''));
    row.append(el('i'), el('b', r.name), el('span', `${LABEL[r.state]}, ${r.t}`));
    return row;
  }));
  dots.replaceChildren(...rows.map((r) => el('i', null, r.state)));
  if (scene !== 'many') return;
  const r = rows[changed];
  if (!r || r.state === 'working') act('working'); else act(r.state, `${r.name} ${r.state === 'done' ? 'is done' : 'needs you'}`);
}

// ---- scenes: whatever sits in the middle of the screen tells the corner pet what to do ----
const tells = [...document.querySelectorAll('.tells article')];
let scene = '', current = null;
function enter(n) {
  if (n === current) return;
  if (scene === 'presence') resetPresence();
  current = n; scene = n.dataset.scene;
  buddy.dataset.size = scene === 'hero' || scene === 'cast' ? 'l' : '';
  buddy.classList.toggle('out', scene === 'adopt');
  dots.hidden = scene !== 'many';
  tells.forEach((a) => a.classList.toggle('active', a === n));
  if (scene === 'tell') show(n.dataset.mood);
  else if (scene === 'presence') applyPresence();
  else if (scene === 'many') drawRows();
  else show(scene === 'how' ? 'sleep' : 'idle');
}
const sceneIO = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) enter(e.target); }, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-scene]').forEach((n) => sceneIO.observe(n));
for (const a of tells) a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') enter(a); });

// at the top of the page the pet runs through its moods on its own
const order = ['working', 'done', 'working', 'needs', 'working', 'sleep'];
let step = 0;
if (!reduced) setInterval(() => {
  if (document.hidden) return;
  if (scene === 'hero') show(order[step++ % order.length]);
  else if (scene === 'many') { const [i, state] = SCRIPT[beat++ % SCRIPT.length]; rows[i].state = state; rows[i].t = 'just now'; drawRows(i); }
}, 3200);

// ---- closing parade: a line-up of characters, each in its own colour ----
['blob', 'simba', 'zuck', 'david', 'lucy', 'geralt', 'kage', 'grim', 'titan', 'cat'].map((id) => CHARS.find((c) => c.id === id)).filter(Boolean).slice(0, 8).forEach((c, i) => {
  const n = el('div', null, 'pet'); n.style.setProperty('--i', i % 4);
  PipPet.mount(n, { char: c.id, skin: SKINS[(i * 3 + 5) % SKINS.length].id, acc: ACCS[(i * 2 + 1) % ACCS.length].id, mood: i % 3 === 0 ? 'done' : 'idle' });
  $('parade').append(n);
});

draw();
drawRows();
if (scrollY < innerHeight / 2) enter(document.querySelector('.hero')); // the observer reports late on a cold load, and the hello below needs the scene

// arrive the way the app does when Claude opens: pop up, wave, say hello
setTimeout(() => {
  buddy.classList.remove('gone');
  setTimeout(() => { if (scene !== 'hero') return; greet('hello'); speak('Hello.', 'Claude is open, so here I am.'); }, 450);
}, 300);

// ---- every pet watches the cursor; the corner pet likes being clicked ----
const pets = [...document.querySelectorAll('.pet')];
addEventListener('pointermove', (e) => {
  const c = (v) => Math.max(-1, Math.min(1, v));
  for (const n of pets) {
    if (n.classList.contains('offscreen')) continue;
    const r = n.getBoundingClientRect();
    PipPet.look(n, c((e.clientX - r.left - r.width / 2) / 340), c((e.clientY - r.top - r.height / 2) / 340));
  }
}, { passive: true });
pet.addEventListener('click', () => { PipPet.pet(pet); });

// pause pets that are off screen
const vis = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('offscreen', !e.isIntersecting)), { rootMargin: '120px' });
pets.forEach((n) => vis.observe(n));
