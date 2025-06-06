// Variables globales
const API_URL = `${window.location.origin}/api`;
let authToken = localStorage.getItem('authToken');
let userData = JSON.parse(localStorage.getItem('userData'));

// Funciones de autenticación
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
    // Guardar token y datos de usuario
    authToken = data.token;
    userData = data.usuario;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return true;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

function logout() {
  // Eliminar token y datos de usuario
  authToken = null;
  userData = null;
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redirigir a la página de login
  showLoginPage();
}

// Funciones para mostrar/ocultar secciones
function showLoginPage() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  loadDashboardData();
}

// Funciones para consumir la API
async function fetchWithAuth(url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Si el token expiró, redirigir al login
    if (response.status === 401) {
      logout();
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }
    
    return response;
  } catch (error) {
    console.error('Error en fetchWithAuth:', error);
    throw error;
  }
}

async function getEstadisticas() {
  try {
    const response = await fetchWithAuth(`${API_URL}/dashboard/estadisticas`);
    
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }
    
    const data = await response.json();
    return data.estadisticas;
  } catch (error) {
    console.error('Error en getEstadisticas:', error);
    throw error;
  }
}

async function getTransacciones(filtros = {}) {
  try {
    // Construir query string con filtros
    const queryParams = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetchWithAuth(`${API_URL}/transacciones?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener transacciones');
    }
    
    const data = await response.json();
    return data.transacciones;
  } catch (error) {
    console.error('Error en getTransacciones:', error);
    throw error;
  }
}

async function getReservas(filtros = {}) {
  try {
    // Construir query string con filtros
    const queryParams = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetchWithAuth(`${API_URL}/reservas?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener reservas');
    }
    
    const data = await response.json();
    return data.reservas;
  } catch (error) {
    console.error('Error en getReservas:', error);
    throw error;
  }
}

async function generarInformeVentas(fechaInicio, fechaFin) {
  try {
    const response = await fetchWithAuth(`${API_URL}/dashboard/informes/ventas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
    
    if (!response.ok) {
      throw new Error('Error al generar informe de ventas');
    }
    
    const data = await response.json();
    return data.informe;
  } catch (error) {
    console.error('Error en generarInformeVentas:', error);
    throw error;
  }
}

// Funciones para cargar datos en la interfaz
async function loadDashboardData() {
  try {
    const estadisticas = await getEstadisticas();
    
    // Actualizar estadísticas
    document.getElementById('stats-total-ventas').textContent = formatCurrency(estadisticas.ventas.monto_total);
    document.getElementById('stats-entradas-vendidas').textContent = estadisticas.entradas.vendidas;
    document.getElementById('stats-total-clientes').textContent = estadisticas.clientes.total;
    document.getElementById('stats-reservas-pendientes').textContent = estadisticas.reservas.por_estado.pendiente || 0;
    
    // Cargar gráfico de ventas
    loadSalesChart(estadisticas.grafico_ventas);
    
    // Cargar últimas transacciones
    const transacciones = await getTransacciones({ limit: 5 });
    loadLatestTransactions(transacciones);
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
    showNotification('Error al cargar datos', 'error');
  }
}

function loadSalesChart(data) {
  const ctx = document.getElementById('sales-chart-canvas').getContext('2d');
  
  // Extraer fechas y montos
  const fechas = data.map(item => item.fecha);
  const montos = data.map(item => item.monto_total);
  const transacciones = data.map(item => item.transacciones);
  
  // Crear gráfico
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: fechas,
      datasets: [
        {
          label: 'Monto Total',
          data: montos,
          backgroundColor: 'rgba(147, 51, 234, 0.2)',
          borderColor: 'rgba(147, 51, 234, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Transacciones',
          data: transacciones,
          type: 'line',
          fill: false,
          borderColor: 'rgba(59, 130, 246, 1)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Monto Total'
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Transacciones'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

function loadLatestTransactions(transacciones) {
  const transactionsContainer = document.getElementById('latest-transactions');
  transactionsContainer.innerHTML = '';
  
  if (transacciones.length === 0) {
    transactionsContainer.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay transacciones disponibles</td></tr>';
    return;
  }
  
  transacciones.forEach(trans => {
    const fecha = new Date(trans.created_at).toLocaleDateString();
    
    // Determinar color de estado
    let estadoClass = 'bg-yellow-100 text-yellow-800';
    if (trans.estado === 'Aceptada') {
      estadoClass = 'bg-green-100 text-green-800';
    } else if (trans.estado === 'Rechazada') {
      estadoClass = 'bg-red-100 text-red-800';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${trans.referencia}</td>
      <td class="px-6 py-4 whitespace-nowrap">${trans.nombre}</td>
      <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(trans.monto)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
          ${trans.estado}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${fecha}</td>
    `;
    
    transactionsContainer.appendChild(row);
  });
}

// Funciones de utilidad
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showNotification(message, type = 'success') {
  alert(message); // Implementación simple
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay token de autenticación
  if (authToken) {
    showDashboard();
  } else {
    showLoginPage();
  }
  
  // Evento de Login
  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const loginSuccess = await login(email, password);
      
      if (loginSuccess) {
        showDashboard();
      }
    } catch (error) {
      const errorMsg = document.getElementById('login-error-message');
      errorMsg.textContent = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      
      document.getElementById('login-error').classList.remove('hidden');
    }
  });
  
  // Evento de Logout
  document.getElementById('logout-button').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
  
  // Navegación entre páginas
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const pageId = this.getAttribute('data-page');
      const pageTitle = this.textContent.trim();
      
      // Ocultar todas las páginas
      document.querySelectorAll('[id^="page-"]').forEach(page => {
        page.classList.add('hidden');
      });
      
      // Mostrar la página seleccionada
      document.getElementById(`page-${pageId}`).classList.remove('hidden');
      
      // Actualizar título de la página
      document.getElementById('page-title').textContent = pageTitle;
      
      // Resaltar el elemento de navegación activo
      document.querySelectorAll('[data-page]').forEach(navItem => {
        navItem.classList.remove('bg-purple-800', 'bg-opacity-25');
      });
      this.classList.add('bg-purple-800', 'bg-opacity-25');
      
      // Cargar datos según la página
      switch (pageId) {
        case 'transacciones':
          loadTransaccionesPage();
          break;
        case 'reservas':
          loadReservasPage();
          break;
        case 'asientos':
          loadAsientosPage();
          break;
        case 'informes':
          initInformesPage();
          break;
      }
    });
  });
});

// Funciones para cargar datos en las páginas
async function loadTransaccionesPage() {
  try {
    const transacciones = await getTransacciones();
    renderTransaccionesTable(transacciones);
    
    // Configurar eventos de filtros
    document.getElementById('apply-transaction-filters').addEventListener('click', async function() {
      const filtros = {
        estado: document.getElementById('filter-estado').value,
        tipo_transaccion: document.getElementById('filter-tipo').value,
        email: document.getElementById('filter-email').value
      };
      
      const transaccionesFiltradas = await getTransacciones(filtros);
      renderTransaccionesTable(transaccionesFiltradas);
    });
    
    document.getElementById('clear-transaction-filters').addEventListener('click', function() {
      document.getElementById('filter-estado').value = '';
      document.getElementById('filter-tipo').value = '';
      document.getElementById('filter-email').value = '';
      
      loadTransaccionesPage();
    });
    
    // Configurar evento para exportar a Excel
    document.getElementById('export-transactions').addEventListener('click', function() {
      const estado = document.getElementById('filter-estado').value;
      const tipo = document.getElementById('filter-tipo').value;
      const email = document.getElementById('filter-email').value;
      
      // Construir URL con filtros aplicados
      let url = `${API_URL}/dashboard/exportar/transacciones`;
      const params = [];
      
      if (estado) params.push(`estado=${estado}`);
      if (tipo) params.push(`tipo_transaccion=${tipo}`);
      if (email) params.push(`email=${email}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      // Abrir en nueva ventana para descargar
      window.open(url);
    });
  } catch (error) {
    console.error('Error al cargar transacciones:', error);
    showNotification('Error al cargar transacciones', 'error');
  }
}

async function loadReservasPage() {
  try {
    const reservas = await getReservas();
    renderReservasTable(reservas);
    
    // Configurar eventos de filtros
    document.getElementById('apply-reservation-filters').addEventListener('click', async function() {
      const filtros = {
        estado: document.getElementById('filter-reserva-estado').value,
        tipo_pago: document.getElementById('filter-reserva-tipo').value,
        email: document.getElementById('filter-reserva-email').value
      };
      
      const reservasFiltradas = await getReservas(filtros);
      renderReservasTable(reservasFiltradas);
    });
    
    document.getElementById('clear-reservation-filters').addEventListener('click', function() {
      document.getElementById('filter-reserva-estado').value = '';
      document.getElementById('filter-reserva-tipo').value = '';
      document.getElementById('filter-reserva-email').value = '';
      
      loadReservasPage();
    });
    
    // Configurar evento para exportar a Excel
    document.getElementById('export-reservations').addEventListener('click', function() {
      const estado = document.getElementById('filter-reserva-estado').value;
      const tipo = document.getElementById('filter-reserva-tipo').value;
      const email = document.getElementById('filter-reserva-email').value;
      
      // Construir URL con filtros aplicados
      let url = `${API_URL}/dashboard/exportar/reservas`;
      const params = [];
      
      if (estado) params.push(`estado=${estado}`);
      if (tipo) params.push(`tipo_pago=${tipo}`);
      if (email) params.push(`email=${email}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      // Abrir en nueva ventana para descargar
      window.open(url);
    });
  } catch (error) {
    console.error('Error al cargar reservas:', error);
    showNotification('Error al cargar reservas', 'error');
  }
}

function loadAsientosPage() {
  try {
    // Limpiar cualquier instancia previa
    cleanupSeatsManagement();
    
    // Inicializar la gestión de asientos
    initSeatsManagement();
    
    console.log('Página de asientos cargada correctamente');
  } catch (error) {
    console.error('Error al cargar página de asientos:', error);
    showNotification('Error al cargar la gestión de asientos', 'error');
  }
}

function initInformesPage() {
  // Establecer fechas predeterminadas (último mes)
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  
  document.getElementById('informe-fecha-inicio').value = formatDateForInput(lastMonth);
  document.getElementById('informe-fecha-fin').value = formatDateForInput(today);
  
  // Configurar evento para generar informe
  document.getElementById('generate-report').addEventListener('click', async function() {
    const fechaInicio = document.getElementById('informe-fecha-inicio').value;
    const fechaFin = document.getElementById('informe-fecha-fin').value;
    
    if (!fechaInicio || !fechaFin) {
      showNotification('Por favor, seleccione las fechas para el informe', 'error');
      return;
    }
    
    try {
      const informe = await generarInformeVentas(fechaInicio, fechaFin);
      renderInforme(informe);
    } catch (error) {
      console.error('Error al generar informe:', error);
      showNotification('Error al generar el informe', 'error');
    }
  });
}

// Funciones para renderizar tablas y gráficos
function renderTransaccionesTable(transacciones) {
  const tableBody = document.getElementById('all-transactions');
  tableBody.innerHTML = '';
  
  if (transacciones.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">No hay transacciones disponibles</td></tr>';
    return;
  }
  
  transacciones.forEach(trans => {
    const fecha = new Date(trans.created_at).toLocaleDateString();
    
    // Determinar color de estado
    let estadoClass = 'bg-yellow-100 text-yellow-800';
    if (trans.estado === 'Aceptada') {
      estadoClass = 'bg-green-100 text-green-800';
    } else if (trans.estado === 'Rechazada') {
      estadoClass = 'bg-red-100 text-red-800';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${trans.id}</td>
      <td class="px-6 py-4 whitespace-nowrap">${trans.referencia}</td>
      <td class="px-6 py-4 whitespace-nowrap">${trans.tipo_transaccion === 'completar' ? 'Completar Reserva' : 'Nueva Compra'}</td>
      <td class="px-6 py-4 whitespace-nowrap">${trans.nombre}</td>
      <td class="px-6 py-4 whitespace-nowrap">${trans.email}</td>
      <td class="px-6 py-4 whitespace-nowrap">${trans.cantidad}</td>
      <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(trans.monto)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
          ${trans.estado}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${fecha}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

function renderReservasTable(reservas) {
  const tableBody = document.getElementById('all-reservations');
  tableBody.innerHTML = '';
  
  if (reservas.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10" class="px-6 py-4 text-center text-gray-500">No hay reservas disponibles</td></tr>';
    return;
  }
  
  reservas.forEach(reserva => {
    const fecha = new Date(reserva.created_at).toLocaleDateString();
    
    // Determinar color de estado
    let estadoClass = 'bg-yellow-100 text-yellow-800';
    if (reserva.estado === 'completado') {
      estadoClass = 'bg-green-100 text-green-800';
    } else if (reserva.estado === 'cancelado') {
      estadoClass = 'bg-red-100 text-red-800';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${reserva.id}</td>
      <td class="px-6 py-4 whitespace-nowrap">${reserva.nombre}</td>
      <td class="px-6 py-4 whitespace-nowrap">${reserva.email}</td>
      <td class="px-6 py-4 whitespace-nowrap">${reserva.telefono}</td>
      <td class="px-6 py-4 whitespace-nowrap">${reserva.cantidad}</td>
      <td class="px-6 py-4 whitespace-nowrap">${reserva.tipo_pago === 'completo' ? 'Pago Completo' : 'Reserva (30%)'}</td>
      <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(reserva.monto_total)}</td>
      <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(reserva.monto_pagado)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
          ${reserva.estado === 'completado' ? 'Completado' : 
            reserva.estado === 'pendiente' ? 'Pendiente' : 'Cancelado'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${fecha}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

function renderInforme(informe) {
  // Mostrar el contenedor de resultados
  document.getElementById('report-results').classList.remove('hidden');
  
  // Llenar datos de resumen
  document.getElementById('report-period').textContent = `${informe.periodo.fecha_inicio} a ${informe.periodo.fecha_fin} (${informe.periodo.dias} días)`;
  document.getElementById('report-total-transactions').textContent = informe.resumen.total_transacciones;
  document.getElementById('report-successful-transactions').textContent = informe.resumen.transacciones_exitosas;
  document.getElementById('report-total-amount').textContent = formatCurrency(informe.resumen.monto_total);
  document.getElementById('report-average-ticket').textContent = formatCurrency(informe.resumen.ticket_promedio);
  document.getElementById('report-tickets-sold').textContent = informe.resumen.entradas_vendidas;
  
  // Generar gráficos
  renderDailyChart(informe.desglose_diario);
  renderPaymentTypeChart(informe.distribucion_tipo_pago);
  renderTransactionTypeChart(informe.distribucion_tipo_transaccion);
}

function renderDailyChart(data) {
  const ctx = document.getElementById('report-daily-chart-canvas').getContext('2d');
  
  // Limpiar canvas si ya existe un gráfico
  if (window.dailyChart) {
    window.dailyChart.destroy();
  }
  
  // Extraer fechas y datos
  const fechas = data.map(item => item.fecha);
  const montos = data.map(item => item.monto_total);
  const transacciones = data.map(item => item.total_transacciones);
  const exitosas = data.map(item => item.transacciones_exitosas);
  
  // Crear gráfico
  window.dailyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: fechas,
      datasets: [
        {
          label: 'Monto Total',
          data: montos,
          backgroundColor: 'rgba(147, 51, 234, 0.2)',
          borderColor: 'rgba(147, 51, 234, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Transacciones',
          data: transacciones,
          type: 'line',
          fill: false,
          borderColor: 'rgba(59, 130, 246, 1)',
          tension: 0.1,
          yAxisID: 'y1'
        },
        {
          label: 'Exitosas',
          data: exitosas,
          type: 'line',
          fill: false,
          borderColor: 'rgba(16, 185, 129, 1)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Monto Total'
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Transacciones'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

function renderPaymentTypeChart(data) {
  const ctx = document.getElementById('report-payment-type-canvas').getContext('2d');
  
  // Limpiar canvas si ya existe un gráfico
  if (window.paymentTypeChart) {
    window.paymentTypeChart.destroy();
  }
  
  // Extraer datos
  const labels = data.map(item => item.tipo_pago);
  const valores = data.map(item => item.monto_total);
  
  // Crear gráfico
  window.paymentTypeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: [
          'rgba(147, 51, 234, 0.2)',
          'rgba(59, 130, 246, 0.2)'
        ],
        borderColor: [
          'rgba(147, 51, 234, 1)',
          'rgba(59, 130, 246, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return context.label + ': ' + formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function renderTransactionTypeChart(data) {
  const ctx = document.getElementById('report-transaction-type-canvas').getContext('2d');
  
  // Limpiar canvas si ya existe un gráfico
  if (window.transactionTypeChart) {
    window.transactionTypeChart.destroy();
  }
  
  // Extraer datos
  const labels = data.map(item => item.tipo_transaccion);
  const valores = data.map(item => item.monto_total);
  
  // Crear gráfico
  window.transactionTypeChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: [
          'rgba(16, 185, 129, 0.2)',
          'rgba(245, 158, 11, 0.2)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return context.label + ': ' + formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

// Helpers
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}