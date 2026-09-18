# TierList - API (tierlist-server)

API REST du projet **TierList** : créer, partager, voter et commenter des classements de jeux vidéo.
Stack : Node.js, Express 5, MongoDB / Mongoose, JWT, zod.

Le front React est dans le repo `tierlist-client`.

**API en ligne :** https://tierlist-server.onrender.com (Render, base de données sur MongoDB Atlas)

## Installation

```bash
npm install
cp .env.example .env
# puis remplir les valeurs dans .env
npm run dev
```

Variables d'environnement :

| Variable       | Description                                              |
|----------------|----------------------------------------------------------|
| `PORT`         | Port du serveur (5005 par défaut)                        |
| `MONGODB_URI`  | Chaîne de connexion MongoDB (locale ou Atlas)            |
| `TOKEN_SECRET` | Secret utilisé pour signer les tokens JWT                |
| `ORIGIN`       | URL du front autorisée par CORS (`http://localhost:5173`) |
| `RAWG_API_KEY` | Clé API RAWG (https://rawg.io/apidocs)                   |

## Modèles

- **User** : email, password (hashé), name, avatar, role (`user` / `admin`)
- **TierList** : title, description, owner, isPublic, tiers `[{ label, color }]`
- **TierListItem** : tierList, gameId (id RAWG), gameName, gameImage, tier, position
- **Vote** : tierList, user, value (`1` / `-1`), index unique sur `{ tierList, user }`
- **Comment** : tierList, author, content (500 caractères max)

## Routes

### Authentification

| Méthode | Route          | Accès   | Description                          |
|---------|----------------|---------|--------------------------------------|
| POST    | `/auth/signup` | public  | Crée un compte                       |
| POST    | `/auth/login`  | public  | Renvoie un token JWT                 |
| GET     | `/auth/verify` | token   | Vérifie le token, renvoie l'utilisateur |

### Tier lists

| Méthode | Route                          | Accès               | Description                              |
|---------|--------------------------------|---------------------|------------------------------------------|
| GET     | `/api/tierlists`               | public              | Listes publiques (`?search=`, `?sort=recent|popular`) |
| GET     | `/api/tierlists/:id`           | public              | Une liste avec ses items et ses votes    |
| GET     | `/api/tierlists/user/:userId`  | public              | Les listes d'un utilisateur              |
| POST    | `/api/tierlists`               | token               | Crée une liste                           |
| PUT     | `/api/tierlists/:id`           | propriétaire, admin | Modifie titre, description, visibilité, rangs |
| DELETE  | `/api/tierlists/:id`           | propriétaire, admin | Supprime la liste et tout ce qui en dépend |

### Items (jeux dans une liste)

| Méthode | Route                                    | Accès               | Description                     |
|---------|------------------------------------------|---------------------|---------------------------------|
| POST    | `/api/tierlists/:id/items`               | propriétaire, admin | Ajoute un jeu                   |
| PUT     | `/api/tierlists/:id/items/:itemId`       | propriétaire, admin | Change le rang ou la position   |
| DELETE  | `/api/tierlists/:id/items/:itemId`       | propriétaire, admin | Retire un jeu                   |

### Commentaires

| Méthode | Route                          | Accès          | Description              |
|---------|--------------------------------|----------------|--------------------------|
| GET     | `/api/tierlists/:id/comments`  | public         | Les commentaires         |
| POST    | `/api/tierlists/:id/comments`  | token          | Ajoute un commentaire    |
| PUT     | `/api/comments/:commentId`     | auteur         | Modifie un commentaire   |
| DELETE  | `/api/comments/:commentId`     | auteur, admin  | Supprime un commentaire  |

### Votes

| Méthode | Route                       | Accès | Description                          |
|---------|-----------------------------|-------|--------------------------------------|
| POST    | `/api/tierlists/:id/vote`   | token | Vote `{ value: 1 }` ou `{ value: -1 }` (remplace le vote existant) |
| DELETE  | `/api/tierlists/:id/vote`   | token | Retire son vote                      |

### Relais RAWG

| Méthode | Route                        | Description                          |
|---------|------------------------------|--------------------------------------|
| GET     | `/api/games/search?q=zelda`  | Recherche de jeux (12 résultats)     |
| GET     | `/api/games/:gameId`         | Détail d'un jeu                      |

Le front ne contacte jamais RAWG directement : la clé API reste côté serveur.

### Utilisateurs

| Méthode | Route             | Description                          |
|---------|-------------------|--------------------------------------|
| GET     | `/api/users/:id`  | Profil public (nom, avatar, rôle)    |

## Choix techniques

- **Dénormalisation volontaire** : on recopie `gameName` et `gameImage` dans `TierListItem` plutôt
  que de créer une collection `Game`. RAWG reste la source de vérité, et on évite un appel réseau
  à chaque affichage.
- **Rôle admin** : un admin peut supprimer n'importe quelle tier list ou commentaire. Pour promouvoir
  un compte, changer son champ `role` en `admin` directement dans MongoDB.
- **Suppression en cascade** : supprimer une tier list supprime aussi ses items, votes et commentaires.
- **Validation des entrées avec zod** : chaque route POST / PUT vérifie le corps de la requête avec un
  schéma du dossier `validation/` avant de toucher à la base. Le premier problème rencontré est renvoyé
  en 400 avec un message clair.
- **Middleware d'erreurs centralisé** : erreurs de validation Mongoose → 400, identifiant mal formé → 400,
  doublon → 400, tout le reste → 500.

## Crédits

Données des jeux fournies par [RAWG](https://rawg.io).

## Licence

MIT
