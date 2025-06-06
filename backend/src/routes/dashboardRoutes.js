const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authController = require('../controllers/authController');

// Aplicar middleware de autenticación a todas las rutas
router.use(authController.verificarAuth);

// Ruta para obtener estadísticas generales del dashboard
router.get('/estadisticas', dashboardController.obtenerEstadisticas);

// Rutas para exportar datos
router.get('/exportar/transacciones', dashboardController.exportarTransacciones);
router.get('/exportar/reservas', dashboardController.exportarReservas);
router.get('/exportar/suscripciones', dashboardController.exportarSuscripciones);

// Ruta para generar informe de ventas por período
router.get('/informes/ventas', dashboardController.generarInformeVentas);

// Rutas para gestión de suscripciones
router.get('/suscripciones', dashboardController.obtenerSuscripciones);
router.put('/suscripciones/:id/estado', dashboardController.actualizarEstadoSuscripcion);

module.exports = router; 