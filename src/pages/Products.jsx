import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import { useConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog'
import productService from '../services/productService'
import productCategoryService from '../services/productCategoryService'
import '../pages/Users.css'

const Products = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirmDialog()

  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAvailable, setFilterAvailable] = useState('all')
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    categoryId: '',
    price: '',
    active: true,
    deliveryPackaging: false
  })

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getCategories({ size: 100 })
      if (response.success && response.data) {
        setCategories(response.data.content || [])
      }
    } catch (error) {
      toast.error('Error al cargar categorías')
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        size: itemsPerPage,
        sort: 'name,asc'
      }
      if (filterCategory !== 'all') {
        params.categoryId = filterCategory
      }
      if (filterAvailable !== 'all') {
        params.available = filterAvailable === 'available'
      }
      const response = await productService.getProducts(params)
      if (response.success && response.data) {
        setProducts(response.data.content)
        setTotalElements(response.data.totalElements)
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadCategories()
    }
  }, [])

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadProducts()
    }
  }, [currentPage, itemsPerPage, filterCategory, filterAvailable])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalElements / itemsPerPage)
  const startIndex = currentPage * itemsPerPage

  const handleCreate = () => {
    setModalMode('create')
    setFieldErrors({})
    setFormData({
      name: '',
      description: '',
      code: '',
      categoryId: '',
      price: '',
      active: true,
      deliveryPackaging: false
    })
    setShowModal(true)
  }

  const handleEdit = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setFieldErrors({})
    setFormData({
      name: product.name,
      description: product.description || '',
      code: product.code || '',
      categoryId: product.categoryId,
      price: product.price.toString(),
      active: product.active,
      deliveryPackaging: Boolean(product.deliveryPackaging)
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar'
    })
    if (!confirmed) {
      return
    }
    
    try {
      await productService.deleteProduct(id)
      toast.success('Producto eliminado correctamente')
      loadProducts()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar producto')
    }
  }

  const handleToggleAvailability = async (id) => {
    try {
      await productService.toggleAvailability(id)
      toast.success('Estado actualizado correctamente')
      loadProducts()
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }
    
    if (!formData.categoryId) {
      errors.categoryId = 'La categoría es requerida'
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      errors.price = 'El precio debe ser mayor o igual a 0'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    try {
      setSubmitting(true)
      
      const payload = {
        name: formData.name,
        description: formData.description,
        code: formData.code || null,
        categoryId: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        active: formData.active,
        deliveryPackaging: formData.deliveryPackaging
      }

      if (modalMode === 'create') {
        await productService.createProduct(payload)
        toast.success('Producto creado correctamente')
      } else {
        await productService.updateProduct(selectedProduct.id, payload)
        toast.success('Producto actualizado correctamente')
      }
      
      setShowModal(false)
      loadProducts()
    } catch (error) {
      toast.error(error.message || 'Error al guardar el producto')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && products.length === 0) {
    return (
      <Layout>
        <div className="users-page products-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando productos...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="users-page products-page">
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        
        <div className="users-header">
          <div>
            <h1 className="page-title">Gestión de Productos</h1>
            <p className="page-subtitle">Administra los productos y platillos de tu restaurante</p>
          </div>
          <div className="users-header-actions">
            <button className="btn-secondary" onClick={loadProducts} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refrescar
            </button>
            <button className="btn-action" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo Producto
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
              placeholder="Nombre del producto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="category">Categoría:</label>
            <select
              id="category"
              className="filter-select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setCurrentPage(0)
              }}
            >
              <option value="all">Todas</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="available">Estado:</label>
            <select
              id="available"
              className="filter-select"
              value={filterAvailable}
              onChange={(e) => setFilterAvailable(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="available">Activos</option>
              <option value="unavailable">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="table-controls">
          <div className="table-info">
            <span className="results-count">
              Mostrando {filteredProducts.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalElements)} de {totalElements} productos
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
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td>
                      <div>
                        {product.categoryName}
                      </div>
                    </td>
                    <td>S/ {product.price.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${product.active ? 'active' : 'inactive'}`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(product)}
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={`btn-icon ${product.active ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleToggleAvailability(product.id)}
                        title={product.active ? 'Desactivar' : 'Activar'}
                      >
                        {product.active ? (
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
                      <button
                        className="btn-icon btn-deactivate"
                        onClick={() => handleDelete(product.id)}
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

          {filteredProducts.length === 0 && !loading && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Crear Nuevo Producto' : 'Editar Producto'}</h2>
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
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }))
                    }}
                    disabled={submitting}
                    placeholder="Ej: Lomo Saltado"
                  />
                  {fieldErrors.name && <div className="field-error-text">{fieldErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="categoryId">Categoría <span className="required">*</span></label>
                  <select
                    id="categoryId"
                    className={`input select-input ${fieldErrors.categoryId ? 'input-error' : ''}`}
                    value={formData.categoryId}
                    onChange={(e) => {
                      setFormData({ ...formData, categoryId: e.target.value })
                      if (fieldErrors.categoryId) setFieldErrors(prev => ({ ...prev, categoryId: '' }))
                    }}
                    disabled={submitting}
                  >
                    <option value="">Selecciona una categoría...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {fieldErrors.categoryId && <div className="field-error-text">{fieldErrors.categoryId}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Precio (S/) <span className="required">*</span></label>
                    <input
                      id="price"
                      type="text"
                      className={`input ${fieldErrors.price ? 'input-error' : ''}`}
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        if (fieldErrors.price) setFieldErrors(prev => ({ ...prev, price: '' }))
                      }}
                      disabled={submitting}
                      placeholder="0.00"
                    />
                    {fieldErrors.price && <div className="field-error-text">{fieldErrors.price}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="active">Estado</label>
                    <select
                      id="active"
                      className="input select-input"
                      value={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                      disabled={submitting}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

                <label className="delivery-packaging-option">
                  <input
                    type="checkbox"
                    checked={formData.deliveryPackaging}
                    onChange={(e) => setFormData({ ...formData, deliveryPackaging: e.target.checked })}
                    disabled={submitting}
                  />
                  <span>
                    <strong>Aplicar empaque en delivery</strong>
                    <small>Agrega S/ 1.00 por cada unidad de este producto en pedidos a domicilio.</small>
                  </span>
                </label>

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
                    {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
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

export default Products
