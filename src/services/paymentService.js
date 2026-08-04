import api from './api';

export const paymentService = {
  // Obtener cuenta de una mesa
  getTableAccount: async (tableId) => {
    const response = await api.get(`/payments/table/${tableId}/account`);
    return response;
  },

  // Procesar pago
  processPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response;
  },

  // Obtener recibo para reimprimir
  getPaymentReceipt: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/receipt`);
    return response;
  },

  // Listar todos los pagos
  getAllPayments: async (page = 0, size = 20) => {
    const response = await api.get('/payments', {
      params: { page, size }
    });
    return response;
  },

  // Obtener pago por ID
  getPaymentById: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response;
  }
};

export default paymentService;
