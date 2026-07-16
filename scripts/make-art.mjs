// Generates decorative, culturally-neutral SVG banner art for each festival.
// These are symbolic/motif illustrations (lamps, lotus, conch, vel, arch, toran)
// in the app's palette — NOT depictions of deities' faces/forms, to avoid
// iconography errors in a temple context. Run: node scripts/make-art.mjs
//
// One shared frame (soft background + faint gopuram + marigold toran + rangoli
// corners) plus a per-festival central motif keeps all 21 images cohesive.

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'images'
);
await mkdir(outDir, { recursive: true });

const C = {
  maroon: '#7A2048',
  deep: '#551531',
  gold: '#C79A2E',
  marigold: '#E8871E',
  light: '#F7B155',
  green: '#3F7D4F',
  cream: '#FFF8EC',
  blue: '#3E6E8E',
  white: '#FFFFFF',
};

const W = 800;
const H = 380;

// ---- shared frame pieces -------------------------------------------------

function defs(accent) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${tint(accent, 0.18)}"/>
      <stop offset="1" stop-color="${C.cream}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${tint(accent, 0.45)}"/>
      <stop offset="1" stop-color="${tint(accent, 0)}"/>
    </radialGradient>
  </defs>`;
}

// crude hex tint toward white by amount (0..1)
function tint(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c) => Math.round(c + (255 - c) * (1 - amount));
  const h = (c) => c.toString(16).padStart(2, '0');
  return `#${h(mix(r))}${h(mix(g))}${h(mix(b))}`;
}

function background() {
  return `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
}

// faint stepped temple tower behind the motif
function gopuram() {
  const cx = W / 2;
  let s = `<g fill="${C.maroon}" opacity="0.07">`;
  for (let i = 0; i < 5; i++) {
    const w = 150 - i * 22;
    const y = 150 - i * 26;
    s += `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="26" rx="4"/>`;
  }
  s += `<path d="M${cx - 20} 46 h40 l-8 -20 h-24 z"/>`; // kalash top
  s += `</g>`;
  return s;
}

// marigold garland (toran) hanging from the top
function toran() {
  let s = `<path d="M0 34 Q${W / 2} 78 ${W} 34" fill="none" stroke="${C.green}" stroke-width="3"/>`;
  const n = 17;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = t * W;
    const y = 34 + Math.sin(t * Math.PI) * 44;
    const col = i % 2 ? C.marigold : C.gold;
    s += `<circle cx="${x}" cy="${y}" r="8" fill="${col}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="3" fill="${C.deep}" opacity="0.35"/>`;
    if (i % 3 === 0)
      s += `<path d="M${x} ${y + 8} l-5 12 h10 z" fill="${C.green}"/>`; // leaf
  }
  return s;
}

// rangoli dot-and-petal clusters in the lower corners
function rangoli() {
  const cluster = (cx, cy) => {
    let s = `<g>`;
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const x = cx + Math.cos(ang) * 20;
      const y = cy + Math.sin(ang) * 20;
      s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="3" transform="rotate(${(ang * 180) / Math.PI} ${x} ${y})" fill="${C.marigold}" opacity="0.55"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="9" fill="${C.gold}"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="${C.maroon}"/></g>`;
    return s;
  };
  return cluster(60, H - 46) + cluster(W - 60, H - 46);
}

function halo(cx = W / 2, cy = 200) {
  return `<circle cx="${cx}" cy="${cy}" r="120" fill="url(#halo)"/>`;
}

// ---- central motifs ------------------------------------------------------
// Each returns SVG centered roughly at (400, 200).

const motifs = {
  diyas() {
    let s = '';
    const xs = [300, 400, 500];
    xs.forEach((x, i) => {
      const y = 240 - (i === 1 ? 18 : 0);
      s += `<ellipse cx="${x}" cy="${y}" rx="34" ry="12" fill="${C.gold}"/>`;
      s += `<path d="M${x - 8} ${y - 6} q8 -30 8 -30 q0 30 8 30 a10 8 0 01-16 0z" fill="${C.marigold}"/>`;
      s += `<path d="M${x} ${y - 40} q6 12 0 20 q-6 -8 0 -20z" fill="${C.light}"/>`;
    });
    return s;
  },
  sun() {
    let s = `<circle cx="400" cy="200" r="60" fill="${C.marigold}"/><circle cx="400" cy="200" r="44" fill="${C.light}"/>`;
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const x1 = 400 + Math.cos(ang) * 70;
      const y1 = 200 + Math.sin(ang) * 70;
      const x2 = 400 + Math.cos(ang) * 96;
      const y2 = 200 + Math.sin(ang) * 96;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"/>`;
    }
    return s;
  },
  lotus() {
    let s = `<g transform="translate(400 210)">`;
    for (let i = -3; i <= 3; i++) {
      const rot = i * 22;
      s += `<path d="M0 0 C -18 -70 18 -70 0 0" transform="rotate(${rot})" fill="${i % 2 ? C.marigold : C.light}" stroke="${C.maroon}" stroke-width="1.5"/>`;
    }
    s += `<ellipse cx="0" cy="6" rx="70" ry="14" fill="${C.green}" opacity="0.5"/></g>`;
    return s;
  },
  trishul() {
    return `<g stroke="${C.maroon}" stroke-width="9" stroke-linecap="round" fill="none">
      <line x1="400" y1="120" x2="400" y2="290"/>
      <path d="M360 150 q0 -34 40 -34 q40 0 40 34"/>
      <line x1="360" y1="150" x2="360" y2="118"/><line x1="440" y1="150" x2="440" y2="118"/>
      <line x1="400" y1="116" x2="400" y2="96"/>
    </g><ellipse cx="400" cy="292" rx="46" ry="12" fill="${C.gold}"/>`;
  },
  conch() {
    // conch (shankha) + discus (chakra)
    let s = `<path d="M350 250 q-30 -10 -20 -50 q10 -40 55 -55 q40 -12 45 20 q4 22 -18 30 q-14 5 -20 -6 q26 8 20 -14 q-6 -18 -30 -8 q-34 14 -40 50 q-4 26 22 34 q30 8 46 -6" fill="${C.white}" stroke="${C.maroon}" stroke-width="4"/>`;
    s += `<g transform="translate(500 190)"><circle r="46" fill="${C.gold}"/><circle r="30" fill="none" stroke="${C.maroon}" stroke-width="3"/>`;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      s += `<line x1="0" y1="0" x2="${Math.cos(ang) * 46}" y2="${Math.sin(ang) * 46}" stroke="${C.maroon}" stroke-width="3"/>`;
    }
    s += `</g>`;
    return s;
  },
  vel() {
    // vel (spear) with peacock feather
    return `<line x1="400" y1="110" x2="400" y2="300" stroke="${C.gold}" stroke-width="8" stroke-linecap="round"/>
      <path d="M400 110 C 372 140 372 176 400 196 C 428 176 428 140 400 110 Z" fill="${C.marigold}" stroke="${C.maroon}" stroke-width="3"/>
      <ellipse cx="470" cy="210" rx="16" ry="34" fill="${C.green}" transform="rotate(24 470 210)"/>
      <circle cx="474" cy="222" r="9" fill="${C.blue}"/><circle cx="474" cy="222" r="4" fill="${C.gold}"/>`;
  },
  mace() {
    // gada (mace)
    return `<g transform="rotate(18 400 200)"><rect x="392" y="150" width="16" height="130" rx="8" fill="${C.gold}"/>
      <circle cx="400" cy="140" r="40" fill="${C.marigold}" stroke="${C.maroon}" stroke-width="4"/>
      <circle cx="400" cy="140" r="20" fill="${C.light}"/></g>`;
  },
  modak() {
    // modak (sweet) on a leaf
    return `<ellipse cx="400" cy="256" rx="90" ry="20" fill="${C.green}" opacity="0.5"/>
      <path d="M400 150 C 350 210 356 250 400 250 C 444 250 450 210 400 150 Z" fill="${C.light}" stroke="${C.maroon}" stroke-width="3"/>
      <path d="M400 150 l-14 26 h28 z" fill="${C.marigold}"/>`;
  },
  bow() {
    // bow and arrow
    return `<path d="M330 110 Q470 200 330 290" fill="none" stroke="${C.maroon}" stroke-width="8" stroke-linecap="round"/>
      <line x1="330" y1="110" x2="330" y2="290" stroke="${C.gold}" stroke-width="3"/>
      <line x1="332" y1="200" x2="500" y2="200" stroke="${C.deep}" stroke-width="5"/>
      <path d="M500 200 l-20 -9 v18 z" fill="${C.marigold}"/>
      <path d="M332 200 l16 -8 v16 z" fill="${C.gold}"/>`;
  },
  kalash() {
    // kalash (pot) with mango leaves and coconut
    return `<path d="M356 200 q-14 40 6 80 q38 24 64 0 q20 -40 6 -80z" fill="${C.gold}" stroke="${C.maroon}" stroke-width="3"/>
      <rect x="352" y="188" width="96" height="16" rx="6" fill="${C.marigold}"/>
      <g fill="${C.green}"><path d="M400 188 q-30 -18 -46 -46 q34 6 46 40z"/><path d="M400 188 q30 -18 46 -46 q-34 6 -46 40z"/><path d="M400 188 q-4 -30 0 -54 q4 24 0 54z"/></g>
      <ellipse cx="400" cy="150" rx="16" ry="20" fill="${C.deep}"/>`;
  },
  book() {
    // palm-leaf manuscript / book with a small flame (knowledge)
    return `<g transform="translate(400 210)"><path d="M-90 20 L0 0 L90 20 L0 40 Z" fill="${C.light}" stroke="${C.maroon}" stroke-width="3"/>
      <path d="M-90 20 L0 40 L0 0 Z" fill="${C.gold}"/>
      <path d="M0 -14 q7 14 0 24 q-7 -10 0 -24z" fill="${C.marigold}"/></g>`;
  },
  steps() {
    // 18 sacred steps (Ayyappa) — stylized stair
    let s = '';
    for (let i = 0; i < 6; i++) {
      const w = 60 + i * 40;
      const y = 130 + i * 26;
      s += `<rect x="${400 - w / 2}" y="${y}" width="${w}" height="20" rx="4" fill="${i % 2 ? C.gold : C.marigold}" stroke="${C.maroon}" stroke-width="1.5"/>`;
    }
    return s;
  },
  thread() {
    // pavithra (sacred thread) knotted loops
    let s = `<g fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round">`;
    for (let i = 0; i < 3; i++) {
      const cx = 320 + i * 80;
      s += `<circle cx="${cx}" cy="200" r="40"/>`;
    }
    s += `</g><path d="M280 200 q120 -70 240 0" fill="none" stroke="${C.marigold}" stroke-width="4"/>`;
    return s;
  },
  flute() {
    // flute with a peacock feather
    return `<line x1="320" y1="250" x2="500" y2="160" stroke="${C.gold}" stroke-width="12" stroke-linecap="round"/>
      <g fill="${C.deep}"><circle cx="360" cy="228" r="4"/><circle cx="392" cy="212" r="4"/><circle cx="424" cy="196" r="4"/><circle cx="456" cy="180" r="4"/></g>
      <ellipse cx="512" cy="150" rx="16" ry="36" fill="${C.green}" transform="rotate(30 512 150)"/>
      <circle cx="516" cy="162" r="9" fill="${C.blue}"/><circle cx="516" cy="162" r="4" fill="${C.gold}"/>`;
  },
};

// ---- per-festival assignment (motif + accent) ----------------------------

const MAP = {
  shivaratri: ['trishul', C.maroon],
  ramanavami: ['bow', C.gold],
  ganeshchaturthi: ['modak', C.marigold],
  janmashtami: ['flute', C.green],
  dussehra: ['bow', C.maroon],
  diwali: ['diyas', C.marigold],
  godakalyanam: ['lotus', C.maroon],
  makarasankranti: ['sun', C.marigold],
  mahalakshmijayanthi: ['lotus', C.gold],
  yugadi: ['kalash', C.green],
  hanumanjayanthi: ['mace', C.marigold],
  sivalayavarshikotsavam: ['trishul', C.gold],
  tamilnewyearvishu: ['kalash', C.green],
  akshayatritiya: ['conch', C.gold],
  brahmotsavam: ['conch', C.maroon],
  gurupurnima: ['book', C.maroon],
  pavithrotsavam: ['thread', C.gold],
  srivarujayanti: ['conch', C.maroon],
  skandashashti: ['vel', C.marigold],
  ayyappamandala: ['steps', C.maroon],
  vaikunthaekadasi: ['conch', C.gold],
};

function buildSvg(id) {
  const [motifKey, accent] = MAP[id];
  const motif = motifs[motifKey]();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid slice">
${defs(accent)}
${background()}
${gopuram()}
${halo()}
${motif}
${toran()}
${rangoli()}
</svg>
`;
}

let count = 0;
for (const id of Object.keys(MAP)) {
  await writeFile(resolve(outDir, `${id}.svg`), buildSvg(id), 'utf8');
  count++;
}
console.log(`Wrote ${count} festival art SVGs to assets/images/`);
