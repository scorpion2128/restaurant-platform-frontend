import api from './api';

export const orderService = {
  // Crear nuevo pedido
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response;
  },

  // Obtener pedido por ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response;
  },

  // Obtener todos los pedidos (admin)
  getAllOrders: async (page = 0, size = 20) => {
    const response = await api.get('/orders', {
      params: { page, size }
    });
    return response;
  },

  // Obtener pedidos por estado (admin)
  getOrdersByStatus: async (status, page = 0, size = 20) => {
    const response = await api.get(`/orders/status/${status}`, {
      params: { page, size }
    });
    return response;
  },

  // Obtener pedidos activos del mesero
  getActiveOrdersByWaiter: async () => {
    const response = await api.get('/orders/waiter/active');
    return response;
  },

  // Obtener pedidos para cocina
  getOrdersForKitchen: async () => {
    const response = await api.get('/orders/kitchen');
    return response;
  },

  // Actualizar estado del pedido
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response;
  }
};
