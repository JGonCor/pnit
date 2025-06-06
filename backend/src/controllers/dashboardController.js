const ExcelJS = require('exceljs');
const moment = require('moment');
const { pool } = require('../config/db');
const transaccionModel = require('../models/transaccionModel');
const reservaModel = require('../models/reservaModel');

class DashboardController {
  /**
   * Obtiene estadísticas generales para el dashboard
   */
  async obtenerEstadisticas(req, res) {
    try {
      // Obtener conexión a la base de datos
      const connection = await pool.getConnection();
      
      // Total de ventas
      const [totalVentas] = await connection.query(`
        SELECT COUNT(*) as total, SUM(monto) as monto_total 
        FROM transacciones 
        WHERE estado = 'Aceptada'
      `);
      
      // Total de clientes
      const [totalClientes] = await connection.query('SELECT COUNT(*) as total FROM clientes');
      
      // Total de reservas por estado
      const [reservasPorEstado] = await connection.query(`
        SELECT estado, COUNT(*) as total 
        FROM reservas 
        GROUP BY estado
      `);
      
      // Total de entradas vendidas
      const [entradasVendidas] = await connection.query(`
        SELECT SUM(cantidad) as total 
        FROM reservas 
        WHERE estado = 'completado' OR (estado = 'pendiente' AND tipo_pago = 'reserva')
      `);
      
      // Ventas por día (últimos 7 días)
      const [ventasPorDia] = await connection.query(`
        SELECT 
          DATE(created_at) as fecha, 
          COUNT(*) as transacciones, 
          SUM(monto) as monto_total 
        FROM transacciones 
        WHERE estado = 'Aceptada' AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY fecha
      `);
      
      // Liberar conexión
      connection.release();
      
      // Construir respuesta
      const estadisticas = {
        ventas: {
          total: totalVentas[0].total || 0,
          monto_total: totalVentas[0].monto_total || 0
        },
        clientes: {
          total: totalClientes[0].total || 0
        },
        reservas: {
          por_estado: reservasPorEstado.reduce((acc, item) => {
            acc[item.estado] = item.total;
            return acc;
          }, {})
        },
        entradas: {
          vendidas: entradasVendidas[0].total || 0
        },
        grafico_ventas: ventasPorDia.map(item => ({
          fecha: item.fecha,
          transacciones: item.transacciones,
          monto_total: item.monto_total
        }))
      };
      
      res.status(200).json({ estadisticas });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Exporta los datos de transacciones a Excel
   */
  async exportarTransacciones(req, res) {
    try {
      // Obtener filtros opcionales
      const filtros = req.query;
      
      // Obtener todas las transacciones con los filtros aplicados
      const transacciones = await transaccionModel.obtenerTodas(filtros);
      
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      
      // Añadir una hoja de cálculo
      const worksheet = workbook.addWorksheet('Transacciones');
      
      // Definir las columnas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Referencia', key: 'referencia', width: 20 },
        { header: 'Tipo', key: 'tipo_transaccion', width: 15 },
        { header: 'Monto', key: 'monto', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Código Estado', key: 'codigo_estado', width: 15 },
        { header: 'Cliente', key: 'nombre', width: 25 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Cantidad Entradas', key: 'cantidad', width: 15 },
        { header: 'Tipo Pago', key: 'tipo_pago', width: 15 },
        { header: 'Fecha', key: 'created_at', width: 20 }
      ];
      
      // Aplicar estilo al encabezado
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      
      // Agregar los datos
      transacciones.forEach(transaccion => {
        // Formatear la fecha
        const fecha = transaccion.created_at ? moment(transaccion.created_at).format('DD/MM/YYYY HH:mm:ss') : '';
        
        worksheet.addRow({
          id: transaccion.id,
          referencia: transaccion.referencia,
          tipo_transaccion: transaccion.tipo_transaccion === 'completar' ? 'Completar Reserva' : 'Nueva Compra',
          monto: transaccion.monto,
          estado: transaccion.estado,
          codigo_estado: transaccion.codigo_estado,
          nombre: transaccion.nombre,
          email: transaccion.email,
          cantidad: transaccion.cantidad,
          tipo_pago: transaccion.tipo_pago === 'completo' ? 'Pago Completo' : 'Reserva (30%)',
          created_at: fecha
        });
      });
      
      // Formato para la columna de monto
      worksheet.getColumn('monto').numFmt = '"$"#,##0.00';
      
      // Nombre del archivo
      const fileName = `transacciones_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
      
      // Establecer encabezados para la descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Enviar el archivo
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error al exportar transacciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Exporta los datos de reservas a Excel
   */
  async exportarReservas(req, res) {
    try {
      // Obtener filtros opcionales
      const filtros = req.query;
      
      // Obtener todas las reservas con los filtros aplicados
      const reservas = await reservaModel.obtenerTodas(filtros);
      
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      
      // Añadir una hoja de cálculo
      const worksheet = workbook.addWorksheet('Reservas');
      
      // Definir las columnas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Cliente', key: 'nombre', width: 25 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Cantidad', key: 'cantidad', width: 10 },
        { header: 'Tiene Discapacidad', key: 'tiene_discapacidad', width: 15 },
        { header: 'Movilidad Reducida', key: 'num_movilidad_reducida', width: 15 },
        { header: 'Tipo Pago', key: 'tipo_pago', width: 15 },
        { header: 'Precio Unitario', key: 'precio_unitario', width: 15 },
        { header: 'Monto Total', key: 'monto_total', width: 15 },
        { header: 'Monto Pagado', key: 'monto_pagado', width: 15 },
        { header: 'Descuento', key: 'descuento_aplicado', width: 10 },
        { header: '% Descuento', key: 'porcentaje_descuento', width: 10 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Fecha', key: 'created_at', width: 20 }
      ];
      
      // Aplicar estilo al encabezado
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      
      // Agregar los datos
      reservas.forEach(reserva => {
        // Formatear la fecha
        const fecha = reserva.created_at ? moment(reserva.created_at).format('DD/MM/YYYY HH:mm:ss') : '';
        
        worksheet.addRow({
          id: reserva.id,
          nombre: reserva.nombre,
          email: reserva.email,
          telefono: reserva.telefono,
          cantidad: reserva.cantidad,
          tiene_discapacidad: reserva.tiene_discapacidad ? 'Sí' : 'No',
          num_movilidad_reducida: reserva.num_movilidad_reducida,
          tipo_pago: reserva.tipo_pago === 'completo' ? 'Pago Completo' : 'Reserva (30%)',
          precio_unitario: reserva.precio_unitario,
          monto_total: reserva.monto_total,
          monto_pagado: reserva.monto_pagado,
          descuento_aplicado: reserva.descuento_aplicado ? 'Sí' : 'No',
          porcentaje_descuento: reserva.porcentaje_descuento,
          estado: reserva.estado === 'completado' ? 'Completado' : 
                 reserva.estado === 'pendiente' ? 'Pendiente' : 'Cancelado',
          created_at: fecha
        });
      });
      
      // Formato para las columnas de dinero
      ['precio_unitario', 'monto_total', 'monto_pagado'].forEach(col => {
        worksheet.getColumn(col).numFmt = '"$"#,##0.00';
      });
      
      // Nombre del archivo
      const fileName = `reservas_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
      
      // Establecer encabezados para la descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Enviar el archivo
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error al exportar reservas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Genera un informe de ventas por período
   */
  async generarInformeVentas(req, res) {
    try {
      // Obtener parámetros para el informe
      const { fecha_inicio, fecha_fin } = req.query;
      
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias' });
      }
      
      // Validar formato de fechas
      const fechaInicio = moment(fecha_inicio);
      const fechaFin = moment(fecha_fin);
      
      if (!fechaInicio.isValid() || !fechaFin.isValid()) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
      }
      
      // Obtener conexión a la base de datos
      const connection = await pool.getConnection();
      
      // Resumen de ventas en el período
      const [resumenVentas] = await connection.query(`
        SELECT 
          COUNT(*) as total_transacciones, 
          SUM(CASE WHEN estado = 'Aceptada' THEN 1 ELSE 0 END) as transacciones_exitosas,
          SUM(CASE WHEN estado = 'Aceptada' THEN monto ELSE 0 END) as monto_total,
          AVG(CASE WHEN estado = 'Aceptada' THEN monto ELSE NULL END) as ticket_promedio
        FROM transacciones 
        WHERE created_at BETWEEN ? AND ?
      `, [
        fechaInicio.format('YYYY-MM-DD 00:00:00'),
        fechaFin.format('YYYY-MM-DD 23:59:59')
      ]);
      
      // Ventas por día en el período
      const [ventasPorDia] = await connection.query(`
        SELECT 
          DATE(created_at) as fecha, 
          COUNT(*) as total_transacciones,
          SUM(CASE WHEN estado = 'Aceptada' THEN 1 ELSE 0 END) as transacciones_exitosas,
          SUM(CASE WHEN estado = 'Aceptada' THEN monto ELSE 0 END) as monto_total
        FROM transacciones 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY fecha
      `, [
        fechaInicio.format('YYYY-MM-DD 00:00:00'),
        fechaFin.format('YYYY-MM-DD 23:59:59')
      ]);
      
      // Distribución por tipo de pago
      const [distribucionTipoPago] = await connection.query(`
        SELECT 
          r.tipo_pago, 
          COUNT(*) as total_transacciones,
          SUM(t.monto) as monto_total
        FROM transacciones t
        JOIN reservas r ON t.reserva_id = r.id
        WHERE t.estado = 'Aceptada' AND t.created_at BETWEEN ? AND ?
        GROUP BY r.tipo_pago
      `, [
        fechaInicio.format('YYYY-MM-DD 00:00:00'),
        fechaFin.format('YYYY-MM-DD 23:59:59')
      ]);
      
      // Distribución por tipo de transacción
      const [distribucionTipoTransaccion] = await connection.query(`
        SELECT 
          tipo_transaccion, 
          COUNT(*) as total_transacciones,
          SUM(CASE WHEN estado = 'Aceptada' THEN monto ELSE 0 END) as monto_total
        FROM transacciones 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY tipo_transaccion
      `, [
        fechaInicio.format('YYYY-MM-DD 00:00:00'),
        fechaFin.format('YYYY-MM-DD 23:59:59')
      ]);
      
      // Total de entradas vendidas en el período
      const [entradasVendidas] = await connection.query(`
        SELECT SUM(r.cantidad) as total
        FROM transacciones t
        JOIN reservas r ON t.reserva_id = r.id
        WHERE t.estado = 'Aceptada' AND t.created_at BETWEEN ? AND ?
      `, [
        fechaInicio.format('YYYY-MM-DD 00:00:00'),
        fechaFin.format('YYYY-MM-DD 23:59:59')
      ]);
      
      // Liberar conexión
      connection.release();
      
      // Construir respuesta
      const informe = {
        periodo: {
          fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
          fecha_fin: fechaFin.format('YYYY-MM-DD'),
          dias: fechaFin.diff(fechaInicio, 'days') + 1
        },
        resumen: {
          total_transacciones: resumenVentas[0].total_transacciones || 0,
          transacciones_exitosas: resumenVentas[0].transacciones_exitosas || 0,
          monto_total: resumenVentas[0].monto_total || 0,
          ticket_promedio: resumenVentas[0].ticket_promedio || 0,
          entradas_vendidas: entradasVendidas[0].total || 0
        },
        desglose_diario: ventasPorDia.map(item => ({
          fecha: item.fecha,
          total_transacciones: item.total_transacciones,
          transacciones_exitosas: item.transacciones_exitosas,
          monto_total: item.monto_total
        })),
        distribucion_tipo_pago: distribucionTipoPago.map(item => ({
          tipo_pago: item.tipo_pago === 'completo' ? 'Pago completo' : 'Reserva (30%)',
          total_transacciones: item.total_transacciones,
          monto_total: item.monto_total
        })),
        distribucion_tipo_transaccion: distribucionTipoTransaccion.map(item => ({
          tipo_transaccion: item.tipo_transaccion === 'completar' ? 'Completar reserva' : 'Nueva compra',
          total_transacciones: item.total_transacciones,
          monto_total: item.monto_total
        }))
      };
      
      res.status(200).json({ informe });
    } catch (error) {
      console.error('Error al generar informe de ventas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Obtiene todas las suscripciones con filtros opcionales
   */
  async obtenerSuscripciones(req, res) {
    try {
      // Obtener filtros opcionales
      const { estado, origen, buscar, limite = 50, pagina = 1 } = req.query;
      
      // Obtener conexión a la base de datos
      const connection = await pool.getConnection();
      
      // Construir consulta base
      let whereConditions = [];
      let queryParams = [];
      
      if (estado) {
        whereConditions.push('estado = ?');
        queryParams.push(estado);
      }
      
      if (origen) {
        whereConditions.push('origen = ?');
        queryParams.push(origen);
      }
      
      if (buscar) {
        whereConditions.push('(nombre LIKE ? OR email LIKE ?)');
        queryParams.push(`%${buscar}%`, `%${buscar}%`);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      // Calcular offset para paginación
      const offset = (parseInt(pagina) - 1) * parseInt(limite);
      
      // Obtener suscripciones con paginación
      const [suscripciones] = await connection.query(`
        SELECT 
          id, nombre, email, origen, estado, ip_address, created_at
        FROM suscripciones 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, parseInt(limite), offset]);
      
      // Obtener total de registros para paginación
      const [totalCount] = await connection.query(`
        SELECT COUNT(*) as total 
        FROM suscripciones 
        ${whereClause}
      `, queryParams);
      
      connection.release();
      
      res.status(200).json({
        suscripciones,
        total: totalCount[0].total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total_paginas: Math.ceil(totalCount[0].total / parseInt(limite))
      });
    } catch (error) {
      console.error('Error al obtener suscripciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Actualiza el estado de una suscripción
   */
  async actualizarEstadoSuscripcion(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      // Validar estado
      const estadosValidos = ['activo', 'inactivo', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      
      // Obtener conexión a la base de datos
      const connection = await pool.getConnection();
      
      // Actualizar estado
      const [result] = await connection.query(
        'UPDATE suscripciones SET estado = ?, updated_at = NOW() WHERE id = ?',
        [estado, id]
      );
      
      connection.release();
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Suscripción no encontrada' });
      }
      
      res.status(200).json({ mensaje: 'Estado actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar estado de suscripción:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  /**
   * Exporta las suscripciones a Excel
   */
  async exportarSuscripciones(req, res) {
    try {
      // Obtener filtros opcionales
      const { estado, origen, buscar } = req.query;
      
      // Obtener conexión a la base de datos
      const connection = await pool.getConnection();
      
      // Construir consulta
      let whereConditions = [];
      let queryParams = [];
      
      if (estado) {
        whereConditions.push('estado = ?');
        queryParams.push(estado);
      }
      
      if (origen) {
        whereConditions.push('origen = ?');
        queryParams.push(origen);
      }
      
      if (buscar) {
        whereConditions.push('(nombre LIKE ? OR email LIKE ?)');
        queryParams.push(`%${buscar}%`, `%${buscar}%`);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      // Obtener todas las suscripciones con los filtros aplicados
      const [suscripciones] = await connection.query(`
        SELECT 
          id, nombre, email, origen, estado, ip_address, created_at, updated_at
        FROM suscripciones 
        ${whereClause}
        ORDER BY created_at DESC
      `, queryParams);
      
      connection.release();
      
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      
      // Añadir una hoja de cálculo
      const worksheet = workbook.addWorksheet('Suscripciones');
      
      // Definir las columnas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre', key: 'nombre', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Origen', key: 'origen', width: 20 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'IP Address', key: 'ip_address', width: 20 },
        { header: 'Fecha Suscripción', key: 'created_at', width: 20 },
        { header: 'Última Actualización', key: 'updated_at', width: 20 }
      ];
      
      // Aplicar estilo al encabezado
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      
      // Agregar los datos
      suscripciones.forEach(suscripcion => {
        // Formatear las fechas
        const fechaCreacion = suscripcion.created_at ? moment(suscripcion.created_at).format('DD/MM/YYYY HH:mm:ss') : '';
        const fechaActualizacion = suscripcion.updated_at ? moment(suscripcion.updated_at).format('DD/MM/YYYY HH:mm:ss') : '';
        
        worksheet.addRow({
          id: suscripcion.id,
          nombre: suscripcion.nombre,
          email: suscripcion.email,
          origen: suscripcion.origen,
          estado: suscripcion.estado.charAt(0).toUpperCase() + suscripcion.estado.slice(1),
          ip_address: suscripcion.ip_address || 'No disponible',
          created_at: fechaCreacion,
          updated_at: fechaActualizacion
        });
      });
      
      // Nombre del archivo
      const fileName = `suscripciones_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
      
      // Establecer encabezados para la descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Enviar el archivo
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error al exportar suscripciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = new DashboardController(); 