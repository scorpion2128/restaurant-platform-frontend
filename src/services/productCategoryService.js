import api from './api'

const productCategoryService = {
  // Get all categories
  getCategories: async (params = {}) => {
    try {
      const response = await api.get('/master-product-categories', { params })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading categories:', error)
      throw new Error(error.message || 'Error al cargar categorías')
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/master-product-categories/${id}`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading category:', error)
      throw new Error(error.message || 'Error al cargar categoría')
    }
  },

  // Create category
  createCategory: async (data) => {
    try {
      const response = await api.post('/master-product-categories', data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error creating category:', error)
      throw new Error(error.message || 'Error al crear categoría')
    }
  },

  // Update category
  updateCategory: async (id, data) => {
    try {
      const response = await api.put(`/master-product-categories/${id}`, data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error updating category:', error)
      throw new Error(error.message || 'Error al actualizar categoría')
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      await api.delete(`/master-product-categories/${id}`)
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar categoría')
    }
  }
}

export default productCategoryService
