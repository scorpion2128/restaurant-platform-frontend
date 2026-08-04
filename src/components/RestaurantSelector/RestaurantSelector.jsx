import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import './RestaurantSelector.css'

const RestaurantSelector = () => {
  const { user, availableRestaurants, switchRestaurant } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const dropdownRef = useRef(null)

  const currentRestaurant = availableRestaurants.find(
    r => r.restaurantId === user?.activeRestaurantId
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRestaurantSwitch = async (restaurantId) => {
    if (restaurantId === user?.activeRestaurantId) {
      setIsOpen(false)
      return
    }

    setSwitching(true)
    await switchRestaurant(restaurantId)
    // El reload de página ocurre en switchRestaurant
  }

  if (!availableRestaurants || availableRestaurants.length <= 1) {
    // No mostrar selector si solo hay un restaurant
    return null
  }

  return (
    <div className="restaurant-selector" ref={dropdownRef}>
      <button 
        className="restaurant-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
      >
        <div className="restaurant-selector-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="restaurant-selector-info">
          <span className="restaurant-selector-label">Sede Actual:</span>
          <span className="restaurant-selector-name">{currentRestaurant?.restaurantName || 'Seleccionar'}</span>
        </div>
        <svg 
          className={`restaurant-selector-arrow ${isOpen ? 'open' : ''}`}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="restaurant-selector-dropdown">
          {availableRestaurants.map((restaurant) => (
            <button
              key={restaurant.restaurantId}
              className={`restaurant-selector-item ${restaurant.restaurantId === user?.activeRestaurantId ? 'active' : ''}`}
              onClick={() => handleRestaurantSwitch(restaurant.restaurantId)}
              disabled={switching}
            >
              <div className="restaurant-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="restaurant-item-info">
                <span className="restaurant-item-name">{restaurant.restaurantName}</span>
                <span className="restaurant-item-role">
                  {restaurant.role === 'ADMIN' ? 'Administrador' : 
                   restaurant.role === 'WAITER' ? 'Mesero' : 
                   restaurant.role === 'KITCHEN' ? 'Cocina' : 'Cajero'}
                </span>
              </div>
              {restaurant.restaurantId === user?.activeRestaurantId && (
                <svg 
                  className="restaurant-item-check"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RestaurantSelector
