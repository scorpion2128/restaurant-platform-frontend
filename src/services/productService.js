import api from './api'
import { PRODUCTS } from '../constants/apiEndpoints'

const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    try {
      const response = await api.get(PRODUCTS.BASE, { params })
      return response
    } catch (error) {
      console.error('Error loading products:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar productos')
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(PRODUCTS.BY_ID(id))
      return response
    } catch (error) {
      console.error('Error loading product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar producto')
    }
  },

  // Create product
  createProduct: async (data) => {
    try {
      const response = await api.post(PRODUCTS.BASE, data)
      return response
    } catch (error) {
      console.error('Error creating product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al crear producto')
    }
  },

  // Update product
  updateProduct: async (id, data) => {
    try {
      const response = await api.put(PRODUCTS.BY_ID(id), data)
      return response
    } catch (error) {
      console.error('Error updating product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al actualizar producto')
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(PRODUCTS.BY_ID(id))
      return response
    } catch (error) {
      console.error('Error deleting product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al eliminar producto')
    }
  },

  // Toggle product availability
  toggleAvailability: async (id) => {
    try {
      const response = await api.patch(PRODUCTS.TOGGLE_AVAILABILITY(id))
      return response
    } catch (error) {
      console.error('Error toggling availability:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cambiar disponibilidad')
    }
  }
}

export default productService
