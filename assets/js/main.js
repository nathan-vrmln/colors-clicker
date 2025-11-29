// main.js
// Point d'entrée: assemble animation, user system et UI

import { CONFIG } from './config.js';
import { initUserSystem, createAccount, login, getCurrentUser, addColorToUser, addCoins, getCurrentMultiplier, cleanupBoosters, resetAccount, setPFP, getCollection, getAttackNotifications, checkAutoUnlockZones } from './userSystem.js';
import { spinSpinner, createBurst } from './animation.js';
import { updateHUD, updateCoinsDisplay, updateBoosterBadge, togglePanel, setupPanelTabs, renderCollection, renderShop, updatePFPDisplay, renderRanking, renderRankingInto } from './ui.js';
import { isZoneUnlocked } from './userSystem.js';


// initialisation
initUserSystem();

// --- Cercles dorés bonus (Gold Orbs) ---
const goldOrbContainer = document.createElement('div');
goldOrbContainer.id = 'goldOrbContainer';
goldOrbContainer.style.position = 'fixed';
goldOrbContainer.style.inset = '0';
goldOrbContainer.style.pointerEvents = 'none';
goldOrbContainer.style.zIndex = '30';
document.body.appendChild(goldOrbContainer);

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function spawnGoldOrbs(count = 1) {
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'gold-orb';
    orb.style.position = 'absolute';
    orb.style.width = orb.style.height = randomBetween(32, 48) + 'px';
    orb.style.borderRadius = '50%';
    orb.style.background = 'radial-gradient(circle at 30% 30%, #ffe066 70%, #ffd700 100%)';
    orb.style.boxShadow = '0 0 18px 6px #ffd70088, 0 0 60px 0 #fffbe6';
    orb.style.left = randomBetween(5, 90) + '%';
    orb.style.top = randomBetween(20, 75) + '%';
    orb.style.cursor = 'pointer';
    orb.style.pointerEvents = 'auto';
    orb.style.transition = 'opacity 0.4s';
    orb.style.opacity = '1';
    // Optionally, add a little movement
    if (Math.random() < 0.5) {
      const dx = randomBetween(-10, 10);
      const dy = randomBetween(-10, 10);
      orb.animate([
        { transform: 'translate(0,0)' },
        { transform: `translate(${dx}px,${dy}px)` },
        { transform: 'translate(0,0)' }
      ], { duration: randomBetween(3000, 6000), iterations: Infinity });
    }
    // Disparition auto
    const lifetime = randomBetween(5000, 10000);
    const timeout = setTimeout(() => {
      orb.style.opacity = '0';
      setTimeout(() => orb.remove(), 400);
    }, lifetime);
    // Clic = gain coins
    orb.addEventListener('click', (e) => {
      e.stopPropagation();
      if (orb.dataset.collected) return;
      orb.dataset.collected = '1';
      orb.remove(); // disparition instantanée
      clearTimeout(timeout);
      // Son fun pour le clic
      try{ playGoldOrbSound(); }catch(err){}
      // Gain 100-200 coins
      const gain = Math.floor(randomBetween(100, 201));
      addCoins(gain);
      updateHUD(); updateCoinsDisplay();
      showCoinsFloat(gain, orb);
    });
    goldOrbContainer.appendChild(orb);
  }
}

// Affichage seulement si aucun menu/panneau ouvert
function canShowGoldOrbs() {
  const side = document.getElementById('sidePanel');
  return !(side && side.classList.contains('open'));
}

// Boucle d'apparition
setInterval(() => {
  if (!canShowGoldOrbs()) return;
  const r = Math.random();
  if (r < 0.01) spawnGoldOrbs(25);
  else if (r < 0.06) spawnGoldOrbs(5);
  else if (r < 0.16) spawnGoldOrbs(3);
  else if (r < 0.36) spawnGoldOrbs(1);
}, 10000);

// Nettoyage si menu ouvert
document.getElementById('sidePanel').addEventListener('transitionstart', () => {
  setTimeout(() => {
    if (!canShowGoldOrbs()) {
      goldOrbContainer.innerHTML = '';
    }
  }, 400);
});

const modal = document.getElementById('modal');
const loginBtn = document.getElementById('loginBtn');
const createBtn = document.getElementById('createBtn');
const loginUserInput = document.getElementById('loginUser');
const loginPasswordInput = document.getElementById('loginPassword');
const createUserInput = document.getElementById('createUser');
const createPasswordInput = document.getElementById('createPassword');
const hamburger = document.getElementById('hamburger');

const spinnerInner = document.getElementById('spinnerInner');
const spinner = document.getElementById('spinner');

// Check for attack notifications
function checkAttackNotifications() {
  const attacks = getAttackNotifications();
  attacks.forEach(attack => {
    const color = CONFIG.COLORS.find(c => c.id === attack.colorId);
    const colorName = color ? color.name : attack.colorId;
    showAttackNotification(`⚔️ ${attack.from} a détruit votre "${colorName}" !`);
  });
}

// Attack notification queue
let attackNotificationQueue = [];
let isShowingAttackNotification = false;

// Show attack notification with queue management
function showAttackNotification(message) {
  attackNotificationQueue.push(message);
  if (!isShowingAttackNotification) {
    processAttackNotificationQueue();
  }
}

function processAttackNotificationQueue() {
  if (attackNotificationQueue.length === 0) {
    isShowingAttackNotification = false;
    return;
  }
  
  isShowingAttackNotification = true;
  const message = attackNotificationQueue.shift();
  
  // Play scary sound
  playAttackSound();
  
  const notification = document.createElement('div');
  Object.assign(notification.style, {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #ff4444, #cc0000)',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 8px 24px rgba(255,68,68,0.5)',
    zIndex: '1000',
    opacity: '0',
    transition: 'all 0.5s ease-out'
  });
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Fade in
  setTimeout(() => notification.style.opacity = '1', 10);
  
  // After 2.5s: dissolve and move up
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.top = '30px';
    setTimeout(() => {
      notification.remove();
      // Process next notification
      processAttackNotificationQueue();
    }, 500);
  }, 2500);
}

// Vérifier si utilisateur connecté
function ensureAuth(){
  const u = getCurrentUser();
  if(!u){modal.classList.remove('hidden');} else {modal.classList.add('hidden'); updateAfterLogin()}
}

function updateAfterLogin(){
  updateHUD(); 
  updateCoinsDisplay(); 
  updateBoosterBadge();
  updatePFPDisplay();
  setupPanelTabs();
  checkAttackNotifications();
}

// handlers de connexion / création
loginBtn.addEventListener('click', async ()=>{
  try{ 
    await login(loginUserInput.value.trim(), loginPasswordInput.value); 
    modal.classList.add('hidden'); 
    updateAfterLogin(); 
  }
  catch(e){alert(e.message)}
});

createBtn.addEventListener('click', async ()=>{
  try{ 
    await createAccount(createUserInput.value.trim(), createPasswordInput.value); 
    modal.classList.add('hidden'); 
    updateAfterLogin(); 
  }
  catch(e){alert(e.message)}
});

// hamburger - toggle panel, don't re-render unless necessary
hamburger.addEventListener('click', ()=>{
  const sidePanel = document.getElementById('sidePanel');
  const isOpen = sidePanel.classList.contains('open');
  if (!isOpen) {
    // Opening: set to collection tab
    document.querySelectorAll('.panel-tabs .tab').forEach(t=>t.classList.remove('active'));
    document.querySelector('[data-tab="collection"]').classList.add('active');
    // ensure panel is full and always refresh collection on open so it reflects current user state
    sidePanel.classList.add('full');
    try{ renderCollection(true); }catch(e){ console.error('renderCollection error', e); }
  }
  togglePanel(!isOpen);
});
document.getElementById('sidePanel').addEventListener('click', (e)=>{ if(e.target === e.currentTarget) togglePanel(false); });

// reset account button
const resetIcon = document.getElementById('resetIcon');
if(resetIcon){
  resetIcon.addEventListener('click', ()=>{
    if(confirm('Êtes-vous sûr de vouloir réinitialiser votre compte ? Vos pièces, couleurs et boosters seront perdus.')){
      resetAccount();
      location.reload();
    }
  });
}

// ranking icon in header - opens separate overlay
const rankingIcon = document.getElementById('rankingIcon');
if(rankingIcon){
  rankingIcon.addEventListener('click', async ()=>{
    const overlay = document.getElementById('rankingOverlay');
    const container = document.getElementById('rankingContainer');
    overlay.classList.remove('hidden');
    // Render ranking in the container
    container.innerHTML = '';
    const heading = document.createElement('h3'); 
    heading.textContent='Classement'; 
    heading.style.marginBottom = '20px';
    heading.style.fontSize = '28px';
    container.appendChild(heading);
    await renderRankingInto(container);
  });
}

// Close ranking overlay
document.getElementById('closeRanking')?.addEventListener('click', ()=>{
  document.getElementById('rankingOverlay').classList.add('hidden');
});

// Close ranking on overlay click
document.getElementById('rankingOverlay')?.addEventListener('click', (e)=>{
  if(e.target.id === 'rankingOverlay') e.target.classList.add('hidden');
});

// Logout
document.getElementById('logoutIcon')?.addEventListener('click', ()=>{ 
  localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT); 
  location.reload(); 
});

// close shop when clicking outside the panel
document.addEventListener('click', (e)=>{
  const side = document.getElementById('sidePanel');
  if(!side) return;
  const isOpen = side.classList.contains('open');
  if(!isOpen) return;
  // if click target is outside sidePanel and not on hamburger, close
  const target = e.target;
  if(!side.contains(target) && !hamburger.contains(target)){
    togglePanel(false);
  }
});

// Clicker logic: click directly on the spinner square
let spinning = false;
let megaSpinning = false;
spinner.addEventListener('click', async ()=>{
  if(spinning || megaSpinning) return;
  spinning = true;
  spinner.classList.add('sparkle');
  // Get unlocked zones for this user
  const user = getCurrentUser();
  const unlockedZones = user?.unlockedZones || ['grays'];
  const final = await spinSpinner(spinnerInner, CONFIG.COLORS, CONFIG.SPINNER_DURATION, unlockedZones);
  spinner.classList.remove('sparkle');
  // add to user
  const added = addColorToUser(final);
  // Check for auto-unlock zones
  const unlockedZone = checkAutoUnlockZones();
  if (unlockedZone) {
    const zoneNames = {warm: 'COULEURS CHAUDES 🔥\nDÉBLOQUÉE!', cold: 'COULEURS FROIDES ❄️\nDÉBLOQUÉE!'};
    playZoneUnlockAnimation(zoneNames[unlockedZone] || `${unlockedZone.toUpperCase()}\nDÉBLOQUÉE!`);
  }
  // add coins (with booster + collection bonus)
  const multiplier = getCurrentMultiplier();
  const collectionBonus = 1 + (getCollection().length * 0.1); // +10% par couleur
  const base = final.value || CONFIG.COIN_PER_COLOR;
  const gained = Math.round(base * multiplier * collectionBonus);
  addCoins(gained);
  updateHUD(); 
  updateCoinsDisplay(); 
  updateBoosterBadge();

  // Show last color + coins gained
  document.getElementById('lastColorValue').textContent = final.name;
  showColorDetails(final);
  showCoinsFloat(gained);

  // New color animations
  if(added){
    playWinSound();
    playWildAnimation(spinner, final);
    showBigRarityText('NEW COLOR', final.hex);
    if(final.rarity === 'epic') showBigRarityText('EPIQUE', '#FFD700');
    else if(final.rarity === 'rare') showBigRarityText('RARE', '#FF6B6B');
  } else {
    playTone(final.hex);
  }

  // Refresh collection if open
  const side = document.getElementById('sidePanel');
  const active = document.querySelector('.panel-tabs .tab.active');
  if(side?.classList.contains('open') && active?.dataset.tab === 'collection'){
    renderCollection(side.classList.contains('full'));
  }

  spinning = false;
});

// Mega Spin: special action that locks UI, spins visually, then gives boosted probability + coin bonus
const megaBtn = document.getElementById('megaSpinBtn');
if(megaBtn){
  megaBtn.addEventListener('click', async ()=>{
    if(megaSpinning || spinning) return;
    const side = document.getElementById('sidePanel');
    megaSpinning = true;
    // block UI with overlay and countdown
    const blocker = document.createElement('div'); blocker.className = 'global-blocker';
    const countdown = document.createElement('div'); countdown.id = 'megaCountdown'; countdown.textContent = '5';
    blocker.appendChild(countdown);
    document.body.appendChild(blocker);
    megaBtn.disabled = true; hamburger.disabled = true;

    // play special mega sound
    try{ playMegaSound(); }catch(e){}

    const container = spinnerInner.parentElement || spinnerInner;
    // fast clockwise rotations for 5s (no reverse)
    const cw = container.animate([
      {transform: 'rotate(0deg)'},
      {transform: 'rotate(3600deg)'}
    ], {duration:5000, easing:'cubic-bezier(.2,.8,.2,1)'});

    // countdown visible
    let remaining = 5;
    const interval = setInterval(()=>{
      remaining--;
      if(remaining >= 0) countdown.textContent = String(remaining);
    }, 1000);

    await new Promise(r => setTimeout(r, 5000));
    clearInterval(interval);

    // Perform boosted spin
    spinner.classList.add('sparkle');
    const user = getCurrentUser();
    const unlockedZones = user?.unlockedZones || ['grays'];
    const final = await spinSpinner(spinnerInner, CONFIG.COLORS, CONFIG.SPINNER_DURATION, unlockedZones, {megaBoost:0.2});
    spinner.classList.remove('sparkle');

    // Award result with +30% coin bonus
    const added = addColorToUser(final);
    // Check for auto-unlock zones
    const unlockedZone = checkAutoUnlockZones();
    if (unlockedZone) {
      const zoneNames = {warm: 'COULEURS CHAUDES 🔥\nDÉBLOQUÉE!', cold: 'COULEURS FROIDES ❄️\nDÉBLOQUÉE!'};
      playZoneUnlockAnimation(zoneNames[unlockedZone] || `${unlockedZone.toUpperCase()}\nDÉBLOQUÉE!`);
    }
    const multiplier = getCurrentMultiplier();
    const collectionBonus = 1 + (getCollection().length * 0.1);
    const base = final.value || CONFIG.COIN_PER_COLOR;
    const gained = Math.round(base * multiplier * collectionBonus * 1.3);
    addCoins(gained);
    updateHUD(); 
    updateCoinsDisplay(); 
    updateBoosterBadge();
    document.getElementById('lastColorValue').textContent = final.name;
    showColorDetails(final);
    showCoinsFloat(gained);
    playWinSound();
    playWildAnimation(spinner, final);
    
    if(added){
      showBigRarityText('NEW COLOR', final.hex);
      if(final.rarity === 'epic') showBigRarityText('EPIQUE', '#FFD700');
      else if(final.rarity === 'rare') showBigRarityText('RARE', '#FF6B6B');
    }

    // Cleanup
    blocker.remove(); 
    megaBtn.disabled = false; 
    hamburger.disabled = false; 
    megaSpinning = false;

    // Refresh collection if open
    const active = document.querySelector('.panel-tabs .tab.active');
    if(side?.classList.contains('open') && active?.dataset.tab === 'collection'){
      renderCollection(side.classList.contains('full'));
    }
  });
}

// Audio functions
function hexToFrequency(hex) {
  const r = parseInt(hex.substr(1,2), 16);
  const g = parseInt(hex.substr(3,2), 16);
  const b = parseInt(hex.substr(5,2), 16);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return 100 + brightness * 700;
}

window.playToneForColor = (hex) => playTone(hex);

function playTone(hex = null){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = hex ? hexToFrequency(hex) : 220 + Math.random() * 400;
  g.gain.value = 0.001;
  o.connect(g); 
  g.connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  o.stop(ctx.currentTime + 0.65);
}

function playWinSound(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  freqs.forEach((freq, i)=>{
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; 
    o.frequency.value = freq;
    g.gain.value = 0.001;
    o.connect(g); 
    g.connect(ctx.destination);
    const start = ctx.currentTime + i*0.08;
    o.start(start); 
    o.stop(start + 0.5);
    g.gain.exponentialRampToValueAtTime(0.1, start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
  });
}

// special mega spin sound: short rising whoosh + thump
function playMegaSound(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 80;
    o.connect(g); g.connect(ctx.destination);
    g.gain.value = 0.0005;
    const now = ctx.currentTime;
    o.start(now);
    o.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    o.stop(now + 1.05);
  }catch(e){}
}
function playGoldOrbSound(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 1200;
  o.connect(g); 
  g.connect(ctx.destination);
  g.gain.value = 0.001;
  const now = ctx.currentTime;
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  o.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  o.stop(now + 0.2);
}

// Scary attack sound - deep and ominous
function playAttackSound(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 55; // Deep bass note (A1)
    o.connect(g); 
    g.connect(ctx.destination);
    g.gain.value = 0.001;
    const now = ctx.currentTime;
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.1);
    o.frequency.exponentialRampToValueAtTime(40, now + 0.6); // Descend to even lower
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    o.stop(now + 0.85);
  }catch(e){}
}

// INSANE zone unlock animation - even crazier than new color!
function playZoneUnlockAnimation(text){
  const body = document.body;
  const origBg = body.style.background;
  
  // MULTI-COLOR EXPLOSIVE FLASHES
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00'];
  let flashCount = 0;
  const flashInterval = setInterval(() => {
    body.style.background = colors[flashCount % colors.length];
    flashCount++;
    if (flashCount >= 12) {
      clearInterval(flashInterval);
      body.style.transition = 'background 1s ease-out';
      body.style.background = origBg;
    }
  }, 100);
  
  // MASSIVE PARTICLE EXPLOSION - 200 particles!
  for(let i=0; i<200; i++){
    setTimeout(() => {
      const spark = document.createElement('div');
      spark.style.position = 'fixed';
      spark.style.pointerEvents = 'none';
      spark.style.left = '50%';
      spark.style.top = '50%';
      spark.style.width = (8 + Math.random()*12) + 'px';
      spark.style.height = spark.style.width;
      spark.style.borderRadius = '50%';
      spark.style.background = colors[Math.floor(Math.random()*colors.length)];
      spark.style.boxShadow = `0 0 40px ${spark.style.background}`;
      spark.style.zIndex = '9999';
      document.body.appendChild(spark);
      
      const angle = (Math.PI*2)*(i/200) + (Math.random()-0.5)*1.2;
      const distance = 300 + Math.random()*500;
      const vx = Math.cos(angle)*distance;
      const vy = Math.sin(angle)*distance;
      const rotation = Math.random()*1440;
      
      spark.animate([
        {transform:`translate(-50%, -50%) scale(2) rotate(0deg)`, opacity:1},
        {transform:`translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px)) scale(0) rotate(${rotation}deg)`, opacity:0}
      ],{duration:800+Math.random()*600, easing:'cubic-bezier(.17,.89,.32,1.27)'}).onfinish = ()=>spark.remove();
    }, i * 3); // Stagger particles
  }
  
  // GIANT ANIMATED TEXT with crazy effects
  const bigText = document.createElement('div');
  bigText.style.position = 'fixed';
  bigText.style.top = '50%';
  bigText.style.left = '50%';
  bigText.style.transform = 'translate(-50%, -50%)';
  bigText.style.fontSize = '50px';
  bigText.style.fontWeight = '900';
  bigText.style.color = '#FFD700';
  bigText.style.textShadow = `0 0 60px #FFD700, 0 0 120px #FFD700, 0 0 180px #FFD700`;
  bigText.style.opacity = '0';
  bigText.style.pointerEvents = 'none';
  bigText.style.zIndex = '10000';
  bigText.style.letterSpacing = '6px';
  bigText.style.whiteSpace = 'pre-line';
  bigText.style.textAlign = 'center';
  bigText.style.textTransform = 'uppercase';
  bigText.style.lineHeight = '1.2';
  bigText.textContent = text;
  document.body.appendChild(bigText);
  
  // Crazy animation: spin, scale, pulse
  bigText.animate([
    {opacity: 0, transform: 'translate(-50%, -50%) scale(0) rotate(-180deg)'},
    {opacity: 1, transform: 'translate(-50%, -50%) scale(1.5) rotate(0deg)', offset: 0.2},
    {opacity: 1, transform: 'translate(-50%, -50%) scale(1.2) rotate(5deg)', offset: 0.4},
    {opacity: 1, transform: 'translate(-50%, -50%) scale(1.4) rotate(-5deg)', offset: 0.6},
    {opacity: 1, transform: 'translate(-50%, -50%) scale(1.3) rotate(0deg)', offset: 0.8},
    {opacity: 0, transform: 'translate(-50%, -50%) scale(0) rotate(180deg)'}
  ], {
    duration: 4000,
    easing: 'cubic-bezier(.2,.8,.2,1)'
  }).onfinish = () => bigText.remove();
  
  // Play epic sound
  try{ playZoneUnlockSound(); }catch(e){}
}

// Epic zone unlock sound - CRAZY VERSION!
function playZoneUnlockSound(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Multiple crazy ascending and descending patterns
    const melodyNotes = [
      261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5 - rising
      587.33, 698.46, 783.99, 880.00, // D5, F5, G5, A5 - continue rising
      1046.50, 880.00, 698.46, 523.25 // C6, A5, F5, C5 - descending finale
    ];
    
    melodyNotes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i % 3 === 0 ? 'square' : (i % 3 === 1 ? 'sawtooth' : 'sine'); // Vary waveforms
      o.frequency.value = freq;
      g.gain.value = 0.001;
      o.connect(g); 
      g.connect(ctx.destination);
      const start = ctx.currentTime + i*0.08; // Faster rhythm
      o.start(start);
      g.gain.exponentialRampToValueAtTime(0.12, start + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      o.stop(start + 0.3);
    });
    
    // Add bass pulse for power
    for(let i=0; i<8; i++){
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.value = 65.41; // C2 - deep bass
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      const start = ctx.currentTime + i*0.3;
      bass.start(start);
      bassGain.gain.value = 0.001;
      bassGain.gain.exponentialRampToValueAtTime(0.2, start + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      bass.stop(start + 0.3);
    }
  }catch(e){}
}

// Display functions
function showColorDetails(color){
  let details = document.getElementById('colorDetails');
  if(!details){
    details = document.createElement('div');
    details.id = 'colorDetails';
    details.style.position = 'fixed';
    details.style.bottom = '20px';
    details.style.left = '50%';
    details.style.transform = 'translateX(-50%)';
    details.style.textAlign = 'center';
    details.style.color = 'var(--muted)';
    details.style.fontSize = '13px';
    details.style.zIndex = '5';
    document.body.appendChild(details);
  }
  const prob = (color.prob||0)*100;
  details.innerHTML = `<div style="font-size:11px;margin-bottom:2px">${color.hex} (${prob.toFixed(2)}%)</div>`;
}

// Show coins float animation ('+X coins' in orange)
function showCoinsFloat(amount){
  const coinsHud = document.querySelector('.coins');
  if(!coinsHud) return;
  const rect = coinsHud.getBoundingClientRect();
  // Compenser le scale de 1.75 appliqué au body
  const scale = 1.75;
  const float = document.createElement('div');
  float.className = 'coins-float';
  float.textContent = `+${amount}`;
  float.style.left = (rect.left / scale + rect.width / scale / 2) + 'px';
  float.style.top = (rect.top / scale + rect.height / scale / 2) + 'px';
  document.body.appendChild(float);
  float.animate([
    {transform:'translate(-50%, -50%) scale(1)', opacity:1},
    {transform:'translate(-50%, -100px) scale(1.2)', opacity:0}
  ],{duration:1200, easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish = ()=>float.remove();
}

// Show big rarity text in background (EPIQUE or RARE)
function showBigRarityText(text, color){
  const bigText = document.createElement('div');
  bigText.style.position = 'fixed';
  bigText.style.top = '50%';
  bigText.style.left = '50%';
  bigText.style.transform = 'translate(-50%, -50%)';
  bigText.style.fontSize = '120px';
  bigText.style.fontWeight = '900';
  bigText.style.color = color;
  bigText.style.textShadow = `0 0 40px ${color}, 0 0 80px ${color}`;
  bigText.style.opacity = '0';
  bigText.style.pointerEvents = 'none';
  bigText.style.zIndex = '10';
  bigText.style.letterSpacing = '8px';
  bigText.style.whiteSpace = 'nowrap';
  bigText.textContent = text;
  document.body.appendChild(bigText);
  
  // Animation: fade in, scale, then fade out
  bigText.animate([
    {opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)'},
    {opacity: 0.9, transform: 'translate(-50%, -50%) scale(1.2)', offset: 0.3},
    {opacity: 0.9, transform: 'translate(-50%, -50%) scale(1)', offset: 0.7},
    {opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)'}
  ], {
    duration: 2500,
    easing: 'cubic-bezier(.2,.8,.2,1)'
  }).onfinish = () => bigText.remove();
}

// DELETED: Old notification function not needed - using new wild animation instead

// INSANELY WILD animation on new color unlock - MAX JIGGLE!
function playWildAnimation(container, color){
  const body = document.body;
  const origBg = body.style.background;
  
  // EXPLOSIVE FLASH: Background explodes with color
  body.style.background = color.hex;
  body.style.transition = 'background 0.1s ease-out';
  setTimeout(() => {
    body.style.transition = 'background 0.8s cubic-bezier(.2,.8,.2,1)';
    body.style.background = origBg;
  }, 100);
  
  // EXTREME PARTICLE BURST - 60 particles, insane spread + rotation
  for(let i=0; i<60; i++){
    const spark = document.createElement('div');
    spark.style.position = 'fixed';
    spark.style.pointerEvents = 'none';
    const rect = container.getBoundingClientRect();
    // Compensate for 1.75 scale
    spark.style.left = (rect.left + rect.width/2) / 1.75 + 'px';
    spark.style.top = (rect.top + rect.height/2) / 1.75 + 'px';
    spark.style.width = '10px';
    spark.style.height = '10px';
    spark.style.borderRadius = '50%';
    spark.style.background = i%2===0 ? color.hex : (CONFIG.COLORS[Math.floor(Math.random()*CONFIG.COLORS.length)].hex);
    spark.style.boxShadow = `0 0 30px ${spark.style.background}`;
    document.body.appendChild(spark);
    
    const angle = (Math.PI*2)*(i/60) + (Math.random()-0.5)*0.6;
    const distance = 180 + Math.random()*250;
    const vx = Math.cos(angle)*distance;
    const vy = Math.sin(angle)*distance;
    const rotation = Math.random()*720;
    
    spark.animate([
      {transform:`scale(1.8) translate(0,0) rotate(0deg)`, opacity:1},
      {transform:`scale(0) translate(${vx}px, ${vy}px) rotate(${rotation}deg)`, opacity:0}
    ],{duration:500+Math.random()*400, easing:'cubic-bezier(.17,.89,.32,1.27)'}).onfinish = ()=>spark.remove();
  }
  
  // Spinner container EXTREME JIGGLE (rapid shaking)
  container.style.animation = 'none';
  container.parentElement.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = 'extremeJiggle 0.5s ease-in-out';
  }, 10);
}

// PFP circle click - open modal to select from collection
const pfpCircle = document.getElementById('pfpCircle');
if(pfpCircle){
  pfpCircle.addEventListener('click', ()=>{
    const collection = getCollection();
    if(collection.length === 0){
      alert('Vous n\'avez pas encore de couleur débloquée.');
      return;
    }
    showPFPSelector(collection);
  });
}

function showPFPSelector(collectionIds){
  const modal = document.createElement('div');
  modal.style.position = 'fixed'; modal.style.inset = '0'; modal.style.background = 'rgba(0,0,0,0.8)';
  modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
  modal.style.zIndex = '1200'; modal.style.padding = '20px';
  
  const inner = document.createElement('div');
  inner.style.background = '#0c0c0c'; inner.style.borderRadius = '10px'; inner.style.padding = '14px';
  inner.style.maxWidth = '360px'; inner.style.width = '100%'; inner.style.maxHeight = '60vh'; inner.style.overflow = 'auto';
  
  const title = document.createElement('h3'); title.textContent = 'Choisir votre PDP'; title.style.marginTop = '0'; title.style.fontSize = '14px'; title.style.marginBottom = '10px';
  inner.appendChild(title);
  
  const grid = document.createElement('div');
  grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(auto-fill, 38px)'; grid.style.gap = '8px';
  
  collectionIds.forEach(cid => {
    const c = CONFIG.COLORS.find(x=>x.id===cid);
    if(!c) return;
    const circle = document.createElement('div');
    circle.style.width = '38px'; circle.style.height = '38px'; circle.style.borderRadius = '50%';
    circle.style.background = c.hex; circle.style.cursor = 'pointer'; circle.style.border = '2px solid transparent';
    circle.style.transition = 'all 0.2s'; circle.title = c.name;
    circle.addEventListener('mouseenter', ()=>circle.style.borderColor = '#fff');
    circle.addEventListener('mouseleave', ()=>circle.style.borderColor = 'transparent');
    circle.addEventListener('click', ()=>{
      setPFP(c.hex);
      updatePFPDisplay();
      modal.remove();
    });
    grid.appendChild(circle);
  });
  
  inner.appendChild(grid);
  modal.appendChild(inner);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// refresh booster timers every second
setInterval(updateBoosterBadge, 1000);

// Keyboard shortcuts
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const side = document.getElementById('sidePanel');
    if(side?.classList.contains('open')) togglePanel(false);
  }
  
  // Admin shortcuts - only for user "nathan" or "natha"
  const user = getCurrentUser();
  if(!user) return; // Not logged in
  
  // Get username from userSystem
  import('./userSystem.js').then(module => {
    // Can't access current directly, need to check through a different way
  });
  
  // Check through localStorage
  const currentData = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT);
  if(!currentData) return;
  
  const currentUser = JSON.parse(currentData);
  const username = currentUser?.username?.toLowerCase();
  const isNathan = username === 'nathan' || username === 'natha';
  
  if(!isNathan) return; // Block shortcuts for non-nathan users
  
  if(e.key === 'p' || e.key === 'P'){
    addCoins(10000);
    updateCoinsDisplay();
    showCoinsFloat(10000);
  }
  if(e.key === 'm' || e.key === 'M'){
    if(!user) return;
    // Débloquer toutes les couleurs
    CONFIG.COLORS.forEach(color => {
      if(!user.collection.includes(color.id)){
        user.collection.push(color.id);
      }
    });
    // Sauvegarder
    import('./userSystem.js').then(module => {
      if(module.getCurrentUser()){
        const username = Object.keys(module.getCurrentUser())[0];
        // Force save
        setupPanelTabs(); // Refresh UI
      }
    });
    alert('Toutes les couleurs débloquées !');
    setupPanelTabs();
  }
  if(e.key === 'i' || e.key === 'I'){
    // Test attack notification
    showAttackNotification('⚔️ TestAttacker a détruit votre "Couleur Test" !');
  }
  if(e.key === 'k' || e.key === 'K'){
    // Test zone unlock animation
    playZoneUnlockAnimation('COULEURS CHAUDES 🔥\nDÉBLOQUÉE!');
  }
});

// Check for attacks periodically
setInterval(checkAttackNotifications, 10000);

// Ensure auth on load
ensureAuth();
