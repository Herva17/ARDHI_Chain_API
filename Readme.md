# 📋 API ARDHI - Documentation Complète

## 🚀 Description
API REST complète pour la gestion immobilière avec système d'authentification JWT, upload d'images multi-modules (parcelles et maisons).

## 📦 Technologies Utilisées
- **Node.js** + **Express.js**
- **Prisma** + **SQLite**
- **JWT** pour l'authentification
- **bcryptjs** pour le hash des mots de passe
- **multer** pour l'upload d'images
- **dotenv** pour la gestion des variables d'environnement

## 🗂️ Structure du Projet
```
ARDHI_API/
├── app.js
├── package.json
├── .env
├── prisma/
│   └── schema.prisma
├── middleware/
│   ├── auth.js
│   └── uploadMaison.js (gestion unifiée des uploads)
├── src/
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── authController.js
│   │   ├── parcelleController.js
│   │   └── maisonController.js
│   └── routes/
│       ├── userRoutes.js
│       ├── authRoutes.js
│       ├── authCheckRoutes.js
│       ├── parcelleRoutes.js
│       └── maisonRoutes.js
└── uploads/
    ├── parcelles/
    └── maisons/
```

## 🗃️ Modèles de Données

### Utilisateur
```prisma
model Utilisateur {
  id               Int        @id @default(autoincrement())
  nom              String
  email            String     @unique
  mot_de_passe     String
  telephone        String?
  type             String     // 'proprietaire', 'commissionnaire', 'admin', 'user'
  adresse          String?
  date_inscription DateTime   @default(now())
  parcelles        Parcelle[]
  maisons          Maison[]   @relation("ProprietaireMaisons")
}
```

### Parcelle
```prisma
model Parcelle {
  id                Int       @id @default(autoincrement())
  titre             String
  quartier          String
  avenue            String?
  numero            String?
  ville             String
  superficie        Float
  description       String?
  prix_vente        Float?
  type_terrain      String    // 'urbain', 'agricole', 'residentiel', 'commercial'
  statut            String    @default("disponible")
  images            String?   // URLs séparées par des virgules
  date_creation     DateTime  @default(now())
  utilisateur_id    Int
  utilisateur       Utilisateur @relation(fields: [utilisateur_id], references: [id])
  maisons           Maison[]
}
```

### Maison
```prisma
model Maison {
  id                Int       @id @default(autoincrement())
  titre             String
  nombre_chambres   Int
  nombre_salles_bain Int
  surface_totale    Float
  etat              String    // 'neuf', 'bon_etat', 'renovation', 'ancien'
  type_maison       String    // 'villa', 'appartement', 'duplex', 'studio', 'fermette', 'contemporaine'
  standing          String    // 'luxe', 'haut_de_gamme', 'standard', 'economique'
  type_offre        String    // 'vente', 'location', 'vente_location'
  description       String?
  jardin            Boolean   @default(false)
  garage            Boolean   @default(false)
  piscine           Boolean   @default(false)
  prix_vente        Float?
  prix_location     Float?
  images            String?   // URLs séparées par des virgules
  statut            String    @default("disponible")
  date_creation     DateTime  @default(now())
  
  // Relations
  parcelle_id       Int
  parcelle          Parcelle  @relation(fields: [parcelle_id], references: [id])
  utilisateur_id    Int?      // Propriétaire (via parcelle)
  utilisateur       Utilisateur? @relation("ProprietaireMaisons", fields: [utilisateur_id], references: [id])
}
```

## 🔐 API Endpoints

### 🏠 Routes Publiques

#### 📍 Parcelles
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/parcelles` | Lister toutes les parcelles avec filtres |
| `GET` | `/api/parcelles/search` | Rechercher par localisation |
| `GET` | `/api/parcelles/stats/quartier` | Statistiques par quartier |
| `GET` | `/api/parcelles/quartiers` | Liste des quartiers |
| `GET` | `/api/parcelles/avenues` | Liste des avenues par quartier |
| `GET` | `/api/parcelles/:id` | Obtenir une parcelle par ID |
| `GET` | `/api/parcelles/utilisateur/:id` | Parcelles d'un utilisateur |

#### 🏘️ Maisons
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/maisons` | Lister toutes les maisons avec filtres |
| `GET` | `/api/maisons/search` | Recherche avancée de maisons |
| `GET` | `/api/maisons/parcelle/search` | Recherche par localisation de parcelle |
| `GET` | `/api/maisons/stats` | Statistiques sur les maisons |
| `GET` | `/api/maisons/:id` | Obtenir une maison par ID |
| `GET` | `/api/maisons/parcelle/:id` | Maisons d'une parcelle spécifique |
| `GET` | `/api/maisons/utilisateur/:id` | Maisons d'un utilisateur |

#### 👤 Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/register` | Inscription utilisateur |
| `POST` | `/api/auth/login` | Connexion utilisateur |
| `GET` | `/api/health` | Statut de l'API |

### 🔒 Routes Protégées (JWT requis)

#### 📍 Parcelles
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/parcelles` | Créer une parcelle (avec images) |
| `PUT` | `/api/parcelles/:id` | Modifier une parcelle (avec images) |
| `DELETE` | `/api/parcelles/:id` | Supprimer une parcelle |

#### 🏘️ Maisons
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/maisons` | Créer une maison (avec images) |
| `PUT` | `/api/maisons/:id` | Modifier une maison (avec images) |
| `DELETE` | `/api/maisons/:id` | Supprimer une maison |

#### 👤 Utilisateurs & Administration
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/users` | Lister tous les utilisateurs |
| `GET` | `/api/users/:id` | Obtenir un utilisateur par ID |
| `POST` | `/api/users` | Créer un utilisateur |
| `PUT` | `/api/users/:id` | Modifier un utilisateur |
| `DELETE` | `/api/users/:id` | Supprimer un utilisateur |
| `GET` | `/api/auth/check` | Vérifier l'authentification |

## 🛠️ Installation et Configuration

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Créez un fichier `.env` :
```env
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="votre_cle_secrete_tres_longue_et_complexe"
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Configuration de la base de données
```bash
# Générer le client Prisma
npx prisma generate

# Créer/mettre à jour la base de données
npx prisma db push

# Ou créer une migration
npx prisma migrate dev --name init
```

### 4. Démarrage du serveur
```bash
# Développement (avec nodemon)
npm run dev

# Production
npm start
```

## 📝 Utilisation avec Postman

### Authentification
1. **Inscription** :
```bash
POST http://localhost:3000/api/auth/register
{
  "nom": "Jean Propriétaire",
  "email": "jean@email.com",
  "mot_de_passe": "password123",
  "type": "proprietaire",
  "telephone": "+243810000001",
  "adresse": "Goma, Katindo"
}
```

2. **Connexion** :
```bash
POST http://localhost:3000/api/auth/login
{
  "email": "jean@email.com",
  "mot_de_passe": "password123"
}
```

3. **Utiliser le token** dans les headers :
```
Authorization: Bearer VOTRE_TOKEN_JWT
```

### Gestion des Parcelles avec Images
Utilisez **FormData** pour créer/modifier des parcelles avec images :

**Headers :**
```
Authorization: Bearer VOTRE_TOKEN
Content-Type: multipart/form-data
```

**Body (Form Data) :**
- `titre`: "Terrain à Katindo"
- `quartier`: "Katindo"
- `ville`: "Goma"
- `superficie`: 500
- `type_terrain`: "residentiel"
- `utilisateur_id`: 1
- `role`: "proprietaire"
- `images`: [sélectionner fichiers images]

### Gestion des Maisons avec Images
**Headers :**
```
Authorization: Bearer VOTRE_TOKEN
Content-Type: multipart/form-data
```

**Body (Form Data) - Champs requis :**
- `titre`: "Villa moderne avec piscine"
- `nombre_chambres`: 4
- `nombre_salles_bain`: 3
- `surface_totale`: 250
- `etat`: "neuf"
- `type_maison`: "villa"
- `standing`: "luxe"
- `type_offre`: "vente"
- `parcelle_id`: 1

**Champs optionnels :**
- `description`: "Magnifique villa..."
- `jardin`: true
- `garage`: true
- `piscine`: true
- `prix_vente`: 500000
- `prix_location`: null
- `statut`: "disponible"
- `images`: [sélectionner fichiers images]

## 🔍 Fonctionnalités Avancées

### Recherche et Filtres des Parcelles
```bash
# Recherche par quartier
GET /api/parcelles/search?quartier=Katindo

# Recherche par avenue
GET /api/parcelles/search?avenue=Lumumba

# Filtres multiples
GET /api/parcelles?type_terrain=residentiel&min_prix=10000&max_prix=50000

# Recherche globale
GET /api/parcelles?search=Katindo

# Pagination
GET /api/parcelles?page=1&limit=10
```

### Recherche et Filtres des Maisons
```bash
# Recherche par caractéristiques
GET /api/maisons?type_maison=villa&min_chambres=3&standing=luxe

# Recherche par localisation (via parcelle)
GET /api/maisons/parcelle/search?quartier=katindo&ville=goma

# Filtres avancés
GET /api/maisons/search?avec_jardin=true&avec_piscine=true&min_surface=150

# Recherche par type d'offre
GET /api/maisons?type_offre=location&max_prix_location=2000
```

### Types et Catégories

#### Parcelles - Types de Terrain
- `urbain`
- `agricole` 
- `residentiel`
- `commercial`

#### Maisons - Types
- `villa`
- `appartement`
- `duplex`
- `studio`
- `fermette`
- `contemporaine`

#### Maisons - Standings
- `luxe`
- `haut_de_gamme`
- `standard`
- `economique`

#### Maisons - États
- `neuf`
- `bon_etat`
- `renovation`
- `ancien`

#### Types d'Offre (Maisons)
- `vente`
- `location`
- `vente_location`

#### Statuts
- `disponible` (par défaut)
- `vendu`
- `loue`
- `en_negociation`

## 🖼️ Gestion des Images

### Configuration
| Module | Format acceptés | Taille max | Nombre max | Dossier |
|--------|----------------|------------|------------|---------|
| Parcelles | Toutes images (image/*) | 5MB | 5 | `uploads/parcelles/` |
| Maisons | JPG, PNG, WebP, GIF | 10MB | 10 | `uploads/maisons/` |

### URLs des Images
Les images sont accessibles via :
- Parcelles : `http://localhost:3000/uploads/parcelles/nom-du-fichier.jpg`
- Maisons : `http://localhost:3000/uploads/maisons/nom-du-fichier.jpg`

### Nettoyage automatique
- Suppression des images en cas d'erreur de création
- Suppression des anciennes images lors de la mise à jour
- Nettoyage lors de la suppression d'une ressource

## 🛡️ Sécurité

### Authentification JWT
- Tokens valables 7 jours
- Vérification automatique des routes protégées
- Middleware `authenticateToken` pour sécuriser les endpoints

### Validation des Données
- Validation des types et catégories
- Validation des rôles utilisateur
- Validation des formats d'email
- Hash des mots de passe avec bcrypt
- Protection contre les injections SQL (Prisma)

### Sécurité des Fichiers
- Validation des types MIME
- Noms de fichiers uniques
- Limites de taille et quantité
- Filtrage des extensions

## 🚨 Gestion des Erreurs

### Codes d'Erreur Courants
| Code | Signification | Exemple |
|------|--------------|---------|
| `400` | Données invalides | Champs manquants, types incorrects |
| `401` | Non authentifié | Token manquant ou invalide |
| `403` | Accès refusé | Droits insuffisants |
| `404` | Ressource non trouvée | ID inexistant |
| `409` | Conflit de données | Email déjà utilisé |
| `413` | Fichier trop volumineux | Image > 10MB |
| `415` | Type non supporté | Fichier non-image |
| `500` | Erreur serveur interne | Erreur base de données |

### Exemples de Réponses d'Erreur
```json
{
  "error": "Champs requis manquants: standing, type_maison",
  "code": "VALIDATION_ERROR"
}
```

```json
{
  "error": "Fichier trop volumineux. Taille max: 10MB",
  "code": "LIMIT_FILE_SIZE"
}
```

```json
{
  "error": "Parcelle non trouvée",
  "code": "P2025"
}
```

## 📊 Statistiques et Rapports

### Parcelles
```bash
# Statistiques par quartier
GET /api/parcelles/stats/quartier

# Liste des quartiers disponibles
GET /api/parcelles/quartiers?ville=goma

# Liste des avenues par quartier
GET /api/parcelles/avenues?quartier=katindo
```

### Maisons
```bash
# Statistiques générales
GET /api/maisons/stats

# Statistiques filtrées
GET /api/maisons/stats?ville=goma&type_offre=vente

# Statistiques détaillées par catégorie
GET /api/maisons/stats?standing=luxe&type_maison=villa
```

## 🔄 Relations entre Modèles

### Hiérarchie des données
```
Utilisateur
    ├── Parcelle
    │     ├── Maison
    │     └── Maison
    └── Parcelle
          └── Maison
```

### Récupération des données liées
```javascript
// Une maison inclut automatiquement :
{
  maison: {...},
  parcelle: {
    ...,
    utilisateur: {...}  // Propriétaire
  }
}

// Une parcelle inclut automatiquement :
{
  parcelle: {...},
  utilisateur: {...},
  maisons: [...]  // Toutes les maisons sur cette parcelle
}
```

## 🧪 Tests et Débogage

### Routes de développement
```bash
# Test création maison avec JSON
POST /api/maisons/test-json

# Test simple de réception
POST /api/maisons/public-test

# Liste des parcelles pour débogage
GET /api/maisons/debug/parcelles
```

### Logs de débogage
Activez les logs détaillés :
```javascript
// Le serveur affiche automatiquement :
- ✅ Modules activés
- ✅ Upload d'images activé
- ✅ Routes disponibles
- 🧪 Données reçues (en développement)
- 🔍 Requêtes SQL (en développement)
```

## 📈 Migration des Données

### Ajout d'un nouveau module
1. Ajouter le modèle dans `schema.prisma`
2. Générer le client Prisma : `npx prisma generate`
3. Créer le contrôleur
4. Créer les routes
5. Ajouter le middleware d'upload si nécessaire
6. Tester avec Postman

### Exemple : Ajout du module "Maisons"
```bash
# 1. Modifier schema.prisma
# 2. Mettre à jour la base de données
npx prisma db push

# 3. Vérifier les données existantes
npx prisma studio
```

## 🌐 Déploiement

### Variables d'Environnement Production
```env
NODE_ENV=production
JWT_SECRET="cle_secrete_tres_longue_en_production"
DATABASE_URL="postgresql://user:password@localhost:5432/ardhi_db"
PORT=8080
```

### Recommendations Production
- **Base de données** : PostgreSQL ou MySQL
- **Stockage images** : Cloud (AWS S3, Cloudinary)
- **Reverse proxy** : Nginx pour HTTPS et cache
- **Monitoring** : PM2 ou Docker avec health checks
- **Backup** : Sauvegarde automatique de la base de données
- **CDN** : Pour servir les images (CloudFront, Cloudflare)

### Scripts de déploiement
```bash
# Build pour production
npm run build

# Démarrage en production
npm start

# Avec PM2
pm2 start app.js --name "ardhi-api"

# Avec Docker
docker build -t ardhi-api .
docker run -p 3000:3000 ardhi-api
```

## 📞 Support et Dépannage

### Problèmes Courants et Solutions

#### 1. **Erreurs Prisma**
```bash
# Régénérer le client
npx prisma generate

# Réinitialiser la base de données (développement)
npx prisma db push --force-reset
```

#### 2. **Problèmes d'upload**
```bash
# Vérifier les permissions
chmod -R 755 uploads/

# Vérifier l'espace disque
df -h
```

#### 3. **Erreurs JWT**
```bash
# Vérifier la variable d'environnement
echo $JWT_SECRET

# Redémarrer avec nouvelle variable
JWT_SECRET="nouvelle_cle" npm run dev
```

#### 4. **Port déjà utilisé**
```bash
# Vérifier les processus
sudo lsof -i :3000

# Changer le port
PORT=3001 npm run dev
```

### Logs de débogage détaillés
Activez les logs SQL Prisma :
```env
# Dans .env
DATABASE_URL="file:./dev.db"
LOG_LEVEL="query"  # Affiche les requêtes SQL
```

## 📚 Ressources Utiles

### Documentation
- **Express.js** : https://expressjs.com/
- **Prisma** : https://www.prisma.io/docs/
- **Multer** : https://github.com/expressjs/multer
- **JWT** : https://jwt.io/

### Outils de test
- **Postman** : https://www.postman.com/
- **Insomnia** : https://insomnia.rest/
- **Prisma Studio** : Interface visuelle pour la base de données

### Bonnes pratiques
- Validation des entrées utilisateur
- Gestion centralisée des erreurs
- Logs structurés
- Tests unitaires et d'intégration
- Documentation à jour

## 📄 Licence
MIT License - Voir le fichier LICENSE pour plus de détails.

## 👥 Auteurs
**Développé par** : Hervé IRAGI  
**Contact** : [herve.iragi@email.com]  
**Version** : 2.0.0  
**Dernière mise à jour** : 2025-12-02  

## 🏷️ Versions
- **1.0.0** : Module Utilisateurs et Parcelles
- **2.0.0** : Ajout du module Maisons, upload multi-modules, statistiques avancées

---

*Cette documentation est mise à jour régulièrement. Consultez la route `/` pour la documentation interactive en temps réel.*  
*Pour toute question ou problème, consultez la section "Support et Dépannage" ou ouvrez une issue sur le dépôt.*