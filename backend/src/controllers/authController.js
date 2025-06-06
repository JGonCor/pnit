const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

class AuthController {
  /**
   * Autenticar un usuario y generar token JWT
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validar campos obligatorios
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      }
      
      // Validar credenciales
      const usuario = await usuarioModel.validarCredenciales(email, password);
      
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // Generar token JWT
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET || 'secret_key_for_jwt_123456',
        { expiresIn: '8h' }
      );
      
      // Retornar información del usuario y token
      res.status(200).json({
        mensaje: 'Autenticación exitosa',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Verificar si un token es válido y devolver la información del usuario
   */
  async verificarToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }
      
      // Verificar el token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_for_jwt_123456');
        
        // Obtener información actualizada del usuario
        const usuario = await usuarioModel.obtenerPorId(decoded.id);
        
        if (!usuario) {
          return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        res.status(200).json({
          mensaje: 'Token válido',
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
          }
        });
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    } catch (error) {
      console.error('Error en verificarToken:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Middleware para verificar autenticación
   */
  verificarAuth(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }
      
      // Verificar el token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_for_jwt_123456');
        req.usuario = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    } catch (error) {
      console.error('Error en verificarAuth:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Middleware para verificar rol de administrador
   */
  verificarAdmin(req, res, next) {
    if (req.usuario && req.usuario.rol === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    }
  }
}

module.exports = new AuthController(); 