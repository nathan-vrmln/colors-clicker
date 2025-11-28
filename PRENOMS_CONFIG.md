# Configuration des Prénoms, Probabilités et Coins

## 📝 Comment modifier les prénoms

### Fichier à éditer: `assets/js/names.js`

Ce fichier contient la liste complète des prénoms utilisés dans le jeu.

```javascript
// Dans assets/js/names.js
export const MODERN_NAMES = [
  'Nathan',
  'Naïa',
  'Lucas',
  'Emma',
  // ... ajoutez ou modifiez ici
];
```

**Important:**
- **Nathan** et **Naïa** sont réservés pour les couleurs épiques (noir et blanc)
- Les autres prénoms sont distribués automatiquement sur les 500 couleurs
- L'ordre dans la liste détermine quelle couleur reçoit quel prénom

---

## 💰 Comment modifier les coins donnés par les couleurs

### Fichier à éditer: `assets/js/config.js`

### 1. Couleurs ÉPIQUES (Noir et Blanc)
```javascript
// Lignes 37-38 environ
out.push({id:'c-0001', hex:'#000000', name:'Naïa', rarity:'epic', value:10000, prob:0.001, officialName:'Noir'});
out.push({id:'c-0002', hex:'#FFFFFF', name:'Nathan', rarity:'epic', value:10000, prob:0.001, officialName:'Blanc'});
```
**Modifie `value:10000`** pour changer les coins donnés par le noir et le blanc.

### 2. Couleurs RARES (Rouge, Vert, Bleu)
```javascript
// Lignes 41-43 environ
out.push({id:'c-0003', hex:'#FF0000', name:generateUniqueName(), rarity:'rare', value:1000, prob:0.01, officialName:'Rouge'});
out.push({id:'c-0004', hex:'#00FF00', name:generateUniqueName(), rarity:'rare', value:1000, prob:0.01, officialName:'Vert'});
out.push({id:'c-0005', hex:'#0000FF', name:generateUniqueName(), rarity:'rare', value:1000, prob:0.01, officialName:'Bleu'});
```
**Modifie `value:1000`** pour changer les coins donnés par les couleurs rares.

### 3. Couleurs GRISES (30 nuances)
```javascript
// Ligne 50 environ
const value = 1 + Math.round((grayCount-1 - i) * (9/(grayCount-1))); // 1-10 coins
```
**Actuellement:** Les gris donnent entre **1 et 10 coins** (les plus clairs donnent plus, les plus foncés donnent moins).

**Pour modifier:**
- Change `1` (minimum) par ta valeur minimum souhaitée
- Change `9` par `(max - min)`. Par exemple pour 5-20 coins: `const value = 5 + Math.round((grayCount-1 - i) * (15/(grayCount-1)));`

### 4. Couleurs COMMUNES (Warm et Cold zones)
```javascript
// Ligne 64 environ
const value = 30 + Math.round(Math.random() * 20); // 30-50 coins
```
**Actuellement:** Les couleurs communes donnent entre **30 et 50 coins** (aléatoire).

**Pour modifier:**
- Change `30` (minimum) par ta valeur minimum
- Change `20` par `(max - min)`. Par exemple pour 100-150 coins: `const value = 100 + Math.round(Math.random() * 50);`

---

## 🎯 Comment modifier les probabilités

### Fichier à éditer: `assets/js/config.js`

Cherchez la section qui définit les probabilités:

```javascript
// Lignes 71-78 environ dans config.js

// Probabilités des couleurs épiques et rares
out.find(c=>c.hex==='#000000').prob = 0.001;  // Noir (0.1%)
out.find(c=>c.hex==='#FFFFFF').prob = 0.001;  // Blanc (0.1%)
out.find(c=>c.hex==='#FF0000').prob = 0.01;   // Rouge (1%)
out.find(c=>c.hex==='#00FF00').prob = 0.01;   // Vert (1%)
out.find(c=>c.hex==='#0000FF').prob = 0.01;   // Bleu (1%)

// Probabilités des gris (ligne 81)
const graysTotalProb = 0.60; // 60% pour tous les gris combinés

// Probabilités des couleurs communes (ligne 82)
const commonsTotalProb = Math.max(0, 1 - epicRareTotal - graysTotalProb);
```

### Valeurs à modifier:
- **Epic (noir/blanc)**: `prob = 0.001` (0.1% chacun)
- **Rare (rouge/vert/bleu)**: `prob = 0.01` (1% chacun)
- **Gris combinés**: `graysTotalProb = 0.60` (60% total)
- **Communes**: Le reste est automatiquement distribué

---

## 🔥 Exemples de modifications

### Rendre les couleurs rares plus fréquentes:
```javascript
// Dans config.js, lignes 73-75
out.find(c=>c.hex==='#FF0000').prob = 0.05;   // Rouge 5% au lieu de 1%
out.find(c=>c.hex==='#00FF00').prob = 0.05;   // Vert 5%
out.find(c=>c.hex==='#0000FF').prob = 0.05;   // Bleu 5%
```

### Changer les coins des gris pour 5-15:
```javascript
// Ligne 50
const value = 5 + Math.round((grayCount-1 - i) * (10/(grayCount-1)));
```

### Changer les coins des communes pour 100-200:
```javascript
// Ligne 64
const value = 100 + Math.round(Math.random() * 100);
```

⚠️ **Attention**: La somme de toutes les probabilités doit toujours faire 1.0 (100%)

---

## 📊 Récapitulatif des fichiers

| Fichier | Ce qu'il contient |
|---------|-------------------|
| `assets/js/names.js` | Liste des prénoms |
| `assets/js/config.js` | Probabilités et coins donnés par chaque couleur |
