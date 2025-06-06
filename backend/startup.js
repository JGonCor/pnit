// startup.js - Configuración de inicio para cPanel
const fs = require('fs');
const path = require('path');

/**
 * Configurar variables de entorno para cPanel
 * Este archivo se ejecuta antes de inicializar la aplicación principal
 */
function setupEnvironment() {
    console.log('Configurando entorno para cPanel...');
    
    try {
        // Buscar archivo .env en el directorio actual
        const envPath = path.join(__dirname, '.env');
        
        if (fs.existsSync(envPath)) {
            console.log('Archivo .env encontrado, cargando variables...');
            
            // Leer el archivo .env
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Parsear las variables de entorno
            const envVars = envContent.split('\n').filter(line => {
                return line.trim() && !line.startsWith('#') && line.includes('=');
            });
            
            // Establecer las variables de entorno
            envVars.forEach(line => {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                
                // Solo establecer si no existe ya
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                    console.log(`Variable ${key.trim()} configurada`);
                }
            });
            
            console.log('Variables de entorno cargadas exitosamente');
        } else {
            console.warn('Archivo .env no encontrado en:', envPath);
            console.log('Usando variables de entorno del sistema...');
        }
        
        // Configuraciones específicas para cPanel
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'production';
        }
        
        // Configurar puerto por defecto si no está definido
        if (!process.env.PORT) {
            process.env.PORT = 3000;
        }
        
        // Log de configuración final (sin valores sensibles)
        console.log('Configuración de entorno completada:');
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- PORT:', process.env.PORT);
        console.log('- DB_HOST:', process.env.DB_HOST ? 'Configurado' : 'No configurado');
        console.log('- DB_NAME:', process.env.DB_NAME ? 'Configurado' : 'No configurado');
        console.log('- EPAYCO_PUBLIC_KEY:', process.env.EPAYCO_PUBLIC_KEY ? 'Configurado' : 'No configurado');
        
    } catch (error) {
        console.error('Error al configurar entorno:', error);
        console.log('Continuando con variables de entorno del sistema...');
    }
}

/**
 * Verificar dependencias críticas
 */
function checkDependencies() {
    console.log('Verificando dependencias críticas...');
    
    const requiredDeps = [
        'express',
        'mysql2',
        'cors',
        'helmet',
        'bcrypt',
        'jsonwebtoken',
        'exceljs',
        'moment'
    ];
    
    const missingDeps = [];
    
    requiredDeps.forEach(dep => {
        try {
            require(dep);
            console.log(`✓ ${dep} encontrado`);
        } catch (error) {
            console.error(`✗ ${dep} NO encontrado`);
            missingDeps.push(dep);
        }
    });
    
    if (missingDeps.length > 0) {
        console.error('Dependencias faltantes:', missingDeps);
        console.log('Ejecuta: npm install para instalar las dependencias');
        return false;
    }
    
    console.log('Todas las dependencias están disponibles');
    return true;
}

/**
 * Verificar estructura de directorios
 */
function checkDirectoryStructure() {
    console.log('Verificando estructura de directorios...');
    
    const requiredDirs = [
        'src',
        'src/config',
        'src/controllers',
        'src/models',
        'src/routes',
        'src/middleware'
    ];
    
    const missingDirs = [];
    
    requiredDirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`✓ Directorio ${dir} encontrado`);
        } else {
            console.error(`✗ Directorio ${dir} NO encontrado`);
            missingDirs.push(dir);
        }
    });
    
    if (missingDirs.length > 0) {
        console.error('Directorios faltantes:', missingDirs);
        return false;
    }
    
    console.log('Estructura de directorios correcta');
    return true;
}

/**
 * Función principal de inicialización
 */
function initialize() {
    console.log('='.repeat(50));
    console.log('INICIANDO CONFIGURACIÓN DE LA APLICACIÓN');
    console.log('='.repeat(50));
    
    // Configurar entorno
    setupEnvironment();
    
    // Verificar dependencias
    const depsOk = checkDependencies();
    if (!depsOk) {
        console.error('Error: Dependencias faltantes. No se puede continuar.');
        process.exit(1);
    }
    
    // Verificar estructura
    const structureOk = checkDirectoryStructure();
    if (!structureOk) {
        console.error('Error: Estructura de directorios incorrecta. No se puede continuar.');
        process.exit(1);
    }
    
    console.log('='.repeat(50));
    console.log('CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(50));
    
    // Inicializar la aplicación principal
    require('./src/app.js');
}

// Ejecutar inicialización
if (require.main === module) {
    initialize();
}

module.exports = {
    setupEnvironment,
    checkDependencies,
    checkDirectoryStructure,
    initialize
}; 