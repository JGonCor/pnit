const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { rateLimit, sanitizeInput } = require('../middleware/auth');
const Asiento = require('../models/Asiento');

// Ruta pública para buscar reservas pendientes por email
// Con rate limiting más estricto y validación adicional
router.get('/reservas/pendientes/:email', 
    rateLimit(5, 60000), // Solo 5 búsquedas por minuto
    sanitizeInput,
    async (req, res) => {
        try {
            const { email } = req.params;
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    error: 'Formato de email inválido',
                    code: 'INVALID_EMAIL_FORMAT' 
                });
            }
            
            // Registrar búsqueda para auditoría
            console.log(`Búsqueda de reservas pendientes para: ${email} desde IP: ${req.ip}`);
            
            // Usar el controlador existente
            await reservaController.obtenerReservasPendientes(req, res);
        } catch (error) {
            console.error('Error en búsqueda pública de reservas:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                code: 'INTERNAL_ERROR' 
            });
        }
    }
);

// Ruta para crear reserva (sin autenticación pero con validación estricta)
router.post('/reservas',
    rateLimit(3, 60000), // Solo 3 reservas por minuto por IP
    sanitizeInput,
    async (req, res) => {
        try {
            // Validaciones adicionales antes de procesar
            const { nombre, email, telefono, cantidad } = req.body;
            
            if (!nombre || !email || !telefono || !cantidad) {
                return res.status(400).json({
                    error: 'Todos los campos son obligatorios',
                    code: 'MISSING_FIELDS'
                });
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Formato de email inválido',
                    code: 'INVALID_EMAIL'
                });
            }
            
            // Validar cantidad
            const cantidadNum = parseInt(cantidad);
            if (isNaN(cantidadNum) || cantidadNum < 1 || cantidadNum > 10) {
                return res.status(400).json({
                    error: 'Cantidad debe estar entre 1 y 10',
                    code: 'INVALID_QUANTITY'
                });
            }
            
            // Registrar intento de reserva para auditoría
            console.log(`Nueva reserva desde: ${req.ip} - Email: ${email} - Cantidad: ${cantidad}`);
            
            // Usar el controlador existente
            await reservaController.crearReserva(req, res);
        } catch (error) {
            console.error('Error en creación pública de reserva:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// Ruta de validación de referencia de pago (muy limitada)
router.get('/pagos/validar/:referencia',
    rateLimit(10, 300000), // 10 validaciones cada 5 minutos
    sanitizeInput,
    async (req, res) => {
        try {
            const { referencia } = req.params;
            
            // Validar formato de referencia
            if (!referencia || referencia.length < 5 || referencia.length > 50) {
                return res.status(400).json({
                    error: 'Formato de referencia inválido',
                    code: 'INVALID_REFERENCE'
                });
            }
            
            const transaccionModel = require('../models/transaccionModel');
            const transaccion = await transaccionModel.obtenerPorReferencia(referencia);
            
            if (!transaccion) {
                return res.status(404).json({
                    error: 'Transacción no encontrada',
                    code: 'TRANSACTION_NOT_FOUND'
                });
            }
            
            // Solo devolver información mínima necesaria
            res.status(200).json({
                existe: true,
                estado: transaccion.estado,
                fecha: transaccion.created_at,
                // NO incluir información sensible como montos o datos del cliente
            });
        } catch (error) {
            console.error('Error validando referencia:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// Ruta para suscripciones de email desde la landing page
router.post('/suscripciones',
    rateLimit(5, 300000), // 5 suscripciones cada 5 minutos por IP
    sanitizeInput,
    async (req, res) => {
        try {
            const { nombre, email, origen } = req.body;
            
            // Validar campos obligatorios
            if (!nombre || !email) {
                return res.status(400).json({
                    error: 'Nombre y email son obligatorios',
                    code: 'MISSING_FIELDS'
                });
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Formato de email inválido',
                    code: 'INVALID_EMAIL'
                });
            }
            
            // Validar longitud de nombre
            if (nombre.length > 100) {
                return res.status(400).json({
                    error: 'El nombre es demasiado largo',
                    code: 'INVALID_NAME_LENGTH'
                });
            }
            
            // Registrar intento de suscripción para auditoría
            console.log(`Nueva suscripción desde: ${req.ip} - Email: ${email} - Origen: ${origen || 'landing_page'}`);
            
            // Intentar guardar en base de datos
            const { pool } = require('../config/db');
            const connection = await pool.getConnection();
            
            try {
                // Verificar si el email ya existe
                const [existingSubscription] = await connection.query(
                    'SELECT id FROM suscripciones WHERE email = ?',
                    [email.toLowerCase()]
                );
                
                if (existingSubscription.length > 0) {
                    // Email ya está suscrito
                    connection.release();
                    return res.status(200).json({
                        mensaje: 'Suscripción exitosa',
                        code: 'ALREADY_SUBSCRIBED',
                        ya_suscrito: true
                    });
                }
                
                // Insertar nueva suscripción
                await connection.query(
                    'INSERT INTO suscripciones (nombre, email, origen, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [nombre, email.toLowerCase(), origen || 'landing_page', req.ip]
                );
                
                connection.release();
                
                res.status(201).json({
                    mensaje: 'Suscripción exitosa',
                    code: 'SUBSCRIPTION_SUCCESS'
                });
                
            } catch (dbError) {
                connection.release();
                throw dbError;
            }
            
        } catch (error) {
            console.error('Error al procesar suscripción:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// Ruta pública para obtener estado de asientos ocupados/reservados
router.get('/asientos-ocupados',
    rateLimit(20, 60000), // 20 consultas por minuto
    sanitizeInput,
    async (req, res) => {
        try {
            console.log(`Consulta de asientos ocupados desde IP: ${req.ip}`);
            
            const asientos = await Asiento.obtenerTodos();
            
            // Filtrar solo asientos ocupados y reservados (sin información personal)
            const ocupados = asientos
                .filter(asiento => asiento.estado === 'ocupado')
                .map(asiento => asiento.id);
                
            const reservados = asientos
                .filter(asiento => asiento.estado === 'reservado')
                .map(asiento => asiento.id);
            
            res.status(200).json({
                ocupados: ocupados,
                reservados: reservados,
                total_ocupados: ocupados.length,
                total_reservados: reservados.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error obteniendo asientos ocupados:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// Ruta pública para obtener cupos disponibles
router.get('/cupos',
    rateLimit(30, 60000), // 30 consultas por minuto
    sanitizeInput,
    async (req, res) => {
        try {
            const estadisticas = await Asiento.obtenerEstadisticas();
            
            res.status(200).json({
                disponibles: estadisticas.disponibles,
                ocupados: estadisticas.ocupados,
                reservados: estadisticas.reservados,
                total: estadisticas.total,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error obteniendo cupos disponibles:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

module.exports = router; 