import api from './api'

const productCategoryService = {
  // Get all categories
  getCategories: async (params = {}) => {
    try {
      const response = await api.get('/product-categories', { params })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading categories:', error)
      throw new Error(error.message || 'Error al cargar categorías')
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/product-categories/${id}`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading category:', error)
      throw new Error(error.message || 'Error al cargar categoría')
    }
  },

  // Create category
  createCategory: async (data) => {
    try {
      const response = await api.post('/product-categories', data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error creating category:', error)
      throw new Error(error.message || 'Error al crear categoría')
    }
  },

  // Update category
  updateCategory: async (id, data) => {
    try {
      const response = await api.put(`/product-categories/${id}`, data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error updating category:', error)
      throw new Error(error.message || 'Error al actualizar categoría')
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      await api.delete(`/product-categories/${id}`)
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar categoría')
    }
  }
}

export default productCategoryService
