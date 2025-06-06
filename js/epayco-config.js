// js/epayco-config.js - Configuración de ePayco con soporte para modo prueba

/**
 * Configuración de ePayco con soporte para producción y pruebas
 */
window.EpaycoConfig = (function() {
    
    // ⚠️ CAMBIAR ESTA VARIABLE PARA ACTIVAR/DESACTIVAR MODO PRUEBA
    const MODO_PRUEBA = false; // ← Cambiar a false para producción
    
    // Configuración de producción - ✅ CREDENCIALES ACTUALIZADAS
    const prodConfig = {
        mode: 'production',
        publicKey: '070f8aab3261bf1a71bbfd82dd97c9e2', // ✅ Clave correcta
        confirmationUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/api/epayco/confirmacion',
        responseUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/response.html'
    };
    
    // Configuración de prueba - ✅ CLAVES OFICIALES DE SANDBOX EPAYCO
    const testConfig = {
        mode: 'test',
        publicKey: '491d6a0b6e992cf924edd8d3d088aff1', // ✅ Clave oficial de sandbox ePayco
        confirmationUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/api/epayco/confirmacion',
        responseUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/response.html'
    };
    
    // Configuración actual según el modo
    const currentConfig = MODO_PRUEBA ? testConfig : prodConfig;
    
    // Mostrar información del modo actual
    if (MODO_PRUEBA) {
        console.log('🧪 ePayco: Modo PRUEBA (SANDBOX)');
        console.log('💳 Las transacciones serán SIMULADAS');
        console.log('🔑 Usando clave pública de sandbox');
        console.warn('⚠️ Recuerda cambiar MODO_PRUEBA = false para producción');
    } else {
        console.log('🚀 ePayco: Modo PRODUCCIÓN');
        console.log('💰 Las transacciones serán REALES');
        console.log('🔑 Usando credenciales de producción');
    }
    
    return {
        /**
         * Obtiene la configuración actual (prueba o producción)
         */
        getConfig: function() {
            return currentConfig;
        },
        
        /**
         * Obtiene la clave pública según el modo actual
         */
        getPublicKey: function() {
            return currentConfig.publicKey;
        },
        
        /**
         * Obtiene la URL de confirmación
         */
        getConfirmationUrl: function() {
            return currentConfig.confirmationUrl;
        },
        
        /**
         * Obtiene la URL de respuesta
         */
        getResponseUrl: function() {
            return currentConfig.responseUrl;
        },
        
        /**
         * Verifica si está en modo de prueba
         */
        isTestMode: function() {
            return MODO_PRUEBA;
        },
        
        /**
         * Verifica si está en modo de producción
         */
        isProductionMode: function() {
            return !MODO_PRUEBA;
        },
        
        /**
         * Genera un número de factura según el modo
         */
        generateInvoiceNumber: function(baseId = null) {
            const timestamp = Date.now();
            const prefix = MODO_PRUEBA ? 'TEST' : 'PROD';
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            if (baseId) {
                return `${prefix}-${timestamp}-${baseId}-${random}`;
            } else {
                return `${prefix}-${timestamp}-${random}`;
            }
        },
        
        /**
         * Muestra la configuración actual
         */
        showConfig: function() {
            console.log(`📊 Configuración de ePayco - ${MODO_PRUEBA ? 'PRUEBA' : 'PRODUCCIÓN'}:`);
            console.log('- Modo:', currentConfig.mode.toUpperCase());
            console.log('- Clave pública:', currentConfig.publicKey);
            console.log('- URL confirmación:', currentConfig.confirmationUrl);
            console.log('- URL respuesta:', currentConfig.responseUrl);
            console.log('- Dominio:', window.location.hostname);
            
            if (MODO_PRUEBA) {
                console.log('🧪 Modo de prueba activo - Las transacciones no son reales');
            } else {
                console.log('💰 Modo de producción activo - Las transacciones son reales');
            }
            
            return currentConfig;
        },
        
        /**
         * Validar configuración actual
         */
        validateConfig: function() {
            const errors = [];
            
            if (!currentConfig.publicKey || currentConfig.publicKey.trim().length === 0) {
                errors.push('Clave pública no configurada');
            }
            
            if (!currentConfig.confirmationUrl || !currentConfig.responseUrl) {
                errors.push('URLs de respuesta no configuradas');
            }
            
            return {
                valid: errors.length === 0,
                errors: errors,
                config: currentConfig,
                mode: MODO_PRUEBA ? 'test' : 'production'
            };
        },
        
        /**
         * Obtiene información del modo actual
         */
        getModeInfo: function() {
            return {
                isTest: MODO_PRUEBA,
                isProduction: !MODO_PRUEBA,
                mode: currentConfig.mode,
                description: MODO_PRUEBA ? 
                    'Modo de prueba - Transacciones simuladas' : 
                    'Modo de producción - Transacciones reales'
            };
        }
    };
})();

// Mostrar configuración al cargar
const modeInfo = window.EpaycoConfig.getModeInfo();
console.log(`✅ ePayco configurado para ${modeInfo.mode.toUpperCase()}`);
console.log(`📝 ${modeInfo.description}`);
window.EpaycoConfig.showConfig(); 