const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/auth');

// Routes publiques
router.get('/', locationController.getLocations);
router.get('/stats', locationController.getStatsLocations);
router.get('/:id', locationController.getLocationById);

// Routes protégées
router.post('/', authenticateToken, locationController.createLocation);
router.put('/:id/activer', authenticateToken, locationController.activerLocation);
router.put('/:id/paiement', authenticateToken, locationController.enregistrerPaiement);
router.put('/:id/terminer', authenticateToken, locationController.terminerLocation);
router.put('/:id/resilier', authenticateToken, locationController.resilierLocation);

module.exports = router;