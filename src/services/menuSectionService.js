import api from './api'

const menuSectionService = {
  // Get all sections for a template
  getSections: async (templateId) => {
    try {
      const response = await api.get(`/menu-templates/${templateId}/sections`)
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al cargar secciones' }
    }
  },

  // Get section by ID
  getSectionById: async (templateId, id) => {
    try {
      const response = await api.get(`/menu-templates/${templateId}/sections/${id}`)
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al cargar sección' }
    }
  },

  // Create section
  createSection: async (templateId, data) => {
    try {
      const response = await api.post(`/menu-templates/${templateId}/sections`, data)
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al crear sección' }
    }
  },

  // Update section
  updateSection: async (templateId, id, data) => {
    try {
      const response = await api.put(`/menu-templates/${templateId}/sections/${id}`, data)
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al actualizar sección' }
    }
  },

  // Delete section
  deleteSection: async (templateId, id) => {
    try {
      await api.delete(`/menu-templates/${templateId}/sections/${id}`)
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar sección')
    }
  }
}

export default menuSectionService
