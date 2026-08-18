import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole } from '../constants'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRestaurantSelection, setShowRestaurantSelection] = useState(false)
  const [availableRestaurants, setAvailableRestaurants] = useState([])
  const [tempToken, setTempToken] = useState(null)
  const [organizationName, setOrganizationName] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const navigate = useNavigate()
  const { login, selectRestaurant } = useAuth()

  const validateFields = () => {
    const errors = {}
    
    if (!username.trim()) {
      errors.username = 'El usuario es requerido'
    }
    
    if (!password.trim()) {
      errors.password = 'La contraseña es requerida'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    
    if (!validateFields()) {
      return
    }
    
    setLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      if (result.requiresRestaurantSelection) {
        // Mostrar selector de restaurant
        setAvailableRestaurants(result.availableRestaurants)
        setTempToken(result.tempToken)
        setOrganizationName(result.organizationName || '')
        setShowRestaurantSelection(true)
        setLoading(false)
      } else {
        navigate(getDefaultRouteForRole(result.user?.activeRestaurantRole), { replace: true })
      }
    } else {
      setError(result.error || 'Credenciales incorrectas. Por favor, intente nuevamente.')
      setLoading(false)
    }
  }

  const handleRestaurantSelection = async () => {
    if (!selectedRestaurant) {
      setError('Por favor, selecciona un restaurant')
      return
    }

    setLoading(true)
    const result = await selectRestaurant(selectedRestaurant, tempToken)
    
    if (result.success) {
      navigate(getDefaultRouteForRole(result.user?.activeRestaurantRole), { replace: true })
    } else {
      setError(result.error || 'Error al seleccionar restaurant')
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (showRestaurantSelection) {
    return (
      <div className="login-container">
        <div className="login-background">
          <div className="login-shape shape-1"></div>
          <div className="login-shape shape-2"></div>
          <div className="login-shape shape-3"></div>
        </div>
        
        <div className="login-card fade-in">
          <div className="login-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1>{organizationName || 'Seleccionar Sede'}</h1>
            <p>Elige el restaurant donde deseas trabajar</p>
          </div>

          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="restaurant-selection">
            {availableRestaurants.map((restaurant) => (
              <div
                key={restaurant.restaurantId}
                className={`restaurant-card ${selectedRestaurant === restaurant.restaurantId ? 'selected' : ''}`}
                onClick={() => setSelectedRestaurant(restaurant.restaurantId)}
              >
                <div className="restaurant-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="restaurant-info">
                  <h3>{restaurant.restaurantName}</h3>
                  <p className="restaurant-role">{restaurant.role === 'ADMIN' ? 'Administrador' : restaurant.role === 'WAITER' ? 'Mesero' : restaurant.role === 'KITCHEN' ? 'Cocina' : 'Cajero'}</p>
                </div>
                {selectedRestaurant === restaurant.restaurantId && (
                  <div className="selected-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            className="btn btn-primary login-button" 
            onClick={handleRestaurantSelection}
            disabled={loading || !selectedRestaurant}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Cargando...
              </>
            ) : (
              <>
                Continuar
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
        <div className="login-shape shape-3"></div>
      </div>
      
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1>Sabe Perú</h1>
          <p>Sistema de Gestión de Restaurantes</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <div className="input-wrapper">
              <div className="input-with-icon">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  className={`input ${fieldErrors.username ? 'input-error' : ''}`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (fieldErrors.username) {
                      setFieldErrors(prev => ({ ...prev, username: '' }))
                    }
                  }}
                  placeholder=" "
                  autoComplete="username"
                />
                <label className="floating-label" htmlFor="username">
                  Usuario
                </label>
              </div>
              {fieldErrors.username && (
                <div className="field-error fade-in">
                  {fieldErrors.username}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <div className="input-with-icon input-with-toggle">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  placeholder=" "
                  autoComplete="current-password"
                />
                <label className="floating-label" htmlFor="password">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="field-error fade-in">
                  {fieldErrors.password}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar sesión
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  )
}

export default Login
