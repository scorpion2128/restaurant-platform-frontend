import { createContext, useState, useContext, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const AuthContext = createContext(null)

const buildUserFromToken = (token) => {
  const decoded = jwtDecode(token)
  return {
    decoded,
    user: {
      userId: decoded.userId,
      username: decoded.username,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      organizationId: decoded.organizationId,
      organizationName: decoded.organizationName,
      activeRestaurantId: decoded.activeRestaurantId,
      activeRestaurantRole: decoded.activeRestaurantRole,
      restaurantAccess: decoded.restaurantAccess || []
    }
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availableRestaurants, setAvailableRestaurants] = useState([])

  useEffect(() => {
    document.title = user?.organizationName
      ? `${user.organizationName} - Sistema de Gestión`
      : 'Sistema de Gestión de Restaurantes'
  }, [user?.organizationName])

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const { decoded, user: tokenUser } = buildUserFromToken(token)
        // Verificar si el token no ha expirado
        if (decoded.exp * 1000 > Date.now()) {
          setUser(tokenUser)
          setAvailableRestaurants(decoded.restaurantAccess || [])
        } else {
          localStorage.removeItem('accessToken')
        }
      } catch (error) {
        console.error('Error al decodificar token:', error)
        localStorage.removeItem('accessToken')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Las credenciales son inválidas')
      }

      const result = await response.json()
      
      if (result.success && result.data && result.data.accessToken) {
        const data = result.data
        
        // Si no hay restaurant activo, significa que el usuario tiene múltiples restaurants
        // y debe seleccionar uno
        if (!data.activeRestaurant) {
          const { user: tokenUser } = buildUserFromToken(data.accessToken)
          return {
            success: true,
            requiresRestaurantSelection: true,
            availableRestaurants: data.availableRestaurants,
            tempToken: data.accessToken,
            organizationName: tokenUser.organizationName
          }
        }
        
        // Si ya tiene un restaurant activo, guardamos el token y el usuario
        const token = data.accessToken
        localStorage.setItem('accessToken', token)
        
        const { decoded, user: tokenUser } = buildUserFromToken(token)
        setUser(tokenUser)
        setAvailableRestaurants(decoded.restaurantAccess || [])
        
        return { success: true, user: tokenUser }
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: error.message }
    }
  }

  const selectRestaurant = async (restaurantId, tempToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/select-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ restaurantId }),
      })

      if (!response.ok) {
        throw new Error('Error al seleccionar restaurant')
      }

      const result = await response.json()
      
      if (result.success && result.data && result.data.accessToken) {
        const token = result.data.accessToken
        localStorage.setItem('accessToken', token)
        
        const { decoded, user: tokenUser } = buildUserFromToken(token)
        setUser(tokenUser)
        setAvailableRestaurants(decoded.restaurantAccess || [])
        
        return { success: true, user: tokenUser }
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error) {
      console.error('Error al seleccionar restaurant:', error)
      return { success: false, error: error.message }
    }
  }

  const switchRestaurant = async (restaurantId) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE_URL}/auth/switch-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ restaurantId }),
      })

      if (!response.ok) {
        throw new Error('Error al cambiar de restaurant')
      }

      const result = await response.json()
      
      if (result.success && result.data && result.data.accessToken) {
        const newToken = result.data.accessToken
        localStorage.setItem('accessToken', newToken)
        
        const { user: tokenUser } = buildUserFromToken(newToken)
        setUser(tokenUser)
        
        // Recargar la página para que todos los componentes se actualicen
        window.location.reload()
        
        return { success: true }
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error) {
      console.error('Error al cambiar restaurant:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
    setAvailableRestaurants([])
  }

  const value = {
    user,
    login,
    selectRestaurant,
    switchRestaurant,
    logout,
    loading,
    isAuthenticated: !!user,
    availableRestaurants
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
