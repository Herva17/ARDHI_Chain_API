const express = require('express');
const router = express.Router();
const parcelleController = require('../controllers/parcelleController');
const { authenticateToken } = require('../middleware/auth');
const { handleFormData } = require('../middleware/upload');

// Routes publiques
router.get('/', parcelleController.getParcelles);
router.get('/search', parcelleController.searchParcelles);
router.get('/stats/quartier', parcelleController.getStatsByQuartier);
router.get('/quartiers', parcelleController.getQuartiers);
router.get('/avenues', parcelleController.getAvenuesByQuartier);
router.get('/:id', parcelleController.getParcelleById);
router.get('/utilisateur/:utilisateur_id', parcelleController.getParcellesByUtilisateur);

// Routes protégées avec upload d'images
router.post('/', authenticateToken, handleFormData, parcelleController.createParcelle);
router.put('/:id', authenticateToken, handleFormData, parcelleController.updateParcelle);
router.delete('/:id', authenticateToken, parcelleController.deleteParcelle);

module.exports = router;