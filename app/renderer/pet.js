// Pip characters: shared by the desktop app and the landing page.
(function (root) {
  const SKINS = [
    { id: 'coral', name: 'Coral', body: '#F0765A', accent: '#58B274' },
    { id: 'clay', name: 'Terracotta', body: '#D97757', accent: '#F4F0E8' },
    { id: 'red', name: 'Red', body: '#E3263F', accent: '#FFC94A' },
    { id: 'tangerine', name: 'Tangerine', body: '#FF9A3D', accent: '#3FA7D6' },
    { id: 'butter', name: 'Butter', body: '#F8CE55', accent: '#F0765A' },
    { id: 'matcha', name: 'Matcha', body: '#86C36A', accent: '#F59AB5' },
    { id: 'mint', name: 'Mint', body: '#52CDB0', accent: '#FFB23E' },
    { id: 'sky', name: 'Sky', body: '#58B2F2', accent: '#FFC94A' },
    { id: 'blueberry', name: 'Blueberry', body: '#6E7EEA', accent: '#FFC94A' },
    { id: 'bubblegum', name: 'Bubblegum', body: '#F78DB8', accent: '#5CC9A7' },
    { id: 'white', name: 'White', body: '#F7F6F9', accent: '#E3263F' },
    { id: 'midnight', name: 'Midnight', body: '#3D3B5C', accent: '#FFC94A' },
    { id: 'black', name: 'Black', body: '#222026', accent: '#E3263F' },
  ];
  const ACCS = [
    { id: 'none', name: 'Nothing' }, { id: 'crown', name: 'Crown' }, { id: 'party', name: 'Party hat' },
    { id: 'headphones', name: 'Headphones' }, { id: 'glasses', name: 'Glasses' }, { id: 'bow', name: 'Bow' }, { id: 'cheese', name: 'White cheese' },
  ];

  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const lum = (h) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const SHADE = '#2a1238';
  // Every tone of a character is derived from one body colour, so new colours are one line.
  function palette(skinId) {
    const s = SKINS.find((s) => s.id === skinId) || SKINS[0], dk = lum(s.body) < 0.38;
    return {
      body: s.body, light: mix(s.body, '#ffffff', dk ? 0.24 : 0.45), dark: dk ? mix(s.body, '#000000', 0.3) : mix(s.body, SHADE, 0.24),
      deep: dk ? mix(s.body, '#ffffff', 0.18) : mix(s.body, SHADE, 0.4),
      belly: mix(s.body, '#ffffff', dk ? 0.5 : 0.76), accent: s.accent, accent2: mix(s.accent, SHADE, 0.22),
      cheek: dk ? '#ff8fb0' : mix('#ff4f7e', s.body, 0.2), ink: dk ? '#fff4de' : '#261c2c', glint: dk ? s.body : '#ffffff',
    };
  }

  // sq: square pixel eyes. brow: stern eyebrows. cheek: blush.
  // iris: a colour gives the eye a white, an iris and a pupil instead of the plain bead
  const face = ({ ey = 108, dx = 22, my = ey + 14, sq = false, brow = false, cheek = true, iris = '' }, u) => `
    <g class="face">
      ${cheek ? `<ellipse class="cheek" cx="${100 - dx - 14}" cy="${ey + 13}" rx="11" ry="7" fill="url(#c${u})"/><ellipse class="cheek" cx="${100 + dx + 14}" cy="${ey + 13}" rx="11" ry="7" fill="url(#c${u})"/>` : ''}
      <g class="eyes">${[100 - dx, 100 + dx].map((x, i) => `
        <g class="eye-open">${iris ? `<ellipse cx="${x}" cy="${ey}" rx="8.4" ry="8.8" fill="#fff"/><circle cx="${x}" cy="${ey + 0.5}" r="5.4" fill="${iris}"/><circle cx="${x}" cy="${ey + 0.5}" r="2.6" fill="#1d1820"/>` : sq ? `<rect x="${x - 6.5}" y="${ey - 8}" width="13" height="16" rx="2"/>` : `<ellipse cx="${x}" cy="${ey}" rx="7.2" ry="9.6"/>`}<circle class="glint" cx="${x + 2.4}" cy="${ey - 3.8}" r="2.7"/><circle class="glint" cx="${x - 2.6}" cy="${ey + 3.8}" r="1.2"/></g>
        <path class="eye-happy" d="M${x - 8.5} ${ey + 3}q8.5 -12 17 0"/>
        <path class="eye-shut" d="M${x - 7.5} ${ey}q7.5 5.5 15 0"/>
        ${brow === 'flat' ? `<path class="brow soft" d="M${x - 8} ${ey - 13}q8 -4 16 0"/>` : brow ? `<path class="brow" d="M${x + (i ? 11 : -11)} ${ey - 15}L${x + (i ? -8 : 8)} ${ey - 9}"/>` : ''}`).join('')}
      </g>
      <path class="m-smile" d="M93 ${my}q7 7 14 0"/>
      <path class="m-open" d="M90 ${my - 1}q10 15 20 0z"/>
      <ellipse class="m-o" cx="100" cy="${my + 3}" rx="4" ry="5"/>
    </g>`;

  const ROUND = 'M100 56c40 0 64 26 64 60 0 34-24 56-64 56s-64-22-64-56c0-34 24-60 64-60z';
  const SPARK8 = 'M0 -12L2.8 -4.6L9.6 -7.6L5.2 -1.4L12 2L4.6 3.2L5.8 10.8L0 5.8L-5.8 10.8L-4.6 3.2L-12 2L-5.2 -1.4L-9.6 -7.6L-2.8 -4.6Z';

  // Figures: characters with a head, torso, arms and legs. They share one skeleton so every mood animates the same way.
  const FIG = {
    face: { ey: 68, dx: 18, my: 85, cheek: false },
    legs: '<rect class="deep" x="77" y="144" width="18" height="34" rx="7"/><rect class="deep" x="105" y="144" width="18" height="34" rx="7"/><ellipse class="foot" cx="85" cy="177" rx="14" ry="6.5"/><ellipse class="foot" cx="115" cy="177" rx="14" ry="6.5"/>',
    arms: '<rect class="arm arm-l" x="54" y="101" width="17" height="47" rx="8.5"/><rect class="arm arm-r" x="129" y="101" width="17" height="47" rx="8.5"/>',
    torso: (f) => `<rect fill="${f}" x="70" y="96" width="60" height="58" rx="16"/>`,
    head: (f) => `<rect fill="${f}" x="58" y="28" width="84" height="74" rx="28"/>`,
  };
  const fig = (o) => ({ kind: 'figure', top: 28, hw: 43, gloss: [76, 42, 13, 5, -18], feet: false, arms: FIG.arms, ...o, face: { ...FIG.face, ...o.face } });

  // ---- drawn characters: their own colours and face, on the same mood classes as everyone else ----
  const lr = (f) => f(-1, 'l') + f(1, 'r');
  // An eye pair: a white, an iris that follows the cursor (class look) and a lash line. tilt > 0 is a stern look.
  function eyes(u, { y, dx, w = 7.4, h = 6.4, iris, ir = h * 0.84, pr = ir * 0.48, lash = '#2a1c1e', lw = 2.6, tilt = 0, slit = false, white = '#fff' }) {
    return lr((s, k) => {
      const x = 100 + s * dx, id = `e${k}${u}`;
      return `<clipPath id="${id}"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}"/></clipPath>
        <g class="eye-open"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${white}"/>
          <g clip-path="url(#${id})"><g class="look"><circle cx="${x}" cy="${y + 0.5}" r="${ir}" fill="${iris}"/>
            ${slit ? `<ellipse cx="${x}" cy="${y + 0.5}" rx="${pr * 0.5}" ry="${ir * 0.92}" fill="#17131a"/>` : `<circle cx="${x}" cy="${y + 0.5}" r="${pr}" fill="#17131a"/>`}
            <circle cx="${x + ir * 0.4}" cy="${y - ir * 0.42}" r="${Math.max(1, ir * 0.27)}" fill="#fff"/></g></g>
          <path d="M${x - s * (w + 1.2)} ${y - h * 0.3 + tilt}Q${x} ${y - h - 2.4} ${x + s * (w + 1.6)} ${y - h * 0.15 - tilt}" fill="none" stroke="${lash}" stroke-width="${lw}" stroke-linecap="round"/></g>
        <path class="eye-happy" d="M${x - w} ${y + 2}q${w} ${-h * 1.5} ${2 * w} 0"/><path class="eye-shut" d="M${x - w} ${y}q${w} ${h * 0.7} ${2 * w} 0"/>`;
    });
  }
  const mouth = (y, w = 6, curve = 2.5) => `<path class="m-smile" d="M${100 - w} ${y}q${w} ${curve} ${2 * w} 0"/><path class="m-open" d="M${100 - w} ${y - 1}q${w} ${w * 1.4} ${2 * w} 0z"/><ellipse class="m-o" cx="100" cy="${y + 1.5}" rx="3" ry="3.6"/>`;

  // Drawn humans share one skeleton: head 20..80, shoulders at 86, feet on 179. Arms swing from the shoulder, legs kick when carried.
  const HEAD = 'M73 46C73 28 85 20 100 20s27 8 27 26v9c0 9-6 17-15 22q-12 6-24 0c-9-5-15-13-15-22z';
  const head = (skin, shade, ear = 4.6) => `<ellipse cx="72.5" cy="55" rx="${ear}" ry="${ear * 1.5}" fill="${shade}"/><ellipse cx="127.5" cy="55" rx="${ear}" ry="${ear * 1.5}" fill="${shade}"/><path fill="${skin}" d="${HEAD}"/>`;
  const arms = (draw) => lr((s, k) => `<g class="arm arm-${k}">${draw(s < 0 ? 59 : 126, s)}</g>`);
  const sleeve = (x, fill, hand, extra = '') => `<rect x="${x}" y="86" width="15" height="46" rx="7.5" fill="${fill}"/>${extra}<circle cx="${x + 7.5}" cy="135" r="6.6" fill="${hand}"/>`;
  const legs = (fill, shoe, sole, extra = () => '') => lr((s) => { const x = s < 0 ? 81 : 102, sx = s < 0 ? 77 : 102;
    return `<g class="foot"><rect x="${x}" y="124" width="17" height="48" rx="6" fill="${fill}"/>${extra(x, s)}<rect x="${sx}" y="165" width="21" height="14" rx="6" fill="${shoe}"/><rect x="${sx}" y="175" width="21" height="4" rx="2" fill="${sole}"/></g>`; });
  const SIMBA_HEAD = 'M100 30C126 30 144 42 150 62C157 70 160 82 154 92L162 98L151 100L153 109L141 106C130 114 116 118 100 118C84 118 70 114 59 106L47 109L49 100L38 98L46 92C40 82 43 70 50 62C56 42 74 30 100 30Z';
  const art = (o) => ({ kind: 'figure', fixed: true, art: true, top: 20, hw: 30, gloss: [0, 0, 0, 0, 0], feet: false, ...o, face: { ey: 54, dx: 12.5, ...o.face } });

  // top: y of the head's highest point. hw: half-width at eye level. gloss: [cx, cy, rx, ry, rotation].
  const CHARS = [
    {
      id: 'blob', name: 'Pip', blurb: 'A small fox who keeps one eye on your terminal. The tip of its tail turns amber while Claude works, green when a session is done and red when Claude needs you.',
      kind: 'figure', top: 36, hw: 52, face: { ey: 76, dx: 21, my: 103 }, gloss: [74, 50, 14, 6, -24], feet: false,
      back: (B) => `<g class="plume"><path fill="${B}" d="M112 160C150 176 192 152 188 114C186 98 180 84 174 74C172 92 162 108 146 118C132 127 120 136 116 146Z"/>
          <path class="tip" d="M174 74C180 84 186 98 188 113C180 108 170 106 159 109C167 99 172 87 174 74Z"/></g>
        <path fill="${B}" d="M58 62L49 14Q48 7 55 10L92 36Z"/><path class="deep" d="M49 14Q48 7 55 10L68 19L52 29Z"/><path class="belly" d="M61 52L57 29L78 40Z"/>
        <path fill="${B}" d="M142 62L151 14Q152 7 145 10L108 36Z"/><path class="deep" d="M151 14Q152 7 145 10L132 19L148 29Z"/><path class="belly" d="M139 52L143 29L122 40Z"/>
        <rect class="deep" x="81" y="150" width="16" height="26" rx="7"/><rect class="deep" x="103" y="150" width="16" height="26" rx="7"/>
        <ellipse class="foot" cx="85" cy="176" rx="15" ry="6.5"/><ellipse class="foot" cx="115" cy="176" rx="15" ry="6.5"/>`,
      body: (B, A) => `<path fill="${B}" d="M77 112Q77 102 100 102Q123 102 123 112L127 150Q127 163 100 163Q73 163 73 150Z"/><path class="belly" d="M85 112Q100 120 115 112L118 140Q100 156 82 140Z"/>
        <path fill="${B}" d="M100 34C128 34 146 48 150 68L165 85L148 93C140 107 122 115 100 115C78 115 60 107 52 93L35 85L50 68C54 48 72 34 100 34Z"/>
        <path fill="${A}" d="M72 106Q100 122 128 106L130 114Q100 132 70 114Z"/>`,
      front: () => `<path class="belly" d="M52 93C60 84 76 82 88 90Q100 97 112 90C124 82 140 84 148 93C140 107 122 115 100 115C78 115 60 107 52 93Z"/><path class="inkfill" d="M94 93.5q6 -2.5 12 0l-6 6.5z"/>`,
      arms: lr((s, k) => { const x = s < 0 ? 60 : 124; return `<g class="arm arm-${k}"><rect x="${x}" y="108" width="16" height="36" rx="8"/><circle class="deep" cx="${x + 8}" cy="146" r="8.5"/></g>`; }),
    },
    art({
      id: 'simba', name: 'Simba', blurb: 'A seal-point Ragdoll with pale blue eyes and a low opinion of slow builds. He loves white cheese: give him the cheese to hold and he eats it.',
      top: 30, hw: 50, face: { ey: 76, dx: 20 },
      defs: (u) => `<radialGradient id="sf${u}" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#cdb5a0"/><stop offset=".6" stop-color="#b59a84"/><stop offset="1" stop-color="#8f7462"/></radialGradient>
        <linearGradient id="sh${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98f7c"/><stop offset=".55" stop-color="#c2aa95"/><stop offset="1" stop-color="#eadbc8"/></linearGradient>
        <linearGradient id="sc${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3e6"/><stop offset="1" stop-color="#e2cdb2"/></linearGradient>
        <radialGradient id="sm${u}"><stop offset="0" stop-color="#241715"/><stop offset=".55" stop-color="#3a2722"/><stop offset="1" stop-color="#4a342c" stop-opacity="0"/></radialGradient>
        <radialGradient id="si${u}" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#e3f3fa"/><stop offset=".55" stop-color="#9cc8e2"/><stop offset="1" stop-color="#4f86ad"/></radialGradient>
        <linearGradient id="sl${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b79c86"/><stop offset=".45" stop-color="#8a6f5e"/><stop offset=".8" stop-color="#3d2a24"/><stop offset="1" stop-color="#2a1c19"/></linearGradient>
        <linearGradient id="st${u}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#6b4f41"/><stop offset=".5" stop-color="#3b2924"/><stop offset="1" stop-color="#2a1c19"/></linearGradient>
        <clipPath id="sk${u}"><path d="${SIMBA_HEAD}"/></clipPath>`,
      back: (B, A, u) => `<g class="plume"><path fill="url(#st${u})" d="M128 174C160 184 188 164 186 132C185 118 178 106 168 101L171 112L162 107C169 124 165 142 150 150C142 154 134 160 128 174Z"/>
          <path d="M150 164q18 -6 24 -26M160 150q10 -10 10 -26" fill="none" stroke="#5a4035" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></g>`,
      body: (B, A, u) => `<path fill="url(#sf${u})" d="M100 98C134 98 152 124 152 150C152 169 138 179 100 179C62 179 48 169 48 150C48 124 66 98 100 98Z"/>
        <path fill="#7d6352" opacity=".5" d="M52 140Q50 170 74 177Q58 166 60 138Z"/><path fill="#7d6352" opacity=".5" d="M148 140Q150 170 126 177Q142 166 140 138Z"/>
        <path fill="url(#sc${u})" d="M66 100Q84 116 100 116Q116 116 134 100L138 116L130 113L134 128L124 124L125 139L114 133L110 147L100 139L90 147L86 133L75 139L76 124L66 128L70 113L62 116Z"/>
        <path d="M84 120l3 9M100 121v10M116 120l-3 9M92 132l2 7M108 132l-2 7" fill="none" stroke="#d2b998" stroke-width="1.5" stroke-linecap="round"/>`,
      // The head is one group so it can dip to the cheese.
      draw: (u) => `<g class="shead">
        <path fill="#3a2823" d="M57 62L49 20Q49 12 57 16L92 40Z"/><path fill="#3a2823" d="M143 62L151 20Q151 12 143 16L108 40Z"/>
        <path fill="#8b6c5f" d="M60 52L56 27L79 41Z"/><path fill="#8b6c5f" d="M140 52L144 27L121 41Z"/>
        <path d="M61 48l1 -14M66 47l3 -11M72 45l4 -7M139 48l-1 -14M134 47l-3 -11M128 45l-4 -7" fill="none" stroke="#efe2d2" stroke-width="1.5" stroke-linecap="round"/>
        <path fill="url(#sh${u})" d="${SIMBA_HEAD}"/>
        <g clip-path="url(#sk${u})"><ellipse cx="100" cy="82" rx="37" ry="33" fill="url(#sm${u})"/><ellipse cx="78" cy="75" rx="21" ry="17" fill="url(#sm${u})"/><ellipse cx="122" cy="75" rx="21" ry="17" fill="url(#sm${u})"/>
          <ellipse cx="100" cy="54" rx="13" ry="20" fill="url(#sm${u})" opacity=".8"/><ellipse cx="100" cy="92" rx="20" ry="16" fill="#2a1b18" opacity=".55"/></g>
        <path d="M56 96l-7 4M58 102l-6 6M144 96l7 4M142 102l6 6M74 36l-3 -6M126 36l3 -6" fill="none" stroke="#efe2d2" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        <g class="face">${lr((s, k) => { const x = 100 + s * 20; return `
          <clipPath id="e${k}${u}"><ellipse cx="${x}" cy="76" rx="10.2" ry="9.6"/></clipPath>
          <g class="eye-open"><ellipse cx="${x}" cy="76" rx="11.6" ry="11" fill="#17100f"/><ellipse cx="${x}" cy="76" rx="10.2" ry="9.6" fill="url(#si${u})"/>
            <g clip-path="url(#e${k}${u})"><g class="look"><ellipse cx="${x}" cy="76.5" rx="5" ry="6.4" fill="#0d0a0b"/><circle cx="${x + 3.6}" cy="72.6" r="1.9" fill="#fff"/></g>
              <path class="lid" fill="#2c1d19" d="M${x - 13} 62h26v10q-13 -5 -26 0z"/></g></g>
          <path class="eye-happy" d="M${x - 9.5} 79q9.5 -11 19 0"/><path class="eye-shut" d="M${x - 9.5} 76q9.5 6 19 0"/>`; })}
          <ellipse cx="92.5" cy="96.5" rx="9" ry="6.8" fill="#4b352d"/><ellipse cx="107.5" cy="96.5" rx="9" ry="6.8" fill="#4b352d"/><ellipse cx="100" cy="105" rx="8" ry="5" fill="#7a5f50"/>
          <path fill="#130d0c" d="M93.5 87.5q6.5 -3 13 0q-1 6.5 -6.5 8q-5.5 -1.5 -6.5 -8z"/><path d="M96.5 88.6q3.5 -1.4 7 0" fill="none" stroke="#6d5148" stroke-width="1.2" stroke-linecap="round"/>
          <path class="m-smile" d="M100 95.5v4M100 99.5q-4.5 4.5 -9 1M100 99.5q4.5 4.5 9 1"/>
          <path class="m-open" d="M93.5 99.5q6.5 11 13 0z"/><path class="tongue" d="M96.5 103.5q3.5 4.5 7 0z"/><ellipse class="m-o" cx="100" cy="103" rx="3.2" ry="3.8"/>
          <ellipse class="nom" cx="100" cy="104" rx="6.5" ry="5.5" fill="#2c0f13"/>
          <g class="whisk-set">${lr((s) => `<path class="wh" d="M${100 + s * 15} 95Q${100 + s * 40} 90 ${100 + s * 68} 80M${100 + s * 15} 98Q${100 + s * 42} 98 ${100 + s * 72} 97M${100 + s * 15} 101Q${100 + s * 40} 107 ${100 + s * 66} 114"/>`)}
            <path class="wh" d="M84 63q-4 -10 -2 -20M116 63q4 -10 2 -20"/></g></g></g>`,
      arms: (u) => lr((s, k) => { const x = s < 0 ? 76 : 108; return `<g class="arm arm-${k}"><path fill="url(#sl${u})" d="M${x + 1} 146q7 -6 14 0l2 26q0 7 -9 7t-9 -7z"/><path d="M${x + 5} 173v5M${x + 11} 173v5" stroke="#150e0c" stroke-width="1.3" stroke-linecap="round"/></g>`; }),
    }),
    art({
      id: 'zuck', name: 'Zuck', blurb: 'A parody of a certain social network founder. One expression for every occasion. Sleeps with his eyes open. Definitely human.',
      top: 10, hw: 34, face: { ey: 49.3, dx: 14.2 },
      body: () => `${legs('#3f5c88', '#f4f4f6', '#cfd2d9')}<path fill="#8e939b" d="M72 94q0 -9 10 -9h36q10 0 10 9l-3 38H75z"/><path fill="#7c8189" d="M75 126h50l-.5 6H75.5z"/>
        <path fill="#ecccb9" d="M92 72h16v13q-8 7 -16 0z"/><path d="M90 85q10 9 20 0" fill="none" stroke="#7c8189" stroke-width="2"/>
        <g transform="translate(-18 -14.4) scale(1.18)">${head('#fae6da', '#ecccb9', 5.4)}
          <path fill="#8b6347" d="M72.5 48C70 27 84 18.5 100 18.5S130 27 127.5 48L125.5 40Q124.5 34 119 33.5L112 35L104 33.5L96 35L88 33.5L81 34Q75.5 34.5 74.5 40Z"/>
          <path d="M83 27q3 -3 6 0M93 23.5q3 -3 6 0M103 23.5q3 -3 6 0M112 27q3 -2.5 5.5 .5M88 30.5q3 -2.5 6 0M99 29.5q3 -2.5 6 0M109 31q3 -2 5 .5" fill="none" stroke="#a97c5c" stroke-width="1.5" stroke-linecap="round"/>
          <ellipse cx="100" cy="41" rx="13" ry="3.2" fill="#fff" opacity=".4"/></g>`,
      draw: (u) => `<g class="face" transform="translate(-18 -14.4) scale(1.18)">
        <path d="M82.5 46.5q5.5 -2.6 10.5 -.6M117.5 46.5q-5.5 -2.6 -10.5 -.6" fill="none" stroke="#b28d70" stroke-width="1.5" stroke-linecap="round"/>
        ${eyes(u, { y: 54, dx: 12, w: 6.6, h: 5.7, iris: '#7ba3c8', ir: 3.3, pr: 1.5, lash: '#8a6a56', lw: 1.3 })}
        <path d="M83 61.5q5 1.8 9.5 0M117 61.5q-5 1.8 -9.5 0" fill="none" stroke="#e3bca8" stroke-width="1"/>
        <path d="M100.5 56.5q-1.5 7.5 -3.8 10q3.6 2.6 7 0" fill="none" stroke="#d9a78e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${mouth(72, 8, 2.4)}</g>`,
      arms: arms((x) => `<rect x="${x + 1.5}" y="92" width="12" height="40" rx="6" fill="#fae6da"/><rect x="${x}" y="86" width="15" height="20" rx="7" fill="#8e939b"/><circle cx="${x + 7.5}" cy="135" r="6.4" fill="#fae6da"/>`),
    }),
    art({
      id: 'david', name: 'David', blurb: 'Fan art of David Martinez from Cyberpunk: Edgerunners, in the yellow EMT jacket. Unofficial; Cyberpunk belongs to CD PROJEKT RED.',
      top: 6, face: { ey: 55 },
      back: () => `<path fill="#34c6ee" d="M79 67h42l5 24H74z"/>`,
      body: () => `${legs('#232b40', '#17181d', '#ecebf0')}<path fill="#d69b78" d="M83 84h34l-2 42H85z"/>
        <path d="M100 91v32M88 98q12 6 24 0M93 105l-3 7l4 6M107 105l3 7l-4 6" fill="none" stroke="#b07a5c" stroke-width="1.1" stroke-linecap="round"/>
        <rect x="80" y="122" width="40" height="9" rx="3" fill="#161a26"/><rect x="96" y="123.5" width="8" height="6" rx="1.5" fill="#8f97a8"/>
        <path fill="#f7c61c" d="M70 96q0 -10 11 -11l8 -1l-2 48H74z"/><path fill="#f7c61c" d="M130 96q0 -10 -11 -11l-8 -1l2 48h13z"/>
        <path fill="#dca511" d="M89 84l-2 48h-3.4l2.4 -48zM111 84l2 48h3.4l-2.4 -48z"/><path fill="#1e2533" d="M74 124h13.3l-.3 8H74zM126 124h-13.3l.3 8H126z"/>
        <path fill="#bd8463" d="M92 72h16v14q-8 5 -16 0z"/>
        <path fill="#f7c61c" d="M73 92L76 65L90 77L88 91Z"/><path fill="#f7c61c" d="M127 92L124 65L110 77L112 91Z"/><path fill="#dca511" d="M76 65L90 77L83 80ZM124 65L110 77L117 80Z"/>
        ${head('#d69b78', '#bd8463')}<path fill="#8f6a57" d="M73.3 51C73 40 75 33 79.5 28.5L81 46Z"/><path fill="#8f6a57" d="M126.7 51C127 40 125 33 120.5 28.5L119 46Z"/>
        <path fill="#52d6c4" d="M122 32l4 5.4l-.8 8.6l-3.6 -4.6z"/>`,
      draw: (u) => `<g class="face">
        <path fill="#4b3026" d="M77 40C71 24 80 8 97 4L96 9C108 2 124 5 131 16L126 16C133 23 134 33 129 41L124 35C120 31 114 31 110 34L108 43L103 35L99 45L94 36C88 34 82 36 77 40Z"/>
        <path fill="#6d4737" d="M91 13C102 7 116 9 124 18C114 13.5 102 13.5 93 19Z"/>
        ${lr((s) => `<path d="M${100 + s * 19.5} 45.6L${100 + s * 6.5} 49.4" stroke="#38231c" stroke-width="3" stroke-linecap="round"/><path d="M${100 + s * 7.5} 62.2l${s * 8.5} .5" stroke="#a06c52" stroke-width="1.2" stroke-linecap="round"/>`)}
        ${eyes(u, { y: 55.4, dx: 12.5, w: 6.8, h: 5.1, iris: '#a8743c', tilt: 1.3, lash: '#2a1a16', lw: 2.3 })}
        <path d="M100.4 60l-2.4 6h4.2M117 45l-2.6 6.5l3.2 4.5M84 63l2.4 6" fill="none" stroke="#a9704f" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${mouth(72.5, 5, 0.5)}</g>`,
      arms: arms((x) => sleeve(x, '#f7c61c', '#d69b78', `<rect x="${x}" y="103" width="15" height="5.5" fill="#1e2533"/><rect x="${x}" y="121" width="15" height="10" rx="3.5" fill="#1e2533"/>`)),
    }),
    art({
      id: 'lucy', name: 'Lucy', blurb: 'Fan art of Lucy from Cyberpunk: Edgerunners. Still saving up for the moon. Unofficial; Cyberpunk belongs to CD PROJEKT RED.',
      top: 15, hw: 31, face: { ey: 56, dx: 12 },
      defs: (u) => `<linearGradient id="lh${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b9e3"/><stop offset=".45" stop-color="#e8c3f2"/><stop offset=".72" stop-color="#b7d0fb"/><stop offset="1" stop-color="#98aef0"/></linearGradient>
        <linearGradient id="lt${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0fb"/><stop offset=".5" stop-color="#b3f1d0"/><stop offset="1" stop-color="#f6f1a2"/></linearGradient>`,
      back: (B, A, u) => `<path fill="url(#lh${u})" d="M70 46C67 23 83 12 100 12C117 12 133 23 130 46L131 72Q131 82 123 85L77 85Q69 82 69 72Z"/>`,
      body: (B, A, u) => `${legs('#fdeae3', '#2c2942', '#1b1a2a', (x) => `<rect x="${x}" y="142" width="17" height="30" rx="5" fill="#2c2942"/><rect x="${x}" y="142" width="17" height="3.5" fill="#e23d3d"/>`)}
        <rect x="79" y="120" width="42" height="15" rx="6" fill="#26233a"/><path fill="#3b3658" d="M82 86h36l3 38H79z"/>
        <circle cx="79.5" cy="90.5" r="6.5" fill="#fdeae3"/><circle cx="120.5" cy="90.5" r="6.5" fill="#fdeae3"/>
        <path fill="#fdeae3" d="M93 84h14l-7 11z"/><path fill="#e23d3d" d="M90.5 85.5L100 98L109.5 85.5L107 83.5L100 93L93 83.5Z"/><path d="M100 98v22" stroke="#e23d3d" stroke-width="1.6"/>
        <path fill="#f0cfc8" d="M93 74h14v11q-7 4 -14 0z"/>${head('#fdeae3', '#f0cfc8', 4.2)}`,
      draw: (u) => `<g class="face">
        ${lr((s) => `<path d="M${100 + s * 18} 47.6L${100 + s * 8} 49.8" stroke="#b6a4d4" stroke-width="1.4" stroke-linecap="round"/><path fill="#e8584a" d="M${100 + s * 6} 62L${100 + s * 17.5} 60.4L${100 + s * 13.5} 64.4Z"/>`)}
        ${eyes(u, { y: 56.4, dx: 12, w: 7, h: 4.9, iris: '#9fd3c1', tilt: 1, lash: '#22192a', lw: 2.2 })}
        <path d="M100.2 63.6l-1.4 2.8h2.6" fill="none" stroke="#e0aea5" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>${mouth(71.8, 4.6, 2.2)}
        <path fill="url(#lh${u})" d="M71.5 58C67 30 82 15 100 15C118 15 133 30 128.5 58L126.5 46L119 47.5L118 44L109 46.5L108 43L98 45.5L96 43L88 46.5L84 44L79.5 51Z"/>
        <path fill="url(#lh${u})" d="M72.5 44L69.5 76L76 88L78.5 58Z"/><path fill="url(#lt${u})" d="M127.5 44L131 82L126 108L121.5 80L123.5 56Z"/>
        <path fill="#f6f6f9" stroke="#cdd2e2" stroke-width=".7" d="M75.5 31l6.5 -5.5l1 12.5l-5.5 6z"/></g>`,
      arms: (u) => arms((x) => `<rect x="${x + 2}" y="86" width="11" height="16" rx="5.5" fill="#fdeae3"/><rect x="${x}" y="97" width="15" height="35" rx="7.5" fill="#f1f2f8" stroke="#c5cbe0" stroke-width="1"/><rect x="${x}" y="123" width="15" height="4.5" fill="url(#lt${u})"/><circle cx="${x + 7.5}" cy="135" r="6.2" fill="#fdeae3"/>`),
    }),
    art({
      id: 'geralt', name: 'Geralt', blurb: 'Fan art of Geralt of Rivia from The Witcher games. Says "hmm" when the tests pass. Unofficial; The Witcher belongs to CD PROJEKT RED.',
      top: 14, hw: 31, face: { ey: 55.5 },
      back: () => `<g class="swords">${[0, 10].map((d) => `<path d="M${110 + d} ${104 + d * 0.4}L${144 + d} ${40 + d * 0.6}" stroke="#aeb3bd" stroke-width="4.6" stroke-linecap="round"/><path d="M${138 + d} ${35.5 + d * 0.6}L${151 + d} ${43 + d * 0.6}" stroke="#7f858f" stroke-width="3.6" stroke-linecap="round"/><path d="M${144.5 + d} ${39 + d * 0.6}L${152 + d} ${25 + d * 0.6}" stroke="#5a3a28" stroke-width="5.4" stroke-linecap="round"/><circle cx="${152.6 + d}" cy="${23.8 + d * 0.6}" r="3.3" fill="#9aa0aa"/>`).join('')}</g>
        <path fill="#c6c3bd" d="M71 46C68 23 84 13 100 13C116 13 132 23 129 46L133 84Q127 93 120 87L80 87Q73 93 67 84Z"/>`,
      body: () => `${legs('#2d2928', '#4a3528', '#2a1e17', (x) => `<rect x="${x}" y="148" width="17" height="24" rx="4" fill="#4a3528"/><rect x="${x}" y="148" width="17" height="4" fill="#6b4c38"/>`)}
        <path fill="#3b3330" d="M78 86h44l3 44H75z"/><path fill="#4b413b" d="M86 88h28l-2 32H88z"/>
        <path fill="#7a5438" d="M119 85l7 5L85 131h-9z"/><rect x="96" y="103" width="9" height="8" rx="1.5" fill="#b9bdc6" transform="rotate(-45 100.5 107)"/>
        <rect x="75.5" y="121" width="49" height="8" fill="#5a4030"/><rect x="95.5" y="120" width="9" height="10" rx="1.5" fill="#b9bdc6"/>
        <ellipse cx="76" cy="91" rx="10.5" ry="8" fill="#584c42"/><ellipse cx="124" cy="91" rx="10.5" ry="8" fill="#584c42"/>
        <path d="M70 90h.01M76 87h.01M82 90h.01M118 90h.01M124 87h.01M130 90h.01M90 94h.01M110 116h.01M90 116h.01" stroke="#a39a8c" stroke-width="2.4" stroke-linecap="round"/>
        <path fill="#cfa98e" d="M92 72h16v13q-8 5 -16 0z"/><path d="M91.5 84q8.5 13 17 0" fill="none" stroke="#aeb2ba" stroke-width="1.3"/>
        <circle cx="100" cy="94" r="4.8" fill="#c9ccd3"/><path fill="#676b75" d="M97 92.2l1.4 -2.4l1.6 2l1.6 -2l1.4 2.4l-1 4l-2 1.4l-2 -1.4z"/>
        ${head('#e6c7ad', '#cfa98e')}`,
      draw: (u) => `<g class="face">
        <path fill="#dedbd5" d="M75.5 60C77 74 86 83 100 85C114 83 123 74 124.5 60L120 66C116 70.5 110 71.5 106 69.5L100 68.5L94 69.5C90 71.5 84 70.5 80 66Z"/><path fill="#f1efeb" d="M90.5 69q9.5 -5.5 19 0q-9.5 2.6 -19 0z"/>
        ${lr((s) => `<path d="M${100 + s * 19.5} 46.4L${100 + s * 6.5} 50.2" stroke="#b9b5ae" stroke-width="2.8" stroke-linecap="round"/>`)}
        ${eyes(u, { y: 56, dx: 12.5, w: 6.4, h: 4.6, iris: '#eab520', slit: true, tilt: 1.3, lash: '#3a2c28', lw: 2 })}
        <path d="M116.6 43.5L113.4 66" stroke="#b77f6c" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M100.4 59.5l-2.6 6.5h4.8" fill="none" stroke="#c39a80" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>${mouth(74.6, 4.4, -0.6)}
        <path fill="#eceae6" d="M71.8 54C67.5 29 83 15 100 15C117 15 132.5 29 128.2 54L125 41C121 32 112 28 104.5 28.5L100 34L95.5 28.5C88 28 79 32 75 41Z"/>
        <path fill="#d6d3cd" d="M91 16.5q9 -8.5 18 0q-9 -3 -18 0z"/><path fill="#eceae6" d="M72.6 44L69.6 78L75.6 86L78 56Z"/><path fill="#eceae6" d="M127.4 44L130.4 78L124.4 86L122 56Z"/></g>`,
      arms: arms((x) => sleeve(x, '#3b3330', '#2a2423', `<rect x="${x}" y="113" width="15" height="15" rx="3" fill="#584c42"/>`)),
    }),
    {
      id: 'spark', name: 'Spark', blurb: 'A pixel critter in the spirit of the Claude Code mascot. A fan tribute, not the official one.',
      top: 66, hw: 60, face: { ey: 98, dx: 24, sq: true, cheek: false }, gloss: [0, 0, 0, 0, 0], feet: false, mouth: 'none',
      back: () => `<rect class="deep" x="50" y="144" width="14" height="32"/><rect class="deep" x="74" y="144" width="14" height="32"/><rect class="deep" x="112" y="144" width="14" height="32"/><rect class="deep" x="136" y="144" width="14" height="32"/>`,
      body: (B) => `<rect fill="${B}" x="40" y="66" width="120" height="84" rx="2"/>`,
      arms: '<rect class="arm arm-l" x="22" y="100" width="20" height="20"/><rect class="arm arm-r" x="158" y="100" width="20" height="20"/>',
    },
    fig({
      id: 'nyx', name: 'Nyx', blurb: 'A street kid from the neon city: chrome arms, a jacket two sizes too big. A fan nod to cyberpunk.',
      dark: true, face: { my: 91, brow: true },
      body: (B, A) => `${FIG.legs}${FIG.torso(B)}<path fill="#1b1722" d="M86 96h28l-14 26z"/><rect x="70" y="124" width="60" height="7" fill="${A}"/>
        <path fill="${B}" d="M66 104l-2 -24 24 16z"/><path fill="${B}" d="M134 104l2 -24 -24 16z"/>
        ${FIG.head('#f1c5a6')}<path fill="#2a2230" d="M57 62q-4 -36 30 -38q11 -9 24 -2q34 2 32 40q-9 -19 -25 -17l-6 11l-8 -11l-10 11l-10 -11q-15 0 -27 17z"/>
        <path d="M67 80v9M133 80v9" stroke="${A}" stroke-width="2.6" stroke-linecap="round"/>`,
      arms: ['l', 'r'].map((k) => { const x = k === 'l' ? 54 : 129; return `<g class="arm arm-${k}"><rect x="${x}" y="101" width="17" height="26" rx="8"/><rect class="chrome" x="${x + 1}" y="123" width="15" height="25" rx="6"/><path d="M${x + 1} 134h15" stroke="#5d6373" stroke-width="2"/></g>`; }).join(''),
    }),
    fig({
      id: 'kage', name: 'Kage', blurb: 'A ninja. You will not hear it arrive, only the chime when your session is done.',
      dark: true, mouth: 'none', face: { brow: true },
      back: (B, A) => `<path d="M136 34L64 150" stroke="#8a8f9c" stroke-width="5" stroke-linecap="round"/><path d="M136 34l8 -13" stroke="#261c2c" stroke-width="7" stroke-linecap="round"/>
        <path class="tail scarf" d="M124 100q30 4 44 -14" stroke="${A}"/>`,
      body: (B, A) => `${FIG.legs}${FIG.torso(B)}<rect x="70" y="132" width="60" height="9" fill="${A}"/><rect x="66" y="93" width="68" height="13" rx="6.5" fill="${A}"/>${FIG.head(B)}`,
      front: () => `<rect x="64" y="54" width="72" height="28" rx="13" fill="#f1c5a6"/>`,
    }),
    fig({
      id: 'titan', name: 'Titan', blurb: 'A pocket mech. The core in its chest pulses faster while Claude is working.',
      glow: true, mouth: 'none', gloss: [78, 46, 12, 4, 0],
      back: () => `<path class="deep" d="M56 60l-12 -22 8 30zM144 60l12 -22 -8 30z"/>`,
      body: (B, A) => `${FIG.legs}<rect fill="${B}" x="64" y="96" width="72" height="58" rx="9"/><rect class="deep" x="44" y="92" width="26" height="22" rx="6"/><rect class="deep" x="130" y="92" width="26" height="22" rx="6"/>
        <circle cx="100" cy="124" r="11" fill="#15121d"/><circle class="bulb" cx="100" cy="124" r="6.5" fill="${A}"/><path fill="${B}" d="M66 36h68l10 26-6 40H62l-6 -40z"/>`,
      front: () => `<path fill="#15121d" d="M62 58h76l-3 22H65z"/>`,
      arms: '<rect class="arm arm-l" x="50" y="106" width="18" height="44" rx="5"/><rect class="arm arm-r" x="132" y="106" width="18" height="44" rx="5"/>',
    }),
    fig({
      id: 'vale', name: 'Vale', blurb: 'A knight in full plate. Guards your terminal until the work is finished.',
      glow: true, mouth: 'none',
      back: (B, A) => `<path fill="${A}" d="M72 100q-22 40 -8 76h72q14 -36 -8 -76z"/>`,
      body: (B, A) => `${FIG.legs}${FIG.torso(B)}<circle class="deep" cx="68" cy="103" r="12"/><circle class="deep" cx="132" cy="103" r="12"/><path fill="${A}" d="M100 110l10 8v12q0 8 -10 12q-10 -4 -10 -12v-12z"/>
        <path class="tuft" fill="${A}" d="M100 32q-4 -26 22 -28q-12 10 -8 30z"/>${FIG.head(B)}<path class="deep" d="M97 28h6v74h-6z"/>`,
      front: () => `<rect x="62" y="60" width="76" height="15" rx="7" fill="#15121d"/>`,
    }),
    fig({
      id: 'orbit', name: 'Orbit', blurb: 'An astronaut on a very long mission: waiting for your tests to pass.',
      glow: true, mouth: 'glow', face: { my: 82 }, gloss: [74, 40, 12, 5, -22],
      back: () => `<rect class="deep" x="62" y="92" width="76" height="52" rx="14"/>`,
      body: (B, A) => `${FIG.legs}${FIG.torso(B)}<rect x="84" y="112" width="32" height="20" rx="5" fill="#15121d"/><circle cx="93" cy="122" r="3.4" fill="${A}"/><circle class="bulb" cx="107" cy="122" r="3.4" fill="#58B2F2"/>${FIG.head(B)}`,
      front: () => `<rect x="64" y="40" width="72" height="52" rx="24" fill="#171b2c"/><path d="M76 44h16l-12 44h-10z" fill="#fff" opacity=".09"/>`,
    }),
    fig({
      id: 'grim', name: 'Grim', blurb: 'A very small reaper. Only here for your stale branches.',
      dark: true, mouth: 'none', face: { ey: 70, dx: 15 },
      back: () => `<path d="M150 20L132 176" stroke="#6b5a4c" stroke-width="5" stroke-linecap="round"/><path class="chrome" d="M150 20q-40 -14 -62 14q30 -12 60 -2z"/>`,
      body: (B) => `<ellipse class="foot" cx="85" cy="177" rx="14" ry="6.5"/><ellipse class="foot" cx="115" cy="177" rx="14" ry="6.5"/><path fill="${B}" d="M72 98h56l14 78H58z"/>
        <path fill="${B}" d="M100 22q46 0 46 46v20q0 16 -16 16H70q-16 0 -16 -16V68q0 -46 46 -46z"/>`,
      front: () => `<path fill="#15121d" d="M100 40q32 0 32 32v10q0 14 -14 14H82q-14 0 -14 -14V72q0 -32 32 -32z"/><path fill="#f3efe6" d="M100 50q23 0 23 22q0 10 -8 14v6H85v-6q-8 -4 -8 -14q0 -22 23 -22z"/><path d="M93 90v-6M100 90v-6M107 90v-6" stroke="#15121d" stroke-width="2"/><path fill="#15121d" d="M97 80l3 -6l3 6z"/>`,
    }),
    fig({
      id: 'blaze', name: 'Blaze', blurb: 'A pocket dragon. Breathes a little fire when the build goes green.',
      face: { brow: true, my: 88 },
      back: (B, A) => `<path class="tail" d="M118 150q44 6 46 -30"/><path class="deep" d="M70 104L26 70q-2 30 14 44q-10 2 -12 12q24 6 44 -8z"/><path class="deep" d="M130 104L174 70q2 30 -14 44q10 2 12 12q-24 6 -44 -8z"/>
        <path fill="${A}" d="M70 40q-14 -14 -8 -32q14 8 20 26z"/><path fill="${A}" d="M130 40q14 -14 8 -32q-14 8 -20 26z"/>`,
      body: (B, A) => `${FIG.legs}${FIG.torso(B)}<path class="belly" d="M84 104h32q6 0 6 6v30q0 10 -10 10H88q-10 0 -10 -10v-30q0 -6 6 -6z"/><path d="M80 118h40M80 132h40" stroke="var(--body)" stroke-width="2.4" opacity=".6"/>${FIG.head(B)}
        <path fill="${A}" d="M92 30l8 -12l8 12z"/>`,
      front: () => `<ellipse class="belly" cx="100" cy="88" rx="24" ry="13"/><circle class="inkfill" cx="93" cy="82" r="1.8"/><circle class="inkfill" cx="107" cy="82" r="1.8"/>`,
    }),
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
      top: 62, hw: 54, face: { ey: 108, dx: 20, my: 123, cheek: false }, gloss: [70, 71, 13, 4.5, -8], feet: true, glow: true, mouth: 'glow',
      back: (B, A) => `<rect class="deep ear-bolt" x="35" y="100" width="15" height="28" rx="7"/><rect class="deep ear-bolt" x="150" y="100" width="15" height="28" rx="7"/>
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
      top: 44, hw: 57, face: { ey: 100, dx: 20 }, gloss: [70, 62, 13, 7, -38], feet: true, mouth: 'none',
      body: (B) => `<path fill="${B}" d="M100 44c36 0 58 30 58 68 0 38-22 60-58 60s-58-22-58-60c0-38 22-68 58-68z"/>`,
      front: (B, A) => `<path class="belly" d="M100 72c-15 -15 -43 -5 -43 30 0 42 19 66 43 66s43-24 43-66c0-35-28-45-43-30z"/><path fill="${A}" d="M89 113q11 -7 22 0q-11 14 -22 0z"/>`,
    },
    {
      id: 'imp', name: 'Scamp', blurb: 'A horned imp with a chipped horn and a lantern on its tail. The lantern changes colour with what Claude is doing.',
      kind: 'figure', top: 30, hw: 54, face: { ey: 76, dx: 22 }, gloss: [72, 48, 15, 6, -24], feet: false,
      back: (B, A) => `<g class="lantern"><path class="ptail" d="M118 152C158 164 190 140 183 104C181 93 177 86 172 81"/>
          <circle class="orb halo bulb" cx="170" cy="72" r="16"/><circle class="orb" cx="170" cy="72" r="9.5"/><circle cx="167" cy="69" r="2.6" fill="#fff" opacity=".8"/></g>
        <path class="scarf-end" fill="${A}" d="M76 112L54 124L65 127L55 142Q76 136 84 116Z"/>
        <path class="horn" d="M60 54C45 41 45 22 56 8C56 23 65 34 82 42Z"/><path class="horn" d="M140 54C155 41 156 27 151 16L145 22L143 11C143 24 135 34 118 42Z"/>
        <path class="horn-tip" d="M56 8C53 12 51 16 50 21L57 19C56 15 56 12 56 8Z"/>
        <rect class="deep" x="81" y="150" width="16" height="26" rx="7"/><rect class="deep" x="103" y="150" width="16" height="26" rx="7"/>
        <ellipse class="foot" cx="85" cy="176" rx="15" ry="6.5"/><ellipse class="foot" cx="115" cy="176" rx="15" ry="6.5"/>`,
      body: (B, A) => `<path fill="${B}" d="M77 112Q77 102 100 102Q123 102 123 112L127 150Q127 163 100 163Q73 163 73 150Z"/><ellipse class="belly" cx="100" cy="142" rx="15" ry="14"/>
        <path fill="${B}" d="M100 30C134 30 154 50 154 76C154 100 134 114 100 114C66 114 46 100 46 76C46 50 66 30 100 30Z"/>
        <path fill="${A}" d="M71 104Q100 121 129 104L131 113Q100 132 69 113Z"/>`,
      front: (B, A) => `<circle cx="100" cy="49" r="4.6" fill="${A}"/>`,
      draw: () => `<g class="face"><g class="eyes">${lr((s) => { const x = 100 + s * 22; return `
          <g class="eye-open"><path fill="#fff" d="M${x + s * 13} 69Q${x - s * 1} 61 ${x - s * 14} 77Q${x - s * 11} 90 ${x + s * 1} 90Q${x + s * 15} 88 ${x + s * 13} 69Z"/><circle class="inkfill" cx="${x - s * 2}" cy="79.5" r="5.8"/><circle class="glint" cx="${x - s * 2 + 2}" cy="77" r="1.9"/></g>
          <path class="eye-happy" d="M${x - 9.5} 80q9.5 -13 19 0"/><path class="eye-shut" d="M${x - 9} 77q9 6 18 0"/>
          <path class="plid" d="M${x + s * 15} 65.5Q${x} 61 ${x - s * 15} 75"/>`; })}</g>
        <path class="m-smile" d="M90 96q9 7 20 -2"/><path class="fang" d="M103.5 98.2l2.6 6.4l3.2 -8.6z"/>
        <path class="m-open" d="M89 95q11 15 22 0z"/><ellipse class="m-o" cx="100" cy="99" rx="4" ry="5"/></g>`,
      arms: lr((s, k) => { const x = s < 0 ? 60 : 124; return `<g class="arm arm-${k}"><rect x="${x}" y="108" width="16" height="36" rx="8"/><circle class="deep" cx="${x + 8}" cy="146" r="8.5"/></g>`; }),
    },
    {
      id: 'classic', name: 'Classic', blurb: 'The first Pip, a small horned critter. Retired from the main job, still on call.',
      top: 60, hw: 60, face: { ey: 106, dx: 24 }, gloss: [66, 80, 17, 8, -28], feet: true,
      back: () => `<path class="tail" d="M152 156q30 2 30 -26"/>
        <path class="deep" d="M58 74q-8 -30 8 -38q16 8 16 30z"/><path class="deep" d="M142 74q8 -30 -8 -38q-16 8 -16 30z"/>`,
      body: (B) => `<rect fill="${B}" x="40" y="60" width="120" height="112" rx="48"/>`,
      front: () => `<ellipse class="belly" cx="100" cy="150" rx="34" ry="20"/>`,
    },
    {
      id: 'duck', name: 'Quack', blurb: 'A rubber duck. Explain the bug to it while Claude fixes it.',
      top: 52, hw: 56, face: { ey: 96, dx: 22 }, gloss: [72, 72, 15, 8, -34], feet: true, mouth: 'none',
      back: (B) => `<path fill="${B}" d="M146 152q28 -4 32 -32q-24 4 -36 24z"/><path class="tuft" fill="${B}" d="M90 58q-4 -18 10 -22q-3 9 4 13q4 -9 13 -7q-7 7 -5 17z"/>`,
      body: (B) => `<path fill="${B}" d="M100 52c36 0 60 26 60 62 0 36-24 58-60 58s-60-22-60-58c0-36 24-62 60-62z"/>`,
      front: () => `<path fill="#ff9a3d" d="M79 113q21 -11 42 0q-3 16 -21 16t-21 -16z"/><path d="M82 117q18 7 36 0" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" opacity=".22"/>`,
    },
    {
      id: 'capy', name: 'Kapi', blurb: 'A capybara. Nothing has ever worried it, including your failing build.',
      top: 58, hw: 62, face: { ey: 94, dx: 31, cheek: false }, gloss: [66, 76, 16, 7, -26], feet: true, mouth: 'none',
      back: (B) => `<ellipse cx="60" cy="63" rx="12" ry="10" fill="${B}"/><ellipse class="deep" cx="60" cy="64" rx="6" ry="5"/><ellipse cx="140" cy="63" rx="12" ry="10" fill="${B}"/><ellipse class="deep" cx="140" cy="64" rx="6" ry="5"/>`,
      body: (B) => `<rect fill="${B}" x="38" y="58" width="124" height="114" rx="44"/>`,
      front: (B, A) => `<rect class="snout" x="71" y="100" width="58" height="46" rx="21"/><ellipse class="inkfill" cx="90" cy="113" rx="3.6" ry="2.6"/><ellipse class="inkfill" cx="110" cy="113" rx="3.6" ry="2.6"/><path class="grin" d="M91 130q9 5 18 0"/>
        <g class="tuft"><circle cx="100" cy="50" r="13" fill="#ffa23f"/><path fill="#58b274" d="M100 38q8 -9 15 -4q-4 9 -15 4z"/><circle cx="96" cy="46" r="3" fill="#fff" opacity=".35"/></g>`,
    },
    {
      id: 'shiba', name: 'Mame', blurb: 'A shiba. Much build. Very green. Wow.',
      top: 56, hw: 62, face: { ey: 100, dx: 25, my: 128 }, gloss: [70, 80, 15, 7, -30], feet: true,
      back: (B) => `<path class="tail curl" d="M150 152q34 -2 27 -32q-4 -14 -17 -8"/>
        <path fill="${B}" d="M54 84L52 40Q52 33 59 36L90 58Z"/><path class="belly" d="M60 72L59 48L77 60Z"/><path fill="${B}" d="M146 84L148 40Q148 33 141 36L110 58Z"/><path class="belly" d="M140 72L141 48L123 60Z"/>`,
      body: (B) => `<path fill="${B}" d="${ROUND}"/>`,
      front: () => `<path class="belly" d="M58 124C60 105 80 101 100 113C120 101 140 105 142 124C140 153 122 171 100 171C78 171 60 153 58 124Z"/><ellipse class="belly" cx="76" cy="87" rx="6" ry="4"/><ellipse class="belly" cx="124" cy="87" rx="6" ry="4"/><ellipse class="inkfill" cx="100" cy="120" rx="6" ry="4.4"/>`,
    },
    {
      id: 'octo', name: 'Inky', blurb: 'An octopus. Eight arms, and it still only watches one screen: yours.',
      top: 44, hw: 58, face: { ey: 98, dx: 24 }, gloss: [72, 68, 16, 9, -34], feet: false,
      back: () => `<path class="tent" d="M52 150q-24 8 -19 27M148 150q24 8 19 27"/>`,
      body: (B) => `<path fill="${B}" d="M100 44c36 0 60 26 60 60 0 20-6 34-12 46q4 12 -4 22q-10 6 -16 -6q-4 14 -14 14t-14 -14q-4 14 -14 14t-14 -14q-6 12 -16 6q-8 -10 -4 -22c-6-12-12-26-12-46 0-34 24-60 60-60z"/>`,
      front: () => `<path class="suckers" d="M66 158h.01M84 165h.01M100 167h.01M116 165h.01M134 158h.01"/>`,
    },
    fig({
      id: 'sage', name: 'Sage', blurb: 'A wizard. Calls every passing test a spell that worked.',
      dark: true, top: 8, face: { ey: 66 }, gloss: [0, 0, 0, 0, 0], mouth: 'none',
      back: (B, A) => `<path d="M152 62V176" stroke="#7a5a3c" stroke-width="5" stroke-linecap="round"/><circle class="bulb" cx="152" cy="52" r="10.500" fill="${A}"/><circle cx="149" cy="49" r="2.600" fill="#fff" opacity=".8"/>`,
      body: (B, A) => `<ellipse class="foot" cx="85" cy="177" rx="14" ry="6.500"/><ellipse class="foot" cx="115" cy="177" rx="14" ry="6.500"/><path fill="${B}" d="M72 98h56l12 78H60z"/><rect x="65" y="128" width="70" height="8" fill="${A}"/>
        ${FIG.head('#f1c5a6')}`,
      front: (B, A) => `<path fill="#f4f1ea" d="M62 80q4 44 38 54q34 -10 38 -54q-10 9 -38 9t-38 -9z"/><path fill="#fff" d="M78 86q22 -10 44 0q-10 8 -22 3q-12 5 -22 -3z"/>
        <path fill="${B}" d="M52 48L98 4Q100 2 102 4L148 48Q100 32 52 48Z"/><path fill="${A}" d="M62 38Q100 25 138 38L144 45Q100 30 56 45Z"/>`,
    }),
  ];

  // The drawn cast first, then the classics.
  const ORDER = ['blob', 'simba', 'zuck', 'david', 'lucy', 'geralt', 'imp', 'classic'];
  CHARS.sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));

  function accessory(id, c, u) {
    const t = c.top, { ey = 108, dx = 22 } = c.face, hw = c.hw;
    switch (id) {
      case 'crown': return `<g class="acc"><path fill="#F7C948" d="M76 ${t + 6}l-5 -25 14 11 15 -18 15 18 14 -11 -5 25z"/><path fill="#E0A92B" d="M76 ${t + 6}h48v-6H77z"/><circle cx="100" cy="${t - 9}" r="3.4" fill="#F0567A"/><circle cx="84" cy="${t - 4}" r="2.6" fill="#58B2F2"/><circle cx="116" cy="${t - 4}" r="2.6" fill="#58B2F2"/></g>`;
      case 'party': return `<g class="acc"><path fill="var(--accent)" d="M100 ${t - 38}L82 ${t + 6}H118Z"/><path fill="#fff" opacity=".55" d="M94 ${t - 23}l12 0 3 8-18 0zM88 ${t - 8}l24 0 3 7-30 0z"/><circle cx="100" cy="${t - 39}" r="6" fill="#fff"/></g>`;
      case 'headphones': return `<g class="acc"><path fill="none" stroke="#261c2c" stroke-width="7" stroke-linecap="round" d="M${100 - hw - 2} ${ey - 4}C${100 - hw - 2} ${t - 34} ${100 + hw + 2} ${t - 34} ${100 + hw + 2} ${ey - 4}"/><rect x="${100 - hw - 13}" y="${ey - 18}" width="20" height="36" rx="9" fill="var(--accent)"/><rect x="${100 + hw - 7}" y="${ey - 18}" width="20" height="36" rx="9" fill="var(--accent)"/></g>`;
      case 'glasses': { const r = Math.min(14.5, dx - 1.5); return `<g class="acc glasses" fill="rgba(255,255,255,.2)" stroke="#261c2c" stroke-width="${r < 14 ? 2.6 : 3.6}"><circle cx="${100 - dx}" cy="${ey}" r="${r}"/><circle cx="${100 + dx}" cy="${ey}" r="${r}"/><path fill="none" d="M${100 - dx + r} ${ey - 2}q${dx - r} -6 ${2 * (dx - r)} 0"/></g>`; }
      case 'bow': return `<g class="acc"><path fill="var(--accent)" d="M128 ${t + 14}l-20 -13v26zM128 ${t + 14}l20 -13v26z"/><circle cx="128" cy="${t + 14}" r="6.5" fill="var(--accent2)"/></g>`;
      // A wedge of white cheese. Simba holds his between his paws and eats it (the bites are holes in a mask); everyone else keeps it at their feet.
      case 'cheese': return `<g class="acc cheese"${c.id === 'simba' ? '' : ' transform="translate(-58 14) scale(.92)"'}>
        <mask id="cm${u}"><rect x="50" y="110" width="100" height="80" fill="#fff"/><circle class="bite bite1" cx="100" cy="133" r="8.5"/><circle class="bite bite2" cx="89" cy="145" r="8"/><circle class="bite bite3" cx="111" cy="146" r="8"/></mask>
        <g mask="url(#cm${u})"><path d="M100 132L130 177H70Z" fill="#fffdf6" stroke="#d2c7ad" stroke-width="2.6" stroke-linejoin="round"/><path d="M75 176.5h50" stroke="#e6dcc5" stroke-width="3.4" stroke-linecap="round"/><path d="M97 147l-9 16M105 154l5 12" stroke="#efe7d4" stroke-width="2.2" stroke-linecap="round"/></g>
        <g class="crumbs"><circle cx="90" cy="128" r="1.9"/><circle cx="110" cy="126" r="1.6"/><circle cx="101" cy="122" r="1.3"/></g></g>`;
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
    return `<svg class="pip" data-char="${c.id}" data-kind="${c.kind || 'blob'}" data-face="${c.art ? 'art' : c.glow ? 'glow' : c.dark ? 'dark' : ''}" data-mouth="${c.mouth || ''}" data-acc="${accId}" data-mood="idle" viewBox="0 0 200 200" role="img" aria-label="${c.name}">
      <defs>
        <radialGradient id="b${u}" cx=".36" cy=".24" r=".92">${stop(0, 'light')}${stop(0.48, 'body')}${stop(1, 'dark')}</radialGradient>
        <radialGradient id="c${u}">${stop(0, 'cheek')}${stop(1, 'cheek0')}</radialGradient>
        <linearGradient id="a${u}" x1="0" y1="0" x2="0" y2="1">${stop(0, 'accent')}${stop(1, 'accent2')}</linearGradient>
        <radialGradient id="s${u}"><stop offset="0" stop-color="#1f1a24" stop-opacity=".34"/><stop offset="1" stop-color="#1f1a24" stop-opacity="0"/></radialGradient>${c.defs ? c.defs(u) : ''}
      </defs>
      <ellipse class="shadow" cx="100" cy="181" rx="${c.kind === 'figure' ? 44 : 56}" ry="9" fill="url(#s${u})"/>
      <g class="wrap">
        ${c.back ? c.back(B, A, u) : ''}
        ${c.feet ? '<ellipse class="foot" cx="78" cy="173" rx="15" ry="7.5"/><ellipse class="foot" cx="122" cy="173" rx="15" ry="7.5"/>' : ''}
        ${c.body(B, A, u)}
        <ellipse class="gloss" cx="${gx}" cy="${gy}" rx="${grx}" ry="${gry}" transform="rotate(${gr} ${gx} ${gy})"/>
        ${c.front ? c.front(B, A, u) : ''}${c.draw ? c.draw(u) : face(c.face || {}, u)}${accId === 'cheese' ? '' : accessory(accId, c, u)}
        ${typeof c.arms === 'function' ? c.arms(u) : c.arms || '<ellipse class="arm arm-l" cx="45" cy="135" rx="9" ry="12"/><ellipse class="arm arm-r" cx="155" cy="135" rx="9" ry="12"/>'}
        ${accId === 'cheese' ? accessory(accId, c, u) : ''}
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

  // hello / bye: a wave when Claude opens or closes (class on the mount element, like petted)
  function greet(el, kind) { el.classList.remove('hello', 'bye'); void el.offsetWidth; el.classList.add(kind); setTimeout(() => el.classList.remove(kind), 1700); }

  const api = { CHARS, SKINS, ACCS, palette, mix, svg, mount, skin, setMood, look, pet, greet };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PipPet = api;
})(typeof window !== 'undefined' ? window : globalThis);
