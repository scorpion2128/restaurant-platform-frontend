/**
 * Centralized API client for making HTTP requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

/**
 * Gets the authentication token from localStorage
 * @returns {string|null} The access token or null if not found
 */
const getAuthToken = () => {
  return localStorage.getItem('accessToken')
}

/**
 * Makes an HTTP request to the API
 * @param {string} endpoint - The API endpoint (without base URL)
 * @param {Object} options - Fetch options (method, body, headers, params, etc.)
 * @returns {Promise<Object>} The response data
 * @throws {Error} If the request fails
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  // Build URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint}`
  if (options.params) {
    const queryParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value)
      }
    })
    const queryString = queryParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  // Add body if present and method is not GET
  if (options.body && options.method !== 'GET') {
    config.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, config)
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
    }

    // Parse response
    const data = await response.json()

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Error en la solicitud'
      throw new Error(errorMessage)
    }

    // Return the data from ApiResponse wrapper
    return data
  } catch (error) {
    // Network errors or JSON parsing errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error('Error de conexión. Verifica tu conexión a internet.')
    }
    throw error
  }
}

/**
 * Helper methods for common HTTP methods
 */
export const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body }),
  
  put: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body }),
  
  patch: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
}

export default api
