import { getRoleLabel } from '../constants/roles'

/**
 * Format user's full name as "LastName, FirstName"
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} Formatted full name or empty string if user is null
 */
export const formatFullName = (user) => {
  if (!user) return ''
  return `${user.lastName}, ${user.firstName}`
}

/**
 * Get first name and first last name from user object
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} First name and first last name
 */
export const getFirstNames = (user) => {
  if (!user) return ''
  const firstName = user.firstName.split(' ')[0]
  const firstLastName = user.lastName.split(' ')[0]
  return `${firstName} ${firstLastName}`
}

/**
 * Translate user role code to Spanish display text
 * @param {string} role - User role key (ADMIN, WAITER, CASHIER, KITCHEN, USER)
 * @returns {string} Translated role or original value if not found
 */
export const formatRole = (role) => {
  return getRoleLabel(role)
}
