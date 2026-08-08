import api from './api'

const dailyMenuService = {
  /**
   * Get menu for specific date (resolves override or recurring automatically)
   */
  getMenuByDate: async (date) => {
    return await api.get(`/daily-menus/date/${date}`)
  },

  /**
   * Get all overrides (specific date configurations)
   */
  getOverrides: async (params = {}) => {
    return await api.get('/daily-menus/overrides', { params })
  },

  /**
   * Get monthly view - all dates with their configured menus
   */
  getMonthlyView: async (year, month) => {
    return await api.get(`/daily-menus/month/${year}/${month}`)
  },

  /**
   * Create override for specific date
   */
  createOverride: async (data) => {
    return await api.post('/daily-menus/override', data)
  },

  /**
   * Update an override date or template
   */
  updateOverride: async (id, data) => {
    return await api.put(`/daily-menus/${id}/override`, data)
  },

  /**
   * Delete override (returns to recurring configuration if available)
   */
  deleteOverride: async (id) => {
    return await api.delete(`/daily-menus/${id}/override`)
  }
}

export default dailyMenuService
