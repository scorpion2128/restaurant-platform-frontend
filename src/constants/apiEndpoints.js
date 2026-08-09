/**
 * Centralized API endpoints
 * All API endpoint URLs are defined here for easy maintenance and updates
 */

// Menu Templates
const MENU_TEMPLATES_PATH = '/master-menu-templates'
export const MENU_TEMPLATES = {
  BASE: MENU_TEMPLATES_PATH,
  BY_ID: (id) => `${MENU_TEMPLATES_PATH}/${id}`,
  ITEMS: (id) => `${MENU_TEMPLATES_PATH}/${id}/items`,
  REMOVE_ITEM: (templateId, itemId) => `${MENU_TEMPLATES_PATH}/${templateId}/items/${itemId}`,
  SECTIONS: (templateId) => `${MENU_TEMPLATES_PATH}/${templateId}/sections`,
  SECTION_BY_ID: (templateId, sectionId) => `${MENU_TEMPLATES_PATH}/${templateId}/sections/${sectionId}`,
}

// Orders
const ORDERS_PATH = '/orders'
export const ORDERS = {
  BASE: ORDERS_PATH,
  BY_ID: (id) => `${ORDERS_PATH}/${id}`,
  BY_STATUS: (status) => `${ORDERS_PATH}/status/${status}`,
  WAITER_ACTIVE: `${ORDERS_PATH}/waiter/active`,
  DELIVERY_ACTIVE: `${ORDERS_PATH}/delivery/active`,
  KITCHEN: `${ORDERS_PATH}/kitchen`,
  UPDATE_STATUS: (id) => `${ORDERS_PATH}/${id}/status`,
}

// Payments
const PAYMENTS_PATH = '/payments'
export const PAYMENTS = {
  BASE: PAYMENTS_PATH,
  BY_ID: (id) => `${PAYMENTS_PATH}/${id}`,
  RECEIPT: (id) => `${PAYMENTS_PATH}/${id}/receipt`,
  TABLE_ACCOUNT: (tableId) => `${PAYMENTS_PATH}/table/${tableId}/account`,
  ORDER_ACCOUNT: (orderId) => `${PAYMENTS_PATH}/order/${orderId}/account`,
}

// Product Categories
const PRODUCT_CATEGORIES_PATH = '/master-product-categories'
export const PRODUCT_CATEGORIES = {
  BASE: PRODUCT_CATEGORIES_PATH,
  BY_ID: (id) => `${PRODUCT_CATEGORIES_PATH}/${id}`,
}

// Master Products (Catalog)
const MASTER_PRODUCTS_PATH = '/master-products'
export const MASTER_PRODUCTS = {
  BASE: MASTER_PRODUCTS_PATH,
  BY_ID: (id) => `${MASTER_PRODUCTS_PATH}/${id}`,
}

// Products
const PRODUCTS_PATH = '/products'
export const PRODUCTS = {
  BASE: PRODUCTS_PATH,
  BY_ID: (id) => `${PRODUCTS_PATH}/${id}`,
  TOGGLE_AVAILABILITY: (id) => `${PRODUCTS_PATH}/${id}/toggle-availability`,
}

// Restaurants
const RESTAURANTS_PATH = '/restaurants'
export const RESTAURANTS = {
  BY_ID: (id) => `${RESTAURANTS_PATH}/${id}`,
  SETTINGS: (id) => `${RESTAURANTS_PATH}/${id}/settings`,
}

// Tables
const TABLES_PATH = '/tables'
export const TABLES = {
  BASE: TABLES_PATH,
  BY_ID: (id) => `${TABLES_PATH}/${id}`,
  BY_STATUS: (status) => `${TABLES_PATH}/status/${status}`,
  UPDATE_STATUS: (id) => `${TABLES_PATH}/${id}/status`,
}

// Users
const USERS_PATH = '/users'
export const USERS = {
  BASE: USERS_PATH,
  BY_ID: (id) => `${USERS_PATH}/${id}`,
  TOGGLE_STATUS: (id) => `${USERS_PATH}/${id}/toggle-status`,
  ME: `${USERS_PATH}/me`,
}
