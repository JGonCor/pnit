const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pnit_eventos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para inicializar la base de datos con las tablas necesarias
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Crear tabla de clientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        documento VARCHAR(20) NOT NULL,
        ciudad VARCHAR(100) NOT NULL DEFAULT 'Bogotá',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla de reservas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        cantidad INT NOT NULL,
        tiene_discapacidad BOOLEAN DEFAULT FALSE,
        num_movilidad_reducida INT DEFAULT 0,
        tipo_pago ENUM('completo', 'venta_directa') NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL default 0,
        monto_total DECIMAL(10, 2) NOT NULL default 0,
        monto_pagado DECIMAL(10, 2) NOT NULL default 0,
        descuento_aplicado BOOLEAN DEFAULT FALSE,
        porcentaje_descuento DECIMAL(5, 2) DEFAULT 0,
        codigo_cupon VARCHAR(20) DEFAULT NULL,
        descuento_monto DECIMAL(10, 2) DEFAULT 0,
        asientos_seleccionados JSON DEFAULT NULL,
        estado ENUM('pendiente', 'completado', 'cancelado') DEFAULT 'pendiente',
        factura_generada BOOLEAN DEFAULT FALSE,
        numero_factura VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        notas TEXT DEFAULT NULL,
        INDEX idx_estado (estado),
        INDEX idx_tipo_pago (tipo_pago),
        INDEX idx_created_at (created_at)
      )
    `);
    
    // Crear tabla de transacciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transacciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reserva_id INT NOT NULL,
        referencia VARCHAR(255) NOT NULL,
        tipo_transaccion ENUM('nueva', 'completar') NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        codigo_estado VARCHAR(10) NOT NULL,
        respuesta_completa JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reserva_id) REFERENCES reservas(id)
      )
    `);
    
    // Crear tabla de usuarios administradores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'visualizador') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla de suscripciones de email
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suscripciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        origen VARCHAR(50) DEFAULT 'landing_page',
        ip_address VARCHAR(45),
        estado ENUM('activo', 'inactivo', 'cancelado') DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_estado (estado),
        INDEX idx_origen (origen)
      )
    `);

    // Crear tabla de asientos numerados
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

    // Crear tabla de facturas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS facturas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_factura VARCHAR(50) NOT NULL UNIQUE,
        reserva_id INT NOT NULL,
        datos_factura JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_numero_factura (numero_factura),
        INDEX idx_reserva_id (reserva_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
      )
    `);

    // Verificar y migrar formato de asientos si es necesario
    await migrarFormatoAsientos(connection);

    // Inicializar asientos si la tabla está vacía
    const [asientosCount] = await connection.query('SELECT COUNT(*) as count FROM asientos');
    if (asientosCount[0].count === 0) {
      // Configuración de asientos: 21 filas, primera fila 10 asientos por sección, demás filas 12 asientos por sección
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

      console.log(`✅ Inicializados ${asientos.length} asientos numerados (500 total)`);
      console.log(`📍 Formato de IDs: SecciónFila-Asiento (Ej: L1-1 a L21-12, R1-1 a R21-12)`);
    }
    
    // Verificar si existe un usuario administrador por defecto
    const [adminRows] = await connection.query('SELECT COUNT(*) as count FROM usuarios');
    
    // Si no hay usuarios, crear uno por defecto
    if (adminRows[0].count === 0) {
      // Usar bcrypt para hashear la contraseña
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await connection.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@elpoderdesoltar.pnitecnicasolarte.com', hashedPassword, 'admin']
      );
      
      console.log('Usuario administrador por defecto creado');
    }
    
    console.log('Base de datos inicializada correctamente');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
}

// Función para migrar asientos del formato anterior al nuevo
async function migrarFormatoAsientos(connection) {
  try {
    // Verificar si existen asientos con el formato anterior (F1-I1, F1-D1, etc.)
    const [asientosAntiguos] = await connection.query(`
      SELECT COUNT(*) as count FROM asientos 
      WHERE id LIKE 'F%-%' AND (id LIKE '%-I%' OR id LIKE '%-D%')
    `);
    
    if (asientosAntiguos[0].count > 0) {
      console.log(`🔄 Detectados ${asientosAntiguos[0].count} asientos con formato anterior`);
      console.log('🔄 Migrando al nuevo formato SecciónFila-Asiento...');
      
      // Obtener todos los asientos con formato anterior
      const [asientos] = await connection.query(`
        SELECT id, fila, numero, seccion, estado, reserva_id 
        FROM asientos 
        WHERE id LIKE 'F%-%' AND (id LIKE '%-I%' OR id LIKE '%-D%')
      `);
      
      // Crear nuevos asientos con formato actualizado
      const asientosNuevos = [];
      const asientosAEliminar = [];
      
      for (const asiento of asientos) {
        // Generar nuevo ID con formato SecciónFila-Asiento
        const letraSeccion = asiento.seccion === 'izquierda' ? 'L' : 'R';
        const nuevoId = `${letraSeccion}${asiento.fila}-${asiento.numero}`;
        
        asientosNuevos.push([
          nuevoId, 
          asiento.fila, 
          asiento.numero, 
          asiento.seccion, 
          asiento.estado,
          asiento.reserva_id
        ]);
        
        asientosAEliminar.push(asiento.id);
      }
      
      // Insertar asientos con nuevo formato
      if (asientosNuevos.length > 0) {
        await connection.query(
          'INSERT INTO asientos (id, fila, numero, seccion, estado, reserva_id) VALUES ?',
          [asientosNuevos]
        );
        
        console.log(`✅ Migrados ${asientosNuevos.length} asientos al nuevo formato`);
      }
      
      // Eliminar asientos con formato anterior
      if (asientosAEliminar.length > 0) {
        await connection.query(
          `DELETE FROM asientos WHERE id IN (${asientosAEliminar.map(() => '?').join(',')})`,
          asientosAEliminar
        );
        
        console.log(`🗑️ Eliminados ${asientosAEliminar.length} asientos con formato anterior`);
      }
      
      console.log('✅ Migración de formato de asientos completada');
    }
  } catch (error) {
    console.warn('⚠️ Error durante migración de asientos:', error.message);
    // No es crítico, continúa con la inicialización
  }
}

module.exports = {
  pool,
  initDatabase
}; 