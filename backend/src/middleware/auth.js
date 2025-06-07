const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const usuarioModel = require('../models/usuarioModel');

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Middleware para verificar rol de usuario
function verificarRol(rolesPermitidos) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        next();
    };
}

// Rate limiting configurable - corregida para funcionar como función
function createRateLimit(maxRequests, windowMs) {
    return rateLimit({
        windowMs: windowMs,
        max: maxRequests,
        message: {
            error: 'Demasiadas solicitudes, intenta de nuevo más tarde'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
}

// Rate limiting por defecto
const defaultRateLimit = createRateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Función para crear rate limit personalizado (para usar en rutas)
function rateLimitCustom(maxRequests, windowMs) {
    return createRateLimit(maxRequests, windowMs);
}

// Middleware para sanitizar inputs
function sanitizeInput(req, res, next) {
    // Sanitizar parámetros de consulta
    for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
        }
    }
    
    // Sanitizar cuerpo de la solicitud
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        }
    }
    
    next();
}

// Middleware para verificar origen de ePayco
function verificarOrigenEpayco(req, res, next) {
    const userAgent = req.get('User-Agent') || '';
    const origin = req.get('Origin') || '';
    const referer = req.get('Referer') || '';
    
    // Lista de IPs y dominios conocidos de ePayco
    const epaycoOrigins = [
        'checkout.epayco.co',
        'secure.epayco.co',
        'api.secure.payco.co',
        'epayco.co'
    ];
    
    // Verificar si la solicitud viene de ePayco
    const isFromEpayco = epaycoOrigins.some(domain => 
        origin.includes(domain) || 
        referer.includes(domain) ||
        userAgent.includes('ePayco')
    );
    
    if (isFromEpayco) {
        console.log('Solicitud de ePayco verificada:', {
            ip: req.ip,
            userAgent: userAgent.substring(0, 100),
            origin,
            referer: referer.substring(0, 100)
        });
        next();
    } else {
        console.warn('Solicitud rechazada - origen no verificado:', {
            ip: req.ip,
            userAgent: userAgent.substring(0, 100),
            origin,
            referer: referer.substring(0, 100)
        });
        
        return res.status(403).json({ error: 'Origen no autorizado' });
    }
}

module.exports = {
    verificarToken,
    verificarRol,
    rateLimit: rateLimitCustom, // Exportar como función
    defaultRateLimit, // Exportar el middleware por defecto
    createRateLimit,
    sanitizeInput,
    verificarOrigenEpayco
}; 