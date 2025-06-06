// js/epayco-init.js - Inicialización y validación de ePayco

/**
 * Inicializador de ePayco que verifica la carga correcta de todos los componentes
 */
(function() {
    'use strict';
    
    let initializationAttempts = 0;
    const maxAttempts = 10;
    const checkInterval = 500; // milliseconds
    
    /**
     * Verificar si todos los componentes están listos
     */
    function checkEpaycoReadiness() {
        initializationAttempts++;
        
        console.log(`🔍 Verificando ePayco (intento ${initializationAttempts}/${maxAttempts})...`);
        
        // Verificar si el script de ePayco está cargado
        const epaycoLoaded = typeof window.ePayco !== 'undefined' && 
                           window.ePayco.checkout;
        
        // Verificar si la configuración está cargada
        const configLoaded = typeof window.EpaycoConfig !== 'undefined' && 
                           typeof window.EpaycoConfig.getConfig === 'function';
        
        if (epaycoLoaded && configLoaded) {
            console.log('✅ ePayco inicializado correctamente');
            onEpaycoReady();
            return true;
        }
        
        if (initializationAttempts >= maxAttempts) {
            console.error('❌ ePayco no se pudo inicializar después de', maxAttempts, 'intentos');
            onEpaycoError();
            return false;
        }
        
        // Intentar de nuevo
        setTimeout(checkEpaycoReadiness, checkInterval);
        return false;
    }
    
    /**
     * Ejecutar cuando ePayco esté listo
     */
    function onEpaycoReady() {
        try {
            // Mostrar configuración actual
            const config = window.EpaycoConfig.getConfig();
            console.log('📊 Configuración ePayco:', {
                modo: config.mode,
                clavePublica: config.publicKey,
                isTest: window.EpaycoConfig.isTestMode()
            });
            
            // Validar configuración
            const validation = window.EpaycoConfig.validateConfig();
            if (!validation.valid) {
                console.warn('⚠️ Problemas en configuración:', validation.errors);
            }
            
            // Emitir evento de inicialización completa
            window.dispatchEvent(new CustomEvent('epaycoReady', {
                detail: {
                    config: config,
                    validation: validation
                }
            }));
            
            // Mostrar indicador en la consola
            if (window.EpaycoConfig.isTestMode()) {
                console.log('%c🧪 MODO PRUEBA ACTIVO', 'background: #ffa500; color: #000; padding: 5px; border-radius: 3px; font-weight: bold;');
                console.log('%c💳 Las transacciones serán SIMULADAS', 'background: #90EE90; color: #000; padding: 3px; border-radius: 3px;');
            } else {
                console.log('%c🚀 MODO PRODUCCIÓN ACTIVO', 'background: #ff4444; color: #fff; padding: 5px; border-radius: 3px; font-weight: bold;');
                console.log('%c💰 Las transacciones serán REALES', 'background: #ff6666; color: #fff; padding: 3px; border-radius: 3px;');
            }
            
        } catch (error) {
            console.error('❌ Error al verificar configuración de ePayco:', error);
        }
    }
    
    /**
     * Ejecutar cuando hay error en la inicialización
     */
    function onEpaycoError() {
        console.error('❌ Error crítico: ePayco no está disponible');
        
        // Emitir evento de error
        window.dispatchEvent(new CustomEvent('epaycoError', {
            detail: {
                message: 'ePayco no se pudo inicializar correctamente',
                attempts: initializationAttempts
            }
        }));
        
        // Mostrar mensaje de error al usuario si hay botones de pago
        const paymentButtons = document.querySelectorAll('[onclick*="redirectToPayment"], [onclick*="redirectToEpayco"], .btn-pago');
        paymentButtons.forEach(button => {
            button.style.opacity = '0.5';
            button.style.pointerEvents = 'none';
            button.title = 'Sistema de pago no disponible';
        });
        
        // Mostrar advertencia visual
        const warningDiv = document.createElement('div');
        warningDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff6b6b; color: white; padding: 10px; text-align: center; z-index: 9999; font-weight: bold;">
                ⚠️ Sistema de pagos temporalmente no disponible. Por favor recarga la página.
                <button onclick="location.reload()" style="margin-left: 10px; background: white; color: #ff6b6b; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                    Recargar
                </button>
            </div>
        `;
        document.body.appendChild(warningDiv);
    }
    
    /**
     * Iniciar verificación cuando el DOM esté listo
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkEpaycoReadiness);
    } else {
        // DOM ya está listo
        setTimeout(checkEpaycoReadiness, 100);
    }
    
    /**
     * API pública para verificar estado
     */
    window.EpaycoStatus = {
        isReady: function() {
            return typeof window.ePayco !== 'undefined' && 
                   window.ePayco.checkout &&
                   typeof window.EpaycoConfig !== 'undefined';
        },
        
        getStatus: function() {
            return {
                epaycoLoaded: typeof window.ePayco !== 'undefined' && window.ePayco.checkout,
                configLoaded: typeof window.EpaycoConfig !== 'undefined',
                attempts: initializationAttempts,
                isTest: window.EpaycoConfig ? window.EpaycoConfig.isTestMode() : null
            };
        },
        
        forceCheck: checkEpaycoReadiness
    };
    
})(); 