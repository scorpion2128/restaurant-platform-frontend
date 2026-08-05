import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole, getRoleLabel } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import userService from '../services/userService'
import './Users.css'

const Users = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Redirect if not ADMIN
  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [restaurants] = useState([
    { id: 1, name: 'Restaurante Central' },
    { id: 2, name: 'Sucursal Norte' },
    { id: 3, name: 'Sucursal Sur' }
  ])

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterEnabled, setFilterEnabled] = useState('all')
  const [currentPage, setCurrentPage] = useState(0) // Backend uses 0-indexed pages
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: USER_ROLES.WAITER,
    enabled: true,
    restaurantId: currentUser?.restaurantId || 1
  })

  // Load users from backend
  const loadUsers = async () => {
    try {
      setLoading(true)
      const role = filterRole !== 'all' ? filterRole : null
      const response = await userService.getUsers({
        page: currentPage,
        size: itemsPerPage,
        sort: 'id,asc',
        role
      })
      if (response.success && response.data) {
        setUsers(response.data.content)
        setTotalElements(response.data.totalElements)
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Load users on mount and when filters/pagination change
  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadUsers()
    }
  }, [currentPage, itemsPerPage, filterRole])

  // Helper function to get user's role in current restaurant
  const getUserRole = (user) => {
    if (!user.restaurantAccess || user.restaurantAccess.length === 0) {
      return 'USER' // Default role
    }
    // Get role for current restaurant or first restaurant
    const access = user.restaurantAccess.find(a => a.restaurantId === currentUser?.activeRestaurant?.restaurantId) 
                   || user.restaurantAccess[0]
    return access.role || 'USER'
  }

  // Helper function to get user's restaurant name
  const getUserRestaurantName = (user) => {
    if (!user.restaurantAccess || user.restaurantAccess.length === 0) {
      return 'Sin asignar'
    }
    // Get restaurant for current restaurant or first restaurant
    const access = user.restaurantAccess.find(a => a.restaurantId === currentUser?.activeRestaurant?.restaurantId)
                   || user.restaurantAccess[0]
    return access.restaurantName || 'Sin asignar'
  }

  // Filter users locally (for search and enabled status)
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEnabled = filterEnabled === 'all' || 
      (filterEnabled === 'active' && user.enabled) ||
      (filterEnabled === 'inactive' && !user.enabled)

    return matchesSearch && matchesEnabled
  })

  // Pagination calculations
  const totalPages = Math.ceil(totalElements / itemsPerPage)
  const startIndex = currentPage * itemsPerPage

  const handleCreateUser = () => {
    setModalMode('create')
    setFieldErrors({})
    setFormData({
      firstName: '',
      lastName: '',
      role: USER_ROLES.WAITER,
      enabled: true,
      restaurantId: currentUser?.restaurantId || 1
    })
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    setModalMode('edit')
    setSelectedUser(user)
    setFieldErrors({})
    const userRole = getUserRole(user)
    const restaurantId = user.restaurantAccess?.[0]?.restaurantId || currentUser?.restaurantId || 1
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      role: userRole,
      enabled: user.enabled,
      restaurantId: restaurantId
    })
    setShowModal(true)
  }

  const handleToggleStatus = async (userId) => {
    try {
      await userService.toggleUserStatus(userId)
      toast.success('Estado del usuario actualizado correctamente')
      loadUsers()
    } catch (error) {
      toast.error(error.message || 'Error al cambiar el estado del usuario')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    // Validación de campos
    const errors = {}
    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido'
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    try {
      setSubmitting(true)
      
      if (modalMode === 'create') {
        await userService.createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          restaurantId: formData.restaurantId
        })
        toast.success('Usuario creado correctamente')
      } else {
        await userService.updateUser(selectedUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          enabled: formData.enabled
        })
        toast.success('Usuario actualizado correctamente')
      }
      
      setShowModal(false)
      loadUsers()
    } catch (error) {
      toast.error(error.message || 'Error al guardar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const formatEnabled = (enabled) => {
    return enabled ? 'Activo' : 'Inactivo'
  }

  if (loading && users.length === 0) {
    return (
      <Layout>
        <div className="users-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando usuarios...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="users-page">
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        
        <div className="users-header">
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">Administra los usuarios del sistema</p>
          </div>
          <div className="users-header-actions">
            <button className="btn-secondary" onClick={loadUsers} disabled={loading} title="Refrescar lista">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spinning' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refrescar
            </button>
            <button className="btn-action" onClick={handleCreateUser}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="users-filters card">
          <div className="filter-group">
            <label htmlFor="search">Buscar por:</label>
            <input
              id="search"
              type="text"
              className="filter-input"
              placeholder="Nombre o usuario"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="role">Rol:</label>
            <select
              id="role"
              className="filter-select"
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value)
                setCurrentPage(0)
              }}
            >
              <option value="all">Todos</option>
              <option value={USER_ROLES.ADMIN}>{getRoleLabel(USER_ROLES.ADMIN)}</option>
              <option value={USER_ROLES.WAITER}>{getRoleLabel(USER_ROLES.WAITER)}</option>
              <option value={USER_ROLES.CASHIER}>{getRoleLabel(USER_ROLES.CASHIER)}</option>
              <option value={USER_ROLES.KITCHEN}>{getRoleLabel(USER_ROLES.KITCHEN)}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status">Estado:</label>
            <select
              id="status"
              className="filter-select"
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Paginación Superior */}
        <div className="table-controls">
          <div className="table-info">
            <span className="results-count">
              Mostrando {filteredUsers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalElements)} de {totalElements} usuarios
            </span>
          </div>
          <div className="pagination-controls">
            <div className="items-per-page">
              <label htmlFor="itemsPerPage">Registros por página:</label>
              <select
                id="itemsPerPage"
                className="items-per-page-select"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(0)
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                
                <span className="pagination-info">
                  Página {currentPage + 1} de {totalPages}
                </span>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="users-table-container card">
          {loading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Restaurante</th>
                  <th>Nombres</th>
                  <th>Rol</th>
                  <th>Usuario</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const userRole = getUserRole(user)
                  const restaurantName = getUserRestaurantName(user)
                  return (
                    <tr key={user.id}>
                      <td>{restaurantName}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>
                        <span className={`role-badge role-${userRole.toLowerCase()}`}>
                          {getRoleLabel(userRole)}
                        </span>
                      </td>
                      <td className="user-username">{user.username}</td>
                      <td>
                        <span className={`status-badge status-${user.enabled ? 'active' : 'inactive'}`}>
                          {formatEnabled(user.enabled)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEditUser(user)}
                          title="Editar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`btn-icon ${user.enabled ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleStatus(user.id)}
                          title={user.enabled ? 'Desactivar' : 'Activar'}
                        >
                          {user.enabled ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {filteredUsers.length === 0 && !loading && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p>No se encontraron usuarios</p>
            </div>
          )}
        </div>

        {/* Modal de Crear/Editar Usuario */}
        {showModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</h2>
                <button 
                  className="modal-close" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                {modalMode === 'create' && (
                  <div className="info-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>El usuario y contraseña se generarán automáticamente. La contraseña por defecto es <strong>123456</strong>.</span>
                  </div>
                )}

                {modalMode === 'edit' && (
                  <div className="form-group">
                    <label htmlFor="username">Usuario</label>
                    <input
                      id="username"
                      type="text"
                      className="input input-disabled"
                      value={selectedUser?.username || ''}
                      disabled
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">Nombres <span className="required">*</span></label>
                    <input
                      id="firstName"
                      type="text"
                      className={`input ${fieldErrors.firstName ? 'input-error' : ''}`}
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value })
                        if (fieldErrors.firstName) {
                          setFieldErrors(prev => ({ ...prev, firstName: '' }))
                        }
                      }}
                      disabled={submitting}
                    />
                    {fieldErrors.firstName && (
                      <div className="field-error-text">{fieldErrors.firstName}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Apellidos <span className="required">*</span></label>
                    <input
                      id="lastName"
                      type="text"
                      className={`input ${fieldErrors.lastName ? 'input-error' : ''}`}
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value })
                        if (fieldErrors.lastName) {
                          setFieldErrors(prev => ({ ...prev, lastName: '' }))
                        }
                      }}
                      disabled={submitting}
                    />
                    {fieldErrors.lastName && (
                      <div className="field-error-text">{fieldErrors.lastName}</div>
                    )}
                  </div>
                </div>

                {/* TODO: Implementar selección de restaurante cuando se requiera crear usuarios para otros restaurantes
                {modalMode === 'create' && (
                  <div className="form-group">
                    <label htmlFor="restaurant">Restaurante <span className="required">*</span></label>
                    <div className="select-wrapper">
                      <select
                        id="restaurant"
                        className="input select-input"
                        value={formData.restaurantId}
                        onChange={(e) => setFormData({ ...formData, restaurantId: parseInt(e.target.value) })}
                        disabled={submitting}
                      >
                        {restaurants.map(restaurant => (
                          <option key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                */}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Rol <span className="required">*</span></label>
                    <div className="select-wrapper">
                      <select
                        id="role"
                        className="input select-input"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        disabled={submitting}
                      >
                        <option value={USER_ROLES.ADMIN}>{getRoleLabel(USER_ROLES.ADMIN)}</option>
                        <option value={USER_ROLES.WAITER}>{getRoleLabel(USER_ROLES.WAITER)}</option>
                        <option value={USER_ROLES.CASHIER}>{getRoleLabel(USER_ROLES.CASHIER)}</option>
                        <option value={USER_ROLES.KITCHEN}>{getRoleLabel(USER_ROLES.KITCHEN)}</option>
                      </select>
                    </div>
                  </div>

                  {modalMode === 'edit' && (
                    <div className="form-group">
                      <label htmlFor="enabled">Estado <span className="required">*</span></label>
                      <div className="select-wrapper">
                        <select
                          id="enabled"
                          className="input select-input"
                          value={formData.enabled}
                          onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'true' })}
                          disabled={submitting}
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="required-legend">
                  <span className="required">*</span> Campos obligatorios
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Users
