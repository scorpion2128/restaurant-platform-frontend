import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import productCategoryService from '../services/productCategoryService'
import '../pages/Users.css'

const ProductCategories = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [formData, setFormData] = useState({
    name: ''
  })

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await productCategoryService.getCategories({
        page: currentPage,
        size: itemsPerPage,
        sort: 'name,asc'
      })
      if (response.success && response.data) {
        setCategories(response.data.content)
        setTotalElements(response.data.totalElements)
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadCategories()
    }
  }, [currentPage, itemsPerPage])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalElements / itemsPerPage)
  const startIndex = currentPage * itemsPerPage

  const handleCreate = () => {
    setModalMode('create')
    setFieldErrors({})
    setFormData({ name: '' })
    setShowModal(true)
  }

  const handleEdit = (category) => {
    setModalMode('edit')
    setSelectedCategory(category)
    setFieldErrors({})
    setFormData({ name: category.name })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      return
    }
    
    try {
      await productCategoryService.deleteCategory(id)
      toast.success('Categoría eliminada correctamente')
      loadCategories()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar categoría')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const errors = {}
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    try {
      setSubmitting(true)
      
      if (modalMode === 'create') {
        await productCategoryService.createCategory({
          name: formData.name
        })
        toast.success('Categoría creada correctamente')
      } else {
        await productCategoryService.updateCategory(selectedCategory.id, {
          name: formData.name
        })
        toast.success('Categoría actualizada correctamente')
      }
      
      setShowModal(false)
      loadCategories()
    } catch (error) {
      toast.error(error.message || 'Error al guardar la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && categories.length === 0) {
    return (
      <Layout>
        <div className="users-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando categorías...</p>
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
            <h1 className="page-title">Categorías de Productos</h1>
            <p className="page-subtitle">Gestiona las categorías de tu menú</p>
          </div>
          <div className="users-header-actions">
            <button className="btn-refresh" onClick={loadCategories} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refrescar
            </button>
            <button className="btn-new-user" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva Categoría
            </button>
          </div>
        </div>

        <div className="users-filters card">
          <div className="filter-group">
            <label htmlFor="search">Buscar:</label>
            <input
              id="search"
              type="text"
              className="filter-input"
              placeholder="Nombre de categoría"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-controls">
          <div className="table-info">
            <span className="results-count">
              Mostrando {filteredCategories.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalElements)} de {totalElements} categorías
            </span>
          </div>
          <div className="pagination-controls">
            <div className="items-per-page">
              <label htmlFor="itemsPerPage">Registros por página:</label>
              <select
                id="itemsPerPage"
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

        <div className="users-table-container card">
          {loading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(category => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(category)}
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-deactivate"
                        onClick={() => handleDelete(category.id)}
                        title="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredCategories.length === 0 && !loading && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <p>No se encontraron categorías</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Crear Nueva Categoría' : 'Editar Categoría'}</h2>
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
                <div className="form-group">
                  <label htmlFor="name">Nombre <span className="required">*</span></label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (fieldErrors.name) {
                        setFieldErrors(prev => ({ ...prev, name: '' }))
                      }
                    }}
                    disabled={submitting}
                    placeholder="Ej: Menú, Carta, Bebidas, Adicionales"
                  />
                  {fieldErrors.name && (
                    <div className="field-error-text">{fieldErrors.name}</div>
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
                    {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
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

export default ProductCategories
