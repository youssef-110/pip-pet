const $ = (id) => document.getElementById(id);
const stage = $('stage'), petEl = $('pet'), bubbleEl = $('bubble'), dotsEl = $('dots');
let S = { sessions: [], mood: 'sleep', bubble: null, settings: { char: 'blob', skin: 'coral', acc: 'none', sound: true }, note: '' };
let char = null, hover = false, over = false, down = null, say = '', sayTimer;

const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; };
const TITLE = { done: (n) => `${n} is done`, needs: (n) => `${n} needs you`, error: (n) => `${n} hit an error` };
const LABEL = { working: 'working', done: 'done', needs: 'needs you', error: 'error', idle: 'idle' };

function render() {
  const { settings: st, bubble: b, sessions: list } = S;
  document.documentElement.style.setProperty('--pet', { s: '112px', m: '150px', l: '200px' }[st.size] || '150px');
  const fixed = (PipPet.CHARS.find((c) => c.id === st.char) || {}).fixed;
  petEl.classList.toggle('rim', fixed || PipPet.palette(st.skin).ink !== '#261c2c'); // dark pets get a light edge so they show on dark screens
  const key = st.char + '/' + st.acc;
  if (char !== key) { PipPet.mount(petEl, { char: st.char, skin: st.skin, acc: st.acc }); char = key; }
  PipPet.skin(petEl, st.skin);
  PipPet.setMood(petEl, S.mood);

  dotsEl.replaceChildren(...list.slice(0, 10).map((s) => el('i', null, s.state)));

  bubbleEl.className = 'hit ' + (b ? b.state : '');
  if (b) {
    bubbleEl.replaceChildren(el('b', TITLE[b.state](b.name)), ...(b.msg ? [el('span', b.msg)] : []));
  } else if (say) {
    bubbleEl.replaceChildren(el('b', say));
  } else if (S.note) {
    bubbleEl.replaceChildren(el('span', S.note));
  } else if (hover) {
    bubbleEl.replaceChildren(...(list.length
      ? list.map((s) => { const r = el('div', null, 'row'); r.append(el('i', s.name), el('span', `${LABEL[s.state]} · ${ago(s.since)}`)); return r; })
      : [el('b', 'Nothing running'), el('span', 'Start claude in any terminal and I will keep watch.')]));
  }
  bubbleEl.hidden = !(b || say || S.note || hover);
}

// ---- sound: two soft sine notes, no audio files ----
let ac;
function chime(kind) {
  if (!S.settings.sound) return;
  ac = ac || new AudioContext();
  const notes = kind === 'done' ? [659, 988] : kind === 'boop' ? [520] : [784, 784, 784];
  notes.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.13;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.35);
  });
}

// ---- wiring ----
pip.onState((s) => { S = s; render(); });
// Show and hide. When Claude just opened or closed, wave first: hello on the way in, goodbye before leaving.
let leave;
pip.onVis(({ on, wave }) => {
  clearTimeout(leave); clearTimeout(sayTimer);
  say = wave === 'hello' ? 'Hi! Claude is open, I am watching.' : wave === 'bye' ? 'Claude closed. Bye for now!' : '';
  if (wave) { PipPet.greet(petEl, wave); if (wave === 'hello') chime('boop'); sayTimer = setTimeout(() => { say = ''; render(); }, wave === 'hello' ? 2600 : 1400); }
  if (on) stage.classList.add('in'); else leave = setTimeout(() => stage.classList.remove('in'), wave ? 1300 : 0);
  render();
});
pip.onChime(chime);
pip.onCursor(({ x, y }) => {
  const r = petEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
  const c = (v) => Math.max(-1, Math.min(1, v));
  PipPet.look(petEl, c((x - cx) / 260), c((y - cy) / 260));
});

// The window is click-through except over the pet, bubble and dots.
window.addEventListener('mousemove', (e) => {
  const hit = !!(e.target.closest && e.target.closest('.hit')) || !!down;
  if (hit !== over) { over = hit; pip.ignore(!hit); }
});
document.addEventListener('mouseleave', () => { if (!down) { over = false; pip.ignore(true); } });

const setHover = (v) => () => { hover = v; render(); };
for (const n of [petEl, dotsEl]) { n.addEventListener('mouseenter', setHover(true)); n.addEventListener('mouseleave', setHover(false)); }

petEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  down = { x: e.screenX, y: e.screenY, moved: false, lastX: e.screenX, sway: 0 };
  petEl.setPointerCapture(e.pointerId);
});
petEl.addEventListener('pointermove', (e) => {
  if (!down) return;
  if (!down.moved && Math.hypot(e.screenX - down.x, e.screenY - down.y) > 5) { down.moved = true; pip.drag(true); petEl.classList.add('dragging'); }
  // being carried: the body swings against the direction of travel
  down.sway = Math.max(-22, Math.min(22, down.sway * 0.7 - (e.screenX - down.lastX) * 0.9));
  down.lastX = e.screenX;
  petEl.style.setProperty('--sway', down.sway.toFixed(1));
});
petEl.addEventListener('pointerup', () => {
  if (!down) return;
  if (down.moved) {
    pip.drag(false);
    petEl.classList.remove('dragging'); petEl.classList.add('landed'); petEl.style.setProperty('--sway', 0);
    setTimeout(() => petEl.classList.remove('landed'), 600);
  }
  else { PipPet.pet(petEl); chime('boop'); if (S.bubble) pip.ack(S.bubble.id); }
  down = null;
});
petEl.addEventListener('dblclick', () => pip.openUi());
bubbleEl.addEventListener('click', () => { if (S.bubble) pip.ack(S.bubble.id); });
window.addEventListener('contextmenu', (e) => { e.preventDefault(); pip.menu(); });
setInterval(() => { if (hover) render(); }, 30000);

render();
pip.ready();
