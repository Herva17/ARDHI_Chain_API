const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Vérifier l'authentification
router.get('/check', authController.checkAuth);

module.exports = router;