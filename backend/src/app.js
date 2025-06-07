const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { initDatabase } = require('./config/db');
const { rateLimit, sanitizeInput } = require('./middleware/auth');
const reservaRoutes = require('./routes/reservaRoutes');
const transaccionRoutes = require('./routes/transaccionRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const epaycoRoutes = require('./routes/epaycoRoutes');
const publicRoutes = require('./routes/publicRoutes');
const asientosRoutes = require('./routes/asientos');

// Configuración de variables de entorno
require('dotenv').config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://secure.epayco.co", "https://checkout.epayco.co"],
      frameSrc: ["'self'", "https://checkout.epayco.co"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting global
app.use(rateLimit(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes

// Configuración de CORS para producción
const allowedOrigins = [
    'http://localhost:3000',
    'https://elpoderdesoltar.pnitecnicasolarte.com',
    'https://www.elpoderdesoltar.pnitecnicasolarte.com'
];

// Configuración de CORS más estricta
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (aplicaciones móviles, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Sanitización global de inputs
app.use(sanitizeInput);

// Parsear solicitudes con contenido JSON con límite de tamaño
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Configurar trust proxy si está detrás de un proxy
app.set('trust proxy', 1);

// Servir archivos estáticos desde el directorio raíz del proyecto
const path = require('path');
app.use(express.static(path.join(__dirname, '../../')));

// Rutas públicas (con rate limiting estricto)
app.use('/api/public', publicRoutes);

// Rutas protegidas de la API
app.use('/api/reservas', reservaRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/epayco', epaycoRoutes);
app.use('/api/asientos', asientosRoutes);

// Ruta de estado
app.get('/api/estado', (req, res) => {
  res.status(200).json({ mensaje: 'API funcionando correctamente' });
});

// Iniciar servidor
async function iniciarServidor() {
  // Inicializar base de datos
  const dbInicializada = await initDatabase();
  
  if (!dbInicializada) {
    console.error('Error al inicializar la base de datos. No se puede iniciar el servidor.');
    process.exit(1);
  }
  
  // Iniciar servidor HTTP
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log('Base de datos conectada e inicializada correctamente');
  });
}

// Manejar errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no controlado:', err);
});

// Iniciar la aplicación
iniciarServidor();

module.exports = app; 