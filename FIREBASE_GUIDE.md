# 🔥 Guide Firebase pour Colors Clicker

## 📌 Étapes pour intégrer Firebase

### 1. Créer un projet Firebase
1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Clique sur "Ajouter un projet"
3. Nomme ton projet (ex: "colors-clicker")
4. Active Google Analytics (optionnel)
5. Clique sur "Créer le projet"

### 2. Configurer Firestore Database
1. Dans le menu de gauche, clique sur "Firestore Database"
2. Clique sur "Créer une base de données"
3. Choisis "Démarrer en mode test" (pour le développement)
4. Sélectionne une région (ex: europe-west1)

### 3. Obtenir les identifiants Firebase
1. Dans les paramètres du projet (⚙️ > Paramètres du projet)
2. Descends jusqu'à "Vos applications"
3. Clique sur l'icône Web `</>`
4. Nomme ton app et clique sur "Enregistrer l'application"
5. **Copie le code de configuration** qui ressemble à ceci:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ton-projet.firebaseapp.com",
  projectId: "ton-projet",
  storageBucket: "ton-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123"
};
```

### 4. Ajouter Firebase à ton projet

**a) Ajoute Firebase SDK dans `index.html` AVANT les autres scripts:**

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<!-- Ton code -->
<script type="module" src="assets/js/names.js"></script>
<!-- ... reste des scripts -->
```

**b) Crée `assets/js/firebase.js`:**

```javascript
// firebase.js
const firebaseConfig = {
  // COLLE ICI TA CONFIG FIREBASE
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // etc.
};

// Initialise Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export { db };
```

### 5. Modifier `userSystem.js` pour utiliser Firebase

Remplace le localStorage par Firestore:

```javascript
// Au début du fichier
import { db } from './firebase.js';

// Pour sauvegarder un utilisateur
export async function saveUserToFirebase(user) {
  await db.collection('users').doc(user.username).set({
    username: user.username,
    coins: user.coins,
    collection: user.collection,
    boosters: user.boosters,
    pfp: user.pfp,
    unlockedZones: user.unlockedZones
  });
}

// Pour charger un utilisateur
export async function loadUserFromFirebase(username) {
  const doc = await db.collection('users').doc(username).get();
  if (doc.exists) {
    return doc.data();
  }
  return null;
}

// Pour le classement (tous les utilisateurs)
export async function getAllUsersFromFirebase() {
  const snapshot = await db.collection('users')
    .orderBy('collection', 'desc')
    .limit(10)
    .get();
  return snapshot.docs.map(doc => doc.data());
}
```

### 6. Configurer les règles de sécurité Firestore

Dans la console Firebase > Firestore > Règles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permet lecture/écriture pour tous (temporaire)
    match /users/{username} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

⚠️ **Pour la production, ajoute une authentification Firebase!**

---

## 🎯 Résumé des avantages Firebase

✅ **Données synchronisées** entre tous les utilisateurs  
✅ **Classement en temps réel** avec tous les joueurs  
✅ **Pas de limite de stockage** (contrairement au localStorage)  
✅ **Données persistantes** même si on vide le cache  
✅ **Accessible depuis n'importe quel appareil**

---

## 🔐 Sécurité (important!)

Pour un vrai jeu en production:
1. Active **Firebase Authentication** (connexion par email/Google)
2. Modifie les règles Firestore pour que chaque utilisateur ne puisse modifier que ses propres données
3. Ajoute une validation côté serveur avec **Cloud Functions**

---

## 💡 Exemple complet de modification de `userSystem.js`

```javascript
import { db } from './firebase.js';

// Remplace addCoins
export async function addCoins(amount) {
  const user = getCurrentUser();
  user.coins += amount;
  await saveUserToFirebase(user); // Sauvegarde dans Firebase
}

// Remplace addColorToUser
export async function addColorToUser(color) {
  const user = getCurrentUser();
  if (!user.collection.includes(color.id)) {
    user.collection.push(color.id);
    await saveUserToFirebase(user);
    return true; // nouvelle couleur
  }
  return false;
}
```

Voilà! Ton jeu sera maintenant multijoueur avec un classement partagé! 🚀
