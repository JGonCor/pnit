const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta de login
router.post('/login', authController.login);

// Ruta para verificar token
router.get('/verificar', authController.verificarToken);

module.exports = router; 