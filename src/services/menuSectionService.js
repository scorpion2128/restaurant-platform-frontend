import api from './api'
import { MENU_TEMPLATES } from '../constants/apiEndpoints'

const menuSectionService = {
  // Get all sections for a template
  getSections: async (templateId) => {
    try {
      const response = await api.get(MENU_TEMPLATES.SECTIONS(templateId))
      return response
    } catch (error) {
      console.error('Error loading sections:', error)
      return { success: false, data: [], message: error.message || 'Error al cargar secciones' }
    }
  },

  // Get section by ID
  getSectionById: async (templateId, id) => {
    try {
      const response = await api.get(MENU_TEMPLATES.SECTION_BY_ID(templateId, id))
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al cargar sección' }
    }
  },

  // Create section
  createSection: async (templateId, data) => {
    try {
      const response = await api.post(MENU_TEMPLATES.SECTIONS(templateId), data)
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al crear sección' }
    }
  },

  // Update section
  updateSection: async (templateId, id, data) => {
    try {
      const response = await api.put(MENU_TEMPLATES.SECTION_BY_ID(templateId, id), data)
      return response
    } catch (error) {
      return { success: false, message: error.message || 'Error al actualizar sección' }
    }
  },

  // Delete section
  deleteSection: async (templateId, id) => {
    try {
      await api.delete(MENU_TEMPLATES.SECTION_BY_ID(templateId, id))
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar sección')
    }
  }
}

export default menuSectionService
