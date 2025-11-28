// animation.js
// Module pour l'animation "casino spinner" qui retourne une couleur finale

import { CONFIG } from './config.js';

// shared audio context for short blips
const audioCtx = (function(){
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null }
})();

/**
 * Play a short blip tone. Frequency chosen by index or hue.
 */
function blip(freq = 440, time = 0.06){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.value = 0.001;
  o.connect(g); g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + time);
  o.stop(now + time + 0.02);
}

/**
 * Spin the spinner with a faster, more dramatic "casino" effect.
 * Adds rotation and scale jitter and short blip sounds at each swap.
 * Filters colors by unlocked zones if provided.
 */
export function spinSpinner(innerEl, colors = CONFIG.COLORS, duration = CONFIG.SPINNER_DURATION, unlockedZones = null, options = {}){
  return new Promise((resolve)=>{
    // Filter colors by unlocked zones if provided
    let spinColors = colors;
    if (unlockedZones) {
      spinColors = colors.filter(c => !c.zone || unlockedZones.includes(c.zone));
    }
    const start = performance.now();
    let lastSwap = 0;
    const total = Math.max(120, duration); // ensure a minimum

    // animation parameters (more frantic)
    const minInterval = 8;    // very fast swaps early
    const maxInterval = 110;  // slower near end

    // add a fast transient rotation effect on the container
    const container = innerEl.parentElement || innerEl;
    container.style.transition = 'transform 200ms ease';

    function frame(now){
      const t = Math.min(1, (now - start) / total);
      // easeOutCubic for deceleration
      const ease = 1 - Math.pow(1 - t, 3);
      const interval = minInterval + (maxInterval - minInterval) * ease;

      // small rotation/scale jitter that increases then settles
      const rot = (1 - ease) * 720; // rotate up to 720deg early
      const scale = 1 + 0.06 * (1 - ease);
      container.style.transform = `rotate(${rot}deg) scale(${scale})`;

      if(now - lastSwap >= interval){
        lastSwap = now;
        // pick random color for the flash (from filtered list)
        const idx = Math.floor(Math.random()*spinColors.length);
        const c = spinColors[idx];
        innerEl.style.background = c.hex;
        innerEl.style.boxShadow = `0 12px 40px ${c.hex}55`;
        // sound frequency from hue (approx)
        // estimate hue from hex quickly (simple parse) -> sum RGB
        try{
          const r = parseInt(c.hex.substr(1,2),16);
          const g = parseInt(c.hex.substr(3,2),16);
          const b = parseInt(c.hex.substr(5,2),16);
          const freq = 220 + ((r+g+b)/3) * 0.6;
          blip(freq, 0.06);
        }catch(e){ blip(440,0.06) }
      }

      if(t < 1){
        requestAnimationFrame(frame);
      } else {
        // final selection: pick by explicit probabilities if provided (from filtered list)
        const final = pickByProbability(spinColors, options.megaBoost || 0);
        innerEl.style.background = final.hex;
        innerEl.style.boxShadow = `0 30px 80px ${final.hex}88`;
        container.style.transition = 'transform 600ms cubic-bezier(.2,.9,.3,1)';
        container.style.transform = 'rotate(0deg) scale(1)';
        // final tone
        try{ blip(360, 0.28); }catch(e){}
        innerEl.style.transition = 'box-shadow 500ms ease, background 300ms ease';
        setTimeout(()=>resolve(final), 320);
      }
    }

    requestAnimationFrame(frame);
  })
}

/** pick a color with simple rarity weights */
function pickByProbability(colors, megaBoost = 0){
  // If colors have explicit .prob fields that sum to >0, use them with optional megaBoost
  const probs = colors.map(c => (typeof c.prob === 'number') ? c.prob : 0);
  let total = probs.reduce((s,p)=>s+p,0);
  if(total > 0.000001){
    // apply megaBoost to rarer colors (rare/epic)
    if(megaBoost > 0){
      for(let i=0;i<colors.length;i++){
        if(colors[i].rarity === 'rare' || colors[i].rarity === 'epic'){
          probs[i] = probs[i] * (1 + megaBoost);
        }
      }
      total = probs.reduce((s,p)=>s+p,0);
    }
    let r = Math.random()*total;
    for(let i=0;i<colors.length;i++){
      r -= probs[i];
      if(r <= 0) return colors[i];
    }
    return colors[colors.length-1];
  }
  // fallback uniform
  return colors[Math.floor(Math.random()*colors.length)];
}

export function createBurst(parentEl, color){
  for(let i=0;i<14;i++){
    const p = document.createElement('div');
    p.style.position='absolute';p.style.width='8px';p.style.height='8px';p.style.borderRadius='50%';
    p.style.background = color.hex; p.style.left='50%';p.style.top='50%'; p.style.transform='translate(-50%,-50%)';
    p.style.opacity='0.95'; p.style.pointerEvents='none';
    parentEl.appendChild(p);
    const angle = (Math.PI*2)*(i/14);
    const vx = Math.cos(angle)*(30+Math.random()*60);
    const vy = Math.sin(angle)*(30+Math.random()*60);
    p.animate([
      {transform:'translate(-50%,-50%)',opacity:1},
      {transform:`translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px))`, opacity:0}
    ],{duration:500+Math.random()*300,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish = ()=>p.remove();
  }
}
