/**
 * User roles constants
 * Single source of truth for role definitions
 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  WAITER: 'WAITER',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN'
}

/**
 * Role display names (Spanish)
 */
export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.WAITER]: 'Mesero',
  [USER_ROLES.CASHIER]: 'Cajero',
  [USER_ROLES.KITCHEN]: 'Cocina'
}

/**
 * Get translated role label
 * @param {string} role - Role key
 * @returns {string} Translated role or original if not found
 */
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role
}

/**
 * Check if user has specific role
 * @param {Object} user - User object with activeRestaurantRole property
 * @param {string} requiredRole - Required role
 * @returns {boolean}
 */
export const hasRole = (user, requiredRole) => {
  return user?.activeRestaurantRole === requiredRole
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with activeRestaurantRole property
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export const hasAnyRole = (user, allowedRoles) => {
  return allowedRoles.includes(user?.activeRestaurantRole)
}
