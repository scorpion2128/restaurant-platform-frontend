import api from './api'

const menuTemplateService = {
  // Get all templates
  getTemplates: async (params = {}) => {
    try {
      const response = await api.get('/menu-templates', { params })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading templates:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar plantillas')
    }
  },

  // Get template by ID
  getTemplateById: async (id) => {
    try {
      const response = await api.get(`/menu-templates/${id}`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar plantilla')
    }
  },

  // Create template
  createTemplate: async (data) => {
    try {
      const response = await api.post('/menu-templates', data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error creating template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al crear plantilla')
    }
  },

  // Update template
  updateTemplate: async (id, data) => {
    try {
      const response = await api.put(`/menu-templates/${id}`, data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error updating template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al actualizar plantilla')
    }
  },

  // Delete template
  deleteTemplate: async (id) => {
    try {
      await api.delete(`/menu-templates/${id}`)
    } catch (error) {
      console.error('Error deleting template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar plantilla')
    }
  },

  // Add items to template
  addItems: async (id, items) => {
    try {
      const response = await api.post(`/menu-templates/${id}/items`, { items })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error adding items:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al agregar productos')
    }
  },

  // Remove item from template
  removeItem: async (templateId, itemId) => {
    try {
      const response = await api.delete(`/menu-templates/${templateId}/items/${itemId}`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error removing item:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar producto')
    }
  }
}

export default menuTemplateService
