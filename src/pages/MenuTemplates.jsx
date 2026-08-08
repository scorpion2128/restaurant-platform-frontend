import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import menuTemplateService from '../services/menuTemplateService'
import menuSectionService from '../services/menuSectionService'
import productService from '../services/productService'
import productCategoryService from '../services/productCategoryService'
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
  const [categories, setCategories] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [expandedTemplates, setExpandedTemplates] = useState(new Set())
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
    productsBySection: {}, // { sectionId: [productIds] }
    currentSectionId: null,
    selectedCategories: [], // Array de categoryIds seleccionadas
    hasExistingItems: false // Flag para saber si está editando
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
        const sectionsData = Array.isArray(response.data) ? response.data : []
        setSections(sectionsData)
        return sectionsData // Retornar las secciones para uso inmediato
      } else {
        setSections([])
        if (!response.success) {
          console.warn('Sections endpoint not implemented yet')
        }
        return []
      }
    } catch (error) {
      setSections([])
      console.error('Error loading sections:', error)
      return []
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({ size: 1000, available: true })
      if (response.success && response.data) {
        setProducts(response.data.content || [])
      }
    } catch (error) {
      toast.error('Error al cargar productos')
    }
  }

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getCategories({ size: 100 })
      if (response.success && response.data) {
        setCategories(response.data.content || [])
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadTemplates()
      loadProducts()
      loadCategories()
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
    const sectionsData = await loadSections(template.id)
    
    // Cargar productos actuales del template para pre-marcar checkboxes
    const productsBySection = {}
    const hasItems = template.items && template.items.length > 0
    
    if (hasItems) {
      template.items.forEach(item => {
        // Solo cargar items que tienen sección (eliminar "Sin sección")
        if (item.sectionId) {
          const sectionKey = String(item.sectionId)
          if (!productsBySection[sectionKey]) {
            productsBySection[sectionKey] = []
          }
          productsBySection[sectionKey].push(item.masterProductId)
        }
      })
    }
    
    // Seleccionar la primera sección si existe
    const firstSectionId = sectionsData.length > 0 ? sectionsData[0].id : null
    
    // Auto-seleccionar categorías de la primera sección si tiene productos
    let initialCategories = []
    if (firstSectionId) {
      const sectionKey = String(firstSectionId)
      const productsInSection = productsBySection[sectionKey] || []
      const categoryIds = new Set()
      
      productsInSection.forEach(productId => {
        const product = products.find(p => p.id === productId)
        if (product && product.categoryId) {
          categoryIds.add(product.categoryId)
        }
      })
      
      initialCategories = Array.from(categoryIds)
    }
    
    setItemsFormData({
      productsBySection,
      currentSectionId: firstSectionId,
      selectedCategories: initialCategories,
      hasExistingItems: hasItems
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
    
    // Contar total de productos seleccionados
    const totalProducts = Object.values(itemsFormData.productsBySection).reduce(
      (sum, products) => sum + products.length, 
      0
    )
    
    if (totalProducts === 0) {
      toast.error('Selecciona al menos un producto en alguna sección')
      return
    }

    try {
      setSubmitting(true)
      
      // Convertir productsBySection a la estructura que espera el backend
      const items = []
      let globalOrder = 0
      
      Object.entries(itemsFormData.productsBySection).forEach(([sectionId, productIds]) => {
        productIds.forEach(productId => {
          items.push({
            masterProductId: productId,
            sectionId: parseInt(sectionId), // Siempre será un número, ya no hay 'null'
            displayOrder: globalOrder++
          })
        })
      })

      await menuTemplateService.addItems(selectedTemplate.id, { items })
      toast.success(itemsFormData.hasExistingItems ? 'Cambios guardados correctamente' : 'Productos agregados correctamente')
      setShowItemsModal(false)
      setItemsFormData({
        productsBySection: {},
        currentSectionId: null,
        selectedCategories: [],
        hasExistingItems: false
      })
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
      if (!prev.currentSectionId) return prev // Requerir sección seleccionada
      
      const sectionKey = String(prev.currentSectionId)
      const currentProducts = prev.productsBySection[sectionKey] || []
      
      const newProductsBySection = { ...prev.productsBySection }
      
      if (currentProducts.includes(productId)) {
        // Remover producto
        newProductsBySection[sectionKey] = currentProducts.filter(id => id !== productId)
        // Si la sección queda vacía, eliminarla del objeto
        if (newProductsBySection[sectionKey].length === 0) {
          delete newProductsBySection[sectionKey]
        }
      } else {
        // Agregar producto
        newProductsBySection[sectionKey] = [...currentProducts, productId]
      }
      
      return {
        ...prev,
        productsBySection: newProductsBySection
      }
    })
  }

  const handleCategoryToggle = (categoryId) => {
    setItemsFormData(prev => {
      const isSelected = prev.selectedCategories.includes(categoryId)
      return {
        ...prev,
        selectedCategories: isSelected
          ? prev.selectedCategories.filter(id => id !== categoryId)
          : [...prev.selectedCategories, categoryId]
      }
    })
  }

  const handleSectionChange = (sectionId) => {
    setItemsFormData(prev => {
      const sectionKey = String(sectionId)
      const productsInSection = prev.productsBySection[sectionKey] || []
      
      // Auto-seleccionar categorías de los productos que ya están en esta sección
      const categoryIds = new Set()
      productsInSection.forEach(productId => {
        const product = products.find(p => p.id === productId)
        if (product && product.categoryId) {
          categoryIds.add(product.categoryId)
        }
      })
      
      return {
        ...prev,
        currentSectionId: sectionId,
        selectedCategories: Array.from(categoryIds)
      }
    })
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
            <button className="btn-secondary" onClick={loadTemplates} disabled={loading}>
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
              <label htmlFor="itemsPerPage" style={{ marginRight: '8px', fontWeight: '500', color: '#555' }}>Registros por página:</label>
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
                    padding: '12px',
                    backgroundColor: '#fafafa',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <button
                        onClick={() => {
                          setExpandedTemplates(prev => {
                            const newSet = new Set(prev)
                            if (newSet.has(template.id)) {
                              newSet.delete(template.id)
                            } else {
                              newSet.add(template.id)
                            }
                            return newSet
                          })
                        }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #2196F3',
                          backgroundColor: 'white',
                          color: '#2196F3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                        title={expandedTemplates.has(template.id) ? 'Ocultar detalle' : 'Mostrar detalle'}
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                          style={{ 
                            width: '18px', 
                            height: '18px',
                            transform: expandedTemplates.has(template.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2em', color: '#1a1a1a', fontWeight: '600' }}>{template.name}</h3>
                      </div>
                    </div>
                    <div className="actions-cell" style={{ gap: '8px' }}>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleManageItems(template)}
                        title="Gestionar Contenido"
                        style={{ 
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
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

                  {expandedTemplates.has(template.id) && template.items && template.items.length > 0 && (
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
                                  <tbody>
                                    {section.items.map(item => (
                                      <tr key={item.id}>
                                        <td>{item.productName}</td>
                                        <td>S/ {item.productPrice.toFixed(2)}</td>
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

        {/* Modal Gestionar Contenido (Secciones y Productos) */}
        {showItemsModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowItemsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
              <div className="modal-header">
                <h2>Gestionar contenido - {selectedTemplate?.name}</h2>
              </div>

              <div style={{ display: 'flex', gap: '16px', height: 'calc(90vh - 150px)' }}>
                {/* Panel izquierdo: Secciones */}
                <div style={{ 
                  width: '250px', 
                  borderRight: '2px solid #e8e8e8',
                  paddingRight: '16px',
                  overflowY: 'auto'
                }}>
                  <div style={{ padding: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1em' }}>Secciones</h3>
                    <button 
                      className="btn-icon btn-edit"
                      onClick={handleCreateSection}
                      title="Nueva Sección"
                      style={{ 
                        backgroundColor: '#4CAF50',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>

                  {/* Lista de secciones */}
                  {sections.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                      <p style={{ margin: '0', fontSize: '0.9em' }}>No hay secciones creadas</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85em' }}>Crea al menos una sección para agregar productos</p>
                    </div>
                  ) : (
                    sections.map(section => (
                    <div 
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: itemsFormData.currentSectionId === section.id ? '#e3f2fd' : 'white',
                        border: itemsFormData.currentSectionId === section.id ? '2px solid #2196F3' : '1px solid #ddd',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (itemsFormData.currentSectionId !== section.id) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (itemsFormData.currentSectionId !== section.id) {
                          e.currentTarget.style.backgroundColor = 'white'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.95em' }}>
                            {section.name}
                          </div>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <button
                            className="btn-icon btn-edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSection(section)
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSection(section.id)
                            }}
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
                    </div>
                  ))
                  )}
                </div>

                {/* Panel derecho: Productos */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <form className="modal-form" onSubmit={handleAddItems} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Filtro de categorías */}
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.95em' }}>
                        Categorías de productos
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {categories.map(category => (
                          <label 
                            key={category.id}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              padding: '6px 12px',
                              backgroundColor: itemsFormData.selectedCategories.includes(category.id) ? '#2196F3' : '#f5f5f5',
                              color: itemsFormData.selectedCategories.includes(category.id) ? 'white' : '#333',
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={itemsFormData.selectedCategories.includes(category.id)}
                              onChange={() => handleCategoryToggle(category.id)}
                              style={{ marginRight: '6px' }}
                            />
                            {category.name}
                          </label>
                        ))}
                      </div>
                      {itemsFormData.selectedCategories.length === 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#999', fontStyle: 'italic' }}>
                          Selecciona al menos una categoría para ver productos
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                      {!itemsFormData.currentSectionId ? (
                        <div style={{ 
                          padding: '60px 20px', 
                          textAlign: 'center', 
                          color: '#999',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '6px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }}>
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <p style={{ margin: '0', fontWeight: '600', fontSize: '1.1em', color: '#666' }}>Selecciona una sección</p>
                          <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
                            Elige una sección del panel izquierdo para comenzar a agregar productos
                          </p>
                        </div>
                      ) : (
                        <>
                          {itemsFormData.selectedCategories.length === 0 ? (
                            <div style={{ 
                              padding: '40px 20px', 
                              textAlign: 'center', 
                              color: '#999',
                              backgroundColor: '#f9f9f9',
                              borderRadius: '6px'
                            }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}>
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                              </svg>
                              <p style={{ margin: '0', fontWeight: '500' }}>Selecciona categorías arriba</p>
                              <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
                                Primero elige las categorías de productos que deseas ver
                              </p>
                            </div>
                          ) : products.filter(p => p.categoryId && itemsFormData.selectedCategories.includes(p.categoryId)).length === 0 ? (
                            <div style={{ 
                              padding: '40px 20px', 
                              textAlign: 'center', 
                              color: '#999',
                              backgroundColor: '#f9f9f9',
                              borderRadius: '6px'
                            }}>
                              <p style={{ margin: '0' }}>No hay productos disponibles en las categorías seleccionadas</p>
                            </div>
                          ) : (
                            products.filter(p => p.categoryId && itemsFormData.selectedCategories.includes(p.categoryId)).map(product => {
                              const sectionKey = String(itemsFormData.currentSectionId)
                              const isSelected = (itemsFormData.productsBySection[sectionKey] || []).includes(product.id)
                              
                              return (
                                <div key={product.id} style={{ 
                                  padding: '12px', 
                                  border: '1px solid #ddd', 
                                  borderRadius: '6px', 
                                  marginBottom: '8px',
                                  backgroundColor: isSelected ? '#f0f7ff' : 'white',
                                  borderColor: isSelected ? '#2196F3' : '#ddd'
                                }}>
                                  <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleProductToggle(product.id)}
                                      disabled={submitting}
                                      style={{ marginRight: '12px', marginTop: '4px' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                        {product.name}
                                      </div>
                                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                                        Precio: S/ {(product.basePrice || product.price || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              )
                            })
                          )}
                        </>
                      )}
                    </div>

                    <div className="modal-actions">
                      <button 
                        type="button" 
                        className="btn btn-cancel" 
                        onClick={() => setShowItemsModal(false)}
                        disabled={submitting}
                      >
                        Cerrar
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={submitting || Object.keys(itemsFormData.productsBySection).length === 0}
                      >
                        {submitting ? 'Guardando...' : (() => {
                          const totalProducts = Object.values(itemsFormData.productsBySection).reduce(
                            (sum, products) => sum + products.length, 
                            0
                          )
                          
                          // Si tiene items existentes, mostrar "Guardar cambios"
                          if (itemsFormData.hasExistingItems) {
                            return 'Guardar cambios'
                          }
                          
                          // Si no, mostrar contador de productos
                          return totalProducts > 0 
                            ? `Agregar ${totalProducts} Producto${totalProducts > 1 ? 's' : ''}` 
                            : 'Agregar Productos'
                        })()}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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
