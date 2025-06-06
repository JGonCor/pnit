// Sistema de precios mejorado y sin errores - El Poder de Soltar
console.log('🔄 Cargando PricingModule mejorado...');

// Configuración de precios y fechas
const PRECIO_CONFIG = {
    PRECIO_REGULAR: 500000, // $500,000 COP
    DESCUENTO_CUPON_SOLTAR: 56000, // Descuento fijo de $56,000
    FECHA_LIMITE_PREVENTA: new Date('2025-06-20T23:59:59-05:00'), // Fin de preventa Colombia
    FECHA_EVENTO: new Date('2025-10-05T09:00:00-05:00'), // Fecha del evento
    IVA: 0, // Sin IVA para este evento
    CUPONES_ACTIVOS: ['SOLTAR'],
    MODO_MANTENIMIENTO: false, // Para activar modo mantenimiento si es necesario
    MENSAJE_MANTENIMIENTO: 'Sistema en mantenimiento. Intenta nuevamente en unos minutos.'
};

// Estado global del sistema
const EstadoPricing = {
    cuponAplicado: false,
    codigoCuponActual: '',
    ultimoCálculo: null,
    inicializado: false
};

/**
 * Módulo principal de precios
 */
window.PricingModule = {
    // Estado del módulo
    estado: EstadoPricing,
    
    /**
     * Inicializar el módulo de precios
     */
    init: function() {
        try {
            console.log('🚀 Inicializando PricingModule...');
            this.estado.inicializado = true;
            this.actualizarPreciosUI();
            console.log('✅ PricingModule inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando PricingModule:', error);
            return false;
        }
    },

    /**
     * Aplicar cupón de descuento
     * @param {string} codigo - Código del cupón
     * @returns {Object} - Resultado de la aplicación del cupón
     */
    aplicarCupon: function(codigo) {
        try {
            // Verificar modo mantenimiento
            if (PRECIO_CONFIG.MODO_MANTENIMIENTO) {
                return {
                    valido: false,
                    descuento: 0,
                    mensaje: PRECIO_CONFIG.MENSAJE_MANTENIMIENTO,
                    error: 'MANTENIMIENTO'
                };
            }

            const codigoNormalizado = String(codigo).trim().toUpperCase();
            
            // Verificar si el cupón está en la lista de cupones activos
            if (!PRECIO_CONFIG.CUPONES_ACTIVOS.includes(codigoNormalizado)) {
                this.estado.cuponAplicado = false;
                this.estado.codigoCuponActual = '';
                
                console.log('❌ Cupón inválido:', codigo);
                this.actualizarPreciosUI();
                
                return {
                    valido: false,
                    descuento: 0,
                    mensaje: 'Código de cupón inválido',
                    error: 'CODIGO_INVALIDO'
                };
            }

            // Verificar fecha de preventa
            const fechaActual = new Date();
            const fechaLimite = PRECIO_CONFIG.FECHA_LIMITE_PREVENTA;
            
            if (fechaActual > fechaLimite) {
                this.estado.cuponAplicado = false;
                this.estado.codigoCuponActual = '';
                
                console.log('❌ Cupón expirado - fuera del período de preventa:', {
                    fechaActual: fechaActual.toISOString(),
                    fechaLimite: fechaLimite.toISOString()
                });
                
                this.actualizarPreciosUI();
                
                return {
                    valido: false,
                    descuento: 0,
                    mensaje: `El cupón de preventa ya no está disponible. La preventa terminó el ${fechaLimite.toLocaleDateString('es-CO', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        timeZone: 'America/Bogota'
                    })}.`,
                    error: 'PREVENTA_EXPIRADA',
                    fechaLimite: fechaLimite.toISOString()
                };
            }
    
    if (codigoNormalizado === 'SOLTAR') {
                this.estado.cuponAplicado = true;
                this.estado.codigoCuponActual = codigo;
                
                console.log('✅ Cupón aplicado:', {
                    codigo: codigo,
                    descuento: PRECIO_CONFIG.DESCUENTO_CUPON_SOLTAR,
                    fechaAplicacion: fechaActual.toISOString(),
                    diasRestantesPreventa: Math.ceil((fechaLimite - fechaActual) / (1000 * 60 * 60 * 24))
                });
                
                this.actualizarPreciosUI();
                
                const diasRestantes = Math.ceil((fechaLimite - fechaActual) / (1000 * 60 * 60 * 24));
                
        return {
            valido: true,
                    descuento: PRECIO_CONFIG.DESCUENTO_CUPON_SOLTAR,
                    mensaje: `¡Cupón aplicado! Descuento de ${this.formatearPrecioCOP(PRECIO_CONFIG.DESCUENTO_CUPON_SOLTAR)}. ${diasRestantes > 0 ? `Te quedan ${diasRestantes} días para usar este descuento.` : 'Último día de preventa.'}`,
                    diasRestantes: diasRestantes
                };
            }
            
        } catch (error) {
            console.error('❌ Error aplicando cupón:', error);
            
            // Registrar error para monitoreo
            this.registrarError('aplicarCupon', error, { codigo });
            
        return {
            valido: false,
            descuento: 0,
                mensaje: 'Error procesando cupón. Intenta nuevamente.',
                error: 'ERROR_SISTEMA'
            };
        }
    },

    /**
     * Remover cupón aplicado
     */
    removerCupon: function() {
        try {
            this.estado.cuponAplicado = false;
            this.estado.codigoCuponActual = '';
            console.log('🗑️ Cupón removido');
            this.actualizarPreciosUI();
        } catch (error) {
            console.error('❌ Error removiendo cupón:', error);
        }
    },

    /**
     * Calcular precio con todos los descuentos aplicables
     * @param {number} cantidad - Cantidad de entradas
     * @returns {Object} - Información completa del precio
     */
    calcularPrecio: function(cantidad = 1) {
        try {
            cantidad = parseInt(cantidad) || 1;
            
            let precioUnitario = PRECIO_CONFIG.PRECIO_REGULAR;
            let descuentoUnitario = 0;
    let tipoDescuento = 'ninguno';
    
    // Aplicar descuento de cupón si está activo
            if (this.estado.cuponAplicado) {
                descuentoUnitario = PRECIO_CONFIG.DESCUENTO_CUPON_SOLTAR;
        tipoDescuento = 'cupon';
                precioUnitario = PRECIO_CONFIG.PRECIO_REGULAR - PRECIO_CONFIG.DESCUENTO_CUPON_SOLTAR;
    }
    
            const subtotal = PRECIO_CONFIG.PRECIO_REGULAR * cantidad;
            const descuentoTotal = descuentoUnitario * cantidad;
            const precioFinal = precioUnitario * cantidad;
    
            const resultado = {
                precioOriginal: PRECIO_CONFIG.PRECIO_REGULAR,
        precioUnitario: precioUnitario,
                precioFinal: precioFinal,
        cantidad: cantidad,
                subtotal: subtotal,
                descuentoUnitario: descuentoUnitario,
                descuentoTotal: descuentoTotal,
                cuponAplicado: this.estado.cuponAplicado,
                codigoCupon: this.estado.codigoCuponActual,
                tipoDescuento: tipoDescuento,
                iva: 0,
                // Cálculos para pagos
                montoCompleto: precioFinal,
                montoReserva: Math.round(precioFinal * 0.30),
                // Metadata
                timestamp: new Date().toISOString(),
                valido: true
            };
            
            this.estado.ultimoCálculo = resultado;
            console.log('💰 Precio calculado:', resultado);
            
            return resultado;
        } catch (error) {
            console.error('❌ Error calculando precio:', error);
            return this.obtenerPrecioError(cantidad);
        }
    },

    /**
     * Obtener precio de error/fallback
     * @param {number} cantidad 
     * @returns {Object}
     */
    obtenerPrecioError: function(cantidad = 1) {
        return {
            precioOriginal: PRECIO_CONFIG.PRECIO_REGULAR,
            precioUnitario: PRECIO_CONFIG.PRECIO_REGULAR,
            precioFinal: PRECIO_CONFIG.PRECIO_REGULAR * cantidad,
            cantidad: cantidad,
            subtotal: PRECIO_CONFIG.PRECIO_REGULAR * cantidad,
            descuentoUnitario: 0,
            descuentoTotal: 0,
            cuponAplicado: false,
            codigoCupon: '',
            tipoDescuento: 'error',
            iva: 0,
            montoCompleto: PRECIO_CONFIG.PRECIO_REGULAR * cantidad,
            montoReserva: Math.round(PRECIO_CONFIG.PRECIO_REGULAR * cantidad * 0.3),
            timestamp: new Date().toISOString(),
            valido: false,
            error: true
        };
    },

    /**
     * Formatear precio en COP
     * @param {number} precio - Precio a formatear
     * @returns {string} - Precio formateado
     */
    formatearPrecioCOP: function(precio) {
        try {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
            }).format(precio || 0);
        } catch (error) {
            console.error('❌ Error formateando precio:', error);
            return `$${(precio || 0).toLocaleString('es-CO')} COP`;
        }
    },

    /**
     * Actualizar precios en la interfaz de usuario
     */
    actualizarPreciosUI: function() {
        try {
            const cantidadElement = document.getElementById('cantidad');
            const cantidadExactaElement = document.getElementById('cantidad_exacta');
            
            let cantidad = 1;
            
            if (cantidadElement) {
                if (cantidadElement.value === '6+' && cantidadExactaElement) {
                    cantidad = parseInt(cantidadExactaElement.value) || 6;
                } else {
                    cantidad = parseInt(cantidadElement.value) || 1;
                }
            }
            
            const precios = this.calcularPrecio(cantidad);
            
            // Actualizar display principal de precio
            this.actualizarPrecioDisplay(precios);
            
            // Actualizar labels de tipo de pago
            this.actualizarLabelsFormulario(precios);
            
            // Disparar evento personalizado para notificar cambios
            window.dispatchEvent(new CustomEvent('preciosActualizados', { 
                detail: precios 
            }));
            
        } catch (error) {
            console.error('❌ Error actualizando UI:', error);
        }
    },

    /**
     * Actualizar display principal de precio
     * @param {Object} precios - Información de precios
     */
    actualizarPrecioDisplay: function(precios) {
        try {
    const precioDisplay = document.getElementById('precio-display');
            if (!precioDisplay) return;
            
        if (precios.cuponAplicado) {
            precioDisplay.innerHTML = `
                <div class="precio-con-descuento">
                        <span class="precio-final text-3xl font-bold text-green-600">
                            ${this.formatearPrecioCOP(precios.precioUnitario)}
                        </span>
                        <span class="precio-original text-xl line-through text-gray-500 ml-2">
                            ${this.formatearPrecioCOP(precios.precioOriginal)}
                        </span>
                        <div class="cupon-info mt-2">
                            <span class="cupon-badge bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                Cupón "${precios.codigoCupon}" aplicado
                            </span>
                            <span class="descuento-amount text-green-600 font-semibold ml-2">
                                -${this.formatearPrecioCOP(precios.descuentoUnitario)}
                            </span>
                        </div>
                </div>
            `;
        } else {
                precioDisplay.innerHTML = `
                    <span class="precio-normal text-3xl font-bold text-blue-600">
                        ${this.formatearPrecioCOP(precios.precioOriginal)}
                    </span>
                `;
            }
        } catch (error) {
            console.error('❌ Error actualizando precio display:', error);
        }
    },

    /**
     * Actualizar labels del formulario
     * @param {Object} precios - Información de precios
     */
    actualizarLabelsFormulario: function(precios) {
        try {
            // Actualizar precio total
            const precioTotalElement = document.getElementById('precio-total');
            if (precioTotalElement) {
                precioTotalElement.textContent = `Precio total: ${this.formatearPrecioCOP(precios.precioFinal)}`;
            }
            
            // Actualizar labels de botones de pago
            const pagoCompletoLabel = document.getElementById('pago-completo-label');
            const pagoReservaLabel = document.getElementById('pago-reserva-label');
            
            if (pagoCompletoLabel) {
                pagoCompletoLabel.textContent = `Pago completo (${this.formatearPrecioCOP(precios.montoCompleto)})`;
            }
            
            if (pagoReservaLabel) {
                pagoReservaLabel.textContent = `Reserva (30% - ${this.formatearPrecioCOP(precios.montoReserva)})`;
            }
            
        } catch (error) {
            console.error('❌ Error actualizando labels:', error);
        }
    },

    /**
     * Procesar pago con validaciones mejoradas
     * @param {number} cantidad - Cantidad de entradas
     * @param {Object} datosComprador - Datos del comprador
     * @param {string} tipoPago - Tipo de pago ('completo' o 'reserva')
     */
    procesarPago: function(cantidad, datosComprador, tipoPago) {
        try {
            // Validaciones iniciales
            if (!this.estaInicializado()) {
                throw new Error('PricingModule no está inicializado');
            }

            if (!cantidad || cantidad < 1) {
                throw new Error('Cantidad inválida');
            }

            if (!datosComprador || !datosComprador.nombre || !datosComprador.email || !datosComprador.telefono) {
                throw new Error('Datos del comprador incompletos');
            }

            console.log('💳 Procesando pago:', {
                cantidad: cantidad,
                tipoPago: tipoPago,
                comprador: datosComprador.nombre
            });

            // Verificar que EpaycoConfig esté disponible y cargado
            if (!window.EpaycoConfig) {
                throw new Error('El módulo de configuración de ePayco no está cargado. Por favor recarga la página.');
            }

            // Obtener configuración de ePayco
            const epaycoConfig = window.EpaycoConfig.getConfig();
            
            if (!epaycoConfig) {
                throw new Error('No se pudo obtener la configuración de ePayco');
            }
            
            // Validar configuración
            const validation = window.EpaycoConfig.validateConfig();
            if (!validation.valid) {
                throw new Error('Configuración de ePayco inválida: ' + validation.errors.join(', '));
            }

            // Verificar que ePayco esté disponible
            if (typeof ePayco === 'undefined' || !ePayco.checkout) {
                throw new Error('ePayco no está disponible');
            }

            // Calcular precios finales
            const precios = this.calcularPreciosCompletos(cantidad, tipoPago);
            
            // Configurar ePayco
            const handler = ePayco.checkout.configure({
                key: epaycoConfig.publicKey,
                test: epaycoConfig.isTestMode
            });

            // Generar número de factura
            const invoiceNumber = this.generarNumeroFactura();

            // Configuración de la compra
            const pagoData = {
                name: 'El poder de soltar - Entrada numerada',
                description: `${cantidad} entrada(s) para evento El poder de soltar`,
                invoice: invoiceNumber,
                currency: 'cop',
                amount: precios.montoAPagar.toString(),
                tax_base: '0',
                tax: '0',
                tax_ico: '0',
                country: 'co',
                lang: 'es',
                external: 'true',
                
                confirmation: epaycoConfig.confirmationUrl,
                response: epaycoConfig.responseUrl,
                
                name_billing: datosComprador.nombre,
                email_billing: datosComprador.email,
                type_doc_billing: 'cc',
                mobilephone_billing: datosComprador.telefono,
                number_doc_billing: '1000000000', // Número de documento por defecto
                address_billing: 'Dirección evento El poder de soltar',
                
                extra1: datosComprador.nombre,
                extra2: datosComprador.email,
                extra3: datosComprador.telefono,
                extra4: cantidad.toString(),
                extra5: tipoPago
            };

            console.log('🚀 Abriendo ePayco:', pagoData);
            handler.open(pagoData);

            return { exito: true, factura: invoiceNumber };

        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            alert('Error procesando el pago: ' + error.message);
            return { exito: false, error: error.message };
        }
    },

    /**
     * Calcular precios completos para procesamiento de pago
     * @param {number} cantidad - Cantidad de entradas
     * @param {string} tipoPago - Tipo de pago ('completo' o 'reserva')
     * @returns {Object} - Información completa del precio para pago
     */
    calcularPreciosCompletos: function(cantidad, tipoPago) {
        try {
            // Obtener cálculo base
            const calculoBase = this.calcularPrecio(cantidad);
            
            let montoAPagar = calculoBase.precioFinal;
            
            // Si es reserva (30%), calcular el 30%
            if (tipoPago === 'reserva') {
                montoAPagar = Math.round(calculoBase.precioFinal * 0.30);
            }
            
            return {
                ...calculoBase,
                tipoPago: tipoPago,
                montoAPagar: montoAPagar,
                montoCompleto: calculoBase.precioFinal,
                porcentajeReserva: tipoPago === 'reserva' ? 30 : 100,
                saldoPendiente: tipoPago === 'reserva' ? calculoBase.precioFinal - montoAPagar : 0
            };
            
        } catch (error) {
            console.error('❌ Error calculando precios completos:', error);
            
            // Retornar valores por defecto en caso de error
            const precioRegular = PRECIO_CONFIG.PRECIO_REGULAR * cantidad;
            const montoAPagar = tipoPago === 'reserva' ? Math.round(precioRegular * 0.30) : precioRegular;
            
            return {
                precioOriginal: PRECIO_CONFIG.PRECIO_REGULAR,
                precioUnitario: PRECIO_CONFIG.PRECIO_REGULAR,
                precioFinal: precioRegular,
                cantidad: cantidad,
                tipoPago: tipoPago,
                montoAPagar: montoAPagar,
                montoCompleto: precioRegular,
                cuponAplicado: false,
                descuentoTotal: 0,
                error: true
            };
        }
    },

    /**
     * Generar número de factura único
     * @returns {string}
     */
    generarNumeroFactura: function() {
        // Usar el generador de ePayco Config si está disponible
        if (window.EpaycoConfig && typeof window.EpaycoConfig.generateInvoiceNumber === 'function') {
            return window.EpaycoConfig.generateInvoiceNumber();
        }
        
        // Fallback manual
        const timestamp = Date.now();
        const prefijo = 'FALLBACK';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefijo}-${timestamp}-${random}`;
    },

    /**
     * Verificar si el módulo está inicializado
     * @returns {boolean}
     */
    estaInicializado: function() {
        return this.estado.inicializado;
    },

    /**
     * Registrar errores para monitoreo
     * @param {string} funcion - Función donde ocurrió el error
     * @param {Error} error - Error ocurrido
     * @param {Object} contexto - Contexto adicional
     */
    registrarError: function(funcion, error, contexto = {}) {
        try {
            const errorInfo = {
                timestamp: new Date().toISOString(),
                funcion: funcion,
                mensaje: error.message,
                stack: error.stack,
                contexto: contexto,
                url: window.location.href,
                userAgent: navigator.userAgent,
                config: window.EpaycoConfig?.getConfig()?.mode || 'unknown'
            };

            // Log en consola para desarrollo
            console.error('🚨 Error registrado:', errorInfo);

            // En producción, enviar a servicio de monitoreo
            if (window.EpaycoConfig?.isProductionMode()) {
                this.enviarErrorMonitoreo(errorInfo);
            }

            // Guardar en localStorage para análisis posterior
            this.guardarErrorLocal(errorInfo);

        } catch (e) {
            console.error('❌ Error registrando error:', e);
        }
    },

    /**
     * Enviar error a servicio de monitoreo
     * @param {Object} errorInfo - Información del error
     */
    enviarErrorMonitoreo: function(errorInfo) {
        try {
            // Enviar a endpoint de monitoreo (implementar según necesidades)
            fetch('/api/errores/reportar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorInfo)
            }).catch(e => {
                console.warn('⚠️ No se pudo enviar error a monitoreo:', e);
            });
        } catch (e) {
            console.warn('⚠️ Error enviando a monitoreo:', e);
        }
    },

    /**
     * Guardar error en localStorage
     * @param {Object} errorInfo - Información del error
     */
    guardarErrorLocal: function(errorInfo) {
        try {
            const errores = JSON.parse(localStorage.getItem('pnit_errores') || '[]');
            errores.push(errorInfo);
            
            // Mantener solo los últimos 50 errores
            if (errores.length > 50) {
                errores.splice(0, errores.length - 50);
            }
            
            localStorage.setItem('pnit_errores', JSON.stringify(errores));
        } catch (e) {
            console.warn('⚠️ No se pudo guardar error en localStorage:', e);
        }
    },

    /**
     * Validar estado del sistema antes de procesar
     * @returns {Object} - Resultado de la validación
     */
    validarSistema: function() {
        const problemas = [];
        const advertencias = [];

        try {
            // Verificar configuración de ePayco
            if (typeof ePayco === 'undefined' || !ePayco.checkout) {
                problemas.push('ePayco no está disponible');
            }

            // Verificar configuración
            if (window.EpaycoConfig) {
                const validation = window.EpaycoConfig.validateConfig();
                if (!validation.valid) {
                    problemas.push(...validation.errors);
                }
            } else {
                advertencias.push('EpaycoConfig no disponible');
            }

            // Verificar fechas
            const fechaActual = new Date();
            const fechaEvento = PRECIO_CONFIG.FECHA_EVENTO;
            
            if (fechaActual > fechaEvento) {
                problemas.push('El evento ya ocurrió');
            }

            // Verificar modo mantenimiento
            if (PRECIO_CONFIG.MODO_MANTENIMIENTO) {
                problemas.push('Sistema en modo mantenimiento');
            }

            return {
                valido: problemas.length === 0,
                problemas: problemas,
                advertencias: advertencias,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.registrarError('validarSistema', error);
            return {
                valido: false,
                problemas: ['Error validando sistema'],
                advertencias: [],
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Obtener información de estado del cupón
     * @returns {Object} - Estado del cupón de preventa
     */
    obtenerEstadoCupon: function() {
        try {
            const fechaActual = new Date();
            const fechaLimite = PRECIO_CONFIG.FECHA_LIMITE_PREVENTA;
            const fechaEvento = PRECIO_CONFIG.FECHA_EVENTO;
            
            const diasRestantesPreventa = Math.ceil((fechaLimite - fechaActual) / (1000 * 60 * 60 * 24));
            const diasRestantesEvento = Math.ceil((fechaEvento - fechaActual) / (1000 * 60 * 60 * 24));
            
            return {
                preventaActiva: fechaActual <= fechaLimite,
                diasRestantesPreventa: Math.max(0, diasRestantesPreventa),
                diasRestantesEvento: Math.max(0, diasRestantesEvento),
                fechaLimitePreventa: fechaLimite.toISOString(),
                fechaEvento: fechaEvento.toISOString(),
                cuponDisponible: fechaActual <= fechaLimite && !PRECIO_CONFIG.MODO_MANTENIMIENTO
            };
        } catch (error) {
            this.registrarError('obtenerEstadoCupon', error);
            return {
                preventaActiva: false,
                diasRestantesPreventa: 0,
                diasRestantesEvento: 0,
                fechaLimitePreventa: null,
                fechaEvento: null,
                cuponDisponible: false,
                error: true
            };
        }
    }
};

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.PricingModule.init();
    });
} else {
    // El DOM ya está listo
    window.PricingModule.init();
}

// Exports para compatibilidad
window.aplicarCupon = window.PricingModule.aplicarCupon.bind(window.PricingModule);
window.removerCupon = window.PricingModule.removerCupon.bind(window.PricingModule);
window.calcularPrecio = window.PricingModule.calcularPrecio.bind(window.PricingModule);
window.formatearPrecioCOP = window.PricingModule.formatearPrecioCOP.bind(window.PricingModule);
window.procesarPago = window.PricingModule.procesarPago.bind(window.PricingModule);

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el módulo automáticamente
    window.PricingModule.init();
    console.log('✅ PricingModule inicializado automáticamente');
});

console.log('✅ PricingModule cargado y listo para usar');

window.EpaycoModeSwitcher.mostrarResumen()
window.EpaycoModeSwitcher.ejecutarPagoPrueba()