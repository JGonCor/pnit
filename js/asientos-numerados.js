// Sistema de Selección de Asientos Numerados - El Poder de Soltar
// 500 asientos total: 21 filas, primera fila 20 asientos (10 por sección), demás filas 24 asientos (12 por sección)

console.log('🎫 Cargando sistema de asientos numerados...');

// Configuración de asientos según especificaciones exactas
const ASIENTOS_CONFIG = {
    totalFilas: 21,
    primeraFila: {
        total: 20,              // 10 por sección
        porSeccion: 10,
        soloMovilidadReducida: true
    },
    demasFilas: {
        total: 24,              // 12 por sección  
        porSeccion: 12,
        soloMovilidadReducida: false
    },
    secciones: {
        izquierda: 'L',         // L para Left
        derecha: 'R'            // R para Right
    },
    totalAsientos: 500          // 20 + (20 * 24) = 500 asientos
};

// Estados de asientos
const ESTADOS_ASIENTO = {
    disponible: 'disponible',
    seleccionado: 'seleccionado',
    ocupado: 'ocupado',
    reservado: 'reservado',
    bloqueado: 'bloqueado'      // Para primera fila si no tiene movilidad reducida
};

// Colores para cada estado
const COLORES_ASIENTO = {
    disponible: '#dcfce7',      // Verde claro
    seleccionado: '#3b82f6',    // Azul
    ocupado: '#ef4444',         // Rojo
    reservado: '#f59e0b',       // Amarillo/naranja
    bloqueado: '#f3f4f6'        // Gris claro
};

// Variable global para el sistema de asientos
window.SistemaAsientos = (function() {
    let asientosSeleccionados = [];
    let asientosOcupados = [];
    let asientosReservados = [];
    let cantidadRequerida = 1;
    let tieneMovilidadReducida = false;
    let distribucionAsientos = null; // Nueva variable para distribución
    let contenedorAsientos = null;
    let estructuraAsientos = null;

    // Función para generar ID de asiento con nuevo formato
    function generarIdAsiento(fila, seccion, numero) {
        // Nuevo formato: SecciónFila-Asiento (Ej: L5-12, R10-5)
        // L = Left (izquierda), R = Right (derecha)
        const seccionPrefix = seccion === 'izquierda' ? 'L' : 'R';
        return `${seccionPrefix}${fila}-${numero}`;
    }

    // Función para parsear ID de asiento
    function parsearIdAsiento(id) {
        // Nuevo formato: L5-12, R10-5 (SecciónFila-Asiento)
        const match = id.match(/^([LR])(\d+)-(\d+)$/);
        if (!match) return null;
        
        return {
            seccion: match[1] === 'L' ? 'izquierda' : 'derecha',
            fila: parseInt(match[2]),
            numero: parseInt(match[3])
        };
    }

    // Generar estructura completa de asientos según especificaciones
    function generarEstructuraAsientos() {
        const estructura = {
            filas: [],
            totalAsientos: 0,
            estadisticas: {
                disponibles: 0,
                ocupados: 0,
                reservados: 0,
                seleccionados: 0
            }
        };

        for (let fila = 1; fila <= ASIENTOS_CONFIG.totalFilas; fila++) {
            const esPrimeraFila = fila === 1;
            const asientosPorSeccion = esPrimeraFila ? 
                ASIENTOS_CONFIG.primeraFila.porSeccion : 
                ASIENTOS_CONFIG.demasFilas.porSeccion;

            const filaData = {
                numero: fila,
                esPrimeraFila: esPrimeraFila,
                soloMovilidadReducida: esPrimeraFila,
                asientos: {
                    izquierda: [],
                    derecha: []
                },
                totalAsientos: asientosPorSeccion * 2
            };

            // Generar asientos para sección izquierda
            for (let asiento = 1; asiento <= asientosPorSeccion; asiento++) {
                const id = generarIdAsiento(fila, 'izquierda', asiento);
                filaData.asientos.izquierda.push({
                    id: id,
                    fila: fila,
                    numero: asiento,
                    seccion: 'izquierda',
                    estado: ESTADOS_ASIENTO.disponible,
                    soloMovilidadReducida: esPrimeraFila
                });
            }

            // Generar asientos para sección derecha
            for (let asiento = 1; asiento <= asientosPorSeccion; asiento++) {
                const id = generarIdAsiento(fila, 'derecha', asiento);
                filaData.asientos.derecha.push({
                    id: id,
                    fila: fila,
                    numero: asiento,
                    seccion: 'derecha',
                    estado: ESTADOS_ASIENTO.disponible,
                    soloMovilidadReducida: esPrimeraFila
                });
            }

            estructura.filas.push(filaData);
            estructura.totalAsientos += filaData.totalAsientos;
        }

        console.log(`✅ Estructura generada: ${estructura.totalAsientos} asientos en ${ASIENTOS_CONFIG.totalFilas} filas`);
        estructuraAsientos = estructura;
        return estructura;
    }

    // Establecer distribución de asientos para personas con discapacidad
    function establecerDistribucion(distribucionInfo) {
        distribucionAsientos = distribucionInfo;
        console.log('🎫 Distribución establecida:', distribucionInfo);
        
        // Actualizar el estado de los asientos según la distribución
        if (estructuraAsientos) {
            actualizarEstadosSegunDistribucion();
        }
    }

    // Actualizar estados de asientos según distribución
    function actualizarEstadosSegunDistribucion() {
        if (!distribucionAsientos || !estructuraAsientos) return;

        // Si no hay personas con discapacidad, bloquear toda la primera fila
        if (!tieneMovilidadReducida || distribucionAsientos.filaAccesibilidad === 0) {
            bloquearPrimeraFila();
        } else {
            desbloquearPrimeraFila();
        }
    }

    // Bloquear primera fila para usuarios sin discapacidad
    function bloquearPrimeraFila() {
        if (!estructuraAsientos) return;
        
        const primeraFila = estructuraAsientos.filas[0];
        ['izquierda', 'derecha'].forEach(seccion => {
            primeraFila.asientos[seccion].forEach(asiento => {
                if (asiento.estado === ESTADOS_ASIENTO.disponible) {
                    asiento.estado = ESTADOS_ASIENTO.bloqueado;
                    const elemento = document.getElementById(asiento.id);
                    if (elemento) {
                        aplicarEstiloAsiento(elemento, ESTADOS_ASIENTO.bloqueado);
                    }
                }
            });
        });
    }

    // Desbloquear primera fila para usuarios con discapacidad
    function desbloquearPrimeraFila() {
        if (!estructuraAsientos) return;
        
        const primeraFila = estructuraAsientos.filas[0];
        ['izquierda', 'derecha'].forEach(seccion => {
            primeraFila.asientos[seccion].forEach(asiento => {
                if (asiento.estado === ESTADOS_ASIENTO.bloqueado) {
                    asiento.estado = ESTADOS_ASIENTO.disponible;
                    const elemento = document.getElementById(asiento.id);
                    if (elemento) {
                        aplicarEstiloAsiento(elemento, ESTADOS_ASIENTO.disponible);
                    }
                }
            });
        });
    }

    // Validar si la selección respeta la distribución
    function validarDistribucionSeleccion() {
        if (!distribucionAsientos) return true;

        const asientosFilaAccesibilidad = asientosSeleccionados.filter(id => {
            const asiento = buscarAsientoPorId(id);
            return asiento && asiento.fila === 1;
        });

        const asientosOtrasFilas = asientosSeleccionados.filter(id => {
            const asiento = buscarAsientoPorId(id);
            return asiento && asiento.fila !== 1;
        });

        // Validar que no se excedan los límites
        if (asientosFilaAccesibilidad.length > distribucionAsientos.filaAccesibilidad) {
            return {
                valido: false,
                mensaje: `Solo puedes seleccionar ${distribucionAsientos.filaAccesibilidad} asiento(s) en la fila de accesibilidad`
            };
        }

        if (asientosOtrasFilas.length > distribucionAsientos.otrasFilas) {
            return {
                valido: false,
                mensaje: `Solo puedes seleccionar ${distribucionAsientos.otrasFilas} asiento(s) en otras filas`
            };
        }

        return { valido: true };
    }

    // Inicializar el sistema de asientos
    function inicializar(contenedorId, cantidad = 1, movilidadReducida = false, distribucion = null) {
        console.log(`🎫 Inicializando selector de asientos para ${cantidad} cupos`);
        
        cantidadRequerida = cantidad;
        tieneMovilidadReducida = movilidadReducida;
        asientosSeleccionados = [];
        
        // Establecer distribución si se proporciona
        if (distribucion) {
            establecerDistribucion(distribucion);
        }
        
        contenedorAsientos = document.getElementById(contenedorId);
        if (!contenedorAsientos) {
            console.error('❌ Contenedor de asientos no encontrado:', contenedorId);
            return false;
        }

        // Cargar asientos ocupados desde el servidor
        cargarAsientosOcupados();
        
        // Generar y renderizar la estructura
        const estructura = generarEstructuraAsientos();
        renderizarSelector(estructura);
        
        // Aplicar distribución si existe
        if (distribucionAsientos) {
            actualizarEstadosSegunDistribucion();
        }
        
        // Actualizar contador
        actualizarContadores();
        
        return true;
    }

    // Renderizar el selector visual de asientos
    function renderizarSelector(estructura) {
        contenedorAsientos.innerHTML = '';

        // Crear header con información del evento
        const header = document.createElement('div');
        header.className = 'text-center mb-4 sm:mb-6';
        header.innerHTML = `
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <h2 class="text-lg sm:text-xl font-bold mb-1 sm:mb-2">🎭 Salón de Eventos - Casa Dann Carlton</h2>
                <p class="text-blue-100 text-sm sm:text-base">El Poder de Soltar • 5 de Octubre, 2025</p>
                <p class="text-blue-200 text-xs sm:text-sm">Total: ${estructura.totalAsientos} asientos disponibles</p>
            </div>
            
            <!-- Escenario -->
            <div class="mb-4 sm:mb-6">
                <div class="inline-flex items-center bg-gray-800 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg">
                    <span class="mr-1 sm:mr-2">🎭</span>
                    <span class="font-bold text-sm sm:text-base">ESCENARIO / ÁREA DE PRESENTACIÓN</span>
                </div>
            </div>
        `;
        contenedorAsientos.appendChild(header);

        // Crear área de asientos con diseño responsivo
        const areaAsientos = document.createElement('div');
        areaAsientos.className = 'bg-white rounded-lg shadow-lg p-2 sm:p-4 overflow-x-auto';
        areaAsientos.innerHTML = `
            <div class="min-w-max mx-auto">
                <div class="flex gap-2 sm:gap-4 justify-center items-start">
                    <!-- Sección Izquierda -->
                    <div class="text-center">
                        <h3 class="font-bold mb-2 sm:mb-3 text-purple-700 bg-purple-100 px-2 py-1 sm:px-3 rounded text-xs sm:text-sm">Sección Izquierda</h3>
                        <div id="seccion-izquierda" class="space-y-0.5 sm:space-y-1"></div>
                    </div>
                    
                    <!-- Pasillo Central -->
                    <div class="flex flex-col items-center justify-center mx-2 sm:mx-4">
                        <div class="text-gray-500 text-xs mb-1 sm:mb-2 rotate-90 whitespace-nowrap hidden sm:block">PASILLO CENTRAL</div>
                        <div class="w-3 sm:w-8 bg-gradient-to-b from-gray-200 to-gray-300 rounded" style="height: 400px; min-height: 400px;"></div>
                    </div>
                    
                    <!-- Sección Derecha -->
                    <div class="text-center">
                        <h3 class="font-bold mb-2 sm:mb-3 text-purple-700 bg-purple-100 px-2 py-1 sm:px-3 rounded text-xs sm:text-sm">Sección Derecha</h3>
                        <div id="seccion-derecha" class="space-y-0.5 sm:space-y-1"></div>
                    </div>
                </div>
            </div>
        `;
        contenedorAsientos.appendChild(areaAsientos);

        // Renderizar asientos por sección
        renderizarSeccion('seccion-izquierda', estructura, 'izquierda');
        renderizarSeccion('seccion-derecha', estructura, 'derecha');

        // Información de la primera fila
        if (!tieneMovilidadReducida) {
            const infoMovilidad = document.createElement('div');
            infoMovilidad.className = 'mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
            infoMovilidad.innerHTML = `
                <div class="flex items-center text-yellow-800">
                    <i class="fas fa-wheelchair mr-2"></i>
                    <span class="text-sm">
                        <strong>Primera fila:</strong> Reservada exclusivamente para personas con movilidad reducida.
                        ${!tieneMovilidadReducida ? 'Marca la opción de accesibilidad si la necesitas.' : ''}
                    </span>
                </div>
            `;
            contenedorAsientos.appendChild(infoMovilidad);
        }
    }

    // Renderizar una sección específica (izquierda o derecha)
    function renderizarSeccion(contenedorId, estructura, seccion) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        estructura.filas.forEach((fila, filaIndex) => {
            const filaElement = document.createElement('div');
            filaElement.className = 'flex items-center justify-center mb-1 sm:mb-1.5';
            
            // Número de fila (al lado izquierdo para sección izquierda, derecho para derecha)
            const numeroFila = document.createElement('div');
            numeroFila.className = `w-6 sm:w-8 text-center text-xs font-bold ${fila.esPrimeraFila ? 'text-yellow-600' : 'text-gray-600'}`;
            numeroFila.textContent = fila.numero;

            // Contenedor de asientos
            const asientosContainer = document.createElement('div');
            asientosContainer.className = 'flex gap-0.5 sm:gap-1';
            
            // Agregar asientos de la sección
            fila.asientos[seccion].forEach(asiento => {
                const asientoElement = crearElementoAsiento(asiento);
                asientosContainer.appendChild(asientoElement);
            });

            // Posicionar número de fila según la sección
            if (seccion === 'izquierda') {
                filaElement.appendChild(numeroFila);
                filaElement.appendChild(asientosContainer);
            } else {
            filaElement.appendChild(asientosContainer);
                filaElement.appendChild(numeroFila);
            }

            contenedor.appendChild(filaElement);
        });
    }

    // Crear elemento visual de asiento individual
    function crearElementoAsiento(asiento) {
        const elemento = document.createElement('button');
        // Responsivo: tamaños diferentes para móvil y desktop
        elemento.className = 'w-6 h-6 sm:w-7 sm:h-7 text-xs font-bold rounded transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 border touch-manipulation';
        elemento.id = asiento.id;
        elemento.dataset.asientoId = asiento.id;
        elemento.dataset.fila = asiento.fila;
        elemento.dataset.numero = asiento.numero;
        elemento.dataset.seccion = asiento.seccion;
        elemento.textContent = asiento.numero;
        
        // Tooltip informativo
        elemento.title = `Fila ${asiento.fila}, Asiento ${asiento.numero} (${asiento.seccion})`;
        
        // Si es primera fila y no tiene movilidad reducida, bloquear
        if (asiento.soloMovilidadReducida && !tieneMovilidadReducida) {
            asiento.estado = ESTADOS_ASIENTO.bloqueado;
            elemento.title += ' - Solo para personas con movilidad reducida';
            elemento.disabled = true;
        }

        // Aplicar estilo según estado
        aplicarEstiloAsiento(elemento, asiento.estado);

        // Event listener para selección (optimizado para touch)
        if (asiento.estado !== ESTADOS_ASIENTO.bloqueado && 
            asiento.estado !== ESTADOS_ASIENTO.ocupado) {
            
            // Agregar soporte para touch
            elemento.addEventListener('click', function(e) {
                e.preventDefault();
            manejarClickAsiento(asiento.id);
        });
            
            elemento.addEventListener('touchend', function(e) {
                e.preventDefault();
                manejarClickAsiento(asiento.id);
            });
        }

        return elemento;
    }

    // Aplicar estilo visual según estado del asiento
    function aplicarEstiloAsiento(elemento, estado) {
        // Resetear clases de color
        elemento.className = elemento.className.replace(/bg-\w+-\d+|text-\w+-\d+|border-\w+-\d+/g, '');
        
        switch (estado) {
            case ESTADOS_ASIENTO.disponible:
                elemento.style.backgroundColor = COLORES_ASIENTO.disponible;
                elemento.className += ' border-green-300 text-green-800 hover:bg-green-200';
                break;
                
            case ESTADOS_ASIENTO.seleccionado:
                elemento.style.backgroundColor = COLORES_ASIENTO.seleccionado;
                elemento.className += ' border-blue-600 text-white font-bold';
                break;
                
            case ESTADOS_ASIENTO.ocupado:
                elemento.style.backgroundColor = COLORES_ASIENTO.ocupado;
                elemento.className += ' border-red-600 text-white cursor-not-allowed';
                elemento.disabled = true;
                break;
                
            case ESTADOS_ASIENTO.reservado:
                elemento.style.backgroundColor = COLORES_ASIENTO.reservado;
                elemento.className += ' border-yellow-600 text-white cursor-not-allowed';
                elemento.disabled = true;
                break;
                
            case ESTADOS_ASIENTO.bloqueado:
                elemento.style.backgroundColor = COLORES_ASIENTO.bloqueado;
                elemento.className += ' border-gray-300 text-gray-400 cursor-not-allowed';
                elemento.disabled = true;
                break;
        }
    }

    // Manejar click en asiento
    function manejarClickAsiento(asientoId) {
        console.log('🎫 Click en asiento:', asientoId);
        
        const asiento = buscarAsientoPorId(asientoId);
        if (!asiento) return;
        
        const elemento = document.getElementById(asientoId);
        if (!elemento) return;

        if (asiento.estado === ESTADOS_ASIENTO.seleccionado) {
            // Deseleccionar asiento
            asiento.estado = ESTADOS_ASIENTO.disponible;
            asientosSeleccionados = asientosSeleccionados.filter(id => id !== asientoId);
            aplicarEstiloAsiento(elemento, ESTADOS_ASIENTO.disponible);
            
        } else if (asiento.estado === ESTADOS_ASIENTO.disponible) {
            // Verificar límite general
            if (asientosSeleccionados.length >= cantidadRequerida) {
                mostrarMensajeLimite();
                return;
            }

            // Verificar distribución si está establecida
            if (distribucionAsientos) {
                const asientosFilaAccesibilidad = asientosSeleccionados.filter(id => {
                    const a = buscarAsientoPorId(id);
                    return a && a.fila === 1;
                });

                const asientosOtrasFilas = asientosSeleccionados.filter(id => {
                    const a = buscarAsientoPorId(id);
                    return a && a.fila !== 1;
                });

                // Si está intentando seleccionar un asiento de fila 1
                if (asiento.fila === 1) {
                    if (asientosFilaAccesibilidad.length >= distribucionAsientos.filaAccesibilidad) {
                        mostrarMensajeDistribucion(`Solo puedes seleccionar ${distribucionAsientos.filaAccesibilidad} asiento(s) en la fila de accesibilidad`);
                        return;
                    }
                } else {
                    // Si está intentando seleccionar un asiento de otras filas
                    if (asientosOtrasFilas.length >= distribucionAsientos.otrasFilas) {
                        mostrarMensajeDistribucion(`Solo puedes seleccionar ${distribucionAsientos.otrasFilas} asiento(s) en otras filas`);
                        return;
                    }
                }
            }

            // Si pasa todas las validaciones, seleccionar el asiento
            asiento.estado = ESTADOS_ASIENTO.seleccionado;
            asientosSeleccionados.push(asientoId);
            aplicarEstiloAsiento(elemento, ESTADOS_ASIENTO.seleccionado);
        }

        actualizarContadores();
        actualizarListaSeleccionados();
        dispararEventoSeleccion();
    }

    // Buscar asiento por ID en la estructura
    function buscarAsientoPorId(asientoId) {
        if (!estructuraAsientos) return null;
        
        for (let fila of estructuraAsientos.filas) {
            for (let seccion of ['izquierda', 'derecha']) {
                for (let asiento of fila.asientos[seccion]) {
                    if (asiento.id === asientoId) {
                        return asiento;
                    }
                }
            }
        }
        return null;
    }

    // Actualizar contadores de asientos
    function actualizarContadores() {
        const countElement = document.getElementById('asientos-seleccionados-count');
        const requiredElement = document.getElementById('asientos-requeridos-count');

        if (countElement) {
            countElement.textContent = asientosSeleccionados.length;
        }
        
        if (requiredElement) {
            requiredElement.textContent = cantidadRequerida;
        }
        
        // Cambiar color del contador según completitud
        const containerCounter = document.querySelector('.bg-blue-100');
        if (containerCounter) {
            if (asientosSeleccionados.length === cantidadRequerida) {
                containerCounter.className = containerCounter.className.replace('bg-blue-100 text-blue-800', 'bg-green-100 text-green-800');
            } else {
                containerCounter.className = containerCounter.className.replace('bg-green-100 text-green-800', 'bg-blue-100 text-blue-800');
            }
        }
    }

    // Actualizar lista visual de asientos seleccionados
    function actualizarListaSeleccionados() {
        const listaContainer = document.getElementById('lista-asientos-seleccionados');
        const lista = document.getElementById('asientos-seleccionados-lista');
        
        if (!listaContainer || !lista) return;

        if (asientosSeleccionados.length > 0) {
            listaContainer.classList.remove('hidden');
            lista.innerHTML = '';
            
            asientosSeleccionados.forEach(asientoId => {
                const asiento = buscarAsientoPorId(asientoId);
                if (asiento) {
                    const badge = document.createElement('span');
                    const esFilaAccesibilidad = asiento.fila === 1;
                    const colorClass = esFilaAccesibilidad ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
                    const icono = esFilaAccesibilidad ? 'fas fa-wheelchair' : 'fas fa-chair';
                    
                    badge.className = `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`;
                    badge.innerHTML = `
                        <i class="${icono} mr-1"></i>
                        ${asientoId}
                    `;
                    lista.appendChild(badge);
                }
            });
        } else {
            listaContainer.classList.add('hidden');
        }
    }

    // Mostrar mensaje cuando se alcanza el límite
    function mostrarMensajeLimite() {
        mostrarToast('Ya has seleccionado ' + cantidadRequerida + ' asiento(s)', 'warning');
    }

    // Mostrar mensaje de distribución
    function mostrarMensajeDistribucion(mensaje) {
        mostrarToast(mensaje, 'info');
    }

    // Función genérica para mostrar toast
    function mostrarToast(mensaje, tipo = 'info') {
        const colores = {
            warning: 'bg-orange-500',
            info: 'bg-blue-500',
            error: 'bg-red-500',
            success: 'bg-green-500'
        };

        const iconos = {
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            error: 'fas fa-times-circle',
            success: 'fas fa-check-circle'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colores[tipo]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="${iconos[tipo]} mr-2"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // Cargar asientos ocupados desde el servidor
    async function cargarAsientosOcupados() {
        try {
            const response = await fetch('/api/public/asientos-ocupados');
            if (response.ok) {
                const data = await response.json();
                asientosOcupados = data.ocupados || [];
                asientosReservados = data.reservados || [];
                console.log('✅ Asientos ocupados cargados:', asientosOcupados.length);
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar asientos ocupados:', error);
        }
    }

    // Disparar evento personalizado cuando cambian los asientos seleccionados
    function dispararEventoSeleccion() {
        const evento = new CustomEvent('asientosSeleccionados', {
            detail: {
                asientos: asientosSeleccionados,
                cantidad: asientosSeleccionados.length,
                requeridos: cantidadRequerida,
                completo: asientosSeleccionados.length === cantidadRequerida
            }
        });
        
        window.dispatchEvent(evento);
        console.log('🎫 Evento asientosSeleccionados disparado:', asientosSeleccionados);
    }

    // Limpiar selección
    function limpiarSeleccion() {
        asientosSeleccionados.forEach(asientoId => {
            const asiento = buscarAsientoPorId(asientoId);
                    const elemento = document.getElementById(asientoId);
            
            if (asiento && elemento) {
                asiento.estado = ESTADOS_ASIENTO.disponible;
                        aplicarEstiloAsiento(elemento, ESTADOS_ASIENTO.disponible);
                    }
                });
        
        asientosSeleccionados = [];
        actualizarContadores();
        actualizarListaSeleccionados();
                dispararEventoSeleccion();
            }

        // Obtener asientos seleccionados
    function obtenerAsientosSeleccionados() {
        return asientosSeleccionados.map(asientoId => {
            const asiento = buscarAsientoPorId(asientoId);
            return {
                id: asientoId,
                fila: asiento.fila,
                numero: asiento.numero,
                seccion: asiento.seccion,
                numeroFormateado: asientoId, // El nuevo formato RXX-XX o LXX-XX
                esFilaAccesibilidad: asiento.fila === 1
            };
        });
    }

    // Validar selección completa
    function validarSeleccion() {
        return asientosSeleccionados.length === cantidadRequerida;
    }

    // API pública
    return {
        inicializar,
        limpiarSeleccion,
        obtenerAsientosSeleccionados,
        validarSeleccion,
        cantidadSeleccionada: () => asientosSeleccionados.length,
        cantidadRequerida: () => cantidadRequerida,
        establecerDistribucion,
        validarDistribucionSeleccion
    };
})();

// Inicialización automática cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema de asientos numerados cargado y listo');
}); 