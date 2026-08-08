import api from './api'

const MASTER_PRODUCTS_BASE = '/master-products'

const masterProductService = {
  // Get all master products from the organization catalog
  getMasterProducts: async (params = {}) => {
    try {
      const response = await api.get(MASTER_PRODUCTS_BASE, { params })
      return response
    } catch (error) {
      console.error('Error loading master products:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar productos del catálogo')
    }
  },

  // Get master product by ID
  getMasterProductById: async (id) => {
    try {
      const response = await api.get(`${MASTER_PRODUCTS_BASE}/${id}`)
      return response
    } catch (error) {
      console.error('Error loading master product:', error)
      throw new Error(error.response?.data?.message || error.message || 'Error al cargar producto')
    }
  }
}

export default masterProductService
