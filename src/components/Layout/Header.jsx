import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { formatFullName, formatRole } from '../../utils'
import RestaurantSelector from '../RestaurantSelector/RestaurantSelector'
import './Header.css'

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  /**
   * Close dropdown when clicking outside the component
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Trigger logout action from AuthContext
   */
  const handleLogout = () => {
    logout()
  }

  /**
   * Toggle user profile dropdown visibility
   */
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button" onClick={toggleSidebar} aria-label="Toggle menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        
        <div className="logo">
          <div className="logo-icon-small">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="logo-text">Restaurant Manager</span>
        </div>
      </div>

      <div className="header-right">
        <RestaurantSelector />
        
        <div className="user-profile-container" ref={dropdownRef}>
          <div className="user-profile" onClick={toggleDropdown}>
            <div className="user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">{formatFullName(user)}</span>
              <span className="user-role">{formatRole(user?.activeRestaurantRole)}</span>
            </div>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {showDropdown && (
            <div className="user-dropdown">
              <button className="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Mi Perfil</span>
              </button>
              <button className="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m6.36 6.36l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m6.36-6.36l4.24-4.24" />
                </svg>
                <span>Configuración</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
