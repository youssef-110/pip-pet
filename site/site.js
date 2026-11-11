const { CHARS, SKINS, ACCS, palette, mix } = PipPet;
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = { char: 'blob', skin: 'coral', acc: 'none' };

const SAY = {
  done: ['api-server is done', 'All 42 tests pass. Ready when you are.'],
  needs: ['docs-site needs you', 'Wants to use Bash'],
};
function speak(bubble, mood) {
  const line = SAY[mood];
  bubble.hidden = !line;
  if (!line) return;
  bubble.replaceChildren(el('b', line[0]), el('span', line[1]));
  bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
}

// ---- headline: split into words so each one rises on load ----
const h1 = $('h1');
h1.setAttribute('aria-label', h1.textContent);
h1.replaceChildren(...h1.textContent.split(' ').flatMap((word, i) => {
  const w = el('span', null, 'w'), inner = el('span', word);
  w.style.setProperty('--i', i); w.setAttribute('aria-hidden', 'true'); w.append(inner);
  return [w, ' '];
}));

// ---- the page takes its colours from the pet you pick ----
function theme() {
  const p = palette(pick.skin), dark = p.ink !== '#261c2c', r = document.documentElement.style;
  r.setProperty('--ground', mix(p.body, '#ffffff', dark ? 0.88 : 0.84));
  r.setProperty('--ground-2', mix(p.body, '#ffffff', dark ? 0.74 : 0.66));
  r.setProperty('--skin', p.body);
  r.setProperty('--skin-dark', dark ? p.body : mix(p.body, '#2a1238', 0.34));
  r.setProperty('--on-skin', dark ? '#fff4de' : '#221a28');
  r.setProperty('--on-skin-text', dark ? '#221a28' : '#ffffff');
}

// ---- pets that follow the current pick ----
const hero = $('hero-pet'), story = $('story-pet'), mini = $('mini-pet'), many = $('many-pet');
const moodOf = (n) => n.querySelector('.pip')?.dataset.mood || 'idle';
function drawPicked() {
  for (const n of [hero, story, mini, many]) PipPet.mount(n, { ...pick, mood: moodOf(n) });
  shelfPets.forEach((n, i) => { PipPet.mount(n, { char: CHARS[i].id, skin: pick.skin, acc: pick.acc, mood: CHARS[i].id === pick.char ? 'done' : 'idle' }); n.setAttribute('aria-pressed', CHARS[i].id === pick.char); });
  const c = CHARS.find((c) => c.id === pick.char), name = $('cast-name');
  if (name.textContent !== c.name) { name.textContent = c.name; name.classList.remove('swap'); void name.offsetWidth; name.classList.add('swap'); }
  $('cast-blurb').textContent = c.blurb;
  $('colour-name').textContent = SKINS.find((s) => s.id === pick.skin).name;
  for (const b of $('swatches').children) b.setAttribute('aria-pressed', b.dataset.id === pick.skin);
  for (const b of $('chips').children) b.setAttribute('aria-pressed', b.dataset.id === pick.acc);
  theme();
}

// shelf, swatches, chips
const shelf = $('shelf');
const shelfPets = CHARS.map((c, i) => {
  const b = el('button', null, 'pet');
  b.setAttribute('aria-label', c.name); b.style.setProperty('--i', i);
  b.addEventListener('click', () => { pick.char = c.id; drawPicked(); PipPet.pet(b); });
  shelf.append(b);
  return b;
});
for (const s of SKINS) {
  const b = el('button'); b.dataset.id = s.id; b.style.background = s.body; b.setAttribute('aria-label', s.name); b.title = s.name;
  b.addEventListener('click', () => { pick.skin = s.id; drawPicked(); });
  $('swatches').append(b);
}
for (const a of ACCS) {
  const b = el('button', a.name); b.dataset.id = a.id;
  b.addEventListener('click', () => { pick.acc = a.id; drawPicked(); });
  $('chips').append(b);
}

// ---- hero mood preview: cycles on its own until you take over ----
let auto = !reduced;
function setHero(mood) {
  PipPet.setMood(hero, mood);
  for (const b of $('moods-ctl').children) b.setAttribute('aria-pressed', b.dataset.mood === mood);
  speak($('hero-say'), mood);
}
$('moods-ctl').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { auto = false; setHero(b.dataset.mood); } });
const order = ['working', 'done', 'working', 'needs', 'working', 'sleep'];
let step = 0;
setInterval(() => { if (auto && !document.hidden) setHero(order[++step % order.length]); }, 3600);

// ---- scroll story: the pet changes mood as each statement reaches the middle of the screen ----
const steps = [...document.querySelectorAll('.story-steps article')];
function setStory(a) {
  steps.forEach((s) => s.classList.toggle('active', s === a));
  PipPet.setMood(story, a.dataset.mood);
  speak($('story-say'), a.dataset.mood);
}
const storyIO = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setStory(e.target); }, { rootMargin: '-48% 0px -48% 0px' });
steps.forEach((s) => storyIO.observe(s));

// ---- fullscreen demo ----
const screenEl = $('screen');
const SCENES = [
  ['', 'idle', 'On your desktop, Pip keeps you company.', 3200],
  ['full', 'idle', 'You go fullscreen. Pip steps out.', 4000],
  ['full alert', 'done', 'A session finishes. Pip pops up to tell you.', 3600],
  ['full', 'idle', 'Then leaves you to it.', 2600],
];
let scene = 0, progress = 0;
(function play() {
  const [cls, mood, text, ms] = SCENES[scene++ % SCENES.length];
  screenEl.className = 'screen ' + cls;
  PipPet.setMood(mini, mood);
  $('phase').textContent = text;
  if (!reduced) setTimeout(play, ms);
})();
setInterval(() => { progress = (progress + 0.4) % 100; screenEl.querySelector('.video').style.setProperty('--p', progress + '%'); }, 100);

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
  $('many-dots').replaceChildren(...rows.map((r) => el('i', null, r.state)));
  const now = changed == null ? 'working' : rows[changed].state;
  PipPet.setMood(many, now);
}
drawRows();
if (!reduced) setInterval(() => {
  if (document.hidden) return;
  const [i, state] = SCRIPT[beat++ % SCRIPT.length];
  rows[i].state = state; rows[i].t = 'just now';
  drawRows(i);
}, 2600);

// ---- closing parade: every character, each in its own colour ----
CHARS.forEach((c, i) => {
  const n = el('div', null, 'pet'); n.style.setProperty('--i', i % 4);
  PipPet.mount(n, { char: c.id, skin: SKINS[(i * 3 + 5) % SKINS.length].id, acc: ACCS[(i * 2 + 1) % ACCS.length].id, mood: i % 3 === 0 ? 'done' : 'idle' });
  $('parade').append(n);
});

drawPicked();
setHero('working');

// ---- every pet watches the cursor and likes being clicked ----
const pets = [...document.querySelectorAll('.pet')];
addEventListener('pointermove', (e) => {
  const c = (v) => Math.max(-1, Math.min(1, v));
  for (const n of pets) {
    if (n.classList.contains('offscreen')) continue;
    const r = n.getBoundingClientRect();
    PipPet.look(n, c((e.clientX - r.left - r.width / 2) / 340), c((e.clientY - r.top - r.height / 2) / 340));
  }
}, { passive: true });
for (const n of [hero, story]) n.addEventListener('click', () => PipPet.pet(n));

// pause pets that are off screen, reveal headings and the shelf once
const vis = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('offscreen', !e.isIntersecting)), { rootMargin: '120px' });
pets.forEach((n) => vis.observe(n));
const once = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('on'); once.unobserve(e.target);
  if (e.target === shelf) setTimeout(() => shelf.classList.remove('intro', 'on'), 1300);
}), { threshold: 0.2 });
shelf.classList.add('intro');
document.querySelectorAll('.rise').forEach((n) => once.observe(n));
once.observe(shelf);
