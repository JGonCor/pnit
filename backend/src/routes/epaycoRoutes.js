const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken, verificarRol, rateLimit, verificarOrigenEpayco } = require('../middleware/auth');

// Ruta pública para confirmación de ePayco (con validación de origen y rate limiting)
// Esta es la URL que ePayco llama cuando se completa un pago
router.post('/confirmacion', 
    rateLimit(100, 60000), // Permitir más solicitudes para ePayco
    verificarOrigenEpayco,
    reservaController.procesarConfirmacionPago
);

// Ruta para validar una referencia de pago específica (solo para administradores)
router.get('/validar/:referencia', 
    verificarToken, 
    verificarRol(['admin', 'visualizador']),
    async (req, res) => {
    try {
        const { referencia } = req.params;
        
        // Aquí podrías hacer una consulta adicional a ePayco si necesitas
        // verificar el estado en tiempo real
        
        const transaccionModel = require('../models/transaccionModel');
        const transaccion = await transaccionModel.obtenerPorReferencia(referencia);
        
        if (!transaccion) {
            return res.status(404).json({ 
                error: 'Transacción no encontrada',
                referencia: referencia 
            });
        }
        
        res.status(200).json({
            mensaje: 'Transacción encontrada',
            transaccion: {
                referencia: transaccion.referencia,
                estado: transaccion.estado,
                monto: transaccion.monto,
                fecha: transaccion.created_at
            }
        });
    } catch (error) {
        console.error('Error al validar referencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Webhook adicional para notificaciones de ePayco (con validación de origen)
router.post('/webhook', 
    rateLimit(200, 60000), // Rate limit más alto para webhooks
    verificarOrigenEpayco,
    (req, res) => {
    try {
        console.log('Webhook recibido de ePayco:', req.body);
        
        // Procesar webhook si es necesario
        // Por ahora, solo confirmamos que lo recibimos
        
        res.status(200).json({ mensaje: 'Webhook procesado correctamente' });
    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
});

module.exports = router; 