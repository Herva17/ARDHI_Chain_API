const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Routes protégées
router.get('/', authenticateToken, userController.getUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.post('/', userController.createUser); // Public pour la création
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;