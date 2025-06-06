const { pool } = require('../config/db');

class ReservaModel {
  /**
   * Crea una nueva reserva
   * @param {Object} reserva - Datos de la reserva
   * @returns {Object} - Reserva con ID
   */
  async crear(reserva) {
    try {
      const [result] = await pool.query(
        `INSERT INTO reservas (
          cliente_id, 
          cantidad, 
          tiene_discapacidad, 
          num_movilidad_reducida, 
          tipo_pago, 
          precio_unitario, 
          monto_total, 
          monto_pagado, 
          descuento_aplicado, 
          porcentaje_descuento, 
          codigo_cupon,
          descuento_monto,
          asientos_seleccionados,
          estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reserva.cliente_id,
          reserva.cantidad,
          reserva.tiene_discapacidad,
          reserva.num_movilidad_reducida || 0,
          reserva.tipo_pago,
          reserva.precio_unitario,
          reserva.monto_total,
          reserva.monto_pagado,
          reserva.descuento_aplicado || false,
          reserva.porcentaje_descuento || 0,
          reserva.codigo_cupon || null,
          reserva.descuento_monto || 0,
          reserva.asientos_seleccionados ? JSON.stringify(reserva.asientos_seleccionados) : null,
          reserva.estado || 'pendiente'
        ]
      );
      
      return {
        id: result.insertId,
        ...reserva
      };
    } catch (error) {
      console.error('Error en crear reserva:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una reserva a "completado"
   * @param {number} id - ID de la reserva
   * @param {number} montoRestante - Monto restante pagado
   * @returns {boolean} - Éxito de la operación
   */
  async completarReserva(id, montoRestante) {
    try {
      // Obtener la reserva actual
      const [reservaActual] = await pool.query('SELECT * FROM reservas WHERE id = ?', [id]);
      
      if (reservaActual.length === 0) {
        throw new Error(`Reserva con ID ${id} no encontrada`);
      }
      
      // Calcular nuevo monto pagado
      const nuevoPagado = parseFloat(reservaActual[0].monto_pagado) + parseFloat(montoRestante);
      
      // Actualizar reserva
      await pool.query(
        'UPDATE reservas SET estado = ?, monto_pagado = ?, tipo_pago = ? WHERE id = ?',
        ['completado', nuevoPagado, 'completo', id]
      );
      
      return true;
    } catch (error) {
      console.error('Error en completarReserva:', error);
      throw error;
    }
  }

  /**
   * Obtiene una reserva por su ID
   * @param {number} id - ID de la reserva
   * @returns {Object|null} - Reserva o null si no existe
   */
  async obtenerPorId(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM reservas WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      throw error;
    }
  }

  /**
   * Obtiene reservas pendientes de completar para un cliente
   * @param {number} clienteId - ID del cliente
   * @returns {Array} - Lista de reservas pendientes con información del cliente
   */
  async obtenerReservasPendientes(clienteId) {
    try {
      const [rows] = await pool.query(
        `SELECT r.*, c.nombre, c.email, c.telefono 
         FROM reservas r 
         JOIN clientes c ON r.cliente_id = c.id 
         WHERE r.cliente_id = ? AND r.tipo_pago = ? AND r.estado = ? 
         ORDER BY r.created_at DESC`,
        [clienteId, 'reserva', 'pendiente']
      );
      return rows;
    } catch (error) {
      console.error('Error en obtenerReservasPendientes:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las reservas
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de reservas
   */
  async obtenerTodas(filtros = {}) {
    try {
      let query = 'SELECT r.*, c.nombre, c.email, c.telefono FROM reservas r JOIN clientes c ON r.cliente_id = c.id';
      const values = [];
      
      // Construir cláusula WHERE si hay filtros
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.tipo_pago) {
          condiciones.push('r.tipo_pago = ?');
          values.push(filtros.tipo_pago);
        }
        
        if (filtros.estado) {
          condiciones.push('r.estado = ?');
          values.push(filtros.estado);
        }
        
        if (filtros.email) {
          condiciones.push('c.email LIKE ?');
          values.push(`%${filtros.email}%`);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }
      
      query += ' ORDER BY r.created_at DESC';
      
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error en obtenerTodas:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de factura de una reserva
   * @param {number} id - ID de la reserva
   * @param {string} numeroFactura - Número de factura generado
   * @returns {boolean} - Éxito de la operación
   */
  async actualizarFactura(id, numeroFactura) {
    try {
      await pool.query(
        'UPDATE reservas SET factura_generada = ?, numero_factura = ? WHERE id = ?',
        [true, numeroFactura, id]
      );
      return true;
    } catch (error) {
      console.error('Error en actualizarFactura:', error);
      throw error;
    }
  }
}

module.exports = new ReservaModel(); 