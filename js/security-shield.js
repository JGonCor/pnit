// Security Shield - Protección Avanzada para El Poder de Soltar
// Bloquea DevTools, clic derecho, atajos de teclado y más

(function() {
    'use strict';
    
    // Configuración de protección
    const config = {
        blockDevTools: true,
        blockRightClick: true,
        blockKeyboard: true,
        blockConsole: true,
        redirectOnDetection: true,
        warningMessage: '⚠️ Acceso no autorizado detectado'
    };

    // Variables de control
    let devToolsOpen = false;
    let protectionActive = true;

    // Detectar DevTools por tamaño de ventana
    function detectDevToolsBySize() {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if ((widthThreshold || heightThreshold) && !devToolsOpen) {
            devToolsOpen = true;
            handleDetection('DevTools detectado por tamaño de ventana');
        } else if (!widthThreshold && !heightThreshold) {
            devToolsOpen = false;
        }
    }

    // Detectar DevTools por tiempo de debugger
    function detectDevToolsByDebugger() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
            handleDetection('DevTools detectado por debugger');
        }
    }

    // Manejar detección
    function handleDetection(reason) {
        if (!protectionActive) return;
        
        console.clear();
        alert(config.warningMessage);
        
        if (config.redirectOnDetection) {
            window.location.href = 'https://elpoderdesoltar.pnitecnicasolarte.com';
        }
    }

    // Bloquear clic derecho
    function blockRightClick() {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, true);
    }

    // Bloquear atajos de teclado
    function blockKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // F12 - DevTools
            if (e.keyCode === 123) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+Shift+I - DevTools
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+Shift+J - Console
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+U - View Source
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+Shift+C - Inspect
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+S - Save
            if (e.ctrlKey && e.keyCode === 83) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+A - Select All
            if (e.ctrlKey && e.keyCode === 65) {
                e.preventDefault();
                return false;
            }
        }, true);
    }

    // Proteger consola
    function protectConsole() {
        // Deshabilitar console
        const noop = function() {};
        console.log = noop;
        console.warn = noop;
        console.error = noop;
        console.info = noop;
        console.debug = noop;
        console.trace = noop;
        console.dir = noop;
        console.dirxml = noop;
        console.group = noop;
        console.groupEnd = noop;
        console.time = noop;
        console.timeEnd = noop;
        console.profile = noop;
        console.profileEnd = noop;
        console.table = noop;
        console.clear = noop;
        
        // Bloquear eval
        window.eval = function() {
            throw new Error('eval() bloqueado por seguridad');
        };
        
        // Bloquear Function constructor
        window.Function = function() {
            throw new Error('Function() bloqueado por seguridad');
        };
    }

    // Bloquear selección de texto
    function blockTextSelection() {
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Aplicar CSS
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }
            input, textarea, [contenteditable] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Detectar herramientas de automatización
    function detectAutomation() {
        // Selenium
        if (window.navigator.webdriver) {
            handleDetection('Selenium detectado');
        }
        
        // PhantomJS
        if (window.callPhantom || window._phantom) {
            handleDetection('PhantomJS detectado');
        }
        
        // Otras herramientas
        if (window.Buffer || window.emit || window.spawn) {
            handleDetection('Herramientas de automatización detectadas');
        }
    }

    // Proteger variables globales
    function protectGlobals() {
        try {
            Object.defineProperty(window, 'PricingModule', {
                configurable: false,
                writable: false
            });
            
            Object.defineProperty(window, 'EpaycoConfig', {
                configurable: false,
                writable: false
            });
        } catch (e) {
            // Ignorar errores
        }
    }

    // Monitorear cambios en el DOM
    function monitorDOM() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'SCRIPT') {
                            const src = node.src || '';
                            if (!src.includes('elpoderdesoltar.pnitecnicasolarte.com') && 
                                !src.includes('epayco.com') && 
                                !src.includes('googleapis.com') &&
                                src !== '') {
                                node.remove();
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Inicializar protecciones
    function initProtection() {
        if (config.blockRightClick) blockRightClick();
        if (config.blockKeyboard) blockKeyboardShortcuts();
        if (config.blockConsole) protectConsole();
        
        blockTextSelection();
        detectAutomation();
        protectGlobals();
        monitorDOM();
        
        // Detectores continuos
        if (config.blockDevTools) {
            setInterval(detectDevToolsBySize, 500);
            setInterval(detectDevToolsByDebugger, 1000);
        }
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProtection);
    } else {
        initProtection();
    }

    // Mensaje de protección activa
    console.log('%c🛡️ Sistema de Protección Activo', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cEste sitio está protegido contra acceso no autorizado', 'color: orange; font-size: 14px;');

})(); 