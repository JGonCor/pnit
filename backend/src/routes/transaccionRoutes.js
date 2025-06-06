const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');
const { verificarToken, verificarRol, rateLimit, sanitizeInput } = require('../middleware/auth');

// Ruta para obtener todas las transacciones (solo administradores)
router.get('/', 
    verificarToken, 
    verificarRol(['admin']), 
    sanitizeInput,
    transaccionController.obtenerTransacciones
);

// Ruta para obtener una transacción por su referencia (solo administradores)
router.get('/referencia/:referencia', 
    verificarToken, 
    verificarRol(['admin']), 
    sanitizeInput,
    transaccionController.obtenerTransaccionPorReferencia
);

// Ruta para obtener transacciones por reserva ID (solo administradores)
router.get('/reserva/:reservaId', 
    verificarToken, 
    verificarRol(['admin']), 
    sanitizeInput,
    transaccionController.obtenerTransaccionesPorReserva
);

module.exports = router; 