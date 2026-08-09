import api from './api';
import { ORDERS } from '../constants/apiEndpoints';

export const orderService = {
  // Crear nuevo pedido
  createOrder: async (orderData) => {
    const response = await api.post(ORDERS.BASE, orderData);
    return response;
  },

  // Obtener pedido por ID
  getOrderById: async (id) => {
    const response = await api.get(ORDERS.BY_ID(id));
    return response;
  },

  // Obtener todos los pedidos (admin)
  getAllOrders: async (page = 0, size = 20) => {
    const response = await api.get(ORDERS.BASE, {
      params: { page, size }
    });
    return response;
  },

  // Obtener pedidos por estado (admin)
  getOrdersByStatus: async (status, page = 0, size = 20) => {
    const response = await api.get(ORDERS.BY_STATUS(status), {
      params: { page, size }
    });
    return response;
  },

  // Obtener pedidos activos del mesero
  getActiveOrdersByWaiter: async () => {
    const response = await api.get(ORDERS.WAITER_ACTIVE);
    return response;
  },

  // Obtener únicamente los pedidos activos de una mesa
  getActiveOrdersByTable: async (tableId) => {
    const response = await api.get(`/orders/table/${tableId}/active`);
    return response;
  },

  getActiveDeliveryOrders: async () => {
    return api.get(ORDERS.DELIVERY_ACTIVE);
  },

  // Obtener pedidos para cocina
  getOrdersForKitchen: async () => {
    const response = await api.get(ORDERS.KITCHEN);
    return response;
  },

  // Actualizar estado del pedido
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(ORDERS.UPDATE_STATUS(id), { status });
    return response;
  }
};
