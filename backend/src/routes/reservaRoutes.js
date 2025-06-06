const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken, verificarRol, rateLimit, sanitizeInput } = require('../middleware/auth');

// Ruta para crear una nueva reserva (rate limited)
router.post('/', rateLimit(10, 60000), sanitizeInput, reservaController.crearReserva);

// Ruta para procesar confirmación de pago de ePayco (sin auth, pero con validación)
router.post('/confirmacion', rateLimit(50, 60000), reservaController.procesarConfirmacionPago);

// Ruta para obtener reservas pendientes por email (limitada y autenticada)
router.get('/pendientes/:email', 
    rateLimit(20, 60000), 
    sanitizeInput, 
    verificarToken, 
    verificarRol(['admin', 'visualizador']), 
    reservaController.obtenerReservasPendientes
);

// Ruta para obtener todas las reservas (solo administradores)
router.get('/', 
    verificarToken, 
    verificarRol(['admin']), 
    sanitizeInput,
    reservaController.obtenerReservas
);

// Ruta para obtener detalle de una reserva (solo administradores)
router.get('/:id', 
    verificarToken, 
    verificarRol(['admin']), 
    sanitizeInput,
    reservaController.obtenerDetalleReserva
);

module.exports = router; 