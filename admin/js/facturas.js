// admin/js/facturas.js - Gestión de facturas en el panel administrativo

class FacturasManager {
    constructor() {
        this.facturas = [];
        this.facturasFiltradas = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.cargarFacturas();
    }
    
    setupEventListeners() {
        // Botón de actualizar
        document.getElementById('reload-facturas')?.addEventListener('click', () => {
            this.cargarFacturas();
        });
        
        // Filtros
        document.getElementById('filtro-fecha-facturas')?.addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        document.getElementById('filtro-estado-facturas')?.addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        document.getElementById('buscar-factura')?.addEventListener('input', () => {
            this.aplicarFiltros();
        });
    }
    
    async cargarFacturas() {
        try {
            this.mostrarLoading(true);
            
            // Obtener todas las reservas
            const response = await fetch('/api/reservas', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar reservas');
            }
            
            const data = await response.json();
            const reservas = data.reservas || [];
            
            // Obtener facturas para cada reserva
            this.facturas = [];
            
            for (const reserva of reservas) {
                try {
                    const facturaResponse = await fetch(`/api/reservas/${reserva.id}/facturas`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                    });
                    
                    if (facturaResponse.ok) {
                        const facturaData = await facturaResponse.json();
                        if (facturaData.facturas && facturaData.facturas.length > 0) {
                            this.facturas.push(...facturaData.facturas);
                        }
                    }
                } catch (error) {
                    console.warn(`Error cargando factura para reserva ${reserva.id}:`, error);
                }
            }
            
            this.facturasFiltradas = [...this.facturas];
            this.renderFacturas();
            
        } catch (error) {
            console.error('Error cargando facturas:', error);
            this.mostrarError('Error al cargar las facturas');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    aplicarFiltros() {
        const fecha = document.getElementById('filtro-fecha-facturas')?.value;
        const estado = document.getElementById('filtro-estado-facturas')?.value;
        const busqueda = document.getElementById('buscar-factura')?.value.toLowerCase();
        
        this.facturasFiltradas = this.facturas.filter(factura => {
            const datos = factura.datos_factura;
            
            // Filtro por fecha
            if (fecha) {
                const fechaFactura = new Date(factura.created_at).toISOString().split('T')[0];
                if (fechaFactura !== fecha) return false;
            }
            
            // Filtro por estado
            if (estado) {
                if (datos.transaccion?.estado !== estado) return false;
            }
            
            // Filtro por búsqueda
            if (busqueda) {
                const textosBusqueda = [
                    factura.numero_factura,
                    datos.cliente?.nombre,
                    datos.cliente?.email,
                    datos.transaccion?.referencia
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!textosBusqueda.includes(busqueda)) return false;
            }
            
            return true;
        });
        
        this.renderFacturas();
    }
    
    renderFacturas() {
        const tbody = document.getElementById('facturas-table-body');
        const emptyState = document.getElementById('facturas-empty');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.facturasFiltradas.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        this.facturasFiltradas.forEach(factura => {
            const datos = factura.datos_factura;
            const row = this.crearFilaFactura(factura, datos);
            tbody.appendChild(row);
        });
    }
    
    crearFilaFactura(factura, datos) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const estadoClass = this.getEstadoClass(datos.transaccion?.estado);
        const tipoOperacion = this.formatearTipoOperacion(datos.tipo_operacion);
        const fecha = new Date(factura.created_at).toLocaleDateString('es-CO');
        const monto = this.formatearMonto(datos.facturacion?.total);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${factura.numero_factura}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${datos.cliente?.nombre || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${datos.cliente?.email || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${fecha}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
                    ${datos.transaccion?.estado || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${monto}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${tipoOperacion}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="facturasManager.verFactura('${factura.numero_factura}')" 
                            class="text-blue-600 hover:text-blue-900" title="Ver factura">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="facturasManager.descargarFactura('${factura.numero_factura}')" 
                            class="text-green-600 hover:text-green-900" title="Descargar PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="facturasManager.copiarEnlaceFactura('${factura.numero_factura}')" 
                            class="text-purple-600 hover:text-purple-900" title="Copiar enlace">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }
    
    getEstadoClass(estado) {
        switch (estado) {
            case 'Aceptada':
                return 'bg-green-100 text-green-800';
            case 'Rechazada':
                return 'bg-red-100 text-red-800';
            case 'Pendiente':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
    
    formatearTipoOperacion(tipo) {
        const tipos = {
            'reserva': 'Reserva (30%)',
            'completo': 'Pago Completo',
            'completar': 'Completar Pago'
        };
        return tipos[tipo] || tipo || 'N/A';
    }
    
    formatearMonto(monto) {
        try {
            const numero = parseFloat(monto);
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(numero);
        } catch (e) {
            return `$${monto || 0}`;
        }
    }
    
    verFactura(numeroFactura) {
        // Abrir la factura en una nueva ventana
        const url = `../factura.html?numero=${numeroFactura}`;
        window.open(url, '_blank');
    }
    
    async descargarFactura(numeroFactura) {
        try {
            // Abrir la página de factura y activar la descarga automática
            const url = `../factura.html?numero=${numeroFactura}&download=true`;
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error descargando factura:', error);
            alert('Error al descargar la factura');
        }
    }
    
    copiarEnlaceFactura(numeroFactura) {
        const baseUrl = window.location.origin;
        const enlace = `${baseUrl}/factura.html?numero=${numeroFactura}`;
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(enlace).then(() => {
            this.mostrarNotificacion('Enlace copiado al portapapeles', 'success');
        }).catch(error => {
            console.error('Error copiando enlace:', error);
            
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = enlace;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.mostrarNotificacion('Enlace copiado al portapapeles', 'success');
            } catch (err) {
                this.mostrarNotificacion('No se pudo copiar el enlace', 'error');
            }
            
            document.body.removeChild(textArea);
        });
    }
    
    mostrarLoading(mostrar) {
        const loading = document.getElementById('facturas-loading');
        if (loading) {
            loading.classList.toggle('hidden', !mostrar);
        }
    }
    
    mostrarError(mensaje) {
        this.mostrarNotificacion(mensaje, 'error');
    }
    
    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación temporal
        const notificacion = document.createElement('div');
        notificacion.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            tipo === 'success' ? 'bg-green-500' :
            tipo === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`;
        
        notificacion.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    tipo === 'success' ? 'fa-check-circle' :
                    tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
                } mr-2"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(notificacion);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 3000);
    }
}

// Inicializar cuando se cambie a la página de facturas
let facturasManager;

// Escuchar cambios de página
document.addEventListener('DOMContentLoaded', function() {
    // Observer para detectar cuando se muestra la página de facturas
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const facturasPagina = document.getElementById('page-facturas');
                if (facturasPagina && !facturasPagina.classList.contains('hidden')) {
                    if (!facturasManager) {
                        facturasManager = new FacturasManager();
                    }
                }
            }
        });
    });
    
    const facturasPagina = document.getElementById('page-facturas');
    if (facturasPagina) {
        observer.observe(facturasPagina, { attributes: true });
    }
}); 