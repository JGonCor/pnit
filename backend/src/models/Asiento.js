const { pool } = require('../config/db');

class Asiento {
    constructor(id, fila, numero, seccion, estado = 'disponible') {
        this.id = id;
        this.fila = fila;
        this.numero = numero;
        this.seccion = seccion;
        this.estado = estado;
    }

    // Crear tabla de asientos en la base de datos
    static async crearTabla() {
        try {
            const connection = await pool.getConnection();
            
            await connection.query(`
                CREATE TABLE IF NOT EXISTS asientos (
                    id VARCHAR(20) PRIMARY KEY,
                    fila INT NOT NULL,
                    numero INT NOT NULL,
                    seccion ENUM('izquierda', 'derecha') NOT NULL,
                    estado ENUM('disponible', 'ocupado', 'reservado') DEFAULT 'disponible',
                    reserva_id INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_fila_seccion (fila, seccion),
                    INDEX idx_estado (estado),
                    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE SET NULL
                )
            `);
            
            console.log('✅ Tabla de asientos creada correctamente');
            connection.release();
            return true;
        } catch (error) {
            console.error('❌ Error creando tabla de asientos:', error);
            return false;
        }
    }

    // Inicializar todos los asientos del evento
    static async inicializarAsientos() {
        try {
            const connection = await pool.getConnection();
            
            // Verificar si ya hay asientos inicializados
            const [existingSeats] = await connection.query('SELECT COUNT(*) as count FROM asientos');
            if (existingSeats[0].count > 0) {
                console.log('ℹ️ Los asientos ya están inicializados');
                connection.release();
                return true;
            }

            // Configuración de asientos
            const TOTAL_FILAS = 21;
            const PRIMERA_FILA_ASIENTOS = 10; // Por sección
            const DEMAS_FILAS_ASIENTOS = 12; // Por sección
            const SECCIONES = ['izquierda', 'derecha'];

            const asientos = [];

            for (let fila = 1; fila <= TOTAL_FILAS; fila++) {
                const asientosPorSeccion = fila === 1 ? PRIMERA_FILA_ASIENTOS : DEMAS_FILAS_ASIENTOS;
                
                for (const seccion of SECCIONES) {
                    for (let numero = 1; numero <= asientosPorSeccion; numero++) {
                        // Nuevo formato: SecciónFila-Asiento (Ej: L5-12, R10-5)
                        // L = Left (izquierda), R = Right (derecha)
                        const letraSeccion = seccion === 'izquierda' ? 'L' : 'R';
                        const id = `${letraSeccion}${fila}-${numero}`;
                        asientos.push([id, fila, numero, seccion, 'disponible']);
                    }
                }
            }

            // Insertar todos los asientos
            await connection.query(
                'INSERT INTO asientos (id, fila, numero, seccion, estado) VALUES ?',
                [asientos]
            );

            console.log(`✅ Inicializados ${asientos.length} asientos correctamente`);
            connection.release();
            return true;
        } catch (error) {
            console.error('❌ Error inicializando asientos:', error);
            return false;
        }
    }

    // Obtener todos los asientos con su estado
    static async obtenerTodos() {
        try {
            const connection = await pool.getConnection();
            
            const [asientos] = await connection.query(`
                SELECT 
                    a.id,
                    a.fila,
                    a.numero,
                    a.seccion,
                    a.estado,
                    a.reserva_id,
                    r.id as reserva_info_id,
                    c.nombre as cliente_nombre
                FROM asientos a
                LEFT JOIN reservas r ON a.reserva_id = r.id
                LEFT JOIN clientes c ON r.cliente_id = c.id
                ORDER BY a.fila, a.seccion, a.numero
            `);
            
            connection.release();
            return asientos;
        } catch (error) {
            console.error('❌ Error obteniendo asientos:', error);
            return [];
        }
    }

    // Obtener asientos disponibles
    static async obtenerDisponibles() {
        try {
            const connection = await pool.getConnection();
            
            const [asientos] = await connection.query(`
                SELECT id, fila, numero, seccion
                FROM asientos 
                WHERE estado = 'disponible'
                ORDER BY fila, seccion, numero
            `);
            
            connection.release();
            return asientos;
        } catch (error) {
            console.error('❌ Error obteniendo asientos disponibles:', error);
            return [];
        }
    }

    // Reservar asientos
    static async reservarAsientos(idsAsientos, reservaId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Verificar que todos los asientos están disponibles
            const [asientosVerificar] = await connection.query(`
                SELECT id, estado 
                FROM asientos 
                WHERE id IN (${idsAsientos.map(() => '?').join(',')})
                FOR UPDATE
            `, idsAsientos);

            const noDisponibles = asientosVerificar.filter(asiento => asiento.estado !== 'disponible');
            if (noDisponibles.length > 0) {
                throw new Error(`Los siguientes asientos ya no están disponibles: ${noDisponibles.map(a => a.id).join(', ')}`);
            }

            // Marcar asientos como reservados
            await connection.query(`
                UPDATE asientos 
                SET estado = 'reservado', reserva_id = ?, updated_at = NOW()
                WHERE id IN (${idsAsientos.map(() => '?').join(',')})
            `, [reservaId, ...idsAsientos]);

            await connection.commit();
            console.log(`✅ Asientos reservados correctamente: ${idsAsientos.join(', ')}`);
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error reservando asientos:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Ocupar asientos (pago completo)
    static async ocuparAsientos(idsAsientos, reservaId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Marcar asientos como ocupados
            await connection.query(`
                UPDATE asientos 
                SET estado = 'ocupado', reserva_id = ?, updated_at = NOW()
                WHERE id IN (${idsAsientos.map(() => '?').join(',')})
            `, [reservaId, ...idsAsientos]);

            await connection.commit();
            console.log(`✅ Asientos ocupados correctamente: ${idsAsientos.join(', ')}`);
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error ocupando asientos:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Liberar asientos (cancelar reserva)
    static async liberarAsientos(idsAsientos) {
        try {
            const connection = await pool.getConnection();
            
            await connection.query(`
                UPDATE asientos 
                SET estado = 'disponible', reserva_id = NULL, updated_at = NOW()
                WHERE id IN (${idsAsientos.map(() => '?').join(',')})
            `, idsAsientos);

            console.log(`✅ Asientos liberados correctamente: ${idsAsientos.join(', ')}`);
            connection.release();
            return true;
        } catch (error) {
            console.error('❌ Error liberando asientos:', error);
            return false;
        }
    }

    // Convertir reservas a ocupados (completar pago)
    static async completarPagoAsientos(reservaId) {
        try {
            const connection = await pool.getConnection();
            
            await connection.query(`
                UPDATE asientos 
                SET estado = 'ocupado', updated_at = NOW()
                WHERE reserva_id = ? AND estado = 'reservado'
            `, [reservaId]);

            console.log(`✅ Asientos de la reserva ${reservaId} marcados como ocupados`);
            connection.release();
            return true;
        } catch (error) {
            console.error('❌ Error completando pago de asientos:', error);
            return false;
        }
    }

    // Obtener estadísticas de ocupación
    static async obtenerEstadisticas() {
        try {
            const connection = await pool.getConnection();
            
            const [stats] = await connection.query(`
                SELECT 
                    estado,
                    COUNT(*) as cantidad
                FROM asientos
                GROUP BY estado
            `);

            const estadisticas = {
                disponibles: 0,
                reservados: 0,
                ocupados: 0,
                total: 500
            };

            stats.forEach(stat => {
                estadisticas[stat.estado + 's'] = stat.cantidad;
            });

            connection.release();
            return estadisticas;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {
                disponibles: 500,
                reservados: 0,
                ocupados: 0,
                total: 500
            };
        }
    }
}

module.exports = Asiento; 