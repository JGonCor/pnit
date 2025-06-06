const express = require('express');
const router = express.Router();
const Asiento = require('../models/Asiento');
const authController = require('../controllers/authController');

// Obtener todos los asientos con su estado
router.get('/', async (req, res) => {
    try {
        const asientos = await Asiento.obtenerTodos();
        
        // Agrupar asientos por estado para facilitar el manejo en frontend
        const estadosAsientos = {
            disponibles: asientos.filter(a => a.estado === 'disponible').map(a => a.id),
            ocupados: asientos.filter(a => a.estado === 'ocupado').map(a => a.id),
            reservados: asientos.filter(a => a.estado === 'reservado').map(a => a.id)
        };

        res.json({
            success: true,
            asientos: asientos,
            estados: estadosAsientos,
            total: asientos.length
        });
    } catch (error) {
        console.error('Error obteniendo asientos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener solo asientos disponibles
router.get('/disponibles', async (req, res) => {
    try {
        const asientos = await Asiento.obtenerDisponibles();
        
        res.json({
            success: true,
            asientos: asientos,
            cantidad: asientos.length
        });
    } catch (error) {
        console.error('Error obteniendo asientos disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de ocupación
router.get('/estadisticas', async (req, res) => {
    try {
        const estadisticas = await Asiento.obtenerEstadisticas();
        
        res.json({
            success: true,
            estadisticas: estadisticas
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar disponibilidad de asientos específicos
router.post('/verificar', async (req, res) => {
    try {
        const { asientos } = req.body;
        
        if (!asientos || !Array.isArray(asientos) || asientos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar una lista de asientos a verificar'
            });
        }

        const todosLosAsientos = await Asiento.obtenerTodos();
        const asientosVerificar = todosLosAsientos.filter(a => asientos.includes(a.id));
        
        const disponibles = asientosVerificar.filter(a => a.estado === 'disponible');
        const noDisponibles = asientosVerificar.filter(a => a.estado !== 'disponible');

        res.json({
            success: true,
            disponibles: disponibles.map(a => a.id),
            no_disponibles: noDisponibles.map(a => ({
                id: a.id,
                estado: a.estado,
                cliente: a.cliente_nombre || null
            })),
            todos_disponibles: noDisponibles.length === 0
        });
    } catch (error) {
        console.error('Error verificando asientos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Inicializar asientos (solo para setup inicial)
router.post('/inicializar', async (req, res) => {
    try {
        // Crear tabla si no existe
        await Asiento.crearTabla();
        
        // Inicializar asientos
        const resultado = await Asiento.inicializarAsientos();
        
        if (resultado) {
            res.json({
                success: true,
                message: 'Asientos inicializados correctamente'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error inicializando asientos'
            });
        }
    } catch (error) {
        console.error('Error en inicialización:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint público para obtener estado de asientos (sin datos sensibles)
router.get('/publico/estado', async (req, res) => {
    try {
        const asientos = await Asiento.obtenerTodos();
        
        // Devolver solo IDs y estados, sin información personal
        const estadoPublico = asientos.map(asiento => ({
            id: asiento.id,
            estado: asiento.estado
        }));

        res.json({
            success: true,
            asientos: estadoPublico,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo estado público:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// === ENDPOINTS ADMINISTRATIVOS (requieren autenticación) ===

// Marcar asientos como vendidos manualmente (para asesores)
router.post('/admin/marcar-vendidos', authController.verificarAuth, async (req, res) => {
    try {
        const { asientos, cliente_info } = req.body;
        
        if (!asientos || !Array.isArray(asientos) || asientos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar una lista de asientos'
            });
        }

        if (!cliente_info || !cliente_info.nombre || !cliente_info.email) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar información del cliente (nombre y email)'
            });
        }

        // Crear una reserva "manual" del administrador
        const connection = await require('../config/db').pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Verificar que todos los asientos están disponibles
            const [asientosVerificar] = await connection.query(`
                SELECT id, estado 
                FROM asientos 
                WHERE id IN (${asientos.map(() => '?').join(',')})
                FOR UPDATE
            `, asientos);

            const noDisponibles = asientosVerificar.filter(asiento => asiento.estado !== 'disponible');
            if (noDisponibles.length > 0) {
                throw new Error(`Los siguientes asientos ya no están disponibles: ${noDisponibles.map(a => a.id).join(', ')}`);
            }

            // Crear cliente si no existe
            let clienteId;
            const [clienteExistente] = await connection.query(
                'SELECT id FROM clientes WHERE email = ?',
                [cliente_info.email]
            );

            if (clienteExistente.length > 0) {
                clienteId = clienteExistente[0].id;
            } else {
                const [clienteResult] = await connection.query(`
                    INSERT INTO clientes (nombre, email, telefono, documento, ciudad)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    cliente_info.nombre,
                    cliente_info.email,
                    cliente_info.telefono || '',
                    cliente_info.documento || '',
                    cliente_info.ciudad || 'Bogotá'
                ]);
                clienteId = clienteResult.insertId;
            }

            // Crear reserva marcada como "venta directa"
            const [reservaResult] = await connection.query(`
                INSERT INTO reservas (
                    cliente_id, 
                    cantidad_entradas, 
                    precio_total, 
                    precio_pagado, 
                    descuento_aplicado, 
                    tipo_pago, 
                    estado, 
                    asientos_seleccionados,
                    tiene_movilidad_reducida,
                    notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                clienteId,
                asientos.length,
                asientos.length * 500000, // Precio base por entrada
                asientos.length * 500000, // Completamente pagado
                0, // Sin descuento por defecto
                'venta_directa',
                'completado',
                JSON.stringify(asientos),
                0,
                `Venta directa registrada por administrador ${req.user.email}`
            ]);

            const reservaId = reservaResult.insertId;

            // Marcar asientos como ocupados
            await connection.query(`
                UPDATE asientos 
                SET estado = 'ocupado', reserva_id = ?, updated_at = NOW()
                WHERE id IN (${asientos.map(() => '?').join(',')})
            `, [reservaId, ...asientos]);

            await connection.commit();

            res.json({
                success: true,
                message: `${asientos.length} asientos marcados como vendidos exitosamente`,
                reserva_id: reservaId,
                cliente_id: clienteId,
                asientos_vendidos: asientos
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error marcando asientos como vendidos:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

// Liberar asientos manualmente (cancelar venta)
router.post('/admin/liberar', authController.verificarAuth, async (req, res) => {
    try {
        const { asientos, motivo } = req.body;
        
        if (!asientos || !Array.isArray(asientos) || asientos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar una lista de asientos'
            });
        }

        const connection = await require('../config/db').pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Obtener información de los asientos antes de liberarlos
            const [asientosInfo] = await connection.query(`
                SELECT a.id, a.estado, a.reserva_id, r.id as reserva_existe 
                FROM asientos a
                LEFT JOIN reservas r ON a.reserva_id = r.id
                WHERE a.id IN (${asientos.map(() => '?').join(',')})
                FOR UPDATE
            `, asientos);

            // Verificar que los asientos están ocupados o reservados
            const asientosValidos = asientosInfo.filter(a => 
                a.estado === 'ocupado' || a.estado === 'reservado'
            );

            if (asientosValidos.length === 0) {
                throw new Error('Ninguno de los asientos seleccionados puede ser liberado');
            }

            // Liberar asientos
            await connection.query(`
                UPDATE asientos 
                SET estado = 'disponible', reserva_id = NULL, updated_at = NOW()
                WHERE id IN (${asientosValidos.map(() => '?').join(',')})
            `, asientosValidos.map(a => a.id));

            // Agregar nota a las reservas afectadas
            const reservasAfectadas = [...new Set(asientosValidos
                .filter(a => a.reserva_id)
                .map(a => a.reserva_id))];

            for (const reservaId of reservasAfectadas) {
                await connection.query(`
                    UPDATE reservas 
                    SET notas = CONCAT(COALESCE(notas, ''), '\nAsientos liberados manualmente por admin ${req.user.email}: ${motivo || 'Sin motivo especificado'}')
                    WHERE id = ?
                `, [reservaId]);
            }

            await connection.commit();

            res.json({
                success: true,
                message: `${asientosValidos.length} asientos liberados exitosamente`,
                asientos_liberados: asientosValidos.map(a => a.id),
                reservas_afectadas: reservasAfectadas
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error liberando asientos:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

// Obtener información detallada de asientos para admin
router.get('/admin/detallado', authController.verificarAuth, async (req, res) => {
    try {
        const connection = await require('../config/db').pool.getConnection();
        
        const [asientos] = await connection.query(`
            SELECT 
                a.id,
                a.fila,
                a.numero,
                a.seccion,
                a.estado,
                a.reserva_id,
                a.updated_at,
                r.id as reserva_info_id,
                r.estado as reserva_estado,
                r.tipo_pago,
                r.precio_pagado,
                r.precio_total,
                r.created_at as fecha_reserva,
                c.nombre as cliente_nombre,
                c.email as cliente_email,
                c.telefono as cliente_telefono
            FROM asientos a
            LEFT JOIN reservas r ON a.reserva_id = r.id
            LEFT JOIN clientes c ON r.cliente_id = c.id
            ORDER BY a.fila, a.seccion, a.numero
        `);
        
        // Agrupar por estado para facilitar la visualización
        const asientosPorEstado = {
            disponibles: asientos.filter(a => a.estado === 'disponible'),
            reservados: asientos.filter(a => a.estado === 'reservado'),
            ocupados: asientos.filter(a => a.estado === 'ocupado')
        };

        // Estadísticas
        const estadisticas = await Asiento.obtenerEstadisticas();

        connection.release();

        res.json({
            success: true,
            asientos: asientos,
            asientos_por_estado: asientosPorEstado,
            estadisticas: estadisticas,
            total: asientos.length
        });
    } catch (error) {
        console.error('Error obteniendo información detallada:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 