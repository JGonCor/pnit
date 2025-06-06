const transaccionModel = require('../models/transaccionModel');

class TransaccionController {
  /**
   * Obtiene todas las transacciones con filtros opcionales
   */
  async obtenerTransacciones(req, res) {
    try {
      const filtros = req.query;
      const transacciones = await transaccionModel.obtenerTodas(filtros);
      
      res.status(200).json({ transacciones });
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene una transacción por su referencia
   */
  async obtenerTransaccionPorReferencia(req, res) {
    try {
      const { referencia } = req.params;
      
      if (!referencia) {
        return res.status(400).json({ error: 'Referencia no proporcionada' });
      }
      
      const transaccion = await transaccionModel.obtenerPorReferencia(referencia);
      
      if (!transaccion) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }
      
      res.status(200).json({ transaccion });
    } catch (error) {
      console.error('Error al obtener transacción por referencia:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene transacciones por reserva ID
   */
  async obtenerTransaccionesPorReserva(req, res) {
    try {
      const { reservaId } = req.params;
      
      if (!reservaId) {
        return res.status(400).json({ error: 'ID de reserva no proporcionado' });
      }
      
      const transacciones = await transaccionModel.obtenerPorReservaId(reservaId);
      
      res.status(200).json({ transacciones });
    } catch (error) {
      console.error('Error al obtener transacciones por reserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = new TransaccionController(); 