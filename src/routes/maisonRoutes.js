// maisonRoutes.js
const express = require('express');
const router = express.Router();
const maisonController = require('../controllers/maisonController');
const { authenticateToken } = require('../middleware/auth');
const { handleFormData } = require('../middleware/upload');

// Middleware pour parser JSON (pour les tests)
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ==================== ROUTES PUBLIQUES ====================

/**
 * @route GET /api/maisons
 * @desc Récupérer toutes les maisons avec filtres
 * @access Public
 * @query {string} [type_maison] - Type de maison (villa, appartement, etc.)
 * @query {string} [standing] - Standing (luxe, standard, etc.)
 * @query {string} [etat] - État de la maison
 * @query {string} [type_offre] - Type d'offre (vente, location)
 * @query {number} [min_chambres] - Nombre minimum de chambres
 * @query {number} [max_chambres] - Nombre maximum de chambres
 * @query {number} [min_surface] - Surface minimum
 * @query {number} [max_surface] - Surface maximum
 * @query {boolean} [jardin] - Avec jardin
 * @query {boolean} [garage] - Avec garage
 * @query {boolean} [piscine] - Avec piscine
 * @query {string} [ville] - Ville de la parcelle
 * @query {string} [quartier] - Quartier de la parcelle
 * @query {string} [search] - Recherche globale
 * @query {number} [page=1] - Numéro de page
 * @query {number} [limit=10] - Nombre d'éléments par page
 */
router.get('/', maisonController.getMaisons);

/**
 * @route GET /api/maisons/search
 * @desc Recherche avancée de maisons
 * @access Public
 * @query {string} [type_maison] - Type de maison
 * @query {string} [standing] - Standing
 * @query {number} [min_chambres] - Chambres minimum
 * @query {number} [max_chambres] - Chambres maximum
 * @query {number} [min_surface] - Surface minimum
 * @query {number} [max_surface] - Surface maximum
 * @query {string} [ville] - Ville
 * @query {string} [quartier] - Quartier
 * @query {boolean} [avec_jardin] - Avec jardin
 * @query {boolean} [avec_garage] - Avec garage
 * @query {boolean} [avec_piscine] - Avec piscine
 */
router.get('/search', maisonController.searchMaisons);

/**
 * @route GET /api/maisons/parcelle/search
 * @desc Recherche des maisons par localisation de parcelle
 * @access Public
 * @query {string} [quartier] - Quartier de la parcelle
 * @query {string} [avenue] - Avenue de la parcelle
 * @query {string} [ville] - Ville de la parcelle
 * @example /api/maisons/parcelle/search?quartier=katindo
 * @example /api/maisons/parcelle/search?ville=goma&quartier=katindo
 */
router.get('/parcelle/search', maisonController.searchMaisonsByLocation);

/**
 * @route GET /api/maisons/stats
 * @desc Obtenir des statistiques sur les maisons
 * @access Public
 * @query {string} [ville] - Filtrer par ville
 * @query {string} [quartier] - Filtrer par quartier
 * @query {string} [type_offre] - Filtrer par type d'offre
 */
router.get('/stats', maisonController.getStatsMaisons);

/**
 * @route GET /api/maisons/:id
 * @desc Récupérer une maison par son ID
 * @access Public
 * @param {number} id - ID de la maison
 */
router.get('/:id', maisonController.getMaisonById);

/**
 * @route GET /api/maisons/parcelle/:parcelle_id
 * @desc Récupérer toutes les maisons d'une parcelle
 * @access Public
 * @param {number} parcelle_id - ID de la parcelle
 */
router.get('/parcelle/:parcelle_id', maisonController.getMaisonsByParcelle);

/**
 * @route GET /api/maisons/utilisateur/:utilisateur_id
 * @desc Récupérer toutes les maisons d'un utilisateur
 * @access Public
 * @param {number} utilisateur_id - ID de l'utilisateur
 */
router.get('/utilisateur/:utilisateur_id', maisonController.getMaisonsByUtilisateur);

// ==================== ROUTES PROTÉGÉES ====================

/**
 * @route POST /api/maisons
 * @desc Créer une nouvelle maison
 * @access Private (Authentifié)
 * @body {string} titre - Titre de la maison
 * @body {number} nombre_chambres - Nombre de chambres
 * @body {number} nombre_salles_bain - Nombre de salles de bain
 * @body {number} surface_totale - Surface totale
 * @body {string} etat - État (neuf, bon_etat, etc.)
 * @body {string} type_maison - Type (villa, appartement, etc.)
 * @body {string} standing - Standing (luxe, standard, etc.)
 * @body {string} type_offre - Type d'offre (vente, location)
 * @body {number} parcelle_id - ID de la parcelle
 * @body {string} [description] - Description
 * @body {boolean} [jardin] - Avec jardin
 * @body {boolean} [garage] - Avec garage
 * @body {boolean} [piscine] - Avec piscine
 * @body {number} [prix_vente] - Prix de vente
 * @body {number} [prix_location] - Prix de location
 * @body {string} [statut] - Statut (disponible, vendu, etc.)
 * @files {image[]} [images] - Images de la maison
 */
router.post('/', authenticateToken, handleFormData, maisonController.createMaison);

/**
 * @route PUT /api/maisons/:id
 * @desc Mettre à jour une maison
 * @access Private (Authentifié - Propriétaire ou Admin)
 * @param {number} id - ID de la maison à mettre à jour
 * @body {string} [titre] - Titre de la maison
 * @body {number} [nombre_chambres] - Nombre de chambres
 * @body {number} [nombre_salles_bain] - Nombre de salles de bain
 * @body {number} [surface_totale] - Surface totale
 * @body {string} [etat] - État
 * @body {string} [type_maison] - Type
 * @body {string} [standing] - Standing
 * @body {string} [type_offre] - Type d'offre
 * @body {string} [description] - Description
 * @body {boolean} [jardin] - Avec jardin
 * @body {boolean} [garage] - Avec garage
 * @body {boolean} [piscine] - Avec piscine
 * @body {number} [prix_vente] - Prix de vente
 * @body {number} [prix_location] - Prix de location
 * @body {string} [statut] - Statut
 * @body {number} [parcelle_id] - ID de la parcelle
 * @files {image[]} [images] - Nouvelles images (remplacent les anciennes)
 */
router.put('/:id', authenticateToken, handleFormData, maisonController.updateMaison);

/**
 * @route DELETE /api/maisons/:id
 * @desc Supprimer une maison
 * @access Private (Authentifié - Propriétaire ou Admin)
 * @param {number} id - ID de la maison à supprimer
 */
router.delete('/:id', authenticateToken, maisonController.deleteMaison);

// ==================== ROUTES DE TEST (DÉVELOPPEMENT) ====================

/**
 * @route POST /api/maisons/test-json
 * @desc Route de test pour création avec JSON
 * @access Public (Développement seulement)
 */
router.post('/test-json', (req, res, next) => {
  console.log('🧪 Route test JSON - Données reçues:', req.body);
  
  // Simuler les URLs d'images pour le test
  req.imageUrls = req.body.imageUrls || [];
  
  // Passez au contrôleur
  next();
}, maisonController.createMaison);

/**
 * @route POST /api/maisons/public-test
 * @desc Route publique de test
 * @access Public (Développement seulement)
 */
router.post('/public-test', (req, res) => {
  console.log('📥 Route test publique - Données reçues:', req.body);
  
  // Vérifier les champs requis
  const requiredFields = ['titre', 'standing', 'type_maison', 'parcelle_id'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Champs manquants: ${missingFields.join(', ')}`,
      received: req.body
    });
  }
  
  res.json({
    success: true,
    message: 'Test réussi',
    data: {
      ...req.body,
      standing: req.body.standing,
      content_type: req.headers['content-type']
    }
  });
});

// ==================== ROUTES DE DEBUG ====================

/**
 * @route GET /api/maisons/debug/parcelles
 * @desc Debug: Voir toutes les parcelles disponibles
 * @access Public (Développement)
 */
router.get('/debug/parcelles', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const parcelles = await prisma.parcelle.findMany({
      select: {
        id: true,
        titre: true,
        quartier: true,
        ville: true,
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      count: parcelles.length,
      parcelles: parcelles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;