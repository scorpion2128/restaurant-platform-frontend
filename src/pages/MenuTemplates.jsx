import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import menuTemplateService from '../services/menuTemplateService'
import menuSectionService from '../services/menuSectionService'
import productService from '../services/productService'
import '../pages/Users.css'

const MenuTemplates = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const [templates, setTemplates] = useState([])
  const [products, setProducts] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [showSectionsModal, setShowSectionsModal] = useState(false)
  const [showSectionFormModal, setShowSectionFormModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [sectionModalMode, setSectionModalMode] = useState('create')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [formData, setFormData] = useState({
    name: ''
  })

  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    displayOrder: 0,
    visible: true
  })

  const [itemsFormData, setItemsFormData] = useState({
    selectedProducts: [],
    priceOverrides: {},
    sectionId: null
  })

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await menuTemplateService.getTemplates({
        page: currentPage,
        size: itemsPerPage,
        sort: 'name,asc'
      })
      if (response.success && response.data) {
        setTemplates(response.data.content)
        setTotalElements(response.data.totalElements)
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async (templateId) => {
    try {
      const response = await menuSectionService.getSections(templateId)
      if (response.success && response.data) {
        setSections(response.data || [])
      } else {
        setSections(response || [])
      }
    } catch (error) {
      toast.error('Error al cargar secciones')
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
      loadTemplates()
      loadProducts()
    }
  }, [currentPage, itemsPerPage])

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalElements / itemsPerPage)
  const startIndex = currentPage * itemsPerPage

  const handleCreate = () => {
    setModalMode('create')
    setFieldErrors({})
    setFormData({ name: '' })
    setShowModal(true)
  }

  const handleEdit = (template) => {
    setModalMode('edit')
    setSelectedTemplate(template)
    setFieldErrors({})
    setFormData({ name: template.name })
    setShowModal(true)
  }

  const handleManageSections = async (template) => {
    setSelectedTemplate(template)
    await loadSections(template.id)
    setShowSectionsModal(true)
  }

  const handleCreateSection = () => {
    setSectionModalMode('create')
    setFieldErrors({})
    setSectionFormData({
      name: '',
      displayOrder: sections.length,
      visible: true
    })
    setShowSectionFormModal(true)
  }

  const handleEditSection = (section) => {
    setSectionModalMode('edit')
    setSelectedSection(section)
    setFieldErrors({})
    setSectionFormData({
      name: section.name,
      displayOrder: section.displayOrder,
      visible: section.visible
    })
    setShowSectionFormModal(true)
  }

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sección? Los productos sin sección permanecerán en la plantilla.')) {
      return
    }
    
    try {
      await menuSectionService.deleteSection(selectedTemplate.id, sectionId)
      toast.success('Sección eliminada correctamente')
      await loadSections(selectedTemplate.id)
      loadTemplates()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar sección')
    }
  }

  const handleManageItems = async (template) => {
    setSelectedTemplate(template)
    await loadSections(template.id)
    setItemsFormData({
      selectedProducts: [],
      priceOverrides: {},
      sectionId: null
    })
    setShowItemsModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plantilla?')) {
      return
    }
    
    try {
      await menuTemplateService.deleteTemplate(id)
      toast.success('Plantilla eliminada correctamente')
      loadTemplates()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar plantilla')
    }
  }

  const handleRemoveItem = async (templateId, itemId) => {
    try {
      await menuTemplateService.removeItem(templateId, itemId)
      toast.success('Producto eliminado de la plantilla')
      loadTemplates()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar producto')
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
        await menuTemplateService.createTemplate({
          name: formData.name
        })
        toast.success('Plantilla creada correctamente')
      } else {
        await menuTemplateService.updateTemplate(selectedTemplate.id, {
          name: formData.name
        })
        toast.success('Plantilla actualizada correctamente')
      }
      
      setShowModal(false)
      loadTemplates()
    } catch (error) {
      toast.error(error.message || 'Error al guardar la plantilla')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddItems = async (e) => {
    e.preventDefault()
    
    if (itemsFormData.selectedProducts.length === 0) {
      toast.error('Selecciona al menos un producto')
      return
    }

    try {
      setSubmitting(true)
      
      const items = itemsFormData.selectedProducts.map(productId => ({
        productId: productId,
        sectionId: itemsFormData.sectionId || null,
        priceOverride: itemsFormData.priceOverrides[productId] || null
      }))

      await menuTemplateService.addItems(selectedTemplate.id, items)
      toast.success('Productos agregados correctamente')
      setShowItemsModal(false)
      loadTemplates()
    } catch (error) {
      toast.error(error.message || 'Error al agregar productos')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitSection = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const errors = {}
    if (!sectionFormData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    try {
      setSubmitting(true)
      
      if (sectionModalMode === 'create') {
        await menuSectionService.createSection(selectedTemplate.id, {
          name: sectionFormData.name,
          displayOrder: sectionFormData.displayOrder,
          visible: sectionFormData.visible
        })
        toast.success('Sección creada correctamente')
      } else {
        await menuSectionService.updateSection(selectedTemplate.id, selectedSection.id, {
          name: sectionFormData.name,
          displayOrder: sectionFormData.displayOrder,
          visible: sectionFormData.visible
        })
        toast.success('Sección actualizada correctamente')
      }
      
      setShowSectionFormModal(false)
      await loadSections(selectedTemplate.id)
      loadTemplates()
    } catch (error) {
      toast.error(error.message || 'Error al guardar la sección')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductToggle = (productId) => {
    setItemsFormData(prev => {
      const current = prev.selectedProducts || []
      if (current.includes(productId)) {
        const newOverrides = { ...prev.priceOverrides }
        delete newOverrides[productId]
        return {
          selectedProducts: current.filter(id => id !== productId),
          priceOverrides: newOverrides,
          sectionId: prev.sectionId
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
    setItemsFormData(prev => ({
      ...prev,
      priceOverrides: {
        ...prev.priceOverrides,
        [productId]: value ? parseFloat(value) : null
      }
    }))
  }

  if (loading && templates.length === 0) {
    return (
      <Layout>
        <div className="users-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando plantillas...</p>
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
            <h1 className="page-title">Plantillas de Menú</h1>
            <p className="page-subtitle">Crea plantillas reutilizables para tus menús diarios</p>
          </div>
          <div className="users-header-actions">
            <button className="btn-refresh" onClick={loadTemplates} disabled={loading}>
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
              Nueva Plantilla
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
              placeholder="Nombre de plantilla"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-controls">
          <div className="table-info">
            <span className="results-count">
              Mostrando {filteredTemplates.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalElements)} de {totalElements} plantillas
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
              {filteredTemplates.map(template => (
                <div 
                  key={template.id} 
                  style={{ 
                    marginBottom: '24px', 
                    border: '2px solid #e8e8e8', 
                    borderRadius: '12px', 
                    padding: '20px',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2196F3'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(33,150,243,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8e8e8'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.3em', color: '#1a1a1a', fontWeight: '600' }}>{template.name}</h3>
                      <p style={{ margin: '6px 0 0 0', color: '#666', fontSize: '0.95em' }}>
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
                        {template.items?.length || 0} productos en total
                      </p>
                    </div>
                    <div className="actions-cell" style={{ gap: '8px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleManageSections(template)}
                        title="Gestionar Secciones"
                        style={{ 
                          backgroundColor: '#FF6B35',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF5722'
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,53,0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF6B35'
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,107,53,0.3)'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
                          <rect x="3" y="3" width="18" height="5" rx="1" />
                          <rect x="3" y="10" width="18" height="5" rx="1" />
                          <rect x="3" y="17" width="18" height="5" rx="1" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleManageItems(template)}
                        title="Gestionar Productos"
                        style={{ 
                          backgroundColor: '#00BCD4',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(0,188,212,0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#0097A7'
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,188,212,0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#00BCD4'
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,188,212,0.3)'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
                          <rect x="3" y="3" width="8" height="8" rx="1" />
                          <rect x="13" y="3" width="8" height="8" rx="1" />
                          <rect x="3" y="13" width="8" height="8" rx="1" />
                          <rect x="13" y="13" width="8" height="8" rx="1" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(template)}
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
                        onClick={() => handleDelete(template.id)}
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

                  {template.items && template.items.length > 0 && (
                    <div style={{ marginTop: '16px', backgroundColor: 'white', borderRadius: '8px', padding: '12px' }}>
                      {(() => {
                        // Agrupar items por sección
                        const itemsBySection = {}
                        const itemsWithoutSection = []
                        
                        template.items.forEach(item => {
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
                                <table className="users-table">
                                  <thead>
                                    <tr>
                                      <th>Producto</th>
                                      <th>Precio Base</th>
                                      <th>Precio Personalizado</th>
                                      <th>Precio Final</th>
                                      <th>Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {itemsWithoutSection.map(item => (
                                      <tr key={item.id}>
                                        <td>{item.productName}</td>
                                        <td>S/ {item.productPrice.toFixed(2)}</td>
                                        <td>{item.priceOverride ? `S/ ${item.priceOverride.toFixed(2)}` : '-'}</td>
                                        <td><strong>S/ {item.effectivePrice.toFixed(2)}</strong></td>
                                        <td className="actions-cell">
                                          <button
                                            className="btn-icon btn-deactivate"
                                            onClick={() => handleRemoveItem(template.id, item.id)}
                                            title="Eliminar"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <line x1="18" y1="6" x2="6" y2="18" />
                                              <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Productos por sección */}
                            {Object.values(itemsBySection).map((section, idx) => (
                              <div key={idx} style={{ 
                                marginBottom: '24px',
                                border: '2px solid #e3f2fd',
                                borderRadius: '8px',
                                padding: '16px',
                                backgroundColor: '#f5f9ff'
                              }}>
                                <h4 style={{ 
                                  margin: '0 0 12px 0', 
                                  color: '#1976d2', 
                                  fontSize: '1.05em',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  borderBottom: '2px solid #2196F3',
                                  paddingBottom: '8px'
                                }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                                    <path d="M4 7h16M4 12h16M4 17h10" />
                                  </svg>
                                  {section.name}
                                </h4>
                                <table className="users-table">
                                  <thead>
                                    <tr>
                                      <th>Producto</th>
                                      <th>Precio Base</th>
                                      <th>Precio Personalizado</th>
                                      <th>Precio Final</th>
                                      <th>Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.items.map(item => (
                                      <tr key={item.id}>
                                        <td>{item.productName}</td>
                                        <td>S/ {item.productPrice.toFixed(2)}</td>
                                        <td>{item.priceOverride ? `S/ ${item.priceOverride.toFixed(2)}` : '-'}</td>
                                        <td><strong>S/ {item.effectivePrice.toFixed(2)}</strong></td>
                                        <td className="actions-cell">
                                          <button
                                            className="btn-icon btn-deactivate"
                                            onClick={() => handleRemoveItem(template.id, item.id)}
                                            title="Eliminar"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <line x1="18" y1="6" x2="6" y2="18" />
                                              <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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

          {filteredTemplates.length === 0 && !loading && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No se encontraron plantillas</p>
            </div>
          )}
        </div>

        {/* Modal Crear/Editar Plantilla */}
        {showModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Crear Nueva Plantilla' : 'Editar Plantilla'}</h2>
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
                    placeholder="Ej: Menú Lunes, Menú Fin de Semana"
                  />
                  {fieldErrors.name && <div className="field-error-text">{fieldErrors.name}</div>}
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
                    {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Plantilla' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Agregar Productos */}
        {showItemsModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowItemsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h2>Agregar Productos a {selectedTemplate?.name}</h2>
                <button 
                  className="modal-close" 
                  onClick={() => setShowItemsModal(false)}
                  disabled={submitting}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form className="modal-form" onSubmit={handleAddItems}>
                <div className="form-group">
                  <label htmlFor="sectionSelect">Sección (opcional)</label>
                  <select
                    id="sectionSelect"
                    className="input"
                    value={itemsFormData.sectionId || ''}
                    onChange={(e) => setItemsFormData(prev => ({ ...prev, sectionId: e.target.value || null }))}
                    disabled={submitting}
                  >
                    <option value="">Sin sección</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="info-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Puedes personalizar el precio de cada producto (opcional)</span>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {products.map(product => (
                    <div key={product.id} style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      borderRadius: '6px', 
                      marginBottom: '8px',
                      backgroundColor: itemsFormData.selectedProducts.includes(product.id) ? '#f0f7ff' : 'white'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={itemsFormData.selectedProducts.includes(product.id)}
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
                          {itemsFormData.selectedProducts.includes(product.id) && (
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
                                value={itemsFormData.priceOverrides[product.id] || ''}
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

                <div className="modal-actions" style={{ marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowItemsModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Agregando...' : 'Agregar Productos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Gestionar Secciones */}
        {showSectionsModal && (
          <div className="modal-overlay" onClick={() => setShowSectionsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Secciones de {selectedTemplate?.name}</h2>
                <button 
                  className="modal-close" 
                  onClick={() => setShowSectionsModal(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-form">
                <button 
                  className="btn btn-primary" 
                  onClick={handleCreateSection}
                  style={{ marginBottom: '16px', width: '100%' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '8px' }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nueva Sección
                </button>

                {sections.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <p>No hay secciones creadas</p>
                    <p style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
                      Crea secciones para organizar tu menú
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {sections.map(section => (
                      <div key={section.id} style={{ 
                        padding: '12px', 
                        border: '1px solid #ddd', 
                        borderRadius: '6px', 
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {section.name}
                          </div>
                          <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                            Orden: {section.displayOrder} • {section.visible ? 'Visible' : 'Oculta'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEditSection(section)}
                            title="Editar"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="btn-icon btn-deactivate"
                            onClick={() => handleDeleteSection(section.id)}
                            title="Eliminar"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear/Editar Sección */}
        {showSectionFormModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowSectionFormModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{sectionModalMode === 'create' ? 'Crear Nueva Sección' : 'Editar Sección'}</h2>
                <button 
                  className="modal-close" 
                  onClick={() => setShowSectionFormModal(false)}
                  disabled={submitting}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form className="modal-form" onSubmit={handleSubmitSection}>
                <div className="form-group">
                  <label htmlFor="sectionName">Nombre <span className="required">*</span></label>
                  <input
                    id="sectionName"
                    type="text"
                    className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                    value={sectionFormData.name}
                    onChange={(e) => {
                      setSectionFormData({ ...sectionFormData, name: e.target.value })
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }))
                    }}
                    disabled={submitting}
                    placeholder="Ej: PLATOS A LA CARTA, BEBIDAS"
                  />
                  {fieldErrors.name && <div className="field-error-text">{fieldErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="displayOrder">Orden de Visualización <span className="required">*</span></label>
                  <input
                    id="displayOrder"
                    type="number"
                    min="0"
                    className="input"
                    value={sectionFormData.displayOrder}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, displayOrder: parseInt(e.target.value) })}
                    disabled={submitting}
                  />
                  <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '4px' }}>
                    Menor número aparece primero
                  </small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={sectionFormData.visible}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, visible: e.target.checked })}
                      disabled={submitting}
                      style={{ marginRight: '8px' }}
                    />
                    Sección visible
                  </label>
                </div>

                <div className="required-legend">
                  <span className="required">*</span> Campos obligatorios
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowSectionFormModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando...' : sectionModalMode === 'create' ? 'Crear Sección' : 'Guardar Cambios'}
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

export default MenuTemplates
