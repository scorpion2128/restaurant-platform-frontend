import api from './api'
import { MENU_TEMPLATES } from '../constants/apiEndpoints'

const menuTemplateService = {
  // Get all templates
  getTemplates: async (params = {}) => {
    try {
      const response = await api.get(MENU_TEMPLATES.BASE, { params })
      return response
    } catch (error) {
      console.error('Error loading templates:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar plantillas')
    }
  },

  // Get template by ID
  getTemplateById: async (id) => {
    try {
      const response = await api.get(MENU_TEMPLATES.BY_ID(id))
      return response
    } catch (error) {
      console.error('Error loading template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar plantilla')
    }
  },

  // Create template
  createTemplate: async (data) => {
    try {
      const response = await api.post(MENU_TEMPLATES.BASE, data)
      return response
    } catch (error) {
      console.error('Error creating template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al crear plantilla')
    }
  },

  // Update template
  updateTemplate: async (id, data) => {
    try {
      const response = await api.put(MENU_TEMPLATES.BY_ID(id), data)
      return response
    } catch (error) {
      console.error('Error updating template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al actualizar plantilla')
    }
  },

  // Delete template
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(MENU_TEMPLATES.BY_ID(id))
      return response
    } catch (error) {
      console.error('Error deleting template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar plantilla')
    }
  },

  // Add items to template
  addItems: async (id, data) => {
    try {
      const response = await api.post(MENU_TEMPLATES.ITEMS(id), data)
      return response
    } catch (error) {
      console.error('Error adding items:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al agregar productos')
    }
  },

  // Remove item from template
  removeItem: async (templateId, itemId) => {
    try {
      const response = await api.delete(MENU_TEMPLATES.REMOVE_ITEM(templateId, itemId))
      return response
    } catch (error) {
      console.error('Error removing item:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar producto')
    }
  }
}

export default menuTemplateService
