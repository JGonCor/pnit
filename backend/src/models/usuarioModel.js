const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class UsuarioModel {
  /**
   * Crea un nuevo usuario administrador
   * @param {Object} usuario - Datos del usuario
   * @returns {Object} - Usuario creado con ID
   */
  async crear(usuario) {
    try {
      // Generar hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(usuario.password, salt);
      
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [usuario.nombre, usuario.email, hashedPassword, usuario.rol || 'admin']
      );
      
      return {
        id: result.insertId,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol || 'admin'
      };
    } catch (error) {
      console.error('Error en crear usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su correo electrónico
   * @param {string} email - Correo electrónico del usuario
   * @returns {Object|null} - Usuario o null si no existe
   */
  async obtenerPorEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en obtenerPorEmail:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID
   * @param {number} id - ID del usuario
   * @returns {Object|null} - Usuario o null si no existe
   */
  async obtenerPorId(id) {
    try {
      const [rows] = await pool.query('SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios
   * @returns {Array} - Lista de usuarios
   */
  async obtenerTodos() {
    try {
      const [rows] = await pool.query('SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      throw error;
    }
  }

  /**
   * Valida las credenciales de un usuario
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Object|null} - Usuario autenticado o null si las credenciales son inválidas
   */
  async validarCredenciales(email, password) {
    try {
      const usuario = await this.obtenerPorEmail(email);
      
      if (!usuario) {
        return null;
      }
      
      // Verificar la contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password);
      
      if (!passwordValida) {
        return null;
      }
      
      // Devolver el usuario sin la contraseña
      const { password: _, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    } catch (error) {
      console.error('Error en validarCredenciales:', error);
      throw error;
    }
  }
}

module.exports = new UsuarioModel(); 