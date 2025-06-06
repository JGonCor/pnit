// Main JavaScript for El Poder de Soltar Landing Page - VERSIÓN MEJORADA
console.log('🔄 Cargando main.js mejorado...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM cargado, inicializando sistema...');
    
    try {
    // Mobile menu toggle
        initMobileMenu();
        
        // Update price display based on preventa period
        initPriceSystem();
        
        // Smooth scrolling for anchor links
        initSmoothScrolling();
        
        // Event countdown timer
        initCountdownTimers();
        
        // Form validation and submission
        initReservationForm();
        
        // Load registrations and update available spots
        loadRegistrations();
        
        console.log('✅ Sistema principal inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema principal:', error);
    }
});

/**
 * Inicializar menú móvil
 */
function initMobileMenu() {
    try {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
            console.log('✅ Menú móvil inicializado');
        }
    } catch (error) {
        console.error('❌ Error inicializando menú móvil:', error);
    }
}

/**
 * Inicializar sistema de precios
 */
function initPriceSystem() {
    try {
        // Esperar a que PricingModule esté disponible
        let intentos = 0;
        const maxIntentos = 20;
        
        const checkPricingModule = () => {
            if (typeof window.PricingModule !== 'undefined' && window.PricingModule.estaInicializado()) {
                console.log('✅ PricingModule disponible, configurando eventos...');
                setupPriceEventListeners();
                return true;
            }
            
            intentos++;
            if (intentos < maxIntentos) {
                setTimeout(checkPricingModule, 250);
            } else {
                console.warn('⚠️ PricingModule no disponible después de esperar');
                setupFallbackPricing();
            }
            return false;
        };
        
        checkPricingModule();
        
    } catch (error) {
        console.error('❌ Error inicializando sistema de precios:', error);
        setupFallbackPricing();
    }
}

/**
 * Configurar event listeners para precios
 */
function setupPriceEventListeners() {
    try {
        const cantidadSelect = document.getElementById('cantidad');
        const cantidadExactaInput = document.getElementById('cantidad_exacta');
        
        if (cantidadSelect) {
            cantidadSelect.addEventListener('change', handleQuantityChange);
            console.log('✅ Event listener cantidad configurado');
        }
        
        if (cantidadExactaInput) {
            cantidadExactaInput.addEventListener('input', handleQuantityChange);
            console.log('✅ Event listener cantidad exacta configurado');
        }
        
        // Escuchar evento personalizado de precios actualizados
        window.addEventListener('preciosActualizados', handlePriceUpdate);
        
        // Actualizar precios inicial
        if (window.PricingModule) {
            window.PricingModule.actualizarPreciosUI();
        }
        
    } catch (error) {
        console.error('❌ Error configurando event listeners de precios:', error);
    }
}

/**
 * Manejar cambio de cantidad
 */
function handleQuantityChange() {
    try {
        console.log('📊 Cantidad cambiada, actualizando precios...');
        
        if (window.PricingModule) {
            window.PricingModule.actualizarPreciosUI();
        }
        
        // Manejar visibilidad del campo "6+"
        const cantidadSelect = document.getElementById('cantidad');
        const cantidadExactaContainer = document.getElementById('cantidad-exacta-container');
        
        if (cantidadSelect && cantidadExactaContainer) {
            if (cantidadSelect.value === '6+') {
                cantidadExactaContainer.style.display = 'block';
            } else {
                cantidadExactaContainer.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('❌ Error manejando cambio de cantidad:', error);
    }
}

/**
 * Manejar actualización de precios
 */
function handlePriceUpdate(event) {
    try {
        const precios = event.detail;
        console.log('💰 Precios actualizados:', precios);
        
        // Aquí se pueden añadir acciones adicionales cuando los precios cambien
        
    } catch (error) {
        console.error('❌ Error manejando actualización de precios:', error);
    }
}

/**
 * Sistema de precios de fallback
 */
function setupFallbackPricing() {
    console.warn('⚠️ Usando sistema de precios de fallback');
    
    const precioBase = 500000;
    
    function actualizarPreciosFallback() {
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
            
            const precioTotal = precioBase * cantidad;
            const precioReserva = Math.round(precioTotal * 0.3);
            
            // Actualizar elementos de precio
            const precioTotalElement = document.getElementById('precio-total');
            if (precioTotalElement) {
                precioTotalElement.textContent = `Precio total: ${formatearPrecioFallback(precioTotal)}`;
            }
            
            const pagoCompletoLabel = document.getElementById('pago-completo-label');
            if (pagoCompletoLabel) {
                pagoCompletoLabel.textContent = `Pago completo (${formatearPrecioFallback(precioTotal)})`;
            }
            
            const pagoReservaLabel = document.getElementById('pago-reserva-label');
            if (pagoReservaLabel) {
                pagoReservaLabel.textContent = `Reserva (30% - ${formatearPrecioFallback(precioReserva)})`;
            }
            
        } catch (error) {
            console.error('❌ Error en precios fallback:', error);
        }
    }
    
    // Configurar eventos para fallback
    const cantidadSelect = document.getElementById('cantidad');
    const cantidadExactaInput = document.getElementById('cantidad_exacta');
    
    if (cantidadSelect) {
        cantidadSelect.addEventListener('change', actualizarPreciosFallback);
    }
    
    if (cantidadExactaInput) {
        cantidadExactaInput.addEventListener('input', actualizarPreciosFallback);
    }
    
    actualizarPreciosFallback();
}

/**
 * Formatear precio fallback
 */
function formatearPrecioFallback(precio) {
    try {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(precio);
    } catch (error) {
        return `$${precio.toLocaleString('es-CO')} COP`;
    }
}

/**
 * Inicializar smooth scrolling
 */
function initSmoothScrolling() {
    try {
        const mobileMenu = document.getElementById('mobile-menu');
        
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
                
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                });
            }
        });
    });
    
        console.log('✅ Smooth scrolling inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando smooth scrolling:', error);
    }
}

/**
 * Inicializar timers de countdown
 */
function initCountdownTimers() {
    try {
    // Event countdown timer
    initCountdown(
        new Date('October 5, 2025 09:00:00'),
        'countdown-days',
        'countdown-hours',
        'countdown-minutes',
        'countdown-seconds'
    );
    
    // Preventa countdown timer
    initCountdown(
        new Date('June 20, 2025 23:59:59'),
        'preventa-days',
        'preventa-hours',
        'preventa-minutes',
        'preventa-seconds'
    );
    
        console.log('✅ Timers de countdown inicializados');
        
    } catch (error) {
        console.error('❌ Error inicializando timers:', error);
    }
}

/**
 * Inicializar formulario de reserva
 */
function initReservationForm() {
    try {
    const reservationForm = document.getElementById('reservation-form');
        if (!reservationForm) {
            console.log('ℹ️ Formulario de reserva no encontrado en esta página');
            return;
        }
        
        reservationForm.addEventListener('submit', handleFormSubmission);
        
        // Inicializar visibilidad de campos especiales
        setupFormFieldVisibility();
        
        console.log('✅ Formulario de reserva inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando formulario:', error);
    }
}

/**
 * Configurar visibilidad de campos del formulario
 */
function setupFormFieldVisibility() {
    try {
        // Manejar visibilidad del campo de personas con movilidad reducida
        const discapacidadCheckbox = document.getElementById('discapacidad');
        const personasMovilidadReducida = document.getElementById('personas-movilidad-reducida');
        
        if (discapacidadCheckbox && personasMovilidadReducida) {
            discapacidadCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    personasMovilidadReducida.style.display = 'block';
                } else {
                    personasMovilidadReducida.style.display = 'none';
                }
            });
        }
        
        // Manejar visibilidad del campo de cantidad exacta
        const cantidadSelect = document.getElementById('cantidad');
        const cantidadExactaContainer = document.getElementById('cantidad-exacta-container');
        
        if (cantidadSelect && cantidadExactaContainer) {
            function actualizarCampoCantidadExacta() {
                if (cantidadSelect.value === '6+') {
                    cantidadExactaContainer.style.display = 'block';
                } else {
                    cantidadExactaContainer.style.display = 'none';
                }
            }
            
            cantidadSelect.addEventListener('change', actualizarCampoCantidadExacta);
            actualizarCampoCantidadExacta(); // Llamar inicialmente
        }
        
    } catch (error) {
        console.error('❌ Error configurando visibilidad de campos:', error);
    }
}

/**
 * Manejar envío del formulario
 */
function handleFormSubmission(e) {
    e.preventDefault();
    console.log('📝 Procesando envío de formulario...');
    
    try {
        // Obtener datos del formulario
        const formData = getFormData();
        
        // Validar datos
        if (!validateFormData(formData)) {
            return;
        }
        
        // Procesar pago
        processPayment(formData);
        
    } catch (error) {
        console.error('❌ Error procesando formulario:', error);
        alert('Error interno. Por favor, recarga la página e intenta nuevamente.');
    }
}

/**
 * Obtener datos del formulario
 */
function getFormData() {
    try {
        const cantidadSelect = document.getElementById('cantidad');
        const cantidadExactaInput = document.getElementById('cantidad_exacta');
        
        let cantidad = 1;
        if (cantidadSelect) {
            if (cantidadSelect.value === '6+' && cantidadExactaInput) {
                cantidad = parseInt(cantidadExactaInput.value) || 6;
            } else {
                cantidad = parseInt(cantidadSelect.value) || 1;
            }
        }
        
        // Obtener tipo de pago
            const tipoPagoRadios = document.querySelectorAll('input[name="tipo_pago"]');
        let tipoPago = 'completo';
            for (const radio of tipoPagoRadios) {
                if (radio.checked) {
                    tipoPago = radio.value;
                    break;
                }
            }

        return {
            nombre: document.getElementById('nombre')?.value?.trim() || '',
            email: document.getElementById('email')?.value?.trim() || '',
            telefono: document.getElementById('telefono')?.value?.trim() || '',
            cantidad: cantidad,
            tipoPago: tipoPago,
            discapacidad: document.getElementById('discapacidad')?.checked || false,
            numMovilidadReducida: document.getElementById('num_movilidad_reducida')?.value || '0'
        };
        
    } catch (error) {
        console.error('❌ Error obteniendo datos del formulario:', error);
        return null;
    }
}

/**
 * Validar datos del formulario
 */
function validateFormData(data) {
    try {
        if (!data) {
            alert('Error obteniendo datos del formulario.');
            return false;
        }
        
        if (!data.nombre || data.nombre.length < 2) {
            alert('Por favor, ingresa un nombre válido.');
            return false;
        }
        
        if (!data.email || !isValidEmail(data.email)) {
                alert('Por favor, ingresa un email válido.');
            return false;
        }
        
        if (!data.telefono || data.telefono.length < 7) {
            alert('Por favor, ingresa un teléfono válido.');
            return false;
        }
        
        if (!data.cantidad || data.cantidad < 1) {
            alert('Por favor, selecciona una cantidad válida de entradas.');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error validando datos:', error);
        return false;
    }
}

/**
 * Validar email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Procesar pago
 */
function processPayment(formData) {
    try {
        console.log('💳 Iniciando procesamiento de pago...');
        
        // Verificar que ePayco esté disponible
        if (typeof ePayco === 'undefined' || !ePayco.checkout) {
            console.error('❌ ePayco no está disponible');
            alert('Error: Sistema de pagos no disponible. Por favor, recarga la página e intenta nuevamente.');
            return;
        }
        
        // Usar PricingModule si está disponible, sino usar fallback
        let resultado;
        
        if (window.PricingModule && window.PricingModule.estaInicializado()) {
            console.log('✅ Usando PricingModule para procesar pago');
            resultado = window.PricingModule.procesarPago(
                formData.cantidad,
                {
                    nombre: formData.nombre,
                    email: formData.email,
                    telefono: formData.telefono
                },
                formData.tipoPago
            );
            } else {
            console.warn('⚠️ PricingModule no disponible, usando método fallback');
            resultado = processPaymentFallback(formData);
        }
        
        if (resultado && !resultado.exito) {
            console.error('❌ Error en procesamiento de pago:', resultado.error);
        }
        
        // Guardar registro localmente
        saveRegistrationData(formData);
        
        // Actualizar cupos disponibles
        updateAvailableSpots(formData.cantidad);
        
    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        alert('Error procesando el pago. Por favor, intenta nuevamente.');
    }
}

/**
 * Procesar pago fallback
 */
function processPaymentFallback(formData) {
    try {
        console.log('🔄 Procesando pago con método fallback...');
        
        const precioBase = 500000;
        const precioTotal = precioBase * formData.cantidad;
        const montoAPagar = formData.tipoPago === 'completo' ? precioTotal : Math.round(precioTotal * 0.3);
        
        // Configurar ePayco
        const handler = ePayco.checkout.configure({
            key: '070f8aab3261bf1a71bbfd82dd97c9e2', // Clave pública
            test: false // Modo producción por defecto en fallback
        });
        
        const invoiceNumber = `FALLBACK-INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const data = {
            name: "Entrada - El poder de soltar",
            description: `Entrada para evento El poder de soltar - ${formData.cantidad} cupo(s)`,
            currency: "cop",
            amount: montoAPagar,
            invoice: invoiceNumber,
            tax_base: "0",
            tax: "0",
            country: "co",
            lang: "es",
            external: "true",
            
            response: `${window.location.origin}/response.html`,
            confirmation: `${window.location.origin}/api/epayco/confirmacion`,
            
            name_billing: formData.nombre,
            email_billing: formData.email,
            phone_billing: formData.telefono,
            type_doc_billing: "cc",
            mobilephone_billing: formData.telefono,
            
            x_extra1: formData.nombre,
            x_extra2: formData.email,
            x_extra3: formData.telefono,
            x_extra4: formData.cantidad.toString(),
            x_extra5: formData.tipoPago === 'completo' ? 'Pago_Completo' : 'Pago_Reserva'
        };
        
        handler.open(data);
        
        return { exito: true, metodo: 'fallback' };
        
    } catch (error) {
        console.error('❌ Error en pago fallback:', error);
        return { exito: false, error: error.message };
    }
}

/**
 * Save registration data to localStorage
 */
function saveRegistrationData(formData) {
    try {
        const registrations = JSON.parse(localStorage.getItem('eventRegistrations')) || [];
        
        const registration = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            cantidad: formData.cantidad,
            discapacidad: formData.discapacidad,
            tipo_pago: formData.tipoPago,
            estatus: formData.tipoPago === 'completo' ? 'Pago completo' : 'Reserva (30%)',
            transacciones: []
        };
        
        registrations.push(registration);
        localStorage.setItem('eventRegistrations', JSON.stringify(registrations));
        
        console.log('✅ Registro guardado:', registration);
        
    } catch (error) {
        console.error('❌ Error guardando registro:', error);
    }
}

/**
 * Load saved registrations from localStorage
 */
function loadRegistrations() {
    try {
        const registrations = JSON.parse(localStorage.getItem('eventRegistrations')) || [];
        console.log('📊 Registros cargados:', registrations.length);
        
        let spotsTaken = 0;
        registrations.forEach(reg => {
            spotsTaken += parseInt(reg.cantidad) || 0;
        });
        
        console.log(`📊 Total de cupos reservados: ${spotsTaken}`);
        
        // Update available spots display
        const availableSpotsElement = document.getElementById('available-spots');
        if (availableSpotsElement) {
            let availableSpots = localStorage.getItem('availableSpots');
            
            if (availableSpots === null) {
                availableSpots = Math.max(0, 50 - spotsTaken);
                localStorage.setItem('availableSpots', availableSpots);
            }
            
            availableSpotsElement.textContent = availableSpots;
            
            // Update urgency indicators
            updateUrgencyIndicators(availableSpots);
        }
        
    } catch (error) {
        console.error('❌ Error cargando registros:', error);
    }
}

/**
 * Update urgency indicators based on available spots
 */
function updateUrgencyIndicators(availableSpots) {
    try {
        const ultimosCuposContainer = document.getElementById('ultimos-cupos-container');
        if (!ultimosCuposContainer) return;
        
        if (availableSpots <= 10) {
            ultimosCuposContainer.classList.add('animate-pulse');
            ultimosCuposContainer.classList.remove('bg-yellow-300');
            ultimosCuposContainer.classList.add('bg-red-500', 'text-white');
        } else if (availableSpots <= 20) {
            ultimosCuposContainer.classList.add('bg-yellow-500');
        }
        
    } catch (error) {
        console.error('❌ Error actualizando indicadores de urgencia:', error);
    }
}

/**
 * Update available spots count
 */
function updateAvailableSpots(quantity) {
    try {
        let availableSpots = parseInt(localStorage.getItem('availableSpots')) || 50;
        availableSpots = Math.max(0, availableSpots - quantity);
        
        localStorage.setItem('availableSpots', availableSpots);
        
        const availableSpotsElement = document.getElementById('available-spots');
        if (availableSpotsElement) {
            availableSpotsElement.textContent = availableSpots;
        }
        
        updateUrgencyIndicators(availableSpots);
        
        console.log(`📊 Cupos disponibles actualizados: ${availableSpots}`);
        
    } catch (error) {
        console.error('❌ Error actualizando cupos disponibles:', error);
    }
}

/**
 * Initialize a countdown timer
 * @param {Date} targetDate - The target date to count down to
 * @param {string} daysElementId - ID of the element to display days
 * @param {string} hoursElementId - ID of the element to display hours
 * @param {string} minutesElementId - ID of the element to display minutes
 * @param {string} secondsElementId - ID of the element to display seconds
 */
function initCountdown(targetDate, daysElementId, hoursElementId, minutesElementId, secondsElementId) {
    const daysElement = document.getElementById(daysElementId);
    const hoursElement = document.getElementById(hoursElementId);
    const minutesElement = document.getElementById(minutesElementId);
    const secondsElement = document.getElementById(secondsElementId);
    
    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
        return;
    }
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;
        
        // If the countdown is over
        if (distance < 0) {
            daysElement.textContent = '0';
            hoursElement.textContent = '0';
            minutesElement.textContent = '0';
            secondsElement.textContent = '0';
            return;
        }
        
        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display the result
        daysElement.textContent = days;
        hoursElement.textContent = hours;
        minutesElement.textContent = minutes;
        secondsElement.textContent = seconds;
    }
    
    // Update the countdown every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/**
 * Handle form submission
 * @param {Event} event - The form submission event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const formValues = Object.fromEntries(formData.entries());
    
    // Manejar el caso de cantidad 6+
    if (formValues.cantidad === '6+') {
        const cantidadExacta = parseInt(formValues.cantidad_exacta);
        if (!cantidadExacta || cantidadExacta < 6) {
            alert('Por favor, ingresa una cantidad válida de entradas (mínimo 6).');
            return;
        }
        // Reemplazar el valor '6+' con la cantidad exacta
        formValues.cantidad = cantidadExacta.toString();
    }
    
    // Asegurar que se tenga el valor correcto de movilidad reducida
    if (formValues.discapacidad) {
        const selectMovilidadContainer = document.getElementById('select-movilidad-container');
        const inputMovilidadContainer = document.getElementById('input-movilidad-container');
        
        // Verificar qué interfaz está activa
        if (!selectMovilidadContainer.classList.contains('hidden')) {
            // El select está visible, el valor ya debería estar en formValues.num_movilidad_reducida
        } else if (!inputMovilidadContainer.classList.contains('hidden')) {
            // El input numérico está visible
            const numInput = document.getElementById('num_movilidad_reducida_input');
            const numValue = parseInt(numInput.value) || 1;
            const cantidadTotal = parseInt(formValues.cantidad) || 1;
            
            // Validar que no exceda la cantidad total
            if (numValue > cantidadTotal) {
                alert('El número de personas con movilidad reducida no puede ser mayor que el total de entradas.');
                return;
            }
            
            // Actualizar el valor en formValues
            formValues.num_movilidad_reducida = numValue.toString();
        }
    }
    
    // Basic validation
    if (!validateForm(formValues)) {
        return;
    }
    
    // Obtener el tipo de pago seleccionado
    const tipoPagoRadios = document.querySelectorAll('input[name="tipo_pago"]');
    let tipoPago = 'completo'; // Valor por defecto
    
    for (const radio of tipoPagoRadios) {
        if (radio.checked) {
            tipoPago = radio.value;
            break;
        }
    }

    const datosComprador = {
        nombre: formValues.nombre.trim(),
        email: formValues.email.trim(),
        telefono: formValues.telefono.trim()
    };

    // Validar datos antes de procesar
    if (!datosComprador.nombre || !datosComprador.email || !datosComprador.telefono) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }

    if (!datosComprador.email.includes('@')) {
        alert('Por favor, ingresa un email válido.');
        return;
    }

    const cantidad = parseInt(formValues.cantidad);
    
    // Procesar el pago usando PricingModule
    console.log('Procesando pago:', {
        cantidad: cantidad,
        tipoPago: tipoPago,
        comprador: datosComprador.nombre
    });
    
    // Verificar que PricingModule esté disponible
    if (typeof window.PricingModule === 'undefined') {
        console.error('PricingModule no está disponible');
        alert('Error: Sistema de precios no disponible. Por favor, recarga la página.');
        return;
    }
    
    // Llamar a la función de procesamiento de pago
    window.PricingModule.procesarPago(cantidad, datosComprador, tipoPago);
    
    // Simulate decreasing available spots
    updateAvailableSpots(cantidad);
}

/**
 * Validate form data
 * @param {Object} formData - The form data to validate
 * @returns {boolean} - Whether the form data is valid
 */
function validateForm(formData) {
    // Check required fields
    if (!formData.nombre || !formData.email || !formData.telefono || !formData.cantidad) {
        alert('Por favor completa todos los campos obligatorios.');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Por favor ingresa un correo electrónico válido.');
        return false;
    }
    
    // Validate phone number (simple validation)
    const phoneRegex = /^[0-9\+\-\s]{7,15}$/;
    if (!phoneRegex.test(formData.telefono)) {
        alert('Por favor ingresa un número de teléfono válido.');
        return false;
    }
    
    return true;
}

/**
 * Check if the current date is within the preventa period
 * @returns {boolean} - Whether the current date is within the preventa period
 */
function isPreventaPeriod() {
    const now = new Date();
    const preventaEndDate = new Date('June 20, 2025 23:59:59');
    return now <= preventaEndDate;
}

/**
 * Calculate the price based on whether it's preventa period or not
 * @param {string} paymentType - The type of payment (completo or reserva)
 * @param {number} quantity - The number of tickets
 * @returns {object} - The price information
 */
function calculatePrice(paymentType, quantity = 1) {
    const regularPrice = 434000;
    const discountPercent = 5;
    quantity = parseInt(quantity) || 1;
    
    // Check if we're in the preventa period
    const isDiscount = isPreventaPeriod();
    
    // Calculate the price per ticket
    let pricePerTicket = regularPrice;
    if (isDiscount) {
        pricePerTicket = regularPrice * (1 - discountPercent / 100);
    }
    
    // Calculate total price (price per ticket * quantity)
    let totalPrice = pricePerTicket * quantity;
    
    // If it's a reservation, it's 30% of the total
    if (paymentType === 'reserva') {
        totalPrice = totalPrice * 0.3;
    }
    
    return {
        originalPrice: regularPrice * quantity,
        finalPrice: Math.round(totalPrice),
        pricePerTicket: Math.round(pricePerTicket),
        quantity: quantity,
        isDiscount: isDiscount,
        discountPercent: discountPercent
    };
}

/**
 * Redirect to ePayco payment gateway
 * @param {Object} formData - The form data to send to the payment gateway
 */
function redirectToPayment(formData) {
    try {
            console.log("Iniciando proceso de pago con ePayco...");
    
    // Verificar si ePayco existe
    if (typeof ePayco === 'undefined' || !ePayco.checkout) {
        console.error("Error: El objeto ePayco no está disponible. Asegúrate de que el script esté cargado correctamente.");
        alert("Error al conectar con la pasarela de pagos. Por favor, recarga la página e intenta nuevamente.");
        return;
    }

    // Verificar que EpaycoConfig esté disponible
    if (!window.EpaycoConfig) {
        console.error("Error: El módulo de configuración de ePayco no está cargado.");
        alert("Error: Configuración de pago no disponible. Por favor recarga la página.");
        return;
    }
        
        // Calculate price based on payment type and whether it's preventa period
        const priceInfo = calculatePrice(formData.tipo_pago, formData.cantidad);
        
        // Obtener información de movilidad reducida
        const discapacidad = formData.discapacidad ? true : false;
        let num_movilidad_reducida = "0";
        
        if (discapacidad) {
            const cantidadBoletos = parseInt(formData.cantidad) || 1;
            if (cantidadBoletos > 1 && formData.num_movilidad_reducida) {
                num_movilidad_reducida = formData.num_movilidad_reducida;
            } else {
                num_movilidad_reducida = "1"; // Si es solo 1 boleto y marcó discapacidad
            }
        }
        
        // Save registration to localStorage
        saveRegistration(formData, priceInfo);
        
        // Create unique invoice number with timestamp and 6 random alphanumeric characters
        // Usar la nueva configuración para generar el invoice number
        const invoiceNumber = window.EpaycoConfig ? 
            window.EpaycoConfig.generateInvoiceNumber() : 
            `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // Configuración para ePayco - solo producción
        const epaycoConfig = window.EpaycoConfig ? window.EpaycoConfig.getConfig() : null;
        
        if (!epaycoConfig) {
            console.warn('EpaycoConfig no disponible, usando configuración por defecto');
        }
        
        // Configurar clave pública dinámicamente
        const publicKey = epaycoConfig ? epaycoConfig.publicKey : '070f8aab3261bf1a71bbfd82dd97c9e2';
        console.log("Configurando ePayco con la clave:", publicKey);
        
        // Mostrar advertencia si está en modo de prueba
        if (epaycoConfig && epaycoConfig.mode === 'test') {
            console.warn('⚠️ MODO PRUEBA ACTIVADO - Las transacciones NO serán reales');
        }
        
        // Configuración inicial de ePayco con las claves del comercio
        var handler = ePayco.checkout.configure({
            key: publicKey,
            test: epaycoConfig ? epaycoConfig.mode === 'test' : false
        });
        
        // Obtener URLs dinámicamente
        const confirmationUrl = epaycoConfig ? epaycoConfig.confirmationUrl : 
            'https://elpoderdesoltar.pnitecnicasolarte.com/api/epayco/confirmacion';
                
        const responseUrl = epaycoConfig ? epaycoConfig.responseUrl : 
            'https://elpoderdesoltar.pnitecnicasolarte.com/response.html';
        
        console.log('URLs configuradas:', { 
            confirmationUrl, 
            responseUrl, 
            mode: epaycoConfig ? epaycoConfig.mode : 'default' 
        });
        
        // Configuración de la compra
        var data = {
            // Parámetros compra (obligatorio)
            name: 'El poder de soltar - Evento presencial',
            description: `Reserva para ${formData.nombre} - ${formData.cantidad} entrada(s)`,
            invoice: invoiceNumber,
            currency: 'cop',
            amount: priceInfo.finalPrice.toString(),
            tax_base: '0',
            tax: '0',
            tax_ico: '0',
            country: 'co',
            lang: 'es',
            
            // Onpage="false" - Standard="true"
            external: 'true',
            
            // Atributos opcionales
            extra1: formData.nombre,
            extra2: formData.email,
            extra3: formData.telefono,
            extra4: formData.cantidad,
            extra5: discapacidad ? 'Si' : 'No',
            extra6: formData.tipo_pago, // Guardar el tipo de pago para referencia
            extra7: num_movilidad_reducida, // Número de personas con movilidad reducida
            
            // URLs de respuesta y confirmación
            confirmation: confirmationUrl,
            response: responseUrl,
            
            // Atributos cliente
            name_billing: formData.nombre,
            address_billing: 'Bogotá',
            type_doc_billing: 'cc',
            mobilephone_billing: formData.telefono,
            number_doc_billing: '',
            email_billing: formData.email
        };
        
        console.log("Datos de pago:", data);
        console.log("Abriendo checkout de ePayco...");
        
        // Desplegar checkout
        handler.open(data);
        
        console.log("Checkout de ePayco iniciado correctamente");
    } catch (error) {
        console.error("Error al redirigir a ePayco:", error);
        alert("Ha ocurrido un error al conectar con la pasarela de pagos. Por favor, intenta nuevamente.");
    }
}

/**
 * Save registration data to localStorage
 * @param {Object} formData - The form data
 * @param {Object} priceInfo - The price information
 */
function saveRegistration(formData, priceInfo) {
    // Get existing registrations or initialize empty array
    let registrations = JSON.parse(localStorage.getItem('eventRegistrations')) || [];
    
    // Create registration object
    const registration = {
        id: Date.now(), // Unique ID
        timestamp: new Date().toISOString(),
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        cantidad: formData.cantidad,
        discapacidad: formData.discapacidad ? true : false,
        tipo_pago: formData.tipo_pago,
        monto: priceInfo.finalPrice,
        monto_por_boleto: priceInfo.pricePerTicket,
        monto_total: priceInfo.originalPrice,
        estatus: formData.tipo_pago === 'completo' ? 'Pago completo' : 'Reserva (30%)',
        transacciones: []
    };
    
    // Add to registrations array
    registrations.push(registration);
    
    // Save to localStorage
    localStorage.setItem('eventRegistrations', JSON.stringify(registrations));
    
    console.log('Registro guardado:', registration);
}

/**
 * Load saved registrations from localStorage
 */
function loadRegistrations() {
    const registrations = JSON.parse(localStorage.getItem('eventRegistrations')) || [];
    console.log('Registros guardados:', registrations);
    
    // Calculate total number of spots taken
    let spotsTaken = 0;
    registrations.forEach(reg => {
        spotsTaken += parseInt(reg.cantidad);
    });
    
    console.log(`Total de cupos reservados: ${spotsTaken}`);
    
    // Update available spots display
    const availableSpotsElement = document.getElementById('available-spots');
    if (availableSpotsElement) {
        // Get current available spots from localStorage or use default
        let availableSpots = localStorage.getItem('availableSpots');
        
        // If not set yet, calculate based on registrations
        if (availableSpots === null) {
            availableSpots = Math.max(0, 50 - spotsTaken);
            localStorage.setItem('availableSpots', availableSpots);
        }
        
        // Update display
        availableSpotsElement.textContent = availableSpots;
        
        // Update UI to show urgency when spots are getting low
        const ultimosCuposContainer = document.getElementById('ultimos-cupos-container');
        if (ultimosCuposContainer) {
            if (availableSpots <= 10) {
                ultimosCuposContainer.classList.add('animate-pulse');
                ultimosCuposContainer.classList.remove('bg-yellow-300');
                ultimosCuposContainer.classList.add('bg-red-500');
                ultimosCuposContainer.classList.add('text-white');
            } else if (availableSpots <= 20) {
                ultimosCuposContainer.classList.add('bg-yellow-500');
            }
        }
    }
}

/**
 * Update the price display based on whether it's preventa period or not
 */
function updatePriceDisplay() {
    const isDiscount = isPreventaPeriod();
    const regularPrice = 434000;
    const discountPercent = 5;
    
    // Actualizar etiquetas de radio buttons
    updatePaymentTypeLabels(isDiscount, regularPrice, discountPercent);
    
    // Añadir listener para actualizar precios cuando cambia la cantidad
    const cantidadSelect = document.getElementById('cantidad');
    const cantidadExactaInput = document.getElementById('cantidad_exacta');
    
    if (cantidadSelect) {
        cantidadSelect.addEventListener('change', function() {
            updatePaymentTypeLabels(isDiscount, regularPrice, discountPercent);
        });
    }
    
    if (cantidadExactaInput) {
        cantidadExactaInput.addEventListener('input', function() {
            updatePaymentTypeLabels(isDiscount, regularPrice, discountPercent);
        });
    }
}

/**
 * Format a number with thousands separator
 * @param {number} num - The number to format
 * @returns {string} - The formatted number
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Update payment type radio labels with correct prices
 * @param {boolean} isDiscount - Whether there's a discount
 * @param {number} regularPrice - The regular price
 * @param {number} discountPercent - The discount percentage
 */
function updatePaymentTypeLabels(isDiscount, regularPrice, discountPercent) {
    const pagoCompletoLabel = document.querySelector('input[value="completo"] + span');
    const pagoReservaLabel = document.querySelector('input[value="reserva"] + span');
    
    if (!pagoCompletoLabel || !pagoReservaLabel) return;
    
    // Obtener la cantidad actual seleccionada
    const cantidadSelect = document.getElementById('cantidad');
    const cantidadExactaInput = document.getElementById('cantidad_exacta');
    
    if (!cantidadSelect) return;
    
    // Calcular cantidad efectiva
    let cantidad = 1;
    if (cantidadSelect.value === '6+' && cantidadExactaInput) {
        cantidad = parseInt(cantidadExactaInput.value) || 6;
    } else {
        cantidad = parseInt(cantidadSelect.value) || 1;
    }
    
    if (isDiscount) {
        const discountedPrice = Math.round(regularPrice * (1 - discountPercent / 100));
        const totalPrice = discountedPrice * cantidad;
        pagoCompletoLabel.textContent = `Pago completo ($${formatNumber(totalPrice)})`;
        pagoReservaLabel.textContent = `Reserva (30% - $${formatNumber(Math.round(totalPrice * 0.3))})`;
    } else {
        const totalPrice = regularPrice * cantidad;
        pagoCompletoLabel.textContent = `Pago completo ($${formatNumber(totalPrice)})`;
        pagoReservaLabel.textContent = `Reserva (30% - $${formatNumber(Math.round(totalPrice * 0.3))})`;
    }
    
    // Actualizar también el precio display principal
    updatePriceMainDisplay(isDiscount, regularPrice, discountPercent, cantidad);
}

/**
 * Update the main price display in the top section
 * @param {boolean} isDiscount - Whether there's a discount
 * @param {number} regularPrice - The regular price
 * @param {number} discountPercent - The discount percentage
 * @param {number} cantidad - The quantity of tickets
 */
function updatePriceMainDisplay(isDiscount, regularPrice, discountPercent, cantidad = 1) {
    const precioDisplay = document.getElementById('precio-display');
    if (!precioDisplay) return;
    
    if (isDiscount) {
        const discountedPrice = Math.round(regularPrice * (1 - discountPercent / 100));
        const totalDiscountedPrice = discountedPrice * cantidad;
        const totalRegularPrice = regularPrice * cantidad;
        precioDisplay.innerHTML = `$${formatNumber(totalDiscountedPrice)} <span class="text-sm line-through">$${formatNumber(totalRegularPrice)}</span>`;
    } else {
        const totalPrice = regularPrice * cantidad;
        precioDisplay.innerHTML = `$${formatNumber(totalPrice)}`;
    }
}

/**
 * Initialize FAQ accordion functionality
 */
function initFaqAccordion() {
    const faqButtons = document.querySelectorAll('#faq button');
    
    faqButtons.forEach((button, index) => {
        const content = button.nextElementSibling;
        const icon = button.querySelector('i');
        
        // Inicialmente, colapsar todas las respuestas excepto la primera
        if (index !== 0) {
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            content.style.overflow = 'hidden';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        } else {
            // Primera pregunta expandida
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            content.style.overflow = 'visible';
            icon.classList.add('fa-chevron-down');
            icon.classList.remove('fa-chevron-right');
        }
        
        // Add click event listener
        button.addEventListener('click', function() {
            // Toggle this FAQ item
            const content = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            if (content.style.maxHeight === '0px' || content.style.maxHeight === '') {
                // Expand this item
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
                content.style.overflow = 'visible';
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
                
                // Add transition effect
                content.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
            } else {
                // Collapse this item
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                content.style.overflow = 'hidden';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        });
    });
}

/**
 * Busca y muestra los detalles de una reserva
 */
async function searchAndDisplayReservation() {
    // Obtener el email y referencia ingresados
    const emailInput = document.getElementById('email_pago');
    const referenciaInput = document.getElementById('referencia');
    
    if (!emailInput || !emailInput.value) {
        alert('Por favor ingresa tu correo electrónico para buscar tu reserva.');
        return;
    }
    
    // Ocultar mensajes previos
    document.getElementById('reservation-details').classList.add('hidden');
    document.getElementById('reservation-not-found').classList.add('hidden');
    
    try {
        // Buscar reservas pendientes usando la API
        const reservasPendientes = await API.buscarReservasPendientes(emailInput.value);
        
        if (!reservasPendientes || reservasPendientes.length === 0) {
            // No se encontró ninguna reserva
            document.getElementById('reservation-not-found').classList.remove('hidden');
            return;
        }
        
        // Tomar la reserva más reciente
        const reservation = reservasPendientes[0];
        
        if (reservation.tipo_pago !== 'reserva') {
            // La reserva ya tiene pago completo
            document.getElementById('reservation-not-found').classList.remove('hidden');
            document.querySelector('#reservation-not-found h4').textContent = 'Tu reserva ya tiene pago completo';
            document.querySelector('#reservation-not-found p').textContent = 'La reserva encontrada ya tiene el pago completo. No es necesario realizar un pago adicional.';
            return;
        }
        
        // Calcular el monto restante (70% del total)
        const precioUnitario = parseFloat(reservation.precio_unitario);
        const cantidad = parseInt(reservation.cantidad);
        const montoTotal = precioUnitario * cantidad;
        const montoPagado = parseFloat(reservation.monto_pagado);
        const montoRestante = montoTotal - montoPagado;
        
        // Verificar si se aplicó el descuento de preventa
        const precioRegular = 500000;
        const precioConDescuento = 444000; // 500000 - 56000 = 444000
        const tieneDescuento = Math.abs(precioUnitario - precioConDescuento) < 1000; // Tolerancia de 1000 COP
        
        // Obtener detalles del cliente (asumiendo que la API incluye estos datos)
        const nombre = reservation.nombre || 'Cliente';
        const email = reservation.email || emailInput.value;
        const telefono = reservation.telefono || '';
        
        // Mostrar los detalles de la reserva
        const reservationInfo = document.getElementById('reservation-info');
        reservationInfo.innerHTML = `
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${telefono}</p>
            <p><strong>Cantidad de entradas:</strong> ${cantidad}</p>
            <p><strong>Fecha de reserva:</strong> ${new Date(reservation.created_at).toLocaleDateString()}</p>
            ${tieneDescuento ? '<p class="text-green-600 font-semibold"><i class="fas fa-tag mr-1"></i> Descuento de preventa aplicado ($56,000 COP)</p>' : ''}
            ${reservation.tiene_discapacidad ? '<p><strong>Incluye acceso para personas con movilidad reducida</strong></p>' : ''}
        `;
        
        // Mostrar los montos
        document.getElementById('reserva-monto').textContent = `$${formatNumber(montoPagado)}`;
        document.getElementById('monto-restante').textContent = `$${formatNumber(montoRestante)}`;
        
        // Si tiene descuento, añadir mensaje aclaratorio
        const reservationAmount = document.getElementById('reservation-amount');
        const existingNote = reservationAmount.querySelector('.text-green-600');
        if (existingNote) {
            existingNote.remove();
        }
        
        if (tieneDescuento) {
            const notaDescuento = document.createElement('p');
            notaDescuento.className = 'text-sm text-green-600 mt-2';
            notaDescuento.innerHTML = '<i class="fas fa-info-circle mr-1"></i> Tu reserva mantiene el descuento de preventa de $56,000 COP.';
            reservationAmount.appendChild(notaDescuento);
        }
        
        // Mostrar el área de detalles
        document.getElementById('reservation-details').classList.remove('hidden');
        
        // Guardar la reserva encontrada en un atributo de datos del formulario para usar al enviar
        document.getElementById('complete-payment-form').setAttribute('data-reservation-id', reservation.id);
    } catch (error) {
        console.error('Error al buscar reservas:', error);
        document.getElementById('reservation-not-found').classList.remove('hidden');
        document.querySelector('#reservation-not-found p').textContent = 'Ocurrió un error al buscar tu reserva. Por favor intenta nuevamente más tarde.';
    }
}

/**
 * Handle complete payment form submission
 * @param {Event} event - The form submission event
 */
async function handleCompletePayment(event) {
    event.preventDefault();
    
    // Verificar si ya se buscó una reserva
    const reservationId = event.target.getAttribute('data-reservation-id');
    if (!reservationId) {
        alert('Por favor, primero busca tu reserva usando el botón "Buscar mi reserva".');
        return;
    }
    
    try {
        // Buscar reservas pendientes usando la API para verificar que todavía existe
        const emailInput = document.getElementById('email_pago');
        const reservasPendientes = await API.buscarReservasPendientes(emailInput.value);
        
        // Verificar que la reserva seleccionada sigue existiendo y está pendiente
        const reserva = reservasPendientes.find(r => r.id.toString() === reservationId.toString());
        
        if (!reserva) {
            alert('No se pudo encontrar la reserva o ya ha sido completada. Por favor intenta nuevamente.');
            return;
        }
        
        if (reserva.tipo_pago !== 'reserva') {
            alert('Tu reserva ya tiene pago completo. No es necesario realizar un pago adicional.');
            return;
        }
        
        // Calcular monto restante
        const precioUnitario = parseFloat(reserva.precio_unitario);
        const cantidad = parseInt(reserva.cantidad);
        const montoTotal = precioUnitario * cantidad;
        const montoPagado = parseFloat(reserva.monto_pagado);
        const montoRestante = montoTotal - montoPagado;
        
        // Verificar si tiene descuento de preventa
        const precioRegular = 500000;
        const precioConDescuento = 444000; // 500000 - 56000 = 444000
        const tieneDescuento = Math.abs(precioUnitario - precioConDescuento) < 1000; // Tolerancia de 1000 COP
        
        // Redirigir a ePayco para completar el pago
        redirectToCompletePaymentWithAPI(reserva, montoRestante, tieneDescuento);
    } catch (error) {
        console.error('Error al verificar la reserva:', error);
        
        // Fallback al método anterior si hay error con la API
        const formData = new FormData(event.target);
        const formValues = Object.fromEntries(formData.entries());
        
        // Find the reservation in localStorage
        const registrations = JSON.parse(localStorage.getItem('eventRegistrations')) || [];
        const reservation = registrations.find(reg => reg.id.toString() === reservationId);
        
        if (!reservation) {
            alert('No se pudo encontrar la reserva. Por favor intenta nuevamente.');
            return;
        }
        
        if (reservation.tipo_pago !== 'reserva') {
            alert('Tu reserva ya tiene pago completo. No es necesario realizar un pago adicional.');
            return;
        }
        
        // Redirect to payment for the remaining amount (70%)
        const remainingAmount = calculateRemainingAmount(reservation);
        redirectToCompletePayment(reservation, remainingAmount);
    }
}

/**
 * Redirecciona a ePayco para completar un pago utilizando los datos de la API
 * @param {Object} reserva - Datos de la reserva desde la API
 * @param {number} montoRestante - Monto restante a pagar
 * @param {boolean} tieneDescuento - Si la reserva tiene descuento aplicado
 */
function redirectToCompletePaymentWithAPI(reserva, montoRestante, tieneDescuento) {
    try {
            console.log("Iniciando proceso de completar pago con ePayco...");
    
    // Verificar si ePayco existe
    if (typeof ePayco === 'undefined' || !ePayco.checkout) {
        console.error("Error: El objeto ePayco no está disponible. Asegúrate de que el script esté cargado correctamente.");
        alert("Error al conectar con la pasarela de pagos. Por favor, recarga la página e intenta nuevamente.");
        return;
    }

    // Verificar que EpaycoConfig esté disponible
    if (!window.EpaycoConfig) {
        console.error("Error: El módulo de configuración de ePayco no está cargado.");
        alert("Error: Configuración de pago no disponible. Por favor recarga la página.");
        return;
    }
        
        // Create unique invoice number with timestamp and reservation ID
        const timestamp = Date.now();
        const invoiceNumber = `COMP-${timestamp}-${reserva.id}`;
        
        console.log("Configurando ePayco para completar pago...");
        
        // Configuración para ePayco - solo producción
        const epaycoConfig = window.EpaycoConfig ? window.EpaycoConfig.getConfig() : null;
        
        if (!epaycoConfig) {
            console.warn('EpaycoConfig no disponible, usando configuración por defecto');
        }
        
        // Configurar clave pública dinámicamente
        const publicKey = epaycoConfig ? epaycoConfig.publicKey : '070f8aab3261bf1a71bbfd82dd97c9e2';
        console.log("Configurando ePayco con la clave:", publicKey);
        
        // Mostrar advertencia si está en modo de prueba
        if (epaycoConfig && epaycoConfig.mode === 'test') {
            console.warn('⚠️ MODO PRUEBA ACTIVADO - Las transacciones NO serán reales');
        }
        
        // Configuración inicial de ePayco con las claves del comercio
        var handler = ePayco.checkout.configure({
            key: publicKey,
            test: epaycoConfig ? epaycoConfig.mode === 'test' : false
        });
        
        // Obtener URLs dinámicamente
        const confirmationUrl = epaycoConfig ? epaycoConfig.confirmationUrl : 
            'https://elpoderdesoltar.pnitecnicasolarte.com/api/epayco/confirmacion';
                
        const responseUrl = epaycoConfig ? epaycoConfig.responseUrl : 
            'https://elpoderdesoltar.pnitecnicasolarte.com/response.html';
        
        console.log('URLs configuradas:', { 
            confirmationUrl, 
            responseUrl, 
            mode: epaycoConfig ? epaycoConfig.mode : 'default' 
        });
        
        // Verificar si se aplicó descuento de preventa
        const descuentoTexto = tieneDescuento ? " (con descuento de preventa aplicado)" : "";
        
        // Configuración de la compra
        var data = {
            // Parámetros compra (obligatorio)
            name: 'El poder de soltar - Completar pago',
            description: `Completar pago - ${reserva.cantidad} entrada(s)${descuentoTexto}`,
            invoice: invoiceNumber,
            currency: 'cop',
            amount: montoRestante.toString(),
            tax_base: '0',
            tax: '0',
            tax_ico: '0',
            country: 'co',
            lang: 'es',
            
            // Onpage="false" - Standard="true"
            external: 'true',
            
            // Atributos opcionales
            extra1: reserva.nombre,
            extra2: reserva.email,
            extra3: reserva.telefono,
            extra4: reserva.cantidad.toString(),
            extra5: 'Completar_Pago',
            extra6: reserva.id.toString(), // ID de la reserva original
            extra7: tieneDescuento ? 'ConDescuento' : 'SinDescuento', // Información sobre descuento
            
            // URLs de respuesta y confirmación
            confirmation: confirmationUrl,
            response: responseUrl,
            
            // Atributos cliente
            name_billing: reserva.nombre,
            address_billing: 'Bogotá',
            type_doc_billing: 'cc',
            mobilephone_billing: reserva.telefono,
            number_doc_billing: '',
            email_billing: reserva.email
        };
        
        console.log("Datos para completar pago:", data);
        console.log("Abriendo checkout de ePayco para completar pago...");
        
        // Desplegar checkout
        handler.open(data);
        
        console.log("Checkout de ePayco iniciado correctamente");
    } catch (error) {
        console.error("Error al redirigir a ePayco para completar pago:", error);
        alert("Ha ocurrido un error al conectar con la pasarela de pagos. Por favor, intenta nuevamente.");
    }
}

// API endpoints
// Configuración de API más segura
const API_CONFIG = {
    baseUrl: `${window.location.origin}/api`,
    timeout: 10000, // 10 segundos
    maxRetries: 3
};

/**
 * Funciones para comunicación con la API
 */
const API = {
    // Realizar solicitud con reintentos y timeout
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },

    // Buscar reservas pendientes por email (usando ruta pública segura)
    async buscarReservasPendientes(email) {
        try {
            // Validar email en frontend también
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Formato de email inválido');
            }
            
            const response = await this.makeRequest(`${API_CONFIG.baseUrl}/public/reservas/pendientes/${encodeURIComponent(email)}`);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Demasiadas búsquedas. Espera un momento antes de intentar nuevamente.');
                }
                throw new Error('Error al buscar reservas pendientes');
            }
            
            const data = await response.json();
            return data.reservas;
        } catch (error) {
            console.error('Error en API.buscarReservasPendientes:', error);
            // Como fallback, usar localStorage
            return buscarReservasPendientesLocal(email);
        }
    },

    // Enviar confirmación de transacción a la API
    async confirmarTransaccion(datosConfirmacion) {
        try {
            const response = await this.makeRequest(`${API_CONFIG.baseUrl}/epayco/confirmacion`, {
                method: 'POST',
                body: JSON.stringify(datosConfirmacion)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Demasiadas solicitudes. Espera un momento.');
                }
                throw new Error('Error al confirmar transacción');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en API.confirmarTransaccion:', error);
            // Como no se pudo confirmar en la API, guardar localmente
            saveTransaction(datosConfirmacion);
            return null;
        }
    }
};

/**
 * Buscar reservas pendientes en localStorage (fallback)
 * @param {string} email - Email del cliente
 * @returns {Array} - Reservas pendientes encontradas
 */
function buscarReservasPendientesLocal(email) {
    if (!email) return [];
    
    const registrations = JSON.parse(localStorage.getItem('eventRegistrations')) || [];
    
    // Filtrar reservas pendientes por email
    return registrations.filter(reg => 
        reg.email.toLowerCase() === email.toLowerCase() && 
        reg.tipo_pago === 'reserva' &&
        reg.estatus.includes('Reserva')
    );
}

/**
 * Inicialización principal de event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema principal...');
    
    // Inicializar funciones principales
    initMobileMenu();
    initPriceSystem();
    initSmoothScrolling();
    initCountdownTimers();
    initReservationForm();
    initFaqAccordion();
    
    // Event listeners específicos para la página de reservas (reserva.html)
    const searchReservationButton = document.getElementById('search-reservation-button');
    const completePaymentForm = document.getElementById('complete-payment-form');
    
    if (searchReservationButton) {
        searchReservationButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔍 Iniciando búsqueda de reserva...');
            
            // Validar que se haya ingresado un email
            const emailInput = document.getElementById('email_pago');
            if (!emailInput || !emailInput.value.trim()) {
                alert('Por favor ingresa tu correo electrónico para buscar tu reserva.');
                return;
            }
            
            // Deshabilitar botón durante la búsqueda
            const originalText = this.textContent;
            this.disabled = true;
            this.textContent = '🔍 BUSCANDO...';
            
            searchAndDisplayReservation()
                .finally(() => {
                    // Rehabilitar botón
                    this.disabled = false;
                    this.textContent = originalText;
                });
        });
    }
    
    if (completePaymentForm) {
        completePaymentForm.addEventListener('submit', handleCompletePayment);
    }
    
    /**
     * Manejo del formulario de suscripción a mensajes de email
     */
    // Encontrar el formulario de suscripción
    const emailSubscriptionForm = document.querySelector('section form');
    
    if (emailSubscriptionForm) {
        emailSubscriptionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nombreInput = this.querySelector('input[placeholder="Nombre"]');
            const emailInput = this.querySelector('input[placeholder="Email"]');
            const submitButton = this.querySelector('button[type="submit"]');
            
            if (!nombreInput || !emailInput) {
                console.error('No se encontraron los campos del formulario de suscripción');
                return;
            }
            
            const nombre = nombreInput.value.trim();
            const email = emailInput.value.trim();
            
            // Validar campos
            if (!nombre || !email) {
                alert('Por favor, completa todos los campos.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingresa un email válido.');
                return;
            }
            
            // Deshabilitar botón durante el envío
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = '📧 Suscribiendo...';
            
            try {
                // Guardar suscripción localmente (fallback)
                saveEmailSubscription(nombre, email);
                
                // Intentar enviar a la API (si está disponible)
                try {
                    const response = await fetch(`${API_CONFIG.baseUrl}/public/suscripciones`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nombre: nombre,
                            email: email,
                            origen: 'landing_page'
                        })
                    });
                    
                    if (response.ok) {
                        console.log('Suscripción enviada exitosamente a la API');
                    } else {
                        console.warn('No se pudo enviar a la API, pero se guardó localmente');
                    }
                } catch (apiError) {
                    console.warn('Error al enviar a la API:', apiError);
                    console.log('Suscripción guardada localmente como fallback');
                }
                
                // Mostrar mensaje de éxito
                alert('¡Gracias por suscribirte! Recibirás nuestros mensajes de despertar en tu email.');
                
                // Limpiar formulario
                nombreInput.value = '';
                emailInput.value = '';
                
                // Mostrar feedback visual
                submitButton.textContent = '✅ ¡Suscrito!';
                submitButton.style.backgroundColor = '#10B981';
                
                setTimeout(() => {
                    submitButton.textContent = originalText;
                    submitButton.style.backgroundColor = '';
                    submitButton.disabled = false;
                }, 3000);
                
            } catch (error) {
                console.error('Error al procesar suscripción:', error);
                alert('Hubo un error al procesar tu suscripción. Por favor, intenta nuevamente.');
                
                // Restaurar botón
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
});

/**
 * Guardar suscripción de email en localStorage como fallback
 * @param {string} nombre - Nombre del suscriptor
 * @param {string} email - Email del suscriptor
 */
function saveEmailSubscription(nombre, email) {
    try {
        const subscriptions = JSON.parse(localStorage.getItem('emailSubscriptions')) || [];
        
        // Verificar si ya existe esta suscripción
        const existingSubscription = subscriptions.find(sub => sub.email.toLowerCase() === email.toLowerCase());
        
        if (!existingSubscription) {
            const newSubscription = {
                id: Date.now(),
                nombre: nombre,
                email: email,
                fecha_suscripcion: new Date().toISOString(),
                origen: 'landing_page',
                estado: 'activo'
            };
            
            subscriptions.push(newSubscription);
            localStorage.setItem('emailSubscriptions', JSON.stringify(subscriptions));
            
            console.log('Suscripción guardada localmente:', newSubscription);
        } else {
            console.log('Email ya está suscrito');
        }
    } catch (error) {
        console.error('Error al guardar suscripción localmente:', error);
    }
}