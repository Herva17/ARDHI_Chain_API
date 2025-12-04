const express = require('express');
require('dotenv').config();
const path = require('path');
// 👇 AJOUTEZ CETTE LIGNE
const cors = require('cors');

// Import des routes
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const authCheckRoutes = require('./src/routes/authCheckRoutes');
const parcelleRoutes = require('./src/routes/parcelleRoutes');
const maisonRoutes = require('./src/routes/maisonRoutes');
const locationRoutes = require('./src/routes/locationRoutes');

const app = express();

// 🔧 MIDDLEWARES ESSENTIELS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👇 CONFIGURATION CORS (AJOUTEZ CETTE SECTION)
app.use(cors({
  origin: ['http://localhost:9000', 'http://localhost:8080', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// OU version simple pour développement :
// app.use(cors());

// 👇 SERVIR LES FICHIERS STATIQUES (IMAGES)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/parcelles', express.static(path.join(__dirname, 'uploads/parcelles')));
app.use('/uploads/maisons', express.static(path.join(__dirname, 'uploads/maisons')));

// 🛣️ ROUTES
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', authCheckRoutes);
app.use('/api/parcelles', parcelleRoutes);
app.use('/api/maisons', maisonRoutes);
app.use('/api/locations', locationRoutes);

// 🏠 ROUTE RACINE - DOCUMENTATION
app.get('/', (req, res) => {
  res.json({ 
    message: 'API ARHDI - Gestion Immobilière Complète 🚀',
    version: '2.1.0',
    modules: ['Users', 'Auth', 'Parcelles', 'Maisons', 'Locations'],
    endpoints: {
      health: {
        'GET /api/health': 'Vérifier le statut de l\'API'
      },
      users: {
        'GET /api/users': 'Lister tous les utilisateurs',
        'POST /api/users': 'Créer un utilisateur',
        'GET /api/users/:id': 'Obtenir un utilisateur',
        'PUT /api/users/:id': 'Modifier un utilisateur',
        'DELETE /api/users/:id': 'Supprimer un utilisateur'
      },
      auth: {
        'POST /api/auth/register': 'Créer un utilisateur (renvoie token)',
        'POST /api/auth/login': 'Connexion (renvoie token)',
        'GET /api/auth/check': 'Vérifier l\'authentification'
      },
      parcelles: {
        'GET /api/parcelles': 'Lister toutes les parcelles (avec filtres)',
        'GET /api/parcelles/search': 'Rechercher par quartier/avenue/ville',
        'GET /api/parcelles/stats/quartier': 'Statistiques par quartier',
        'GET /api/parcelles/quartiers': 'Liste des quartiers',
        'GET /api/parcelles/avenues': 'Liste des avenues par quartier',
        'POST /api/parcelles': 'Créer une parcelle (upload images)',
        'GET /api/parcelles/:id': 'Obtenir une parcelle',
        'GET /api/parcelles/utilisateur/:utilisateur_id': 'Parcelles d\'un utilisateur',
        'PUT /api/parcelles/:id': 'Modifier une parcelle (upload images)',
        'DELETE /api/parcelles/:id': 'Supprimer une parcelle'
      },
      maisons: {
        'GET /api/maisons': 'Lister toutes les maisons (avec filtres avancés)',
        'GET /api/maisons/search': 'Recherche avancée de maisons',
        'GET /api/maisons/parcelle/search': 'Recherche par localisation de parcelle',
        'GET /api/maisons/stats': 'Statistiques des maisons',
        'GET /api/maisons/:id': 'Obtenir une maison par ID',
        'GET /api/maisons/parcelle/:parcelle_id': 'Maisons d\'une parcelle',
        'GET /api/maisons/utilisateur/:utilisateur_id': 'Maisons d\'un utilisateur',
        'POST /api/maisons': 'Créer une maison (upload images)',
        'PUT /api/maisons/:id': 'Modifier une maison (upload images)',
        'DELETE /api/maisons/:id': 'Supprimer une maison'
      },
      locations: {
        'GET /api/locations': 'Lister toutes les locations (avec filtres)',
        'GET /api/locations/stats': 'Statistiques des locations',
        'GET /api/locations/:id': 'Obtenir une location par ID',
        'POST /api/locations': 'Créer une location',
        'PUT /api/locations/:id/activer': 'Activer une location (après signature)',
        'PUT /api/locations/:id/paiement': 'Enregistrer un paiement',
        'PUT /api/locations/:id/terminer': 'Terminer une location',
        'PUT /api/locations/:id/resilier': 'Résilier une location'
      }
    },
    filtres_disponibles: {
      parcelles: {
        'type_terrain': 'urbain, agricole, residentiel, commercial',
        'statut': 'disponible, vendu, en_negociation',
        'ville': 'Filtrer par ville',
        'quartier': 'Filtrer par quartier',
        'avenue': 'Filtrer par avenue',
        'min_prix, max_prix': 'Filtrer par prix',
        'min_superficie, max_superficie': 'Filtrer par superficie',
        'search': 'Recherche globale (titre, quartier, avenue, ville, description)',
        'page, limit': 'Pagination'
      },
      maisons: {
        'type_maison': 'villa, appartement, duplex, studio, fermette, contemporaine',
        'standing': 'luxe, haut_de_gamme, standard, economique',
        'etat': 'neuf, bon_etat, renovation, ancien',
        'type_offre': 'vente, location, vente_location',
        'statut': 'disponible, vendu, loue, en_negociation',
        'min_chambres, max_chambres': 'Filtrer par nombre de chambres',
        'min_surface, max_surface': 'Filtrer par surface',
        'min_prix_vente, max_prix_vente': 'Filtrer par prix de vente',
        'min_prix_location, max_prix_location': 'Filtrer par prix de location',
        'ville, quartier': 'Filtrer par localisation (via parcelle)',
        'jardin, garage, piscine': 'Filtrer par équipements',
        'utilisateur_id': 'Filtrer par propriétaire',
        'parcelle_id': 'Filtrer par parcelle',
        'search': 'Recherche globale',
        'page, limit': 'Pagination'
      },
      locations: {
        'statut': 'en_attente, en_cours, termine, resilie',
        'utilisateur_id': 'Filtrer par locataire',
        'maison_id': 'Filtrer par maison',
        'page, limit': 'Pagination'
      }
    },
    exemples_utilisation: {
      auth: {
        'register': 'POST /api/auth/register { "nom": "John", "email": "john@email.com", "mot_de_passe": "secret", "type": "proprietaire" }',
        'login': 'POST /api/auth/login { "email": "john@email.com", "mot_de_passe": "secret" }'
      },
      parcelles: {
        'créer_parcelle': 'POST /api/parcelles (FormData) { "titre": "Terrain", "quartier": "Katindo", "ville": "Goma", "superficie": 500, "type_terrain": "residentiel", "utilisateur_id": 1, "role": "proprietaire", "images": [fichiers] }',
        'recherche_quartier': 'GET /api/parcelles/search?quartier=Katindo',
        'filtres_complets': 'GET /api/parcelles?quartier=Katindo&type_terrain=residentiel&min_prix=10000&max_prix=50000'
      },
      maisons: {
        'créer_maison': 'POST /api/maisons (FormData) { "titre": "Villa moderne", "nombre_chambres": 4, "nombre_salles_bain": 3, "surface_totale": 250, "etat": "neuf", "type_maison": "villa", "standing": "luxe", "type_offre": "vente", "parcelle_id": 1, "jardin": true, "garage": true, "piscine": true, "prix_vente": 150000, "images": [fichiers] }',
        'recherche_maisons': 'GET /api/maisons?type_maison=villa&min_chambres=3&standing=luxe&jardin=true',
        'statistiques': 'GET /api/maisons/stats?ville=Goma'
      },
      locations: {
        'créer_location': 'POST /api/locations { "maison_id": 1, "utilisateur_id": 2, "date_debut": "2024-01-01", "date_fin": "2024-12-31", "loyer_mensuel": 1000, "caution": 2000, "contrat_url": "https://..." }',
        'activer_location': 'PUT /api/locations/1/activer { "contrat_url": "https://..." }',
        'enregistrer_paiement': 'PUT /api/locations/1/paiement { "montant": 1000 }',
        'terminer_location': 'PUT /api/locations/1/terminer'
      }
    },
    types_et_valeurs: {
      types_utilisateur: ['proprietaire', 'commissionnaire', 'admin', 'user'],
      types_terrain: ['urbain', 'agricole', 'residentiel', 'commercial'],
      types_maison: ['villa', 'appartement', 'duplex', 'studio', 'fermette', 'contemporaine'],
      standings: ['luxe', 'haut_de_gamme', 'standard', 'economique'],
      etats_maison: ['neuf', 'bon_etat', 'renovation', 'ancien'],
      types_offre: ['vente', 'location', 'vente_location'],
      statuts_location: ['en_attente', 'en_cours', 'termine', 'resilie']
    },
    notes_importantes: [
      'Pour les uploads d\'images, utilisez Content-Type: multipart/form-data',
      'Les routes protégées nécessitent un header Authorization: Bearer <token>',
      'Les images sont accessibles via /uploads/{module}/{filename}',
      'Les locations créent automatiquement des relations entre maisons et utilisateurs'
    ]
  });
});

// ✅ ROUTE SANTÉ
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'API ARHDI en fonctionnement',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    modules: ['Users', 'Auth', 'Parcelles', 'Maisons', 'Locations'],
    endpoints_count: {
      users: 5,
      auth: 3,
      parcelles: 10,
      maisons: 8,
      locations: 8
    },
    database: 'SQLite',
    uploads: {
      parcelles: 'activé (max 5MB, 5 fichiers)',
      maisons: 'activé (max 10MB, 10 fichiers)',
      locations: 'contrats PDF via URLs'
    }
  });
});

// 🚨 GESTION DES ROUTES NON TROUVÉES
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: `L'endpoint ${req.originalUrl} n'existe pas`,
    documentation: 'Visitez http://localhost:3000 pour voir tous les endpoints disponibles',
    suggestions: [
      '/api/health',
      '/api/auth/login',
      '/api/parcelles',
      '/api/maisons',
      '/api/locations',
      '/api/users'
    ]
  });
});

// 🚨 GESTION DES ERREURS GLOBALES
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  // Erreurs Multer (upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'Erreur d\'upload',
      message: 'Fichier trop volumineux. Maximum 10MB par image.'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ 
      error: 'Erreur d\'upload',
      message: 'Trop de fichiers uploadés.'
    });
  }
  
  // Erreurs Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({ 
      error: 'Conflict',
      message: 'Cette valeur existe déjà (contrainte d\'unicité)'
    });
  }
  
  if (error.code === 'P2003') {
    return res.status(400).json({ 
      error: 'Relation invalide',
      message: 'La référence n\'existe pas'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Non trouvé',
      message: 'L\'enregistrement demandé n\'existe pas'
    });
  }

  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue. Veuillez réessayer plus tard.',
    timestamp: new Date().toISOString()
  });
});

// 🚀 DÉMARRAGE DU SERVEUR
const PORT = process.env.PORT || 3000;
console.log('='.repeat(50));
console.log('🚀 API ARHDI - Gestion Immobilière Complète');
console.log('='.repeat(50));
console.log(`📦 Version: 2.1.0`);
console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Configuré' : '✗ Manquant'}`);
console.log(`🗄️  Base de données: SQLite (${process.env.DATABASE_URL})`);
console.log('='.repeat(50));
console.log(`📋 Documentation: http://localhost:${PORT}`);
console.log(`❤️  Santé API: http://localhost:${PORT}/api/health`);
console.log(`🔐 Authentification: http://localhost:${PORT}/api/auth`);
console.log(`🏡 Parcelles: http://localhost:${PORT}/api/parcelles`);
console.log(`🏠 Maisons: http://localhost:${PORT}/api/maisons`);
console.log(`📝 Locations: http://localhost:${PORT}/api/locations`);
console.log(`👤 Utilisateurs: http://localhost:${PORT}/api/users`);
console.log('='.repeat(50));
console.log(`✅ 5 modules activés: Users, Auth, Parcelles, Maisons, Locations`);
console.log(`✅ Upload d'images activé (parcelles & maisons)`);
console.log(`✅ Service statique activé pour /uploads`);
console.log('='.repeat(50));

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log('='.repeat(50));
});

// ⚠️ ⚠️ ⚠️ SUPPRIMEZ TOUT CE QUI SUIT CETTE LIGNE ⚠️ ⚠️ ⚠️
// NE GARDEZ PAS LA DEUXIÈME COPIE DU CODE !