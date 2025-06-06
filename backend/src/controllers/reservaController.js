const clienteModel = require('../models/clienteModel');
const reservaModel = require('../models/reservaModel');
const transaccionModel = require('../models/transaccionModel');
const crypto = require('crypto');

// Definición de Precios Base del Backend - ACTUALIZADOS
const PRECIO_BOLETO_REGULAR_BACKEND = 500000; // Nuevo precio: $500,000 COP
const DESCUENTO_CUPON_SOLTAR_BACKEND = 56000; // Descuento fijo de $56,000 con cupón "SOLTAR"
const PRECIO_BOLETO_CON_CUPON_BACKEND = PRECIO_BOLETO_REGULAR_BACKEND - DESCUENTO_CUPON_SOLTAR_BACKEND; // $444,000
const PORCENTAJE_RESERVA_BACKEND = 0.30; // 30% para reservas

// Función para validar cupón en el backend
function validarCupon(codigo) {
    const codigoNormalizado = codigo ? codigo.trim().toUpperCase() : '';
    return codigoNormalizado === 'SOLTAR';
}

  /**
   * Crea una nueva reserva
   */
async function crearReserva(req, res) {
    try {
      const {
        nombre,
        email,
        telefono,
        cantidad,
        tiene_discapacidad,
        num_movilidad_reducida,
        tipo_pago,
        precio_unitario,
        monto_total,
        monto_pagado,
        descuento_aplicado,
        porcentaje_descuento
      } = req.body;

      // Validar campos obligatorios
      if (!nombre || !email || !telefono || !cantidad || !tipo_pago || !precio_unitario || !monto_total || !monto_pagado) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      // Crear o encontrar cliente
      const cliente = await clienteModel.crearOEncontrar({
        nombre,
        email,
        telefono
      });

      // Crear reserva
      const reserva = await reservaModel.crear({
        cliente_id: cliente.id,
        cantidad,
        tiene_discapacidad: tiene_discapacidad || false,
        num_movilidad_reducida: num_movilidad_reducida || 0,
        tipo_pago,
        precio_unitario,
        monto_total,
        monto_pagado,
        descuento_aplicado: descuento_aplicado || false,
        porcentaje_descuento: porcentaje_descuento || 0,
        estado: 'pendiente'
      });

      res.status(201).json({ 
        mensaje: 'Reserva creada exitosamente', 
        reserva_id: reserva.id 
      });
    } catch (error) {
      console.error('Error al crear reserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Procesa una confirmación de pago de ePayco
   */
async function procesarConfirmacionPago(req, res) {
    try {
      const data = req.body;
      if (!data.x_ref_payco || !data.x_transaction_state || !data.x_amount || !data.x_signature || !data.x_currency_code || !data.x_cust_id_cliente || !data.x_transaction_id) {
        console.warn('Confirmación de ePayco recibida con datos incompletos para firma o validación:', data);
        return res.status(400).json({ error: 'Datos de confirmación incompletos.' });
      }

      const p_cust_id_cliente_env = process.env.EPAYCO_CUSTOMER_ID;
      const p_key_env = process.env.EPAYCO_P_KEY;
      if (!p_cust_id_cliente_env || !p_key_env) {
        console.error('Variables de entorno EPAYCO_CUSTOMER_ID o EPAYCO_P_KEY no configuradas.');
        return res.status(500).json({ error: 'Error de configuración del servidor para ePayco.' });
      }
      
      const signatureString = `${p_cust_id_cliente_env}^${p_key_env}^${data.x_ref_payco}^${data.x_transaction_id}^${data.x_amount}^${data.x_currency_code}`;
      const calculatedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

      if (calculatedSignature !== data.x_signature) {
        console.warn('Firma de ePayco inválida. Calculada:', calculatedSignature, 'Recibida:', data.x_signature, 'String Firmado:', signatureString, 'Datos:', data);
        return res.status(403).json({ error: 'Firma inválida. La transacción no puede ser procesada.' });
      }
      
      const transaccionExistente = await transaccionModel.obtenerPorReferencia(data.x_ref_payco);
      if (transaccionExistente) {
        return res.status(200).json({ mensaje: 'Transacción ya procesada anteriormente.' });
      }
      
      const nombre = data.x_extra1 || 'Cliente';
      const email = data.x_extra2 || '';
      const telefono = data.x_extra3 || '';
      const cantidad = parseInt(data.x_extra4) || 1;
      
      const esCompletarPago = data.x_extra5 === 'Completar_Pago';
      const tieneCuponBackend = data.x_extra7 === 'ConCupon';
      const codigoCuponBackend = data.x_extra8 || '';
      const descuentoTotalBackend = parseFloat(data.x_extra9) || 0;
      let tieneDiscapacidad = data.x_extra5 && data.x_extra5.includes('Si_Discapacidad');
      let numMovilidadReducida = 0; // Asumir 0 a menos que se pase en un campo extra dedicado

      const tipoTransaccion = esCompletarPago ? 'completar' : 'nueva';
      
      if (tipoTransaccion === 'nueva') {
        const cliente = await clienteModel.crearOEncontrar({ nombre, email, telefono });
        
        // Validar cupón en el backend para mayor seguridad
        const cuponValido = tieneCuponBackend && validarCupon(codigoCuponBackend);
        const precioUnitarioBackend = cuponValido ? PRECIO_BOLETO_CON_CUPON_BACKEND : PRECIO_BOLETO_REGULAR_BACKEND;
        const montoTotalCalculadoBackend = precioUnitarioBackend * cantidad;
        const montoPagadoEpayco = parseFloat(data.x_amount);
        let tipoPagoDeterminado;
        const tolerancia = 0.01;

        if (Math.abs(montoPagadoEpayco - montoTotalCalculadoBackend) < tolerancia) {
            tipoPagoDeterminado = 'completo';
        } else if (Math.abs(montoPagadoEpayco - (montoTotalCalculadoBackend * PORCENTAJE_RESERVA_BACKEND)) < tolerancia) {
            tipoPagoDeterminado = 'reserva';
        } else {
            console.warn(`Discrepancia en el monto pagado. Ref: ${data.x_ref_payco}, Monto ePayco: ${montoPagadoEpayco}, Monto Total Esperado: ${montoTotalCalculadoBackend}, Monto Reserva Esperado: ${montoTotalCalculadoBackend * PORCENTAJE_RESERVA_BACKEND}`);
            // Fallback o lógica adicional si hay discrepancia, por ahora se infiere de x_extra5 si es posible.
            tipoPagoDeterminado = (data.x_extra5 && data.x_extra5.includes('_Reserva')) ? 'reserva' : 'completo';
        }

        // Calcular porcentaje de descuento para almacenar en BD
        const porcentajeDescuentoCalculado = cuponValido && PRECIO_BOLETO_REGULAR_BACKEND > 0 
            ? ((DESCUENTO_CUPON_SOLTAR_BACKEND) / PRECIO_BOLETO_REGULAR_BACKEND) * 100 
            : 0;

        let estadoReserva = 'fallido'; // Estado por defecto si la transacción no es aceptada
        if (data.x_transaction_state === 'Aceptada') {
            estadoReserva = (tipoPagoDeterminado === 'completo') ? 'completado' : 'pendiente';
        }

        // Obtener asientos seleccionados si están disponibles
        let asientosSeleccionados = null;
        if (data.asientos_seleccionados) {
          try {
            asientosSeleccionados = typeof data.asientos_seleccionados === 'string' ? 
              JSON.parse(data.asientos_seleccionados) : 
              data.asientos_seleccionados;
          } catch (error) {
            console.warn('Error parseando asientos seleccionados:', error);
          }
        }

        const reserva = await reservaModel.crear({
          cliente_id: cliente.id,
          cantidad,
          tiene_discapacidad: tieneDiscapacidad,
          num_movilidad_reducida: numMovilidadReducida,
          tipo_pago: tipoPagoDeterminado,
          precio_unitario: precioUnitarioBackend,
          monto_total: montoTotalCalculadoBackend,
          monto_pagado: montoPagadoEpayco,
          descuento_aplicado: cuponValido,
          porcentaje_descuento: porcentajeDescuentoCalculado,
          estado: estadoReserva,
          codigo_cupon: cuponValido ? codigoCuponBackend : null,
          descuento_monto: cuponValido ? DESCUENTO_CUPON_SOLTAR_BACKEND * cantidad : 0,
          asientos_seleccionados: asientosSeleccionados
        });
        
        await transaccionModel.crear({
          reserva_id: reserva.id,
          referencia: data.x_ref_payco,
          tipo_transaccion: tipoTransaccion,
          monto: parseFloat(data.x_amount),
          estado: data.x_transaction_state,
          codigo_estado: data.x_cod_response || data.x_cod_transaction_state || '0',
          respuesta_completa: data
        });

        // Si el pago fue exitoso, generar factura (para todos los tipos de pago)
        if (data.x_transaction_state === 'Aceptada') {
          await generarFactura(reserva, cliente, data, tipoPagoDeterminado);
        }
        
        res.status(200).json({ 
          mensaje: 'Confirmación de pago procesada correctamente',
          estado: data.x_transaction_state,
          reserva_id: reserva.id,
          generar_factura: data.x_transaction_state === 'Aceptada'
        });
      } else {
        // Es completar una reserva existente
        // Buscar la reserva original
        const reservaId = parseInt(data.x_extra6);
        if (!reservaId) {
          console.warn(`ID de reserva original no encontrado en x_extra6 para completar pago. Ref: ${data.x_ref_payco}`);
          return res.status(400).json({ error: 'ID de reserva a completar no válido.' });
        }
        
        // Verificar si la reserva existe
        const reservaExistente = await reservaModel.obtenerPorId(reservaId);
        if (!reservaExistente) {
          return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        // Verificar si la transacción fue aceptada
        if (data.x_transaction_state === 'Aceptada') {
          // Completar la reserva
          await reservaModel.completarReserva(reservaId, parseFloat(data.x_amount));
          
          // Generar factura al completar la reserva
          const cliente = await clienteModel.obtenerPorId(reservaExistente.cliente_id);
          await generarFactura(reservaExistente, cliente, data, 'completar');
        }
        
        // Registrar la transacción de completar pago
        await transaccionModel.crear({
          reserva_id: reservaId,
          referencia: data.x_ref_payco,
          tipo_transaccion: 'completar',
          monto: parseFloat(data.x_amount),
          estado: data.x_transaction_state,
          codigo_estado: data.x_cod_response || data.x_cod_transaction_state || '0',
          respuesta_completa: data
        });
        
        res.status(200).json({ 
          mensaje: 'Completar pago procesado correctamente',
          estado: data.x_transaction_state,
          reserva_id: reservaId
        });
      }
    } catch (error) {
      console.error('Error al procesar confirmación de pago:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene reservas pendientes para un cliente
   */
async function obtenerReservasPendientes(req, res) {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ error: 'Email no proporcionado' });
      }
      
      // Buscar el cliente por email
      const cliente = await clienteModel.obtenerPorEmail(email);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      // Obtener reservas pendientes
      const reservasPendientes = await reservaModel.obtenerReservasPendientes(cliente.id);
      
      res.status(200).json({ reservas: reservasPendientes });
    } catch (error) {
      console.error('Error al obtener reservas pendientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene todas las reservas con filtros opcionales
   */
async function obtenerReservas(req, res) {
    try {
      const filtros = req.query;
      const reservas = await reservaModel.obtenerTodas(filtros);
      
      res.status(200).json({ reservas });
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Obtiene detalles de una reserva con sus transacciones
   */
async function obtenerDetalleReserva(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'ID de reserva no proporcionado' });
      }
      
      // Obtener la reserva
      const reserva = await reservaModel.obtenerPorId(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
      
      // Obtener cliente
      const cliente = await clienteModel.obtenerPorId(reserva.cliente_id);
      
      // Obtener transacciones asociadas
      const transacciones = await transaccionModel.obtenerPorReservaId(id);
      
      res.status(200).json({ 
        reserva,
        cliente,
        transacciones
      });
    } catch (error) {
      console.error('Error al obtener detalle de reserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

/**
 * Generar factura cuando el pago es exitoso
 * @param {Object} reserva - Datos de la reserva
 * @param {Object} cliente - Datos del cliente
 * @param {Object} datosTransaccion - Respuesta de ePayco
 * @param {string} tipoOperacion - Tipo de operación: 'reserva', 'completo', 'completar'
 */
async function generarFactura(reserva, cliente, datosTransaccion, tipoOperacion = null) {
  try {
    // Determinar el tipo de operación si no se proporciona
    if (!tipoOperacion) {
      tipoOperacion = reserva.tipo_pago;
    }
    
    // Generar número de factura único
    const numeroFactura = `FAC-${Date.now()}-${reserva.id}`;
    const fechaFactura = new Date().toISOString();
    
    // Determinar el estado de la factura según el tipo de operación
    let estadoFactura = '';
    let montoFacturado = parseFloat(datosTransaccion.x_amount);
    
    switch (tipoOperacion) {
      case 'reserva':
        estadoFactura = 'Factura de Reserva (30% del total)';
        break;
      case 'completo':
        estadoFactura = 'Factura de Pago Completo (100% del total)';
        break;
      case 'completar':
        estadoFactura = 'Factura de Saldo Completado (70% restante)';
        break;
      default:
        estadoFactura = 'Factura de Pago';
    }
    
    console.log(`📄 Generando factura ${numeroFactura} para reserva ${reserva.id} - Tipo: ${tipoOperacion}`);
    
    // Actualizar la reserva con datos de factura
    await reservaModel.actualizarFactura(reserva.id, numeroFactura);
    
    // Calcular totales para la factura
    const subtotal = montoFacturado;
    const iva = 0; // No aplica IVA para este evento
    const total = subtotal + iva;
    
    // Datos de la factura
    const datosFactura = {
      numero: numeroFactura,
      fecha: fechaFactura,
      tipo_operacion: tipoOperacion,
      estado: estadoFactura,
      cliente: {
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono
      },
      evento: {
        nombre: 'El Poder de Soltar',
        fecha: '5 de octubre, 2025',
        lugar: 'Casa Dann Carlton, Bogotá',
        descripcion: 'Experiencia transformadora con Deepak Chopra'
      },
      reserva: {
        id: reserva.id,
        cantidad: reserva.cantidad,
        tipo_pago: reserva.tipo_pago,
        precio_unitario: reserva.precio_unitario,
        monto_total: reserva.monto_total,
        monto_pagado: reserva.monto_pagado,
        descuento_aplicado: reserva.descuento_aplicado,
        codigo_cupon: reserva.codigo_cupon,
        descuento_monto: reserva.descuento_monto,
        asientos_seleccionados: reserva.asientos_seleccionados,
        tiene_discapacidad: reserva.tiene_discapacidad,
        num_movilidad_reducida: reserva.num_movilidad_reducida
      },
      facturacion: {
        subtotal: subtotal,
        iva_porcentaje: 0,
        iva_valor: iva,
        total: total,
        moneda: 'COP'
      },
      transaccion: {
        referencia: datosTransaccion.x_ref_payco,
        estado: datosTransaccion.x_transaction_state,
        metodo_pago: datosTransaccion.x_franchise || 'No especificado',
        banco: datosTransaccion.x_bank_name || 'No especificado',
        fecha_transaccion: datosTransaccion.x_transaction_date || fechaFactura,
        codigo_autorizacion: datosTransaccion.x_approval_code || 'N/A'
      }
    };
    
    // Guardar factura en base de datos
    try {
      const { pool } = require('../config/db');
      
      // Verificar si ya existe una factura para esta reserva y tipo de operación
      const [existingFacturas] = await pool.query(
        'SELECT * FROM facturas WHERE reserva_id = ?',
        [reserva.id]
      );
      
      if (tipoOperacion === 'completar' && existingFacturas.length > 0) {
        // Si es completar reserva y ya existe una factura, actualizar en lugar de crear nueva
        console.log(`🔄 Actualizando factura existente para reserva ${reserva.id} - Operación: ${tipoOperacion}`);
        
        // Obtener la factura existente
        const facturaExistente = existingFacturas[0];
        const datosExistentes = JSON.parse(facturaExistente.datos_factura);
        
        // Actualizar los datos de la factura existente
        datosExistentes.transacciones = datosExistentes.transacciones || [];
        datosExistentes.transacciones.push({
          tipo: 'completar',
          referencia: datosTransaccion.x_ref_payco,
          estado: datosTransaccion.x_transaction_state,
          metodo_pago: datosTransaccion.x_franchise || 'No especificado',
          banco: datosTransaccion.x_bank_name || 'No especificado',
          fecha_transaccion: datosTransaccion.x_transaction_date || fechaFactura,
          codigo_autorizacion: datosTransaccion.x_approval_code || 'N/A',
          monto: montoFacturado
        });
        
        // Actualizar totales
        datosExistentes.facturacion.total = parseFloat(datosExistentes.facturacion.total) + montoFacturado;
        datosExistentes.facturacion.subtotal = parseFloat(datosExistentes.facturacion.subtotal) + montoFacturado;
        datosExistentes.estado = 'Factura Completada (100% del total)';
        
        await pool.query(
          'UPDATE facturas SET datos_factura = ?, updated_at = NOW() WHERE id = ?',
          [JSON.stringify(datosExistentes), facturaExistente.id]
        );
        
        console.log(`✅ Factura ${facturaExistente.numero_factura} actualizada exitosamente`);
        return datosExistentes;
        
      } else {
        // Crear nueva factura
        await pool.query(
          'INSERT INTO facturas (numero_factura, reserva_id, datos_factura, created_at) VALUES (?, ?, ?, NOW())',
          [numeroFactura, reserva.id, JSON.stringify(datosFactura)]
        );
        
        console.log(`✅ Factura ${numeroFactura} creada exitosamente`);
        return datosFactura;
      }
      
    } catch (dbError) {
      console.warn('Error al manejar la factura en BD:', dbError.message);
      // Continuar sin fallar si hay error en BD
    }
    
  } catch (error) {
    console.error('Error generando factura:', error);
    throw error;
  }
}

/**
 * Obtiene las facturas de una reserva específica
 */
async function obtenerFacturasReserva(req, res) {
  try {
    const { reservaId } = req.params;
    
    if (!reservaId) {
      return res.status(400).json({ error: 'ID de reserva no proporcionado' });
    }
    
    const { pool } = require('../config/db');
    const [facturas] = await pool.query(
      'SELECT * FROM facturas WHERE reserva_id = ? ORDER BY created_at DESC',
      [reservaId]
    );
    
    // Parsear los datos JSON de cada factura
    const facturasFormateadas = facturas.map(factura => ({
      ...factura,
      datos_factura: JSON.parse(factura.datos_factura)
    }));
    
    res.status(200).json({ 
      facturas: facturasFormateadas,
      total: facturasFormateadas.length
    });
    
  } catch (error) {
    console.error('Error al obtener facturas de reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Obtiene una factura específica por su número
 */
async function obtenerFacturaPorNumero(req, res) {
  try {
    const { numeroFactura } = req.params;
    
    if (!numeroFactura) {
      return res.status(400).json({ error: 'Número de factura no proporcionado' });
    }
    
    const { pool } = require('../config/db');
    const [facturas] = await pool.query(
      'SELECT * FROM facturas WHERE numero_factura = ?',
      [numeroFactura]
    );
    
    if (facturas.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    const factura = {
      ...facturas[0],
      datos_factura: JSON.parse(facturas[0].datos_factura)
    };
    
    res.status(200).json({ factura });
    
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Exportar todas las funciones
module.exports = {
    crearReserva,
    procesarConfirmacionPago,
    obtenerReservasPendientes,
    obtenerReservas,
    obtenerDetalleReserva,
    obtenerFacturasReserva,
    obtenerFacturaPorNumero,
    generarFactura
}; 