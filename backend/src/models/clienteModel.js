const { pool } = require('../config/db');

class ClienteModel {
  /**
   * Crea un nuevo cliente o devuelve uno existente si el email ya existe
   * @param {Object} cliente - Datos del cliente
   * @returns {Object} - Cliente con ID
   */
  async crearOEncontrar(cliente) {
    try {
      // Verificar si el cliente ya existe por email
      const [rows] = await pool.query(
        'SELECT * FROM clientes WHERE email = ?',
        [cliente.email]
      );
      
      // Si el cliente existe, devolver
      if (rows.length > 0) {
        return rows[0];
      }
      
      // Si no existe, crear nuevo cliente
      const [result] = await pool.query(
        'INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)',
        [cliente.nombre, cliente.email, cliente.telefono]
      );
      
      // Devolver el cliente con su ID
      return {
        id: result.insertId,
        ...cliente
      };
    } catch (error) {
      console.error('Error en crearOEncontrar:', error);
      throw error;
    }
  }

  /**
   * Obtiene un cliente por su ID
   * @param {number} id - ID del cliente
   * @returns {Object|null} - Cliente o null si no existe
   */
  async obtenerPorId(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      throw error;
    }
  }

  /**
   * Obtiene un cliente por su email
   * @param {string} email - Email del cliente
   * @returns {Object|null} - Cliente o null si no existe
   */
  async obtenerPorEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM clientes WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en obtenerPorEmail:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los clientes
   * @returns {Array} - Lista de clientes
   */
  async obtenerTodos() {
    try {
      const [rows] = await pool.query('SELECT * FROM clientes ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      throw error;
    }
  }
}

module.exports = new ClienteModel(); 