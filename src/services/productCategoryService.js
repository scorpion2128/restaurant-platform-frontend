import api from './api'
import { PRODUCT_CATEGORIES } from '../constants/apiEndpoints'

const productCategoryService = {
  // Get all categories
  getCategories: async (params = {}) => {
    try {
      const response = await api.get(PRODUCT_CATEGORIES.BASE, { params })
      return response
    } catch (error) {
      console.error('Error loading categories:', error)
      throw new Error(error.message || 'Error al cargar categorías')
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(PRODUCT_CATEGORIES.BY_ID(id))
      return response
    } catch (error) {
      console.error('Error loading category:', error)
      throw new Error(error.message || 'Error al cargar categoría')
    }
  },

  // Create category
  createCategory: async (data) => {
    try {
      const response = await api.post(PRODUCT_CATEGORIES.BASE, data)
      return response
    } catch (error) {
      console.error('Error creating category:', error)
      throw new Error(error.message || 'Error al crear categoría')
    }
  },

  // Update category
  updateCategory: async (id, data) => {
    try {
      const response = await api.put(PRODUCT_CATEGORIES.BY_ID(id), data)
      return response
    } catch (error) {
      console.error('Error updating category:', error)
      throw new Error(error.message || 'Error al actualizar categoría')
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(PRODUCT_CATEGORIES.BY_ID(id))
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar categoría')
    }
  }
}

export default productCategoryService
