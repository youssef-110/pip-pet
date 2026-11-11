const $ = (id) => document.getElementById(id);
const stage = $('stage'), petEl = $('pet'), bubbleEl = $('bubble'), dotsEl = $('dots');
let S = { sessions: [], mood: 'sleep', bubble: null, settings: { char: 'blob', skin: 'coral', acc: 'none', sound: true }, note: '' };
let char = null, hover = false, over = false, down = null;

const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; };
const TITLE = { done: (n) => `${n} is done`, needs: (n) => `${n} needs you`, error: (n) => `${n} hit an error` };
const LABEL = { working: 'working', done: 'done', needs: 'needs you', error: 'error', idle: 'idle' };

function render() {
  const { settings: st, bubble: b, sessions: list } = S;
  document.documentElement.style.setProperty('--pet', { s: '112px', m: '150px', l: '200px' }[st.size] || '150px');
  const key = st.char + '/' + st.acc;
  if (char !== key) { PipPet.mount(petEl, { char: st.char, skin: st.skin, acc: st.acc }); char = key; }
  PipPet.skin(petEl, st.skin);
  PipPet.setMood(petEl, S.mood);

  dotsEl.replaceChildren(...list.slice(0, 10).map((s) => el('i', null, s.state)));

  bubbleEl.className = 'hit ' + (b ? b.state : '');
  if (b) {
    bubbleEl.replaceChildren(el('b', TITLE[b.state](b.name)), ...(b.msg ? [el('span', b.msg)] : []));
  } else if (S.note) {
    bubbleEl.replaceChildren(el('span', S.note));
  } else if (hover) {
    bubbleEl.replaceChildren(...(list.length
      ? list.map((s) => { const r = el('div', null, 'row'); r.append(el('i', s.name), el('span', `${LABEL[s.state]} · ${ago(s.since)}`)); return r; })
      : [el('b', 'Nothing running'), el('span', 'Start claude in any terminal and I will keep watch.')]));
  }
  bubbleEl.hidden = !(b || S.note || hover);
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
pip.onVis((v) => stage.classList.toggle('in', v));
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
  down = { x: e.screenX, y: e.screenY, moved: false };
  petEl.setPointerCapture(e.pointerId);
});
petEl.addEventListener('pointermove', (e) => {
  if (down && !down.moved && Math.hypot(e.screenX - down.x, e.screenY - down.y) > 5) { down.moved = true; pip.drag(true); }
});
petEl.addEventListener('pointerup', () => {
  if (!down) return;
  if (down.moved) pip.drag(false);
  else { PipPet.pet(petEl); chime('boop'); if (S.bubble) pip.ack(S.bubble.id); }
  down = null;
});
petEl.addEventListener('dblclick', () => pip.openUi());
bubbleEl.addEventListener('click', () => { if (S.bubble) pip.ack(S.bubble.id); });
window.addEventListener('contextmenu', (e) => { e.preventDefault(); pip.menu(); });
setInterval(() => { if (hover) render(); }, 30000);

render();
pip.ready();
