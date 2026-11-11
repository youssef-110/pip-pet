// Pip characters: shared by the desktop app and the landing page.
(function (root) {
  const SKINS = [
    { id: 'coral', name: 'Coral', body: '#F0765A', accent: '#58B274' },
    { id: 'tangerine', name: 'Tangerine', body: '#FF9A3D', accent: '#3FA7D6' },
    { id: 'butter', name: 'Butter', body: '#F8CE55', accent: '#F0765A' },
    { id: 'matcha', name: 'Matcha', body: '#86C36A', accent: '#F59AB5' },
    { id: 'mint', name: 'Mint', body: '#52CDB0', accent: '#FFB23E' },
    { id: 'sky', name: 'Sky', body: '#58B2F2', accent: '#FFC94A' },
    { id: 'blueberry', name: 'Blueberry', body: '#6E7EEA', accent: '#FFC94A' },
    { id: 'bubblegum', name: 'Bubblegum', body: '#F78DB8', accent: '#5CC9A7' },
    { id: 'cloud', name: 'Cloud', body: '#F1ECE6', accent: '#F0765A' },
    { id: 'midnight', name: 'Midnight', body: '#3D3B5C', accent: '#FFC94A' },
  ];
  const ACCS = [
    { id: 'none', name: 'Nothing' }, { id: 'crown', name: 'Crown' }, { id: 'party', name: 'Party hat' },
    { id: 'headphones', name: 'Headphones' }, { id: 'glasses', name: 'Glasses' }, { id: 'bow', name: 'Bow' },
  ];

  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const lum = (h) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const SHADE = '#2a1238';
  // Every tone of a character is derived from one body colour, so new colours are one line.
  function palette(skinId) {
    const s = SKINS.find((s) => s.id === skinId) || SKINS[0], dk = lum(s.body) < 0.38;
    return {
      body: s.body, light: mix(s.body, '#ffffff', dk ? 0.24 : 0.45), dark: mix(s.body, SHADE, 0.24), deep: dk ? mix(s.body, '#ffffff', 0.16) : mix(s.body, SHADE, 0.4),
      belly: mix(s.body, '#ffffff', dk ? 0.5 : 0.76), accent: s.accent, accent2: mix(s.accent, SHADE, 0.22),
      cheek: dk ? '#ff8fb0' : mix('#ff4f7e', s.body, 0.2), ink: dk ? '#fff4de' : '#261c2c', glint: dk ? s.body : '#ffffff',
    };
  }

  const face = ({ ey = 108, dx = 22, my = ey + 14 }, u) => `
    <g class="face">
      <ellipse class="cheek" cx="${100 - dx - 14}" cy="${ey + 13}" rx="11" ry="7" fill="url(#c${u})"/>
      <ellipse class="cheek" cx="${100 + dx + 14}" cy="${ey + 13}" rx="11" ry="7" fill="url(#c${u})"/>
      <g class="eyes">${[100 - dx, 100 + dx].map((x) => `
        <g class="eye-open"><ellipse cx="${x}" cy="${ey}" rx="7.2" ry="9.6"/><circle class="glint" cx="${x + 2.4}" cy="${ey - 3.8}" r="2.7"/><circle class="glint" cx="${x - 2.6}" cy="${ey + 3.8}" r="1.2"/></g>
        <path class="eye-happy" d="M${x - 8.5} ${ey + 3}q8.5 -12 17 0"/>
        <path class="eye-shut" d="M${x - 7.5} ${ey}q7.5 5.5 15 0"/>`).join('')}
      </g>
      <path class="m-smile" d="M93 ${my}q7 7 14 0"/>
      <path class="m-open" d="M90 ${my - 1}q10 15 20 0z"/>
      <ellipse class="m-o" cx="100" cy="${my + 3}" rx="4" ry="5"/>
    </g>`;

  const BLOB = 'M100 48c38 0 62 28 62 66 0 36-22 58-62 58s-62-22-62-58c0-38 24-66 62-66z';
  const ROUND = 'M100 56c40 0 64 26 64 60 0 34-24 56-64 56s-64-22-64-56c0-34 24-60 64-60z';

  // top: y of the head's highest point. hw: half-width at eye level. gloss: [cx, cy, rx, ry, rotation].
  const CHARS = [
    {
      id: 'blob', name: 'Pip', blurb: 'The original. Calm, round, and grows a sprout when things go well.',
      top: 48, hw: 61, face: {}, gloss: [72, 80, 17, 9, -38], feet: true,
      body: (B) => `<path fill="${B}" d="${BLOB}"/>`,
      front: (B, A) => `<g class="sprout"><path class="stem" d="M100 50q-2 -12 4 -20"/><path fill="${A}" d="M104 30q-16 -8 -20 6q14 6 20 -6z"/><path fill="${A}" d="M104 30q14 -12 22 0q-10 10 -22 0z"/></g>`,
    },
    {
      id: 'cat', name: 'Mochi', blurb: 'Pretends not to care. Checks on your builds anyway.',
      top: 56, hw: 63, face: { ey: 106, my: 125 }, gloss: [70, 88, 16, 8, -36], feet: true,
      back: (B) => `<path class="tail" d="M150 158q34 -4 30 -38"/>
        <path fill="${B}" d="M56 92L54 46Q54 38 62 42L96 62Z"/><path class="belly" d="M62 80L61 54L82 66Z"/>
        <path fill="${B}" d="M144 92L146 46Q146 38 138 42L104 62Z"/><path class="belly" d="M138 80L139 54L118 66Z"/>`,
      body: (B) => `<path fill="${B}" d="${ROUND}"/>`,
      front: () => `<path class="whisk" d="M42 118L24 114M42 126L24 129M158 118L176 114M158 126L176 129"/><path class="inkfill" d="M95.5 116h9l-4.5 5.5z"/>`,
    },
    {
      id: 'ghost', name: 'Boo', blurb: 'Floats above the desk. Haunts only long-running jobs.',
      top: 44, hw: 56, face: { ey: 100 }, gloss: [74, 72, 15, 9, -38], feet: false,
      body: (B) => `<path fill="${B}" d="M44 106C44 70 66 44 100 44C134 44 156 70 156 106V170q-14 -16 -28 0q-14 -16 -28 0q-14 -16 -28 0q-14 -16 -28 0Z"/>`,
    },
    {
      id: 'robot', name: 'Bit', blurb: 'Built from spare tokens. The antenna blinks while Claude thinks.',
      top: 62, hw: 54, face: { ey: 108, dx: 20, my: 123 }, gloss: [70, 71, 13, 4.5, -8], feet: true,
      back: (B, A) => `<rect class="deep" x="35" y="100" width="15" height="28" rx="7"/><rect class="deep" x="150" y="100" width="15" height="28" rx="7"/>
        <g class="antenna"><path class="stem" d="M100 64V42"/><circle class="bulb" cx="100" cy="37" r="8" fill="${A}"/></g>`,
      body: (B) => `<rect fill="${B}" x="46" y="62" width="108" height="110" rx="30"/>`,
      front: () => `<rect x="57" y="81" width="86" height="60" rx="21" fill="#1b2030"/><path d="M72 83h20l-17 56h-13z" fill="#fff" opacity=".07"/>`,
    },
    {
      id: 'axo', name: 'Lotl', blurb: 'An axolotl. Wiggles its gills whenever a session ships.',
      top: 60, hw: 67, face: { ey: 110, dx: 30 }, gloss: [64, 84, 17, 8, -30], feet: true,
      back: (B, A) => `<path class="tail" d="M158 152q28 0 28 -24"/>
        <g class="gills gl" stroke="${A}"><path d="M46 94L20 78"/><path d="M40 108L12 106"/><path d="M44 122L20 136"/></g>
        <g class="gills gr" stroke="${A}"><path d="M154 94L180 78"/><path d="M160 108L188 106"/><path d="M156 122L180 136"/></g>`,
      body: (B) => `<path fill="${B}" d="M100 60c44 0 68 24 68 56 0 34-26 56-68 56s-68-22-68-56c0-32 24-56 68-56z"/>`,
    },
    {
      id: 'bear', name: 'Fig', blurb: 'A small bear with big patience. Naps between prompts.',
      top: 56, hw: 63, face: { ey: 103, dx: 25, my: 127 }, gloss: [72, 84, 15, 8, -36], feet: true,
      back: (B) => `<circle cx="58" cy="68" r="19" fill="${B}"/><circle class="belly" cx="58" cy="68" r="9.5"/><circle cx="142" cy="68" r="19" fill="${B}"/><circle class="belly" cx="142" cy="68" r="9.5"/>`,
      body: (B) => `<path fill="${B}" d="${ROUND}"/>`,
      front: () => `<ellipse class="belly" cx="100" cy="126" rx="22" ry="16"/><ellipse class="inkfill" cx="100" cy="118" rx="6.5" ry="4.5"/>`,
    },
    {
      id: 'bunny', name: 'Bun', blurb: 'All ears. Hears a finished session before you do.',
      top: 64, hw: 60, face: { ey: 110, my: 126 }, gloss: [72, 92, 15, 8, -36], feet: true,
      back: (B) => `<g transform="rotate(-9 80 72)"><g class="ear el"><ellipse cx="80" cy="42" rx="13.5" ry="34" fill="${B}"/><ellipse class="belly" cx="80" cy="45" rx="6" ry="23"/></g></g>
        <g transform="rotate(9 120 72)"><g class="ear er"><ellipse cx="120" cy="42" rx="13.5" ry="34" fill="${B}"/><ellipse class="belly" cx="120" cy="45" rx="6" ry="23"/></g></g>`,
      body: (B) => `<path fill="${B}" d="M100 64c38 0 62 24 62 56 0 32-24 52-62 52s-62-20-62-52c0-32 24-56 62-56z"/>`,
      front: () => `<path class="nosepink" d="M96 119h8l-4 4.5z"/>`,
    },
    {
      id: 'penguin', name: 'Nori', blurb: 'Waddles in when Claude needs you. Very punctual.',
      top: 44, hw: 57, face: { ey: 100, dx: 20 }, gloss: [70, 62, 13, 7, -38], feet: true,
      body: (B) => `<path fill="${B}" d="M100 44c36 0 58 30 58 68 0 38-22 60-58 60s-58-22-58-60c0-38 22-68 58-68z"/>`,
      front: (B, A) => `<path class="belly" d="M100 72c-15 -15 -43 -5 -43 30 0 42 19 66 43 66s43-24 43-66c0-35-28-45-43-30z"/><path fill="${A}" d="M89 113q11 -7 22 0q-11 14 -22 0z"/>`,
    },
  ];

  function accessory(id, c) {
    const t = c.top, { ey = 108, dx = 22 } = c.face, hw = c.hw;
    switch (id) {
      case 'crown': return `<g class="acc"><path fill="#F7C948" d="M76 ${t + 6}l-5 -25 14 11 15 -18 15 18 14 -11 -5 25z"/><path fill="#E0A92B" d="M76 ${t + 6}h48v-6H77z"/><circle cx="100" cy="${t - 9}" r="3.4" fill="#F0567A"/><circle cx="84" cy="${t - 4}" r="2.6" fill="#58B2F2"/><circle cx="116" cy="${t - 4}" r="2.6" fill="#58B2F2"/></g>`;
      case 'party': return `<g class="acc"><path fill="var(--accent)" d="M100 ${t - 38}L82 ${t + 6}H118Z"/><path fill="#fff" opacity=".55" d="M94 ${t - 23}l12 0 3 8-18 0zM88 ${t - 8}l24 0 3 7-30 0z"/><circle cx="100" cy="${t - 39}" r="6" fill="#fff"/></g>`;
      case 'headphones': return `<g class="acc"><path fill="none" stroke="#261c2c" stroke-width="7" stroke-linecap="round" d="M${100 - hw - 2} ${ey - 4}C${100 - hw - 2} ${t - 34} ${100 + hw + 2} ${t - 34} ${100 + hw + 2} ${ey - 4}"/><rect x="${100 - hw - 13}" y="${ey - 18}" width="20" height="36" rx="9" fill="var(--accent)"/><rect x="${100 + hw - 7}" y="${ey - 18}" width="20" height="36" rx="9" fill="var(--accent)"/></g>`;
      case 'glasses': return `<g class="acc glasses" fill="rgba(255,255,255,.2)" stroke="#261c2c" stroke-width="3.6"><circle cx="${100 - dx}" cy="${ey}" r="14.5"/><circle cx="${100 + dx}" cy="${ey}" r="14.5"/><path fill="none" d="M${100 - dx + 14.5} ${ey - 2}q${dx - 14.5} -6 ${2 * dx - 29} 0"/></g>`;
      case 'bow': return `<g class="acc"><path fill="var(--accent)" d="M128 ${t + 14}l-20 -13v26zM128 ${t + 14}l20 -13v26z"/><circle cx="128" cy="${t + 14}" r="6.5" fill="var(--accent2)"/></g>`;
      default: return '';
    }
  }

  const STAR = 'M0 -8Q1.5 -1.5 8 0Q1.5 1.5 0 8Q-1.5 1.5 -8 0Q-1.5 -1.5 0 -8Z';
  const HEART = 'M0 5C-10 -2 -6 -11 0 -5C6 -11 10 -2 0 5Z';
  const at = (pts, path, cls) => pts.map(([x, y], i) => `<g transform="translate(${x} ${y})"><path class="${cls} ${cls}${i}" d="${path}"/></g>`).join('');
  let uid = 0;

  function svg(charId, accId = 'none') {
    const c = CHARS.find((c) => c.id === charId) || CHARS[0], u = ++uid, B = `url(#b${u})`, A = `url(#a${u})`;
    const [gx, gy, grx, gry, gr] = c.gloss;
    // classes, not inline styles: the app's content security policy blocks style attributes
    const stop = (o, v) => `<stop offset="${o}" class="g-${v}"/>`;
    return `<svg class="pip" data-char="${c.id}" data-acc="${accId}" data-mood="idle" viewBox="0 0 200 200" role="img" aria-label="${c.name}">
      <defs>
        <radialGradient id="b${u}" cx=".36" cy=".24" r=".92">${stop(0, 'light')}${stop(0.48, 'body')}${stop(1, 'dark')}</radialGradient>
        <radialGradient id="c${u}">${stop(0, 'cheek')}${stop(1, 'cheek0')}</radialGradient>
        <linearGradient id="a${u}" x1="0" y1="0" x2="0" y2="1">${stop(0, 'accent')}${stop(1, 'accent2')}</linearGradient>
        <radialGradient id="s${u}"><stop offset="0" stop-color="#1f1a24" stop-opacity=".34"/><stop offset="1" stop-color="#1f1a24" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse class="shadow" cx="100" cy="181" rx="56" ry="9" fill="url(#s${u})"/>
      <g class="wrap">
        ${c.back ? c.back(B, A) : ''}
        ${c.feet ? '<ellipse class="foot" cx="78" cy="173" rx="15" ry="7.5"/><ellipse class="foot" cx="122" cy="173" rx="15" ry="7.5"/>' : ''}
        ${c.body(B)}
        <ellipse class="gloss" cx="${gx}" cy="${gy}" rx="${grx}" ry="${gry}" transform="rotate(${gr} ${gx} ${gy})"/>
        ${c.front ? c.front(B, A) : ''}${face(c.face, u)}${accessory(accId, c)}
        <ellipse class="arm arm-l" cx="45" cy="135" rx="9" ry="12"/>
        <ellipse class="arm arm-r" cx="155" cy="135" rx="9" ry="12"/>
        <g class="laptop"><rect class="lap-screen" x="62" y="136" width="76" height="40" rx="7"/><rect class="lap-shine" x="62" y="136" width="76" height="14" rx="7"/><circle class="lap-logo" cx="100" cy="157" r="5.5" fill="${B}"/><rect class="lap-base" x="53" y="174" width="94" height="7" rx="3.5"/></g>
      </g>
      <g class="fx">
        <g class="zzz"><text x="146" y="62">z</text><text x="158" y="46">z</text><text x="172" y="28">Z</text></g>
        <g class="bang"><circle cx="160" cy="40" r="17" fill="${A}"/><path d="M160 29v12"/><circle class="dot" cx="160" cy="48.5" r="2.6"/></g>
        ${at([[30, 54], [172, 62], [100, 12], [18, 112], [184, 118]], STAR, 'spark')}
        ${at([[68, 40], [100, 24], [134, 42]], HEART, 'heart')}
      </g>
    </svg>`;
  }

  function skin(el, skinId) { const p = palette(skinId); for (const k in p) el.style.setProperty('--' + k, p[k]); }
  function mount(el, { char = 'blob', skin: sk = 'coral', acc = 'none', mood = 'idle' } = {}) {
    el.innerHTML = svg(char, acc);
    skin(el, sk);
    setMood(el, mood);
  }
  function setMood(el, mood) { const s = el.querySelector('.pip'); if (s) s.dataset.mood = mood; }
  // lx, ly in -1..1
  function look(el, lx, ly) { el.style.setProperty('--lx', lx.toFixed(2)); el.style.setProperty('--ly', ly.toFixed(2)); }
  function pet(el) { el.classList.remove('petted'); void el.offsetWidth; el.classList.add('petted'); setTimeout(() => el.classList.remove('petted'), 1000); }

  const api = { CHARS, SKINS, ACCS, palette, mix, svg, mount, skin, setMood, look, pet };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PipPet = api;
})(typeof window !== 'undefined' ? window : globalThis);
