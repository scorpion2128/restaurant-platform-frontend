import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLES } from '../../constants'
import './Sidebar.css'

/**
 * Sidebar navigation component
 * Displays role-based menu items with icons and links
 * Supports responsive behavior with open/close states
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the sidebar is open or closed
 * @param {Function} props.onClose - Callback to close the sidebar
 * @returns {JSX.Element} Sidebar with navigation menu
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  /**
   * Menu items configuration
   * Items are ordered with ADMIN routes first, followed by other roles
   * Each item defines title, icon, path, and allowed roles
   */
  const menuItems = [
    {
      title: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      path: '/dashboard',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Categorías',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      ),
      path: '/master-product-categories',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Productos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      path: '/products',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Plantillas Menú',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: '/master-menu-templates',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Menú Diario',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      path: '/daily-menus',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Monitor Pedidos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      ),
      path: '/orders/monitor',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Usuarios',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      path: '/users',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Mesas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="10" width="18" height="10" rx="2" />
          <path d="M3 10V6a2 2 0 012-2h14a2 2 0 012 2v4" />
        </svg>
      ),
      path: '/tables',
      roles: [USER_ROLES.ADMIN]
    },
    {
      title: 'Tomar Pedido',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      path: '/orders/take',
      roles: [USER_ROLES.WAITER]
    },
    {
      title: 'Cocina',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
      path: '/kitchen',
      roles: [USER_ROLES.KITCHEN]
    }
  ]

  /**
   * Filters menu items based on user's role
   * Only shows items where user's role is included in the item's allowed roles
   */
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.activeRestaurantRole)
  )

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {/* Overlay for mobile - closes sidebar when clicked */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  )
}

export default Sidebar
