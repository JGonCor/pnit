// Módulo de Seguridad para Panel Administrativo
const Security = {
    // Token de autenticación
    authToken: null,
    
    // Usuario actual
    currentUser: null,
    
    // Configuración de la API
    apiBaseUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/api',
    
    // Inicializar seguridad
    init() {
        this.checkAuthStatus();
        this.setupTokenRefresh();
        this.setupActivityMonitor();
        this.validatePageAccess();
    },
    
    // Verificar estado de autenticación
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (!token || !user) {
            this.redirectToLogin();
            return false;
        }
        
        try {
            // Verificar si el token no ha expirado
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (tokenData.exp < currentTime) {
                console.warn('Token expirado');
                this.logout();
                return false;
            }
            
            this.authToken = token;
            this.currentUser = JSON.parse(user);
            return true;
        } catch (error) {
            console.error('Error verificando token:', error);
            this.logout();
            return false;
        }
    },
    
    // Configurar renovación automática de token
    setupTokenRefresh() {
        // Renovar token cada 45 minutos
        setInterval(() => {
            this.refreshToken();
        }, 45 * 60 * 1000);
    },
    
    // Renovar token
    async refreshToken() {
        try {
            const response = await this.makeAuthenticatedRequest('/auth/refresh', {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                this.authToken = data.token;
                console.log('Token renovado exitosamente');
            } else {
                throw new Error('Error renovando token');
            }
        } catch (error) {
            console.error('Error renovando token:', error);
            this.logout();
        }
    },
    
    // Monitor de actividad del usuario
    setupActivityMonitor() {
        let lastActivity = Date.now();
        const timeoutLimit = 30 * 60 * 1000; // 30 minutos
        
        // Eventos que cuentan como actividad
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        const updateActivity = () => {
            lastActivity = Date.now();
        };
        
        activityEvents.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });
        
        // Verificar inactividad cada minuto
        setInterval(() => {
            const now = Date.now();
            if (now - lastActivity > timeoutLimit) {
                this.logout('Sesión cerrada por inactividad');
            }
        }, 60000);
    },
    
    // Validar acceso a páginas específicas
    validatePageAccess() {
        // Verificar permisos del usuario actual
        if (!this.currentUser) return false;
        
        const userRole = this.currentUser.rol;
        const currentPage = this.getCurrentPage();
        
        // Definir permisos por página
        const pagePermissions = {
            'main': ['admin', 'visualizador'],
            'transacciones': ['admin'],
            'reservas': ['admin'],
            'informes': ['admin']
        };
        
        const allowedRoles = pagePermissions[currentPage] || [];
        
        if (!allowedRoles.includes(userRole)) {
            console.warn(`Acceso denegado a página ${currentPage} para rol ${userRole}`);
            this.showUnauthorizedMessage();
            this.navigateToPage('main');
            return false;
        }
        
        return true;
    },
    
    // Obtener página actual
    getCurrentPage() {
        const activeNav = document.querySelector('.bg-purple-800');
        return activeNav ? activeNav.getAttribute('data-page') : 'main';
    },
    
    // Mostrar mensaje de no autorizado
    showUnauthorizedMessage() {
        this.showAlert('No tienes permisos para acceder a esta sección', 'error');
    },
    
    // Realizar solicitud autenticada
    async makeAuthenticatedRequest(endpoint, options = {}) {
        if (!this.authToken) {
            throw new Error('No hay token de autenticación');
        }
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, finalOptions);
            
            // Si el token es inválido, cerrar sesión
            if (response.status === 401) {
                this.logout('Sesión expirada');
                throw new Error('Token inválido');
            }
            
            // Si hay errores de permisos
            if (response.status === 403) {
                this.showUnauthorizedMessage();
                throw new Error('Permisos insuficientes');
            }
            
            return response;
        } catch (error) {
            console.error('Error en solicitud autenticada:', error);
            throw error;
        }
    },
    
    // Cerrar sesión
    logout(reason = null) {
        // Limpiar datos de sesión
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.authToken = null;
        this.currentUser = null;
        
        // Mostrar mensaje si hay razón
        if (reason) {
            this.showAlert(reason, 'info');
        }
        
        // Redirigir al login
        this.redirectToLogin();
    },
    
    // Redirigir al login
    redirectToLogin() {
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (loginSection && dashboardSection) {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    },
    
    // Redirigir al dashboard
    redirectToDashboard() {
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (loginSection && dashboardSection) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
        }
    },
    
    // Navegar a una página específica
    navigateToPage(page) {
        // Verificar permisos antes de navegar
        const tempCurrentUser = this.currentUser;
        if (tempCurrentUser) {
            const pagePermissions = {
                'main': ['admin', 'visualizador'],
                'transacciones': ['admin'],
                'reservas': ['admin'],
                'informes': ['admin']
            };
            
            const allowedRoles = pagePermissions[page] || [];
            if (!allowedRoles.includes(tempCurrentUser.rol)) {
                this.showUnauthorizedMessage();
                return false;
            }
        }
        
        // Ocultar todas las páginas
        document.querySelectorAll('[id^="page-"]').forEach(pageEl => {
            pageEl.classList.add('hidden');
        });
        
        // Mostrar página seleccionada
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }
        
        // Actualizar navegación activa
        document.querySelectorAll('[data-page]').forEach(navEl => {
            navEl.classList.remove('bg-purple-800', 'bg-opacity-25');
        });
        
        const activeNav = document.querySelector(`[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('bg-purple-800', 'bg-opacity-25');
        }
        
        // Actualizar título
        const titles = {
            'main': 'Dashboard',
            'transacciones': 'Transacciones',
            'reservas': 'Reservas',
            'informes': 'Informes'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[page] || 'Dashboard';
        }
        
        return true;
    },
    
    // Mostrar alerta
    showAlert(message, type = 'info') {
        // Crear elemento de alerta
        const alertDiv = document.createElement('div');
        const alertClasses = {
            'error': 'bg-red-100 border-red-400 text-red-700',
            'success': 'bg-green-100 border-green-400 text-green-700',
            'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700',
            'info': 'bg-blue-100 border-blue-400 text-blue-700'
        };
        
        alertDiv.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded border ${alertClasses[type] || alertClasses.info}`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-2 text-lg font-bold" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    },
    
    // Sanitizar datos de entrada
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input.replace(/[<>\"'%;()&+]/g, '')
                   .trim()
                   .substring(0, 255);
    },
    
    // Validar email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Encriptar datos sensibles en localStorage
    encryptData(data) {
        try {
            return btoa(JSON.stringify(data));
        } catch (error) {
            console.error('Error encriptando datos:', error);
            return null;
        }
    },
    
    // Desencriptar datos de localStorage
    decryptData(encryptedData) {
        try {
            return JSON.parse(atob(encryptedData));
        } catch (error) {
            console.error('Error desencriptando datos:', error);
            return null;
        }
    },
    
    // Verificar integridad de los datos
    verifyDataIntegrity() {
        const expectedData = ['authToken', 'currentUser'];
        
        for (const key of expectedData) {
            const data = localStorage.getItem(key);
            if (data && !this.isValidData(data, key)) {
                console.warn(`Datos comprometidos detectados: ${key}`);
                this.logout('Datos de sesión comprometidos');
                return false;
            }
        }
        
        return true;
    },
    
    // Validar formato de datos
    isValidData(data, type) {
        try {
            switch (type) {
                case 'authToken':
                    // Verificar formato JWT básico
                    return data.split('.').length === 3;
                    
                case 'currentUser':
                    const user = JSON.parse(data);
                    return user.id && user.email && user.rol;
                    
                default:
                    return true;
            }
        } catch (error) {
            return false;
        }
    }
};

// Inicializar seguridad cuando se carga el documento
document.addEventListener('DOMContentLoaded', () => {
    Security.init();
});

// Exportar para uso global
window.Security = Security;

// Configuración de la aplicación
const config = {
    name: 'Panel de Administración - El poder de soltar',
    version: '1.0.0',
    mode: 'production',
    environment: 'production',
    apiBaseUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/api',
    allowedDomains: [
        'elpoderdesoltar.pnitecnicasolarte.com'
    ],
    security: {
        enableProtection: true,
        blockInvalidAccess: true,
        redirectUrl: 'https://elpoderdesoltar.pnitecnicasolarte.com/'
    }
}; 