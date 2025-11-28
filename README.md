# Colors Clicker

Mini-projet web: clicker de couleurs, sauvegarde locale, boutique et personnalisation.

Installation / usage
- Ouvrir `index.html` dans un navigateur moderne (ou héberger via GitHub Pages).
- Pas d'installation: tout est en HTML/CSS/JS modules.

Structure
```
/assets
  /css
    style.css
  /js
    names.js          ← Fichier centralisé de prénoms (modifiable!)
    config.js
    animation.js
    userSystem.js
    ui.js
    main.js
index.html
```

Modifier les prénoms des couleurs
- Ouvrir `assets/js/names.js`
- Éditer l'array `MODERN_NAMES` avec vos prénoms favoris
- Nathan et Naïa sont réservés pour Blanc et Noir
- Chaque couleur aura un prénom unique (pas de répétitions)

Fonctionnalités
- Bouton central qui lance un "spinner" et donne une couleur aléatoire.
- Les couleurs sont ajoutées à la collection et donnent des pièces.
- Boutique: acheter un booster ×2 pendant 30s (coût configurable dans `config.js`).
- Personnalisation: changer le fond avec les couleurs débloquées.
- Comptes simples via `localStorage` (pas de mot de passe).

Déploiement GitHub Pages
- Placer la branche `gh-pages` contenant ces fichiers ou activer GitHub Pages sur la branche `main`.
- `index.html` doit rester à la racine.

TODO / améliorations
- Ajouter fichiers audio piano + loader (commenté actuellement simple WebAudio).
- Activer l'effet de particules (fonction `createBurst` dans `animation.js`).
- Ajouter système de rareté pondéré au spinner.
- Ajouter écran de profil utilisateur et sauvegarde export/import.
