const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // Corriger le chemin d'import

// Route pour l'inscription
router.post('/signup', userController.signup);

// Route pour la connexion
router.post('/login', userController.login);

module.exports = router;
