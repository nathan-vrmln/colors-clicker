// ui.js
// Rendu des différents panneaux: collection, boutique, personnalisation, HUD

import { CONFIG } from './config.js';
import { getCollection, getCurrentUser, buyBooster, getCurrentMultiplier, cleanupBoosters, getZoneUnlockCost, isZoneUnlocked, unlockZone, setPFP, getPFP, getAllUsers, attackPlayer, calculateAttackCost, buyAttackCoin } from './userSystem.js';

/** Met à jour l'affichage des pièces dans la barre supérieure */
export function updateCoinsDisplay(){
  const el = document.getElementById('coins');
  const u = getCurrentUser();
  el.textContent = u? (u.coins||0) : '0';
  
  // Afficher attackCoins
  const attackCoinsEl = document.getElementById('attackCoins');
  if(attackCoinsEl) {
    attackCoinsEl.textContent = u? (u.attackCoins||0) : '0';
  }
  
  const nameEl = document.getElementById('usernameDisplay');
  if(nameEl){
    let uname = 'Invité';
    try{ const curRaw = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT); const cur = curRaw? JSON.parse(curRaw): null; if(cur && cur.username) uname = cur.username; }
    catch(e){}
    nameEl.textContent = u? (uname) : 'Invité';
  }
}

/** Affiche badge booster actif et temps restant */
export function updateBoosterBadge(){
  const el = document.getElementById('boosterBadge');
  const u = getCurrentUser(); if(!u){el.textContent='';return}
  cleanupBoosters();
  if(u.boosters && u.boosters.length){
    const next = u.boosters[0];
    const remain = Math.max(0, Math.round((next.expiresAt - Date.now())/1000));
    el.textContent = `x${next.multiplier} (${remain}s)`;
  } else el.textContent='';
}

/** Rendre la collection dans le panneau */
export function renderCollection(fullscreen = false){
  const tab = document.getElementById('tabContent');
  tab.innerHTML = '';
  
  // header with title and close button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '12px';
  const heading = document.createElement('h3'); 
  const collectionCount = getCollection().length;
  const bonusPercent = collectionCount * 10;
  heading.innerHTML = `Collection <span style="font-size:12px;color:#7dd3fc;font-weight:400">(bonus: +${bonusPercent}%)</span>`; 
  heading.style.margin = '0';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.background = 'none';
  closeBtn.style.border = '0';
  closeBtn.style.color = 'var(--muted)';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    // Close the side panel using togglePanel to ensure proper state management
    togglePanel(false);
  });
  header.appendChild(heading);
  header.appendChild(closeBtn);
  tab.appendChild(header);

  // search bar for names
  const searchBar = document.createElement('div'); searchBar.className = 'collection-search';
  const searchInput = document.createElement('input'); searchInput.id = 'collectionSearchInput'; searchInput.placeholder = 'Rechercher par prénom...';
  const searchBtn = document.createElement('button'); searchBtn.id = 'collectionSearchBtn'; searchBtn.textContent = 'Aller';
  searchBar.appendChild(searchInput); searchBar.appendChild(searchBtn);
  tab.appendChild(searchBar);

  // Group colors by rarity: epic, rare, common (including grays)
  const unlocked = getCollection();
  // helper to convert hex to rgb (shared for all sections)
  function hexToRgb(hex){
    const r = parseInt(hex.substr(1,2),16);
    const g = parseInt(hex.substr(3,2),16);
    const b = parseInt(hex.substr(5,2),16);
    return {r,g,b};
  }
  const groups = {epic:[], rare:[], common:[]};
  CONFIG.COLORS.forEach(c=>{
    if(c.rarity === 'epic') groups.epic.push(c);
    else if(c.rarity === 'rare') groups.rare.push(c);
    else groups.common.push(c);
  });
  // sort common (grays + others) by hue for rainbow effect
  groups.common.sort((a,b)=>{
    const hueA = a.hue || hexToHue(a.hex);
    const hueB = b.hue || hexToHue(b.hex);
    return hueA - hueB;
  });

  function hexToHue(hex){
    const r = parseInt(hex.substr(1,2),16);
    const g = parseInt(hex.substr(3,2),16);
    const b = parseInt(hex.substr(5,2),16);
    // simple hue approximation
    const max = Math.max(r,g,b);
    const min = Math.min(r,g,b);
    let h = 0;
    if(max===min) h = 0;
    else if(max===r) h = ((g-b)/(max-min)) % 6;
    else if(max===g) h = ((b-r)/(max-min)) + 2;
    else if(max===b) h = ((r-g)/(max-min)) + 4;
    h = Math.round((h*60 + 360) % 360);
    return h;
  }

  function makeSection(title, items){
    const sec = document.createElement('div');
    const h = document.createElement('h4'); h.textContent = title; sec.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'collection-grid' + (fullscreen? ' fullscreen' : '');
    items.forEach(c=>{
      const tile = document.createElement('div'); tile.className='color-tile';
      tile.dataset.name = (c.name || '').toLowerCase();
      tile.dataset.cid = c.id;
      const inner = document.createElement('div'); inner.className='inner';
      let label = null;
      if(unlocked.includes(c.id)){
          inner.style.background = c.hex;
          inner.style.cursor = 'pointer';
          // overlay info (shown on hover)
          const infoOverlay = document.createElement('div');
          infoOverlay.className = 'color-tile-info';
          infoOverlay.style.position = 'absolute';
          infoOverlay.style.inset = '0';
          infoOverlay.style.background = 'rgba(0,0,0,0.6)';
          infoOverlay.style.display = 'flex';
          infoOverlay.style.flexDirection = 'column';
          infoOverlay.style.alignItems = 'center';
          infoOverlay.style.justifyContent = 'center';
          infoOverlay.style.color = '#fff';
          infoOverlay.style.fontSize = '11px';
          infoOverlay.style.padding = '6px';
          infoOverlay.style.textAlign = 'center';
          infoOverlay.style.opacity = '0';
          infoOverlay.style.transition = 'opacity 0.18s';
          infoOverlay.style.pointerEvents = 'auto';
          infoOverlay.style.zIndex = '2';
          infoOverlay.innerHTML = `
            <div style="font-weight:bold;margin-bottom:2px">${c.name}</div>
            <div>${c.hex}</div>
            <div>${((c.prob||0)*100).toFixed(2)}%</div>
            <div>💰 ${c.value || CONFIG.COIN_PER_COLOR}</div>
          `;
          // Use mouseenter/mouseleave for desktop, focus/blur for accessibility
          tile.addEventListener('mouseenter', ()=>{ infoOverlay.style.opacity = '1'; inner.style.filter = 'brightness(0.6)'; });
          tile.addEventListener('mouseleave', ()=>{ infoOverlay.style.opacity = '0'; inner.style.filter = 'none'; });
          tile.addEventListener('focus', ()=>{ infoOverlay.style.opacity = '1'; inner.style.filter = 'brightness(0.6)'; });
          tile.addEventListener('blur', ()=>{ infoOverlay.style.opacity = '0'; inner.style.filter = 'none'; });
          tile.setAttribute('tabindex', '0'); // allow keyboard focus
          tile.addEventListener('click', ()=>{ if(window.playToneForColor) window.playToneForColor(c.hex); });
          tile.appendChild(infoOverlay);
      } else {
        inner.className = 'inner locked'; inner.style.background = '#000000'; inner.innerHTML = '';
        // locked tiles show secret/hidden name
        label = document.createElement('div');
        label.className = 'locked-meta';
        const pct = ((c.prob||0)*100).toFixed(3) + '%';
        label.innerHTML = `<div class="locked-name">???</div><div class="locked-prob">${pct}</div>`;
      }
      tile.appendChild(inner);
      if(label) tile.appendChild(label);
      grid.appendChild(tile);
    });

    // hexToRgb is shared above
    sec.appendChild(grid);
    return sec;
  }

  // Helper to build zone sections
  function buildZoneSection(zone, colors, isUnlocked) {
    const zoneSection = document.createElement('div');
    const zoneLabels = {grays: '🩶 Gris', warm: '🔥 Couleurs chaudes', cold: '❄️ Couleurs froides'};
    const cost = getZoneUnlockCost(zone);
    
    const zoneHeader = document.createElement('h4');
    zoneHeader.style.display = 'flex';
    zoneHeader.style.justifyContent = 'space-between';
    zoneHeader.style.alignItems = 'center';
    
    const labelSpan = document.createElement('span');
    labelSpan.textContent = zoneLabels[zone] || zone;
    zoneHeader.appendChild(labelSpan);
    
    if (!isUnlocked && zone !== 'grays') {
      const unlockBtn = document.createElement('button');
      unlockBtn.className = 'zone-unlock-btn';
      unlockBtn.textContent = `Débloquer (${cost}💰)`;
      unlockBtn.addEventListener('click', () => {
        if (unlockZone(zone)) {
          updateCoinsDisplay();
          renderCollection(fullscreen);
        } else {
          alert('Pas assez de pièces!');
        }
      });
      zoneHeader.appendChild(unlockBtn);
    }
    
    zoneSection.appendChild(zoneHeader);
    
    const grid = document.createElement('div');
    grid.className = 'collection-grid' + (fullscreen ? ' fullscreen' : '');
    
    colors.forEach(c => {
      const tile = document.createElement('div');
      tile.className = 'color-tile';
      tile.dataset.name = (c.name || '').toLowerCase();
      tile.dataset.cid = c.id;
      const inner = document.createElement('div');
      inner.className = 'inner';
      
      if (unlocked.includes(c.id)) {
          inner.style.background = c.hex;
          inner.style.cursor = 'pointer';
          // overlay info (shown on hover)
          const infoOverlay = document.createElement('div');
          infoOverlay.className = 'color-tile-info';
          infoOverlay.style.position = 'absolute';
          infoOverlay.style.inset = '0';
          infoOverlay.style.background = 'rgba(0,0,0,0.6)';
          infoOverlay.style.display = 'flex';
          infoOverlay.style.flexDirection = 'column';
          infoOverlay.style.alignItems = 'center';
          infoOverlay.style.justifyContent = 'center';
          infoOverlay.style.color = '#fff';
          infoOverlay.style.fontSize = '11px';
          infoOverlay.style.padding = '6px';
          infoOverlay.style.textAlign = 'center';
          infoOverlay.style.opacity = '0';
          infoOverlay.style.transition = 'opacity 0.18s';
          infoOverlay.style.pointerEvents = 'auto';
          infoOverlay.style.zIndex = '2';
          infoOverlay.innerHTML = `
            <div style="font-weight:bold;margin-bottom:2px">${c.name}</div>
            <div>${c.hex}</div>
            <div>${((c.prob||0)*100).toFixed(2)}%</div>
            <div>💰 ${c.value || CONFIG.COIN_PER_COLOR}</div>
          `;
          // Use mouseenter/mouseleave for desktop, focus/blur for accessibility
          tile.addEventListener('mouseenter', ()=>{ infoOverlay.style.opacity = '1'; inner.style.filter = 'brightness(0.6)'; });
          tile.addEventListener('mouseleave', ()=>{ infoOverlay.style.opacity = '0'; inner.style.filter = 'none'; });
          tile.addEventListener('focus', ()=>{ infoOverlay.style.opacity = '1'; inner.style.filter = 'brightness(0.6)'; });
          tile.addEventListener('blur', ()=>{ infoOverlay.style.opacity = '0'; inner.style.filter = 'none'; });
          tile.setAttribute('tabindex', '0'); // allow keyboard focus
          tile.addEventListener('click', ()=>{ if(window.playToneForColor) window.playToneForColor(c.hex); });
          tile.appendChild(infoOverlay);
      } else {
        inner.className = 'inner locked';
        inner.style.background = '#000000';
        const label = document.createElement('div');
        label.className = 'locked-meta';
        const pct = ((c.prob||0)*100).toFixed(3) + '%';
        label.innerHTML = `<div class="locked-name">???</div><div class="locked-prob">${pct}</div>`;
        tile.appendChild(label);
      }
      tile.appendChild(inner);
      grid.appendChild(tile);
    });
    
    zoneSection.appendChild(grid);
    return zoneSection;
  }
  
  // Append sections in order: epic, rare, then zones
  tab.appendChild(makeSection('Épiques', groups.epic));
  tab.appendChild(makeSection('Rares', groups.rare));
  
  // Zone-based sections for commons
  const zoneNames = ['grays', 'warm', 'cold'];
  zoneNames.forEach(zone => {
    const zoneColors = groups.common.filter(c => c.zone === zone);
    if (zoneColors.length === 0) return;
    
    const isUnlocked = isZoneUnlocked(zone) || zone === 'grays';
    tab.appendChild(buildZoneSection(zone, zoneColors, isUnlocked));
  });

  // search action: scroll to first matching tile
  document.getElementById('collectionSearchBtn').addEventListener('click', ()=>{
    const q = (document.getElementById('collectionSearchInput').value || '').trim().toLowerCase();
    if(!q) return;
    const tile = tab.querySelector(`.color-tile[data-name="${q}"]`);
    if(tile){
      // ensure panel is open and scrolled to tile
      const side = document.getElementById('sidePanel'); if(side && !side.classList.contains('open')) side.classList.add('open');
      tile.scrollIntoView({behavior:'smooth', block:'center'});
      tile.classList.add('hovered');
      setTimeout(()=>tile.classList.remove('hovered'), 2000);
    } else {
      alert('Prénom introuvable dans la collection');
    }
  });
}

/** Rendre la boutique */
export function renderShop(){
  const tab = document.getElementById('tabContent');
  tab.innerHTML = '';
  const heading = document.createElement('h3'); heading.textContent='Boutique'; tab.appendChild(heading);

  // Booster item
  const item = document.createElement('div'); item.className='shop-item';
  item.innerHTML = `<div><strong>Booster x${CONFIG.BOOSTER.multiplier}</strong><div style="font-size:12px;color:var(--muted)">+ revenus pendant ${CONFIG.BOOSTER.duration}s</div></div><div><div style="text-align:right">${CONFIG.BOOSTER.cost} 💰</div><button id="buyBoosterBtn">Acheter</button></div>`;
  tab.appendChild(item);

  document.getElementById('buyBoosterBtn').addEventListener('click', ()=>{
    try{
      const u = getCurrentUser();
      const hasActive = u?.boosters && u.boosters.length > 0;
      if(hasActive && u.boosters[0].expiresAt > Date.now()){
        alert('Vous avez déjà un booster actif. Attendez qu\'il expire avant d\'en acheter un nouveau.');
        return;
      }
      const res = buyBooster();
      updateCoinsDisplay();
      updateBoosterBadge();
      alert('Booster acheté!');
    }catch(e){alert(e.message)}
  })
  
  // Robions item
  const attackCoinItem = document.createElement('div'); attackCoinItem.className='shop-item';
  attackCoinItem.innerHTML = `<div><strong>Robions ⚔️</strong><div style="font-size:12px;color:var(--muted)">Monnaie d'attaque - Utilisez pour attaquer d'autres joueurs</div></div><div><div style="text-align:right">1000 💰</div><button id="buyAttackCoinBtn">Acheter</button></div>`;
  tab.appendChild(attackCoinItem);
  
  document.getElementById('buyAttackCoinBtn').addEventListener('click', ()=>{
    try{
      buyAttackCoin();
      updateCoinsDisplay();
    }catch(e){alert(e.message)}
  })
}

/** Render leaderboard/ranking tab */
export async function renderRanking(){
  const tab = document.getElementById('tabContent');
  tab.innerHTML = '';
  const heading = document.createElement('h3'); heading.textContent='Classement'; tab.appendChild(heading);
  
  // Charger les utilisateurs depuis Firebase
  const users = await getAllUsers();
  const currentUser = getCurrentUser();
  const currentUsername = currentUser ? localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT) ? JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT)).username : null : null;
  
  const rankings = Object.entries(users).map(([username, user])=>({
    username,
    coins: user.coins || 0,
    collectionCount: (user.collection || []).length,
    pfp: user.pfp || null
  })).sort((a,b)=>b.coins - a.coins);
  
  const rankTable = document.createElement('div'); rankTable.style.display='flex'; rankTable.style.flexDirection='column'; rankTable.style.gap='8px';
  rankings.forEach((rank, idx)=>{
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '12px';
    row.style.padding = '10px'; row.style.background = 'rgba(255,255,255,0.02)'; row.style.borderRadius = '8px';
    
    const pos = document.createElement('div'); pos.style.minWidth = '30px'; pos.style.fontWeight = 'bold'; pos.textContent = `${idx+1}.`;
    const pfpCircle = document.createElement('div');
    pfpCircle.style.width = '32px'; pfpCircle.style.height = '32px'; pfpCircle.style.borderRadius = '50%';
    pfpCircle.style.background = rank.pfp || '#666666'; pfpCircle.style.border = '2px solid rgba(255,255,255,0.2)';
    
    const info = document.createElement('div'); info.style.flex = '1';
    info.innerHTML = `<div style="font-weight:600">${rank.username}</div><div style="font-size:12px;color:var(--muted)">${rank.collectionCount} couleurs</div>`;
    
    const coins = document.createElement('div'); coins.style.fontWeight = 'bold'; coins.style.textAlign = 'right'; coins.textContent = `${rank.coins}💰`;
    
    row.appendChild(pos); row.appendChild(pfpCircle); row.appendChild(info); row.appendChild(coins);
    
    // Add attack button if not current user
    if(currentUsername && rank.username !== currentUsername){
      // Calculate attack cost
      const targetCollection = users[rank.username]?.collection || [];
      const myCollection = currentUser?.collection || [];
      const attackCost = calculateAttackCost(myCollection, targetCollection);
      
      const attackBtn = document.createElement('button');
      attackBtn.textContent = `⚔️ ${attackCost}`;
      attackBtn.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
      attackBtn.style.border = '0';
      attackBtn.style.color = 'white';
      attackBtn.style.padding = '8px 12px';
      attackBtn.style.borderRadius = '6px';
      attackBtn.style.cursor = 'pointer';
      attackBtn.style.fontSize = '14px';
      attackBtn.style.transition = 'all 0.2s';
      attackBtn.title = `Attaquer (coût: ${attackCost} Robions)`;
      
      attackBtn.addEventListener('mouseenter', ()=>{
        attackBtn.style.transform = 'scale(1.1)';
        attackBtn.style.boxShadow = '0 4px 12px rgba(255,68,68,0.4)';
      });
      attackBtn.addEventListener('mouseleave', ()=>{
        attackBtn.style.transform = 'scale(1)';
        attackBtn.style.boxShadow = 'none';
      });
      
      attackBtn.addEventListener('click', async ()=>{
        attackBtn.disabled = true;
        attackBtn.style.opacity = '0.5';
        try{
          const result = await attackPlayer(rank.username);
          // Find color name
          const color = CONFIG.COLORS.find(c => c.id === result.stolenColorId);
          const colorName = color ? color.name : result.stolenColorId;
          alert(`⚔️ Attaque réussie ! Vous avez détruit "${colorName}" de ${rank.username} ! (Coût: ${result.attackCost} Robions)`);
          // Update coins display
          updateCoinsDisplay();
          // Refresh ranking
          renderRanking();
        }catch(e){
          alert('❌ ' + e.message);
          attackBtn.disabled = false;
          attackBtn.style.opacity = '1';
        }
      });
      
      row.appendChild(attackBtn);
    }
    
    rankTable.appendChild(row);
  });
  
  tab.appendChild(rankTable);
}

/** Render ranking into a specific container (for overlay) */
export async function renderRankingInto(container){
  // Charger les utilisateurs depuis Firebase
  const users = await getAllUsers();
  const currentUser = getCurrentUser();
  const currentUsername = currentUser ? localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT) ? JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT)).username : null : null;
  
  const rankings = Object.entries(users).map(([username, user])=>({
    username,
    coins: user.coins || 0,
    collectionCount: (user.collection || []).length,
    pfp: user.pfp || null
  })).sort((a,b)=>b.coins - a.coins);
  
  const rankTable = document.createElement('div'); rankTable.style.display='flex'; rankTable.style.flexDirection='column'; rankTable.style.gap='8px';
  rankings.forEach((rank, idx)=>{
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '12px';
    row.style.padding = '10px'; row.style.background = 'rgba(255,255,255,0.02)'; row.style.borderRadius = '8px';
    
    const pos = document.createElement('div'); pos.style.minWidth = '30px'; pos.style.fontWeight = 'bold'; pos.textContent = `${idx+1}.`;
    const pfpCircle = document.createElement('div');
    pfpCircle.style.width = '32px'; pfpCircle.style.height = '32px'; pfpCircle.style.borderRadius = '50%';
    pfpCircle.style.background = rank.pfp || '#666666'; pfpCircle.style.border = '2px solid rgba(255,255,255,0.2)';
    
    const info = document.createElement('div'); info.style.flex = '1';
    info.innerHTML = `<div style="font-weight:600">${rank.username}</div><div style="font-size:12px;color:var(--muted)">${rank.collectionCount} couleurs</div>`;
    
    const coins = document.createElement('div'); coins.style.fontWeight = 'bold'; coins.style.textAlign = 'right'; coins.textContent = `${rank.coins}💰`;
    
    row.appendChild(pos); row.appendChild(pfpCircle); row.appendChild(info); row.appendChild(coins);
    
    // Add attack button if not current user
    if(currentUsername && rank.username !== currentUsername){
      // Calculate attack cost
      const targetCollection = users[rank.username]?.collection || [];
      const myCollection = currentUser?.collection || [];
      const attackCost = calculateAttackCost(myCollection, targetCollection);
      
      const attackBtn = document.createElement('button');
      attackBtn.textContent = `⚔️ ${attackCost}`;
      attackBtn.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
      attackBtn.style.border = '0';
      attackBtn.style.color = 'white';
      attackBtn.style.padding = '8px 12px';
      attackBtn.style.borderRadius = '6px';
      attackBtn.style.cursor = 'pointer';
      attackBtn.style.fontSize = '14px';
      attackBtn.style.transition = 'all 0.2s';
      attackBtn.title = `Attaquer (coût: ${attackCost} Robions)`;
      
      attackBtn.addEventListener('mouseenter', ()=>{
        attackBtn.style.transform = 'scale(1.1)';
        attackBtn.style.boxShadow = '0 4px 12px rgba(255,68,68,0.4)';
      });
      attackBtn.addEventListener('mouseleave', ()=>{
        attackBtn.style.transform = 'scale(1)';
        attackBtn.style.boxShadow = 'none';
      });
      
      attackBtn.addEventListener('click', async ()=>{
        attackBtn.disabled = true;
        attackBtn.style.opacity = '0.5';
        try{
          const result = await attackPlayer(rank.username);
          // Find color name
          const color = CONFIG.COLORS.find(c => c.id === result.stolenColorId);
          const colorName = color ? color.name : result.stolenColorId;
          alert(`⚔️ Attaque réussie ! Vous avez détruit "${colorName}" de ${rank.username} ! (Coût: ${result.attackCost} Robions)`);
          // Update coins display
          updateCoinsDisplay();
          // Refresh ranking in overlay
          container.innerHTML = '';
          const heading = document.createElement('h3'); 
          heading.textContent='Classement'; 
          heading.style.marginBottom = '20px';
          heading.style.fontSize = '28px';
          container.appendChild(heading);
          await renderRankingInto(container);
        }catch(e){
          alert('❌ ' + e.message);
          attackBtn.disabled = false;
          attackBtn.style.opacity = '1';
        }
      });
      
      row.appendChild(attackBtn);
    }
    
    rankTable.appendChild(row);
  });
  
  container.appendChild(rankTable);
}

/** Ouvre/ferme panneau latéral */
export function togglePanel(open){
  const p = document.getElementById('sidePanel');
  if(open) {
    p.classList.add('open');
    // if collection tab is active, use full-screen mode
    const active = document.querySelector('.panel-tabs .tab.active');
    if(active && active.dataset.tab === 'collection') p.classList.add('full');
  } else {
    p.classList.remove('open');
    p.classList.remove('full');
  }
}

/** Mettre à jour le contenu actif du panneau selon l'onglet */
export function setupPanelTabs(){
  document.querySelectorAll('.panel-tabs .tab').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.panel-tabs .tab').forEach(t=>t.classList.remove('active'));
      b.classList.add('active');
      const tab = b.dataset.tab;
      const side = document.getElementById('sidePanel');
      if(tab==='collection'){
        // render full-screen collection
        side.classList.add('full');
        renderCollection(true);
      }
      if(tab==='shop'){
        side.classList.remove('full');
        renderShop();
      }
    })
  })
}

/** Update PFP circle display */
export function updatePFPDisplay(){
  const pfpEl = document.getElementById('pfpCircle');
  if(pfpEl){
    const pfp = getPFP();
    pfpEl.style.background = pfp || '#666666';
  }
}

export {updateCoinsDisplay as updateHUD};
