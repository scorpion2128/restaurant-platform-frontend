import api from './api'

const recurringMenuService = {
  /**
   * Get all recurring menu configurations (weekly setup)
   */
  getRecurringMenus: async () => {
    return await api.get('/recurring-menus')
  },

  /**
   * Get recurring menu for specific day of week
   */
  getRecurringMenuByDay: async (dayOfWeek) => {
    return await api.get(`/recurring-menus/${dayOfWeek}`)
  },

  /**
   * Create or update recurring menu configuration
   */
  createOrUpdateRecurringMenu: async (data) => {
    return await api.post('/recurring-menus', data)
  },

  /**
   * Delete recurring menu configuration for a day
   */
  deleteRecurringMenu: async (dayOfWeek) => {
    return await api.delete(`/recurring-menus/${dayOfWeek}`)
  }
}

export default recurringMenuService
