import api from './api'
import { DAILY_MENUS } from '../constants/apiEndpoints'

const dailyMenuService = {
  // Get all daily menus
  getDailyMenus: async (params = {}) => {
    try {
      const response = await api.get(DAILY_MENUS.BASE, { params })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading daily menus:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar menús diarios')
    }
  },

  // Get daily menu by ID
  getDailyMenuById: async (id) => {
    try {
      const response = await api.get(DAILY_MENUS.BY_ID(id))
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading daily menu:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar menú diario')
    }
  },

  // Get daily menu by date
  getDailyMenuByDate: async (date) => {
    try {
      const response = await api.get(DAILY_MENUS.BY_DATE, { params: { date } })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading daily menu by date:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar menú diario')
    }
  },

  // Get active menu
  getActiveMenu: async () => {
    try {
      const response = await api.get(DAILY_MENUS.ACTIVE)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading active menu:', error)
      throw new Error(error.response?.data?.message || error.message || 'No hay menú activo')
    }
  },

  // Create daily menu
  createDailyMenu: async (data) => {
    try {
      const response = await api.post(DAILY_MENUS.BASE, data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error creating daily menu:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al crear menú diario')
    }
  },

  // Update daily menu
  updateDailyMenu: async (id, data) => {
    try {
      const response = await api.put(DAILY_MENUS.BY_ID(id), data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error updating daily menu:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al actualizar menú diario')
    }
  },

  // Delete daily menu
  deleteDailyMenu: async (id) => {
    try {
      await api.delete(DAILY_MENUS.BY_ID(id))
    } catch (error) {
      console.error('Error deleting daily menu:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar menú diario')
    }
  },

  // Toggle active status
  toggleActive: async (id) => {
    try {
      const response = await api.patch(DAILY_MENUS.TOGGLE_ACTIVE(id))
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error toggling active status:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cambiar estado')
    }
  }
}

export default dailyMenuService
