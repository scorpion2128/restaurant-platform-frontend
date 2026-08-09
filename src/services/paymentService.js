import api from './api';
import { PAYMENTS } from '../constants/apiEndpoints';

export const paymentService = {
  // Obtener cuenta de una mesa
  getTableAccount: async (tableId) => {
    const response = await api.get(PAYMENTS.TABLE_ACCOUNT(tableId));
    return response;
  },

  getOrderAccount: async (orderId) => {
    return api.get(PAYMENTS.ORDER_ACCOUNT(orderId));
  },

  // Procesar pago
  processPayment: async (paymentData) => {
    const response = await api.post(PAYMENTS.BASE, paymentData);
    return response;
  },

  // Obtener recibo para reimprimir
  getPaymentReceipt: async (paymentId) => {
    const response = await api.get(PAYMENTS.RECEIPT(paymentId));
    return response;
  },

  // Listar todos los pagos
  getAllPayments: async (page = 0, size = 20) => {
    const response = await api.get(PAYMENTS.BASE, {
      params: { page, size }
    });
    return response;
  },

  // Obtener pago por ID
  getPaymentById: async (paymentId) => {
    const response = await api.get(PAYMENTS.BY_ID(paymentId));
    return response;
  }
};

export default paymentService;
