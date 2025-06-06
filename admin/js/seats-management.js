// Gestión de Asientos - Panel Administrativo
class SeatsManagement {
    constructor() {
        this.selectedSeats = new Set();
        this.allSeats = [];
        this.filteredSeats = [];
        this.baseURL = '/api/asientos';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSeats();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('refresh-seats')?.addEventListener('click', () => {
            this.loadSeats();
        });

        document.getElementById('mark-sold-button')?.addEventListener('click', () => {
            this.showMarkSoldModal();
        });

        document.getElementById('free-seats-button')?.addEventListener('click', () => {
            this.showFreeSeatModal();
        });

        // Filtros
        document.getElementById('apply-seat-filters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clear-seat-filters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Seleccionar todos
        document.getElementById('select-all-seats')?.addEventListener('change', (e) => {
            this.selectAllSeats(e.target.checked);
        });

        // Modales
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Modal marcar como vendidos
        document.getElementById('cancel-mark-sold')?.addEventListener('click', () => {
            this.hideModal('mark-sold-modal');
        });

        document.getElementById('mark-sold-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.markSeatsAsSold();
        });

        // Modal liberar asientos
        document.getElementById('cancel-free-seats')?.addEventListener('click', () => {
            this.hideModal('free-seats-modal');
        });

        document.getElementById('free-seats-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.freeSeats();
        });

        // Cerrar modales al hacer clic fuera
        ['mark-sold-modal', 'free-seats-modal'].forEach(modalId => {
            document.getElementById(modalId)?.addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    this.hideModal(modalId);
                }
            });
        });
    }

    async loadSeats() {
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.baseURL}/admin/detallado`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.allSeats = data.asientos;
                this.filteredSeats = [...this.allSeats];
                this.updateStatistics(data.estadisticas);
                this.populateFilters();
                this.renderSeatsTable();
                this.renderSeatsMap();
            } else {
                throw new Error(data.message || 'Error cargando asientos');
            }
        } catch (error) {
            console.error('Error cargando asientos:', error);
            this.showError('Error cargando los asientos: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    updateStatistics(stats) {
        document.getElementById('seats-available').textContent = stats.disponibles || 0;
        document.getElementById('seats-reserved').textContent = stats.reservados || 0;
        document.getElementById('seats-occupied').textContent = stats.ocupados || 0;
        document.getElementById('seats-total').textContent = stats.total || 500;
    }

    populateFilters() {
        // Poblar filtro de filas
        const rowFilter = document.getElementById('filter-row');
        const rows = [...new Set(this.allSeats.map(seat => seat.fila))].sort((a, b) => a - b);
        
        rowFilter.innerHTML = '<option value="">Todas</option>';
        rows.forEach(row => {
            const option = document.createElement('option');
            option.value = row;
            option.textContent = `Fila ${row}`;
            rowFilter.appendChild(option);
        });
    }

    applyFilters() {
        const statusFilter = document.getElementById('filter-seat-status').value;
        const rowFilter = document.getElementById('filter-row').value;
        const sectionFilter = document.getElementById('filter-section').value;
        const clientFilter = document.getElementById('filter-client').value.toLowerCase();

        this.filteredSeats = this.allSeats.filter(seat => {
            if (statusFilter && seat.estado !== statusFilter) return false;
            if (rowFilter && seat.fila != rowFilter) return false;
            if (sectionFilter && seat.seccion !== sectionFilter) return false;
            if (clientFilter && seat.cliente_nombre && seat.cliente_email) {
                const clientMatch = seat.cliente_nombre.toLowerCase().includes(clientFilter) ||
                                  seat.cliente_email.toLowerCase().includes(clientFilter);
                if (!clientMatch) return false;
            }
            return true;
        });

        this.renderSeatsTable();
        this.renderSeatsMap();
    }

    clearFilters() {
        document.getElementById('filter-seat-status').value = '';
        document.getElementById('filter-row').value = '';
        document.getElementById('filter-section').value = '';
        document.getElementById('filter-client').value = '';
        
        this.filteredSeats = [...this.allSeats];
        this.renderSeatsTable();
        this.renderSeatsMap();
    }

    renderSeatsTable() {
        const tbody = document.getElementById('seats-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.filteredSeats.forEach(seat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" 
                           class="seat-checkbox rounded" 
                           data-seat-id="${seat.id}"
                           ${this.selectedSeats.has(seat.id) ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap font-medium">${seat.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">${seat.fila}</td>
                <td class="px-6 py-4 whitespace-nowrap capitalize">${seat.seccion}</td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                     <span class="status-badge inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                                  ${this.getStatusColor(seat.estado)}">
                         ${this.getStatusText(seat.estado)}
                     </span>
                 </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${seat.cliente_nombre || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${seat.cliente_email || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${this.formatPaymentType(seat.tipo_pago)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${this.formatDate(seat.updated_at)}</td>
            `;

            // Agregar event listener al checkbox
            const checkbox = row.querySelector('.seat-checkbox');
            checkbox.addEventListener('change', (e) => {
                this.toggleSeatSelection(seat.id, e.target.checked);
            });

            tbody.appendChild(row);
        });

        this.updateSelectedInfo();
    }

    renderSeatsMap() {
        const mapContainer = document.getElementById('seats-map');
        if (!mapContainer) return;

        mapContainer.innerHTML = '';

        // Organizar asientos por fila y sección
        const seatsByRow = {};
        this.filteredSeats.forEach(seat => {
            if (!seatsByRow[seat.fila]) {
                seatsByRow[seat.fila] = { izquierda: [], derecha: [] };
            }
            seatsByRow[seat.fila][seat.seccion].push(seat);
        });

        // Renderizar filas
        const rows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));
        
        rows.forEach(rowNum => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'theater-row flex justify-center items-center mb-2';
            
            const leftSection = document.createElement('div');
            leftSection.className = 'seat-section flex space-x-1';
            
            const rightSection = document.createElement('div');
            rightSection.className = 'seat-section flex space-x-1';
            
            // Asientos izquierda
            seatsByRow[rowNum].izquierda
                .sort((a, b) => a.numero - b.numero)
                .forEach(seat => {
                    leftSection.appendChild(this.createSeatElement(seat));
                });
            
            // Pasillo
            const aisle = document.createElement('div');
            aisle.className = 'row-label mx-4 text-gray-400 text-xs flex items-center';
            aisle.textContent = `F${rowNum}`;
            
            // Asientos derecha
            seatsByRow[rowNum].derecha
                .sort((a, b) => a.numero - b.numero)
                .forEach(seat => {
                    rightSection.appendChild(this.createSeatElement(seat));
                });
            
            rowDiv.appendChild(leftSection);
            rowDiv.appendChild(aisle);
            rowDiv.appendChild(rightSection);
            mapContainer.appendChild(rowDiv);
        });
    }

    createSeatElement(seat) {
        const seatEl = document.createElement('div');
        seatEl.className = `seat-element w-6 h-6 rounded text-xs flex items-center justify-center cursor-pointer border 
                           ${this.getSeatMapColor(seat)}`;
        seatEl.textContent = seat.numero;
        seatEl.title = `${seat.id} - ${this.getStatusText(seat.estado)}`;
        
        if (seat.cliente_nombre) {
            seatEl.title += ` - ${seat.cliente_nombre}`;
        }

        seatEl.addEventListener('click', () => {
            const isSelected = this.selectedSeats.has(seat.id);
            this.toggleSeatSelection(seat.id, !isSelected);
            this.updateTableCheckbox(seat.id, !isSelected);
        });

        return seatEl;
    }

    getSeatMapColor(seat) {
        if (this.selectedSeats.has(seat.id)) {
            return 'seat-selected';
        }

        switch (seat.estado) {
            case 'disponible':
                return 'seat-available';
            case 'reservado':
                return 'seat-reserved';
            case 'ocupado':
                return 'seat-occupied';
            default:
                return 'bg-gray-300 text-gray-700 border-gray-400';
        }
    }

    getStatusColor(estado) {
        switch (estado) {
            case 'disponible':
                return 'bg-green-100 text-green-800';
            case 'reservado':
                return 'bg-yellow-100 text-yellow-800';
            case 'ocupado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusText(estado) {
        switch (estado) {
            case 'disponible':
                return 'Disponible';
            case 'reservado':
                return 'Reservado';
            case 'ocupado':
                return 'Ocupado';
            default:
                return 'Desconocido';
        }
    }

    formatPaymentType(tipo) {
        if (!tipo) return '-';
        switch (tipo) {
            case 'venta_directa':
                return 'Venta Directa';
            case 'completo':
                return 'Pago Completo';
            case 'reserva':
                return 'Reserva 30%';
            default:
                return tipo;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    toggleSeatSelection(seatId, selected) {
        if (selected) {
            this.selectedSeats.add(seatId);
        } else {
            this.selectedSeats.delete(seatId);
        }
        
        this.updateSelectedInfo();
        this.renderSeatsMap(); // Re-render para actualizar colores
    }

    selectAllSeats(selectAll) {
        const checkboxes = document.querySelectorAll('.seat-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
            this.toggleSeatSelection(checkbox.dataset.seatId, selectAll);
        });
    }

    updateTableCheckbox(seatId, checked) {
        const checkbox = document.querySelector(`[data-seat-id="${seatId}"]`);
        if (checkbox) {
            checkbox.checked = checked;
        }
    }

    updateSelectedInfo() {
        const infoDiv = document.getElementById('selected-seats-info');
        const listDiv = document.getElementById('selected-seats-list');
        
        if (this.selectedSeats.size > 0) {
            infoDiv.classList.remove('hidden');
            listDiv.textContent = Array.from(this.selectedSeats).join(', ');
        } else {
            infoDiv.classList.add('hidden');
        }
    }

    showMarkSoldModal() {
        if (this.selectedSeats.size === 0) {
            this.showError('Debe seleccionar al menos un asiento');
            return;
        }

        // Verificar que todos los asientos seleccionados estén disponibles
        const selectedSeatsData = this.allSeats.filter(seat => this.selectedSeats.has(seat.id));
        const unavailableSeats = selectedSeatsData.filter(seat => seat.estado !== 'disponible');
        
        if (unavailableSeats.length > 0) {
            this.showError(`Los siguientes asientos no están disponibles: ${unavailableSeats.map(s => s.id).join(', ')}`);
            return;
        }

        document.getElementById('modal-selected-seats').textContent = Array.from(this.selectedSeats).join(', ');
        this.showModal('mark-sold-modal');
        
        // Limpiar formulario
        document.getElementById('mark-sold-form').reset();
    }

    showFreeSeatModal() {
        if (this.selectedSeats.size === 0) {
            this.showError('Debe seleccionar al menos un asiento');
            return;
        }

        // Verificar que los asientos seleccionados puedan ser liberados
        const selectedSeatsData = this.allSeats.filter(seat => this.selectedSeats.has(seat.id));
        const nonFreableSeats = selectedSeatsData.filter(seat => 
            seat.estado !== 'ocupado' && seat.estado !== 'reservado'
        );
        
        if (nonFreableSeats.length > 0) {
            this.showError(`Los siguientes asientos no pueden ser liberados: ${nonFreableSeats.map(s => s.id).join(', ')}`);
            return;
        }

        document.getElementById('modal-free-seats').textContent = Array.from(this.selectedSeats).join(', ');
        this.showModal('free-seats-modal');
        
        // Limpiar formulario
        document.getElementById('free-seats-form').reset();
    }

    async markSeatsAsSold() {
        try {
            const form = document.getElementById('mark-sold-form');
            const formData = new FormData(form);
            
            const clienteInfo = {
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                documento: formData.get('documento')
            };

            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.baseURL}/admin/marcar-vendidos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    asientos: Array.from(this.selectedSeats),
                    cliente_info: clienteInfo
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`${this.selectedSeats.size} asientos marcados como vendidos exitosamente`);
                this.hideModal('mark-sold-modal');
                this.selectedSeats.clear();
                this.loadSeats(); // Recargar datos
            } else {
                throw new Error(data.message || 'Error marcando asientos como vendidos');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error marcando asientos como vendidos: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async freeSeats() {
        try {
            const form = document.getElementById('free-seats-form');
            const formData = new FormData(form);
            
            const motivo = formData.get('motivo') || 'Sin motivo especificado';

            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.baseURL}/admin/liberar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    asientos: Array.from(this.selectedSeats),
                    motivo: motivo
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`${data.asientos_liberados.length} asientos liberados exitosamente`);
                this.hideModal('free-seats-modal');
                this.selectedSeats.clear();
                this.loadSeats(); // Recargar datos
            } else {
                throw new Error(data.message || 'Error liberando asientos');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error liberando asientos: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    showLoading(show) {
        // Implementar indicador de carga si es necesario
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = show;
        });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-sm
                                  ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Variable global para la instancia
let seatsManagementInstance = null;

// Función para inicializar la gestión de asientos
function initSeatsManagement() {
    if (!seatsManagementInstance) {
        seatsManagementInstance = new SeatsManagement();
    }
    return seatsManagementInstance;
}

// Función para limpiar la instancia al cambiar de página
function cleanupSeatsManagement() {
    seatsManagementInstance = null;
} 