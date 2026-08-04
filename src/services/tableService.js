import api from './api';

export const tableService = {
  // Get all tables
  getAllTables: async () => {
    const response = await api.get('/tables');
    return response; // Devolver el objeto completo {success, message, data}
  },

  // Get table by ID
  getTableById: async (id) => {
    const response = await api.get(`/tables/${id}`);
    return response; // Devolver el objeto completo
  },

  // Get tables by status
  getTablesByStatus: async (status) => {
    const response = await api.get(`/tables/status/${status}`);
    return response; // Devolver el objeto completo
  },

  // Create table
  createTable: async (data) => {
    const response = await api.post('/tables', data);
    return response; // Devolver el objeto completo
  },

  // Update table
  updateTable: async (id, data) => {
    const response = await api.put(`/tables/${id}`, data);
    return response; // Devolver el objeto completo
  },

  // Delete table
  deleteTable: async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response; // Devolver el objeto completo
  },

  // Update table status
  updateTableStatus: async (id, status) => {
    const response = await api.patch(`/tables/${id}/status`, null, {
      params: { status }
    });
    return response; // Devolver el objeto completo
  }
};
