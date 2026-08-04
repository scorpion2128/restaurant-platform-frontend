import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import dailyMenuService from '../services/dailyMenuService'
import menuTemplateService from '../services/menuTemplateService'
import productService from '../services/productService'
import '../pages/Users.css'

const DailyMenus = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const [dailyMenus, setDailyMenus] = useState([])
  const [templates, setTemplates] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [formData, setFormData] = useState({
    menuDate: '',
    templateId: '',
    active: false,
    selectedProducts: [],
    priceOverrides: {},
    sectionIds: {}
  })

  const loadDailyMenus = async () => {
    try {
      setLoading(true)
      const response = await dailyMenuService.getDailyMenus({
        page: currentPage,
        size: itemsPerPage
      })
      if (response.success && response.data) {
        setDailyMenus(response.data.content)
        setTotalElements(response.data.totalElements)
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar menús diarios')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await menuTemplateService.getTemplates({ size: 100 })
      if (response.success && response.data) {
        setTemplates(response.data.content || [])
      }
    } catch (error) {
      toast.error('Error al cargar plantillas')
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({ size: 100, available: true })
      if (response.success && response.data) {
        setProducts(response.data.content || [])
      }
    } catch (error) {
      toast.error('Error al cargar productos')
    }
  }

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadDailyMenus()
      loadTemplates()
      loadProducts()
    }
  }, [currentPage, itemsPerPage])

  const totalPages = Math.ceil(totalElements / itemsPerPage)
  const startIndex = currentPage * itemsPerPage

  const handleCreate = () => {
    setModalMode('create')
    setFieldErrors({})
    setFormData({
      menuDate: new Date().toISOString().split('T')[0],
      templateId: '',
      active: false,
      selectedProducts: [],
      priceOverrides: {},
      sectionIds: {}
    })
    setShowModal(true)
  }

  const handleEdit = (menu) => {
    setModalMode('edit')
    setSelectedMenu(menu)
    setFieldErrors({})
    
    const selectedProductIds = menu.items?.map(item => item.productId) || []
    const overrides = {}
    const sections = {}
    menu.items?.forEach(item => {
      if (item.priceOverride) {
        overrides[item.productId] = item.priceOverride
      }
      if (item.sectionId) {
        sections[item.productId] = item.sectionId
      }
    })

    setFormData({
      menuDate: menu.menuDate,
      templateId: menu.templateId || '',
      active: menu.active,
      selectedProducts: selectedProductIds,
      priceOverrides: overrides,
      sectionIds: sections
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este menú diario?')) {
      return
    }
    
    try {
      await dailyMenuService.deleteDailyMenu(id)
      toast.success('Menú diario eliminado correctamente')
      loadDailyMenus()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar menú diario')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await dailyMenuService.toggleActive(id)
      toast.success('Estado del menú actualizado correctamente')
      loadDailyMenus()
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado')
    }
  }

  const handleLoadTemplate = async () => {
    if (!formData.templateId) {
      toast.error('Selecciona una plantilla')
      return
    }

    try {
      const response = await menuTemplateService.getTemplateById(formData.templateId)
      const template = response.success && response.data ? response.data : response
      
      // Remove duplicates - keep only unique product IDs
      const allProductIds = template.items?.map(item => item.productId) || []
      const selectedProductIds = Array.from(new Set(allProductIds))
      
      const overrides = {}
      const sections = {}
      template.items?.forEach(item => {
        // Only set if not already set (first occurrence wins)
        if (item.priceOverride && !overrides[item.productId]) {
          overrides[item.productId] = item.priceOverride
        }
        if (item.sectionId && !sections[item.productId]) {
          sections[item.productId] = item.sectionId
        }
      })

      setFormData(prev => ({
        ...prev,
        selectedProducts: selectedProductIds,
        priceOverrides: overrides,
        sectionIds: sections
      }))

      if (selectedProductIds.length < allProductIds.length) {
        toast.success(`Plantilla cargada (${allProductIds.length - selectedProductIds.length} duplicado(s) eliminado(s))`)
      } else {
        toast.success('Plantilla cargada correctamente')
      }
    } catch (error) {
      toast.error('Error al cargar plantilla')
    }
  }

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const current = prev.selectedProducts || []
      if (current.includes(productId)) {
        const newOverrides = { ...prev.priceOverrides }
        const newSections = { ...prev.sectionIds }
        delete newOverrides[productId]
        delete newSections[productId]
        return {
          ...prev,
          selectedProducts: current.filter(id => id !== productId),
          priceOverrides: newOverrides,
          sectionIds: newSections
        }
      } else {
        return {
          ...prev,
          selectedProducts: [...current, productId]
        }
      }
    })
  }

  const handlePriceOverride = (productId, value) => {
    setFormData(prev => ({
      ...prev,
      priceOverrides: {
        ...prev.priceOverrides,
        [productId]: value ? parseFloat(value) : null
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const errors = {}
    if (!formData.menuDate) {
      errors.menuDate = 'La fecha es requerida'
    }
    if (!formData.selectedProducts || formData.selectedProducts.length === 0) {
      errors.selectedProducts = 'Selecciona al menos un producto'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    try {
      setSubmitting(true)
      
      const items = formData.selectedProducts.map(productId => ({
        productId: productId,
        sectionId: formData.sectionIds[productId] || null,
        priceOverride: formData.priceOverrides[productId] || null
      }))

      console.log('🔍 DEBUG - Selected products:', formData.selectedProducts)
      console.log('🔍 DEBUG - Items to send:', items)
      console.log('🔍 DEBUG - Available products:', products.map(p => ({ id: p.id, name: p.name })))

      const payload = {
        items: items,
        active: formData.active
      }

      if (modalMode === 'create') {
        payload.menuDate = formData.menuDate
        payload.templateId = formData.templateId || null
        await dailyMenuService.createDailyMenu(payload)
        toast.success('Menú diario creado correctamente')
      } else {
        payload.templateId = formData.templateId || null
        await dailyMenuService.updateDailyMenu(selectedMenu.id, payload)
        toast.success('Menú diario actualizado correctamente')
      }
      
      setShowModal(false)
      loadDailyMenus()
    } catch (error) {
      toast.error(error.message || 'Error al guardar el menú diario')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && dailyMenus.length === 0) {
    return (
      <Layout>
        <div className="users-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando menús diarios...</p>
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
            <h1 className="page-title">Menús Diarios</h1>
            <p className="page-subtitle">Administra la carta del día</p>
          </div>
          <div className="users-header-actions">
            <button className="btn-refresh" onClick={loadDailyMenus} disabled={loading}>
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
              Nuevo Menú Diario
            </button>
          </div>
        </div>

        <div className="table-controls">
          <div className="table-info">
            <span className="results-count">
              Mostrando {dailyMenus.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalElements)} de {totalElements} menús
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
            <>
              {dailyMenus.map(menu => (
                <div 
                  key={menu.id} 
                  style={{ 
                    marginBottom: '24px', 
                    border: menu.active ? '3px solid #4CAF50' : '2px solid #e8e8e8', 
                    borderRadius: '12px', 
                    padding: '20px',
                    backgroundColor: menu.active ? '#f1f8f4' : '#fafafa',
                    boxShadow: menu.active ? '0 4px 12px rgba(76,175,80,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!menu.active) {
                      e.currentTarget.style.borderColor = '#2196F3'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(33,150,243,0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!menu.active) {
                      e.currentTarget.style.borderColor = '#e8e8e8'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.3em', 
                        color: '#1a1a1a', 
                        fontWeight: '600',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        textTransform: 'capitalize'
                      }}>
                        <svg 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          style={{ width: '24px', height: '24px', color: menu.active ? '#4CAF50' : '#666' }}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {new Date(menu.menuDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        {menu.active && (
                          <span style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.6em',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            boxShadow: '0 2px 4px rgba(76,175,80,0.3)'
                          }}>
                            ● ACTIVO
                          </span>
                        )}
                      </h3>
                      <p style={{ margin: '6px 0 0 32px', color: '#666', fontSize: '0.95em' }}>
                        <svg 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }}
                        >
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                        </svg>
                        {menu.items?.length || 0} productos en total
                        {menu.templateName && (
                          <>
                            <span style={{ margin: '0 6px', color: '#ccc' }}>•</span>
                            <svg 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2"
                              style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }}
                            >
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {menu.templateName}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="actions-cell" style={{ gap: '8px' }}>
                      <button
                        className={`btn-icon ${menu.active ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleToggleActive(menu.id)}
                        title={menu.active ? 'Desactivar' : 'Activar'}
                        style={{ 
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {menu.active ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(menu)}
                        title="Editar"
                        style={{ 
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-deactivate"
                        onClick={() => handleDelete(menu.id)}
                        title="Eliminar"
                        style={{ 
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {menu.items && menu.items.length > 0 && (
                    <div style={{ marginTop: '16px', backgroundColor: 'white', borderRadius: '8px', padding: '12px' }}>
                      {(() => {
                        // Agrupar items por sección
                        const itemsBySection = {}
                        const itemsWithoutSection = []
                        
                        menu.items.forEach(item => {
                          if (item.sectionId) {
                            if (!itemsBySection[item.sectionId]) {
                              itemsBySection[item.sectionId] = {
                                name: item.sectionName,
                                items: []
                              }
                            }
                            itemsBySection[item.sectionId].items.push(item)
                          } else {
                            itemsWithoutSection.push(item)
                          }
                        })

                        return (
                          <>
                            {/* Productos sin sección */}
                            {itemsWithoutSection.length > 0 && (
                              <div style={{ 
                                marginBottom: '24px',
                                border: '1px dashed #d0d0d0',
                                borderRadius: '6px',
                                padding: '12px',
                                backgroundColor: '#f9f9f9'
                              }}>
                                <h4 style={{ 
                                  margin: '0 0 12px 0', 
                                  color: '#999', 
                                  fontSize: '0.9em',
                                  fontWeight: '500',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                  </svg>
                                  Sin sección
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {itemsWithoutSection.map(item => (
                                    <div key={item.id} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '10px 12px',
                                      backgroundColor: 'white',
                                      borderRadius: '6px',
                                      border: '1px solid #e0e0e0'
                                    }}>
                                      <span style={{ fontWeight: '500', fontSize: '0.95em' }}>{item.productName}</span>
                                      {item.effectivePrice > 0 && (
                                        <span style={{ fontSize: '1.1em', fontWeight: '600', color: '#2e7d32' }}>S/ {item.effectivePrice.toFixed(2)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Productos por sección */}
                            {Object.values(itemsBySection).map((section, idx) => (
                              <div key={idx} style={{ 
                                marginBottom: '24px',
                                border: '2px solid #c8e6c9',
                                borderRadius: '8px',
                                padding: '16px',
                                backgroundColor: '#f1f8f4'
                              }}>
                                <h4 style={{ 
                                  margin: '0 0 12px 0', 
                                  color: '#2e7d32', 
                                  fontSize: '1.05em',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  borderBottom: '2px solid #4CAF50',
                                  paddingBottom: '8px'
                                }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                                    <path d="M4 7h16M4 12h16M4 17h10" />
                                  </svg>
                                  {section.name}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {section.items.map(item => {
                                    // No mostrar precio solo para ENTRADAS y SOPAS (incluidos en el menú)
                                    const sectionNameUpper = section.name.toUpperCase();
                                    const showPrice = !sectionNameUpper.includes('ENTRADA') && 
                                                     !sectionNameUpper.includes('SOPA') &&
                                                     item.effectivePrice > 0;
                                    
                                    return (
                                      <div key={item.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        backgroundColor: 'white',
                                        borderRadius: '6px',
                                        border: '1px solid #e0e0e0'
                                      }}>
                                        <span style={{ fontWeight: '500', fontSize: '0.95em' }}>{item.productName}</span>
                                        {showPrice && (
                                          <span style={{ fontSize: '1.1em', fontWeight: '600', color: '#2e7d32' }}>S/ {item.effectivePrice.toFixed(2)}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {dailyMenus.length === 0 && !loading && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No se encontraron menús diarios</p>
            </div>
          )}
        </div>

        {/* Modal Crear/Editar Menú Diario */}
        {showModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Crear Menú Diario' : 'Editar Menú Diario'}</h2>
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
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="menuDate">Fecha <span className="required">*</span></label>
                    <input
                      id="menuDate"
                      type="date"
                      className={`input ${fieldErrors.menuDate ? 'input-error' : ''}`}
                      value={formData.menuDate}
                      onChange={(e) => {
                        setFormData({ ...formData, menuDate: e.target.value })
                        if (fieldErrors.menuDate) setFieldErrors(prev => ({ ...prev, menuDate: '' }))
                      }}
                      disabled={submitting || modalMode === 'edit'}
                    />
                    {fieldErrors.menuDate && <div className="field-error-text">{fieldErrors.menuDate}</div>}
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
                      <option value="false">Inactivo</option>
                      <option value="true">Activo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="templateId">Plantilla (opcional)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      id="templateId"
                      className="input select-input"
                      value={formData.templateId}
                      onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                      disabled={submitting}
                      style={{ flex: 1 }}
                    >
                      <option value="">Sin plantilla</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleLoadTemplate}
                      disabled={!formData.templateId || submitting}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Cargar Plantilla
                    </button>
                  </div>
                </div>

                <div className="info-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Selecciona los productos y personaliza precios si es necesario</span>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '6px', padding: '8px' }}>
                  {products.map(product => (
                    <div key={product.id} style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      borderRadius: '6px', 
                      marginBottom: '8px',
                      backgroundColor: formData.selectedProducts.includes(product.id) ? '#f0f7ff' : 'white'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.selectedProducts.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          disabled={submitting}
                          style={{ marginRight: '12px', marginTop: '4px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px' }}>
                            Precio base: S/ {product.price.toFixed(2)}
                          </div>
                          {formData.selectedProducts.includes(product.id) && (
                            <div style={{ marginTop: '8px' }}>
                              <label style={{ fontSize: '0.9em', display: 'block', marginBottom: '4px' }}>
                                Precio personalizado (opcional):
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input"
                                placeholder={product.price.toFixed(2)}
                                value={formData.priceOverrides[product.id] || ''}
                                onChange={(e) => handlePriceOverride(product.id, e.target.value)}
                                disabled={submitting}
                                style={{ width: '150px' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {fieldErrors.selectedProducts && (
                  <div className="field-error-text">{fieldErrors.selectedProducts}</div>
                )}

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
                    {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Menú' : 'Guardar Cambios'}
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

export default DailyMenus
