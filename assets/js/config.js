// config.js
// Contient les paramètres globaux et la liste des couleurs disponibles

import { MODERN_NAMES } from './names.js';

// Deterministic unique name generator - each color gets exactly one unique name
let nameIndex = 0;

function generateUniqueName(isSpecial = false) {
  // Skip Nathan and Naïa in normal sequence (reserved for epic colors)
  let name;
  do {
    name = MODERN_NAMES[nameIndex % MODERN_NAMES.length];
    nameIndex++;
  } while (name === 'Nathan' || name === 'Naïa');
  return name;
}

export const CONFIG = {
  COIN_PER_COLOR: 10, // coins gagnés par couleur par défaut
  SPINNER_DURATION: 350, // durée en ms de l'animation spinner (plus rapide)
  BOOSTER: {
    multiplier: 2, // multiplicateur de revenu
    duration: 30, // durée en secondes
    cost: 150 // coût en pièces
  },
  // Generate a palette of 500 colours with explicit rarity and probability.
  // Special rules:
  // - Epic: black (#000000) and white (#FFFFFF) with value 10000 and prob 0.1% each
  // - Rare: red, green, blue with value 1000 and prob 1% each
  // - Grays: 30 shades, least rare, values 1-30 (darker = lower value). Combined high probability.
  // - Remaining slots are filled with common colors.
  COLORS: (function generateColors(){
    const total = 500;
    const out = [];

    // 1) Epic colours (explicit) - Nathan & Naïa reserved
    out.push({id:'c-0001', hex:'#000000', name:'Naïa', rarity:'epic', value:10000, prob:0.001, officialName:'Noir'});
    out.push({id:'c-0002', hex:'#FFFFFF', name:'Nathan', rarity:'epic', value:10000, prob:0.001, officialName:'Blanc'});

    // 2) Rare colours - Robion (rouge), Xavier (vert), Natalie (bleu)
    out.push({id:'c-0003', hex:'#FF0000', name:'Robion', rarity:'rare', value:1000, prob:0.01, officialName:'Rouge'});
    out.push({id:'c-0004', hex:'#00FF00', name:'Xavier', rarity:'rare', value:1000, prob:0.01, officialName:'Vert'});
    out.push({id:'c-0005', hex:'#0000FF', name:'Natalie', rarity:'rare', value:1000, prob:0.01, officialName:'Bleu'});

    // 3) Grays (30 shades) - UNLOCKED BY DEFAULT
    const grayCount = 30;
    for(let i=0;i<grayCount;i++){
      const light = Math.round(95 - (i*(60/ (grayCount-1))));
      const hex = hslToHex(0,0,light);
      const value = 1 + Math.round((grayCount-1 - i) * (9/(grayCount-1))); // 1-10 coins
      const name = generateUniqueName();
      out.push({id:`c-g${String(i+1).padStart(2,'0')}`, hex, name, rarity:'common_gray', value, prob:0, zone:'grays'});
    }

    // 4) Fill the rest with common colors - split into warm and cold
    const remaining = total - out.length;
    for(let i=0;i<remaining;i++){
      const idx = i + 6;
      const hue = Math.round((i * 137) % 360);
      const sat = 60 + Math.round((i * 53) % 30);
      const light = 45 + Math.round((i * 71) % 30);
      const hex = hslToHex(hue, sat, light);
      const name = generateUniqueName();
      // Classify as warm (0-60, 300-360) or cold (120-240)
      const zone = (hue < 60 || hue >= 300) ? 'warm' : (hue >= 120 && hue < 240) ? 'cold' : 'neutral';
      const value = 30 + Math.round(Math.random() * 20); // 30-50 coins
      out.push({id:`c-${String(idx+1).padStart(4,'0')}`, hex, name, rarity:'common', value, prob:0, zone});
    }

    // Now assign probabilities: ensure epic and rare probs as requested
    // black/white -> 0.00005 each (0.005%), red/green/blue -> 0.0001 each (0.01%)
    out.find(c=>c.hex==='#000000').prob = 0.00005;
    out.find(c=>c.hex==='#FFFFFF').prob = 0.00005;
    out.find(c=>c.hex==='#FF0000').prob = 0.0001;
    out.find(c=>c.hex==='#00FF00').prob = 0.0001;
    out.find(c=>c.hex==='#0000FF').prob = 0.0001;

    // Choose combined probabilities for grays and commons (grays relatively common)
    const epicRareTotal = out.filter(c => c.prob && c.prob>0).reduce((s,c)=>s+c.prob,0);
    const graysTotalProb = 0.60;
    const commonsTotalProb = Math.max(0, 1 - epicRareTotal - graysTotalProb);

    // collect grays and commons
    const grays = out.filter(c=>c.rarity==='common_gray');
    const commons = out.filter(c=>c.rarity==='common');

    // distribute grays probability proportional to their value (darker smaller value -> smaller prob?)
    // Here we simply distribute equally among grays but adjust by lightness: lighter grays more common.
    const lightnessArr = grays.map(c=>{
      // compute lightness from hex quickly
      const r = parseInt(c.hex.substr(1,2),16);
      return r; // since hex grayscale all channels equal
    });
    const lightSum = lightnessArr.reduce((s,v)=>s+v,0);
    grays.forEach((c,i)=>{
      c.prob = graysTotalProb * (lightnessArr[i] / lightSum);
    });

    // distribute commons with a slight randomization so probabilities are not perfectly uniform
    if(commons.length>0){
      // create random weights around 1.0 (±15%) and normalize
      const weights = commons.map(()=>0.85 + Math.random()*0.3); // [0.85,1.15]
      const sumW = weights.reduce((s,w)=>s+w,0);
      commons.forEach((c,i)=> c.prob = (weights[i]/sumW) * commonsTotalProb);
    }

    // final: ensure sum ≈1 (floating rounding) by adjusting the first common
    const sumProb = out.reduce((s,c)=>s + (c.prob||0), 0);
    const diff = 1 - sumProb;
    if(Math.abs(diff) > 1e-12){
      // add diff to first common (or epic if none)
      const target = out.find(c=>c.rarity==='common') || out[0];
      target.prob = (target.prob||0) + diff;
    }

    return out;

    // helper: HSL -> HEX
    function hslToHex(h, s, l){
      s/=100; l/=100;
      const k = n=> (n + h/30) % 12;
      const a = s * Math.min(l, 1-l);
      const f = n => {
        const color = l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
        return Math.round(255 * color).toString(16).padStart(2,'0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }
  })(),
  STORAGE_KEYS: {
    USERS: 'cc_users_v1',
    CURRENT: 'cc_current_v1'
  }
}
