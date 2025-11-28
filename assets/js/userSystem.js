// userSystem.js
// Gestion des comptes et de la progression via Firebase Firestore

import { CONFIG } from './config.js';
import { db, collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit } from './firebase.js';

let users = {}; // structure: {username: {coins, collection: [ids], settings:{}, boosters:[]}}
let current = null;

/** Charger l'utilisateur courant depuis localStorage (pour la session) */
function loadCurrentFromStorage(){
  try{
    const cur = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT);
    current = cur? JSON.parse(cur) : null;
  }catch(e){current=null}
}

/** Sauvegarder l'utilisateur courant dans localStorage (pour la session) */
function saveCurrentToStorage(){
  localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT, JSON.stringify(current));
}

/** Sauvegarder un utilisateur dans Firebase */
async function saveUserToFirebase(username, userData){
  try{
    const userRef = doc(db, 'users', username);
    await setDoc(userRef, userData, { merge: true });
  }catch(e){
    console.error('Erreur Firebase save:', e);
  }
}

/** Charger un utilisateur depuis Firebase */
async function loadUserFromFirebase(username){
  try{
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
      return userSnap.data();
    }
    return null;
  }catch(e){
    console.error('Erreur Firebase load:', e);
    return null;
  }
}

/** Initialisation du module */
export function initUserSystem(){
  loadCurrentFromStorage();
}

/** Créer un compte avec mot de passe */
export async function createAccount(username, password){
  if(!username) throw new Error('Nom requis');
  if(!password) throw new Error('Mot de passe requis');
  
  // Vérifier si l'utilisateur existe déjà dans Firebase
  const existingUser = await loadUserFromFirebase(username);
  if(existingUser) throw new Error('Utilisateur existe');
  
  const newUser = {
    password: password, // Stocker le mot de passe (en production, utiliser un hash)
    coins: 0,
    attackCoins: 0, // monnaie d'attaque pour attaquer d'autres joueurs
    collection: [],
    settings: {bg:null, accent:null},
    boosters: [], // boosters actifs {type, expiresAt}
    unlockedZones: ['grays'], // grays débloquée par défaut
    pfp: null, // profile picture color hex
    attacks: [] // attacks received: [{from: username, colorId: id, timestamp: timestamp}]
  };
  
  // Sauvegarder dans Firebase
  await saveUserToFirebase(username, newUser);
  
  // Mettre en cache localement
  users[username] = newUser;
  current = {username};
  saveCurrentToStorage();
  
  return newUser;
}

/** Se connecter avec mot de passe */
export async function login(username, password){
  if(!username) throw new Error('Nom requis');
  if(!password) throw new Error('Mot de passe requis');
  
  // Charger depuis Firebase
  const userData = await loadUserFromFirebase(username);
  if(!userData) throw new Error('Utilisateur introuvable');
  
  // Vérifier le mot de passe
  if(userData.password !== password) throw new Error('Mot de passe incorrect');
  
  // Mettre en cache localement
  users[username] = userData;
  current = {username};
  saveCurrentToStorage();
  
  return userData;
}

/** Retourne l'objet user courant (référence) */
export function getCurrentUser(){
  if(!current) return null;
  return users[current.username];
}

/** Ajoute une couleur à la collection (si pas déjà) */
export function addColorToUser(color){
  const u = getCurrentUser(); if(!u) return;
  if(!u.collection.includes(color.id)){
    u.collection.push(color.id);
    // add coins by color value
    u.coins = (u.coins || 0) + (color.value || CONFIG.COIN_PER_COLOR);
    // Sauvegarder dans Firebase
    if(current) saveUserToFirebase(current.username, u);
    return true;
  }
  return false;
}

/** Ajoute des pièces (appliquer multiplicateur si booster actif) */
export function addCoins(amount){
  const u = getCurrentUser(); if(!u) return;
  u.coins = (u.coins||0) + amount;
  // Sauvegarder dans Firebase
  if(current) saveUserToFirebase(current.username, u);
}

/** Acheter une monnaie d'attaque (coût: 1000 coins) */
export function buyAttackCoin(){
  const u = getCurrentUser(); if(!u) throw new Error('Not logged');
  const cost = 1000;
  if((u.coins||0) < cost) throw new Error('Pas assez de pièces');
  u.coins -= cost;
  u.attackCoins = (u.attackCoins||0) + 1;
  if(current) saveUserToFirebase(current.username, u);
  return u.attackCoins;
}

/** Ajoute des monnaies d'attaque */
export function addAttackCoins(amount){
  const u = getCurrentUser(); if(!u) return;
  u.attackCoins = (u.attackCoins||0) + amount;
  // Sauvegarder dans Firebase
  if(current) saveUserToFirebase(current.username, u);
}

/** Tenter d'acheter un booster */
export function buyBooster(){
  const u = getCurrentUser(); if(!u) throw new Error('Not logged');
  if((u.coins||0) < CONFIG.BOOSTER.cost) throw new Error('Pas assez de pièces');
  u.coins -= CONFIG.BOOSTER.cost;
  const expiresAt = Date.now() + CONFIG.BOOSTER.duration*1000;
  u.boosters.push({type:'income', multiplier:CONFIG.BOOSTER.multiplier, expiresAt});
  // Sauvegarder dans Firebase
  if(current) saveUserToFirebase(current.username, u);
  return {expiresAt, multiplier:CONFIG.BOOSTER.multiplier};
}

/** Nettoyage des boosters expirés */
export function cleanupBoosters(){
  const u = getCurrentUser(); if(!u) return;
  const now = Date.now();
  const oldLength = u.boosters.length;
  u.boosters = u.boosters.filter(b=>b.expiresAt>now);
  // Sauvegarder seulement si changement
  if(oldLength !== u.boosters.length && current){
    saveUserToFirebase(current.username, u);
  }
}

/** Retourne le multiplicateur courant (1 si aucun) */
export function getCurrentMultiplier(){
  const u = getCurrentUser(); if(!u) return 1;
  cleanupBoosters();
  if(!u.boosters || u.boosters.length===0) return 1;
  // multiply stacked boosters (if multiple)
  return u.boosters.reduce((m,b)=>m*b.multiplier, 1);
}

/** Récupérer la liste d'IDs débloqués */
export function getCollection(){
  const u = getCurrentUser(); if(!u) return [];
  return u.collection || [];
}

/** Appliquer personnalisation pour l'utilisateur courant */
export function setUserSettings(settings){
  const u = getCurrentUser(); if(!u) return;
  u.settings = Object.assign(u.settings||{}, settings);
  if(current) saveUserToFirebase(current.username, u);
}

/** Get cost to unlock a zone */
export function getZoneUnlockCost(zone) {
  const costs = {
    'grays': 0, // free, always unlocked
    'warm': 50000,    // rare colors
    'cold': 10000,    // epic colors
    'neutral': 1500
  };
  return costs[zone] || 0;
}

/** Check if zone is unlocked */
export function isZoneUnlocked(zone) {
  const u = getCurrentUser(); if(!u) return false;
  return (u.unlockedZones || []).includes(zone);
}

/** Unlock a zone (requires coins) */
export function unlockZone(zone) {
  const u = getCurrentUser(); if(!u) return false;
  if (!u.unlockedZones) u.unlockedZones = ['grays'];
  if (u.unlockedZones.includes(zone)) return true; // already unlocked
  
  const cost = getZoneUnlockCost(zone);
  if ((u.coins || 0) < cost) return false; // not enough coins
  
  u.coins -= cost;
  u.unlockedZones.push(zone);
  if(current) saveUserToFirebase(current.username, u);
  return true;
}

/** Set profile picture (PFP) color hex */
export function setPFP(colorHex) {
  const u = getCurrentUser(); if(!u) return;
  u.pfp = colorHex;
  if(current) saveUserToFirebase(current.username, u);
}

/** Get profile picture color hex */
export function getPFP() {
  const u = getCurrentUser(); if(!u) return null;
  return u.pfp || null;
}

/** Reset account (clear collection, coins, boosters, unlocked zones, but keep PFP) */
export function resetAccount() {
  const u = getCurrentUser(); if(!u) return false;
  u.coins = 0;
  u.collection = [];
  u.boosters = [];
  u.unlockedZones = ['grays'];
  if(current) saveUserToFirebase(current.username, u);
  return true;
}

/** Get all users for leaderboard (from Firebase) */
export async function getAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('collection', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    
    const allUsers = {};
    snapshot.forEach((doc) => {
      allUsers[doc.id] = doc.data();
    });
    
    return allUsers;
  } catch(e) {
    console.error('Erreur Firebase getAllUsers:', e);
    return users; // fallback au cache local
  }
}

/** Calculate attack cost based on collection difference */
export function calculateAttackCost(attackerCollection, targetCollection) {
  const diff = attackerCollection.length - targetCollection.length;
  if (diff <= 0) return 1; // Si on a moins ou autant, coût minimum = 1
  return diff; // Coût = différence de couleurs
}

/** Attack a player (remove random color from their collection) */
export async function attackPlayer(targetUsername) {
  const attacker = getCurrentUser();
  if(!attacker) throw new Error('Not logged in');
  if(!current) throw new Error('No current user');
  
  // Load target user from Firebase
  const targetUser = await loadUserFromFirebase(targetUsername);
  if(!targetUser) throw new Error('Target user not found');
  
  // Check if target has any unlocked colors
  if(!targetUser.collection || targetUser.collection.length === 0) {
    throw new Error('Cet adversaire n\'a aucune couleur à détruire!');
  }
  
  // Calculate attack cost
  const attackCost = calculateAttackCost(attacker.collection || [], targetUser.collection || []);
  
  // Check if attacker has enough attack coins
  if((attacker.attackCoins || 0) < attackCost) {
    throw new Error(`Pas assez de Robions! Coût: ${attackCost}, Vous avez: ${attacker.attackCoins || 0}`);
  }
  
  // Deduct attack coins
  attacker.attackCoins = (attacker.attackCoins || 0) - attackCost;
  
  // Remove a random color from target (destroyed, not stolen)
  const randomIndex = Math.floor(Math.random() * targetUser.collection.length);
  const destroyedColorId = targetUser.collection[randomIndex];
  targetUser.collection.splice(randomIndex, 1);
  
  // Add attack notification to target
  if(!targetUser.attacks) targetUser.attacks = [];
  targetUser.attacks.push({
    from: current.username,
    colorId: destroyedColorId,
    timestamp: Date.now()
  });
  
  // Save target user
  await saveUserToFirebase(targetUsername, targetUser);
  // Save attacker (attackCoins deducted)
  await saveUserToFirebase(current.username, attacker);
  
  return {stolenColorId: destroyedColorId, attackCost};
}

/** Get and clear attack notifications for current user */
export function getAttackNotifications() {
  const u = getCurrentUser();
  if(!u) return [];
  const attacks = u.attacks || [];
  u.attacks = []; // Clear after reading
  if(current && attacks.length > 0) {
    saveUserToFirebase(current.username, u);
  }
  return attacks;
}

export {users as _allUsers};
