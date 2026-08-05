import api from './api';
import { TABLES } from '../constants/apiEndpoints';

export const tableService = {
  // Get all tables
  getAllTables: async () => {
    const response = await api.get(TABLES.BASE);
    return response; // Devolver el objeto completo {success, message, data}
  },

  // Get table by ID
  getTableById: async (id) => {
    const response = await api.get(TABLES.BY_ID(id));
    return response; // Devolver el objeto completo
  },

  // Get tables by status
  getTablesByStatus: async (status) => {
    const response = await api.get(TABLES.BY_STATUS(status));
    return response; // Devolver el objeto completo
  },

  // Create table
  createTable: async (data) => {
    const response = await api.post(TABLES.BASE, data);
    return response; // Devolver el objeto completo
  },

  // Update table
  updateTable: async (id, data) => {
    const response = await api.put(TABLES.BY_ID(id), data);
    return response; // Devolver el objeto completo
  },

  // Delete table
  deleteTable: async (id) => {
    const response = await api.delete(TABLES.BY_ID(id));
    return response; // Devolver el objeto completo
  },

  // Update table status
  updateTableStatus: async (id, status) => {
    const response = await api.patch(TABLES.UPDATE_STATUS(id), null, {
      params: { status }
    });
    return response; // Devolver el objeto completo
  }
};
