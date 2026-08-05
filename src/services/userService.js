import api from './api'
import { USERS } from '../constants/apiEndpoints'

/**
 * Service for user-related API calls
 */
const userService = {
  /**
   * Get a paginated list of users with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (0-indexed)
   * @param {number} params.size - Page size
   * @param {string} params.sort - Sort field and direction (e.g., 'id,asc')
   * @param {string} params.role - Filter by role (optional)
   * @returns {Promise<Object>} Paginated user response
   */
  getUsers: async ({ page = 0, size = 10, sort = 'id,asc', role = null }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    })
    
    if (role) {
      params.append('role', role)
    }

    const response = await api.get(`${USERS.BASE}?${params.toString()}`)
    return response // Returns the complete ApiResponse
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @param {string} userData.role - User's role (ADMIN, USER)
   * @param {number} userData.restaurantId - Restaurant ID
   * @returns {Promise<Object>} Created user
   */
  createUser: async (userData) => {
    const response = await api.post(USERS.BASE, userData)
    return response
  },

  /**
   * Update an existing user
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @param {string} userData.role - User's role
   * @param {boolean} userData.enabled - Whether the user is enabled
   * @returns {Promise<Object>} Updated user
   */
  updateUser: async (id, userData) => {
    const response = await api.put(USERS.BY_ID(id), userData)
    return response
  },

  /**
   * Toggle user's enabled status (activate/deactivate)
   * Only accessible to ADMIN users
   * @param {number} id - User ID
   * @returns {Promise<Object>} Updated user
   */
  toggleUserStatus: async (id) => {
    const response = await api.patch(USERS.TOGGLE_STATUS(id))
    return response
  },

  /**
   * Get the current authenticated user's profile
   * @returns {Promise<Object>} User profile
   */
  getCurrentUser: async () => {
    const response = await api.get(USERS.ME)
    return response
  },
}

export default userService
