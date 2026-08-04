import api from './api'

const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params })
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading products:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar productos')
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error loading product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar producto')
    }
  },

  // Create product
  createProduct: async (data) => {
    try {
      const response = await api.post('/products', data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error creating product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al crear producto')
    }
  },

  // Update product
  updateProduct: async (id, data) => {
    try {
      const response = await api.put(`/products/${id}`, data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error updating product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al actualizar producto')
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      await api.delete(`/products/${id}`)
    } catch (error) {
      console.error('Error deleting product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar producto')
    }
  },

  // Toggle product availability
  toggleAvailability: async (id) => {
    try {
      const response = await api.patch(`/products/${id}/toggle-availability`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error toggling availability:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cambiar disponibilidad')
    }
  }
}

export default productService
