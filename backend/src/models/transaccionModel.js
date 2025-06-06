const { pool } = require('../config/db');

class TransaccionModel {
  /**
   * Crea una nueva transacción
   * @param {Object} transaccion - Datos de la transacción
   * @returns {Object} - Transacción con ID
   */
  async crear(transaccion) {
    try {
      const [result] = await pool.query(
        `INSERT INTO transacciones (
          reserva_id, 
          referencia, 
          tipo_transaccion, 
          monto, 
          estado, 
          codigo_estado, 
          respuesta_completa
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transaccion.reserva_id,
          transaccion.referencia,
          transaccion.tipo_transaccion,
          transaccion.monto,
          transaccion.estado,
          transaccion.codigo_estado,
          JSON.stringify(transaccion.respuesta_completa || {})
        ]
      );
      
      return {
        id: result.insertId,
        ...transaccion
      };
    } catch (error) {
      console.error('Error en crear transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene una transacción por su referencia
   * @param {string} referencia - Referencia de la transacción
   * @returns {Object|null} - Transacción o null si no existe
   */
  async obtenerPorReferencia(referencia) {
    try {
      const [rows] = await pool.query('SELECT * FROM transacciones WHERE referencia = ?', [referencia]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en obtenerPorReferencia:', error);
      throw error;
    }
  }

  /**
   * Obtiene transacciones por reserva ID
   * @param {number} reservaId - ID de la reserva
   * @returns {Array} - Lista de transacciones
   */
  async obtenerPorReservaId(reservaId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM transacciones WHERE reserva_id = ? ORDER BY created_at DESC',
        [reservaId]
      );
      return rows;
    } catch (error) {
      console.error('Error en obtenerPorReservaId:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las transacciones
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de transacciones
   */
  async obtenerTodas(filtros = {}) {
    try {
      let query = `
        SELECT t.*, r.cantidad, r.tipo_pago, c.nombre, c.email 
        FROM transacciones t 
        JOIN reservas r ON t.reserva_id = r.id 
        JOIN clientes c ON r.cliente_id = c.id
      `;
      
      const values = [];
      
      // Construir cláusula WHERE si hay filtros
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.estado) {
          condiciones.push('t.estado = ?');
          values.push(filtros.estado);
        }
        
        if (filtros.tipo_transaccion) {
          condiciones.push('t.tipo_transaccion = ?');
          values.push(filtros.tipo_transaccion);
        }
        
        if (filtros.referencia) {
          condiciones.push('t.referencia LIKE ?');
          values.push(`%${filtros.referencia}%`);
        }
        
        if (filtros.email) {
          condiciones.push('c.email LIKE ?');
          values.push(`%${filtros.email}%`);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }
      
      query += ' ORDER BY t.created_at DESC';
      
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error en obtenerTodas:', error);
      throw error;
    }
  }
}

module.exports = new TransaccionModel(); 