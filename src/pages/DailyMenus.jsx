import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import { useToast, ToastContainer } from '../components/Toast/Toast'
import dailyMenuService from '../services/dailyMenuService'
import recurringMenuService from '../services/recurringMenuService'
import menuTemplateService from '../services/menuTemplateService'
import '../pages/Users.css'

const DAYS_OF_WEEK = [
  { value: 1, name: 'Lunes' },
  { value: 2, name: 'Martes' },
  { value: 3, name: 'Miércoles' },
  { value: 4, name: 'Jueves' },
  { value: 5, name: 'Viernes' },
  { value: 6, name: 'Sábado' },
  { value: 7, name: 'Domingo' }
]

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const DailyMenus = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Tab state
  const [activeTab, setActiveTab] = useState('recurring') // 'recurring' or 'overrides'

  // Recurring menus state
  const [recurringMenus, setRecurringMenus] = useState([])
  const [recurringLoading, setRecurringLoading] = useState(true)

  // Overrides state
  const [overrides, setOverrides] = useState([])
  const [overridesLoading, setOverridesLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Templates
  const [templates, setTemplates] = useState([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('recurring') // 'recurring' or 'override'
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null)
  const [selectedOverride, setSelectedOverride] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    templateId: '',
    menuDate: ''
  })

  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página')
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadTemplates()
      if (activeTab === 'recurring') {
        loadRecurringMenus()
      } else {
        loadOverrides()
      }
    }
  }, [activeTab, currentPage, itemsPerPage])

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

  const loadRecurringMenus = async () => {
    try {
      setRecurringLoading(true)
      const response = await recurringMenuService.getRecurringMenus()
      if (response.success && response.data) {
        setRecurringMenus(response.data || [])
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar menús recurrentes')
    } finally {
      setRecurringLoading(false)
    }
  }

  const loadOverrides = async () => {
    try {
      setOverridesLoading(true)
      const response = await dailyMenuService.getOverrides({
        page: currentPage,
        size: itemsPerPage
      })
      if (response.success && response.data) {
        setOverrides(response.data.content || [])
        setTotalElements(response.data.totalElements || 0)
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar fechas específicas')
    } finally {
      setOverridesLoading(false)
    }
  }

  const handleCreateRecurring = (dayOfWeek) => {
    setModalMode('recurring')
    setSelectedDayOfWeek(dayOfWeek)
    
    // Find existing configuration for this day
    const existing = recurringMenus.find(m => m.dayOfWeek === dayOfWeek)
    setFormData({
      templateId: existing?.templateId || '',
      menuDate: ''
    })
    setShowModal(true)
  }

  const handleCreateOverride = () => {
    setModalMode('override-create')
    setSelectedOverride(null)
    setFormData({
      templateId: '',
      menuDate: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleEditOverride = (override) => {
    setModalMode('override-edit')
    setSelectedOverride(override)
    setFormData({
      templateId: String(override.templateId),
      menuDate: override.menuDate
    })
    setShowModal(true)
  }

  const handleDeleteRecurring = async (dayOfWeek) => {
    const dayName = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.name
    if (!window.confirm(`¿Eliminar configuración para todos los ${dayName}?`)) {
      return
    }

    try {
      await recurringMenuService.deleteRecurringMenu(dayOfWeek)
      toast.success('Configuración eliminada correctamente')
      loadRecurringMenus()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar configuración')
    }
  }

  const handleDeleteOverride = async (id, menuDate) => {
    if (!window.confirm(`¿Eliminar menú específico del ${menuDate}?`)) {
      return
    }

    try {
      await dailyMenuService.deleteOverride(id)
      toast.success('Menú específico eliminado correctamente')
      loadOverrides()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar menú')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.templateId) {
      toast.error('Selecciona una plantilla')
      return
    }

    try {
      setSubmitting(true)

      if (modalMode === 'recurring') {
        await recurringMenuService.createOrUpdateRecurringMenu({
          dayOfWeek: selectedDayOfWeek,
          templateId: formData.templateId
        })
        toast.success('Configuración guardada correctamente')
        loadRecurringMenus()
      } else {
        if (!formData.menuDate) {
          toast.error('Selecciona una fecha')
          return
        }
        const overrideData = {
          menuDate: formData.menuDate,
          templateId: formData.templateId
        }
        if (modalMode === 'override-edit') {
          await dailyMenuService.updateOverride(selectedOverride.id, overrideData)
          toast.success('Fecha actualizada correctamente')
        } else {
          await dailyMenuService.createOverride(overrideData)
          toast.success('Fecha añadida correctamente')
        }
        loadOverrides()
      }

      setShowModal(false)
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(totalElements / itemsPerPage)

  if ((recurringLoading && activeTab === 'recurring') || (overridesLoading && activeTab === 'overrides')) {
    return (
      <Layout>
        <div className="users-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="users-page">
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

        {/* Header */}
        <div className="users-header">
          <div>
            <h1 className="page-title">Menús Diarios</h1>
            <p className="page-subtitle">Configura menús recurrentes por día de semana o crea menús para fechas específicas</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <button
            onClick={() => setActiveTab('recurring')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'recurring' ? '3px solid #2196F3' : '3px solid transparent',
              color: activeTab === 'recurring' ? '#2196F3' : '#666',
              fontWeight: activeTab === 'recurring' ? '600' : '400',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
          >
            Menús Recurrentes
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'overrides' ? '3px solid #2196F3' : '3px solid transparent',
              color: activeTab === 'overrides' ? '#2196F3' : '#666',
              fontWeight: activeTab === 'overrides' ? '600' : '400',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
          >
            Fechas Específicas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'recurring' ? (
          <div className="card" style={{ padding: '0' }}>
            <div className="users-table-container">
              <table className="users-table" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '50%' }} />
                  <col style={{ width: '30%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Plantilla Configurada</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map(day => {
                    const config = recurringMenus.find(m => m.dayOfWeek === day.value)
                    return (
                      <tr key={day.value}>
                        <td style={{ fontWeight: '600' }}>{day.name}</td>
                        <td>
                          {config ? (
                            <span style={{
                              padding: '4px 12px',
                              background: '#fff3e0',
                              borderRadius: '6px',
                              fontSize: '0.9em',
                              fontWeight: '500',
                              color: '#e65100'
                            }}>
                              {config.templateName}
                            </span>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>Sin configurar</span>
                          )}
                        </td>
                        <td className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleCreateRecurring(day.value)}
                            className={config ? 'btn-icon btn-edit' : 'btn-icon'}
                            title={config ? 'Editar' : 'Configurar'}
                            style={config ? undefined : {
                              padding: '6px 12px',
                              background: '#d1ecf1',
                              fontSize: '0.9em',
                              fontWeight: '500'
                            }}
                          >
                            {config ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            ) : '➕ Configurar'}
                          </button>
                          {config && (
                            <button
                              onClick={() => handleDeleteRecurring(day.value)}
                              className="btn-icon btn-deactivate"
                              title="Eliminar"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {/* Overrides Table */}
            <div className="card" style={{ padding: '0' }}>
              <div className="users-table-container">
                    <table className="users-table" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '37%' }} />
                        <col style={{ width: '25%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Día</th>
                          <th>Plantilla</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overrides.map(override => {
                          const date = parseLocalDate(override.menuDate)
                          const dayName = DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1]?.name
                          
                          return (
                            <tr key={override.id}>
                              <td style={{ fontWeight: '600' }}>{formatDate(override.menuDate)}</td>
                              <td>{dayName}</td>
                              <td>
                                <span style={{ 
                                  padding: '4px 12px',
                                  background: '#fff3e0',
                                  borderRadius: '6px',
                                  fontSize: '0.9em',
                                  fontWeight: '500',
                                  color: '#e65100'
                                }}>
                                  {override.templateName}
                                </span>
                              </td>
                              <td className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleEditOverride(override)}
                                  className="btn-icon btn-edit"
                                  title="Editar"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteOverride(override.id, override.menuDate)}
                                  className="btn-icon btn-deactivate"
                                  title="Eliminar"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {overrides.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                              No hay fechas específicas configuradas
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan="3"></td>
                          <td className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={handleCreateOverride}
                              className="btn-icon"
                              style={{
                                padding: '6px 12px',
                                background: '#d1ecf1',
                                fontSize: '0.9em',
                                fontWeight: '500',
                                gap: '6px'
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Añadir fecha
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="table-controls" style={{ padding: '1rem', borderTop: '1px solid #e0e0e0' }}>
                      <div className="items-per-page">
                        <label htmlFor="itemsPerPage" style={{ marginRight: '8px', fontWeight: '500', color: '#555' }}>
                          Registros por página:
                        </label>
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

                      <div className="pagination-controls">
                        <div className="pagination">
                          <button
                            className="pagination-btn"
                            onClick={() => setCurrentPage(0)}
                            disabled={currentPage === 0}
                          >
                            ⏮️ Primera
                          </button>
                          <button
                            className="pagination-btn"
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                          >
                            ⬅️ Anterior
                          </button>
                          <span className="pagination-info">
                            Página {currentPage + 1} de {totalPages}
                          </span>
                          <button
                            className="pagination-btn"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage >= totalPages - 1}
                          >
                            Siguiente ➡️
                          </button>
                          <button
                            className="pagination-btn"
                            onClick={() => setCurrentPage(totalPages - 1)}
                            disabled={currentPage >= totalPages - 1}
                          >
                            Última ⏭️
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {modalMode === 'recurring' 
                    ? `Configurar ${DAYS_OF_WEEK.find(d => d.value === selectedDayOfWeek)?.name}` 
                    : modalMode === 'override-edit' ? 'Editar fecha' : 'Añadir fecha'}
                </h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                {modalMode.startsWith('override') && (
                  <div className="form-group">
                    <label className="label">
                      Fecha <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={formData.menuDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, menuDate: e.target.value }))}
                      required
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="label">
                    Plantilla <span className="required">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.templateId}
                    onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                    required
                    disabled={submitting}
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.itemCount} productos)
                      </option>
                    ))}
                  </select>
                </div>

                {modalMode === 'recurring' && (
                  <div style={{ 
                    padding: '12px', 
                    background: '#e3f2fd', 
                    borderRadius: '8px',
                    fontSize: '0.9em',
                    color: '#1976d2',
                    marginTop: '12px'
                  }}>
                    ℹ️ Esta plantilla se aplicará automáticamente todos los {DAYS_OF_WEEK.find(d => d.value === selectedDayOfWeek)?.name}s
                  </div>
                )}

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
                    {submitting ? 'Guardando...' : 'Guardar'}
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
