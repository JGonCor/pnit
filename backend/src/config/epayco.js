require('dotenv').config();

/**
 * Configuración de ePayco que maneja automáticamente
 * el modo de prueba vs producción
 */
class EpaycoConfig {
    constructor() {
        // ⚠️ CAMBIAR ESTA VARIABLE PARA ACTIVAR/DESACTIVAR MODO PRUEBA
        this.isTestMode = process.env.EPAYCO_TEST_MODE === 'true' || false; // ← Cambiar a false para producción
        this.mode = this.isTestMode ? 'test' : 'production';
        
        if (this.isTestMode) {
            console.log('🧪 ePayco configurado en modo PRUEBA (SANDBOX)');
            console.log('💳 Las transacciones serán SIMULADAS');
            console.warn('⚠️ Recuerda cambiar isTestMode = false para producción');
        } else {
            console.log('🚀 ePayco configurado en modo PRODUCCIÓN');
            console.log('💰 Las transacciones serán REALES');
        }
    }
    
    /**
     * Obtiene la clave pública según el modo actual
     */
    getPublicKey() {
        if (this.isTestMode) {
            // ✅ Clave pública oficial de sandbox ePayco
            return process.env.EPAYCO_PUBLIC_KEY_TEST || '491d6a0b6e992cf924edd8d3d088aff1';
        } else {
            // ✅ Clave pública de producción correcta
            return process.env.EPAYCO_PUBLIC_KEY || '070f8aab3261bf1a71bbfd82dd97c9e2';
        }
    }
    
    /**
     * Obtiene la clave privada según el modo actual
     */
    getPrivateKey() {
        if (this.isTestMode) {
            // ✅ Clave privada oficial de sandbox ePayco
            return process.env.EPAYCO_PRIVATE_KEY_TEST || '6ea3afaed1c0389131a12ddf4cd6692e';
        } else {
            // ✅ Clave privada de producción correcta
            return process.env.EPAYCO_PRIVATE_KEY || '3a8d9241bc18d41c9e80a9232b44f8c9';
        }
    }
    
    /**
     * Obtiene el Customer ID según el modo actual
     */
    getCustomerId() {
        if (this.isTestMode) {
            // ✅ Customer ID oficial de sandbox ePayco
            return process.env.EPAYCO_CUSTOMER_ID_TEST || '6065';
        } else {
            // ✅ Customer ID de producción correcto
            return process.env.EPAYCO_CUSTOMER_ID || '683101';
        }
    }
    
    /**
     * Obtiene la P_KEY según el modo actual
     */
    getPKey() {
        if (this.isTestMode) {
            // ✅ P_KEY oficial de sandbox ePayco
            return process.env.EPAYCO_P_KEY_TEST || '685d4a9e6cb2ecc78e11b23f5232d5e9b4bb3e5e';
        } else {
            // ✅ P_KEY de producción correcta
            return process.env.EPAYCO_P_KEY || 'dd00c57ef9859c64e04d4722f2ab8a5b85a1940a';
        }
    }
    
    /**
     * Obtiene la URL de confirmación según el modo actual
     */
    getConfirmationUrl() {
        return process.env.CONFIRMATION_URL || 'https://elpoderdesoltar.pnitecnicasolarte.com/api/epayco/confirmacion';
    }
    
    /**
     * Obtiene la URL de respuesta según el modo actual
     */
    getResponseUrl() {
        return process.env.RESPONSE_URL || 'https://elpoderdesoltar.pnitecnicasolarte.com/response.html';
    }
    
    /**
     * Obtiene toda la configuración actual
     */
    getConfig() {
        return {
            mode: this.mode,
            isTestMode: this.isTestMode,
            publicKey: this.getPublicKey(),
            privateKey: this.getPrivateKey(),
            customerId: this.getCustomerId(),
            pKey: this.getPKey(),
            confirmationUrl: this.getConfirmationUrl(),
            responseUrl: this.getResponseUrl()
        };
    }
    
    /**
     * Genera un invoice number con prefijo según el modo
     */
    generateInvoiceNumber(baseId = null) {
        const timestamp = Date.now();
        const prefix = this.isTestMode ? 'TEST' : 'PROD';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        if (baseId) {
            return `${prefix}-${timestamp}-${baseId}-${random}`;
        } else {
            return `${prefix}-${timestamp}-${random}`;
        }
    }
    
    /**
     * Valida si la configuración actual es correcta
     */
    validateConfig() {
        const config = this.getConfig();
        const errors = [];
        
        if (!config.publicKey) {
            errors.push('Public Key no configurada');
        }
        
        if (!config.privateKey) {
            errors.push('Private Key no configurada');
        }
        
        if (!config.customerId) {
            errors.push('Customer ID no configurado');
        }
        
        if (!config.pKey) {
            errors.push('P Key no configurada');
        }
        
        if (!config.confirmationUrl) {
            errors.push('URL de confirmación no configurada');
        }
        
        if (!config.responseUrl) {
            errors.push('URL de respuesta no configurada');
        }
        
        if (errors.length > 0) {
            console.error('❌ Errores en configuración de ePayco:');
            errors.forEach(error => console.error(`  - ${error}`));
            return false;
        }
        
        console.log(`✅ Configuración de ePayco válida - Modo ${this.mode.toUpperCase()}`);
        return true;
    }
    
    /**
     * Mostrar configuración
     */
    showConfig() {
        const config = this.getConfig();
        console.log(`📊 Configuración ePayco - ${this.mode.toUpperCase()}:`);
        console.log('- Modo:', config.mode.toUpperCase());
        console.log('- Clave pública:', config.publicKey);
        console.log('- Customer ID:', config.customerId);
        console.log('- URL confirmación:', config.confirmationUrl);
        console.log('- URL respuesta:', config.responseUrl);
        
        if (this.isTestMode) {
            console.log('🧪 Modo de prueba activo - Las transacciones no son reales');
        } else {
            console.log('💰 Modo de producción activo - Las transacciones son reales');
        }
        
        return config;
    }
}

module.exports = new EpaycoConfig(); 