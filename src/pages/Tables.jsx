import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, hasRole } from '../constants';
import Layout from '../components/Layout/Layout';
import { useToast, ToastContainer } from '../components/Toast/Toast';
import { tableService } from '../services/tableService';
import './Users.css';

const Tables = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Redirect if not ADMIN
  useEffect(() => {
    if (currentUser && !hasRole(currentUser, USER_ROLES.ADMIN)) {
      toast.error('No tienes permisos para acceder a esta página');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTable, setEditingTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    if (hasRole(currentUser, USER_ROLES.ADMIN)) {
      loadTables();
    }
  }, [currentUser]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAllTables();
      if (response.success) {
        setTables(response.data || []);
      }
    } catch (error) {
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  // Filter tables locally
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.number.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setModalMode('create');
    setEditingTable(null);
    setFieldErrors({});
    setFormData({
      number: '',
      capacity: '',
      status: 'AVAILABLE'
    });
    setShowModal(true);
  };

  const handleEdit = (table) => {
    setModalMode('edit');
    setEditingTable(table);
    setFieldErrors({});
    setFormData({
      number: table.number,
      capacity: table.capacity,
      status: table.status
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTable(null);
    setFieldErrors({});
    setFormData({
      number: '',
      capacity: '',
      status: 'AVAILABLE'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    // Validations
    const errors = {};
    if (!formData.number || formData.number < 1) {
      errors.number = 'El número de mesa debe ser mayor a 0';
    }
    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = 'La capacidad debe ser mayor a 0';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        number: parseInt(formData.number),
        capacity: parseInt(formData.capacity),
        status: formData.status
      };

      if (editingTable) {
        await tableService.updateTable(editingTable.id, data);
        toast.success('Mesa actualizada exitosamente');
      } else {
        await tableService.createTable(data);
        toast.success('Mesa creada exitosamente');
      }

      handleCloseModal();
      loadTables();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al guardar la mesa';
      toast.error(errorMessage);
      
      // Si hay errores de validación específicos del backend
      if (error.response?.data?.errors) {
        setFieldErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta mesa?')) {
      return;
    }

    try {
      await tableService.deleteTable(id);
      toast.success('Mesa eliminada exitosamente');
      loadTables();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la mesa');
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await tableService.updateTableStatus(id, newStatus);
      toast.success('Estado actualizado exitosamente');
      loadTables();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'AVAILABLE': { label: 'Disponible', class: 'status-available' },
      'OCCUPIED': { label: 'Ocupada', class: 'status-occupied' },
      'RESERVED': { label: 'Reservada', class: 'status-reserved' },
      'OUT_OF_SERVICE': { label: 'Fuera de servicio', class: 'status-out' }
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  return (
    <Layout>
      <div className="users-container">
        <div className="users-header">
          <div className="header-content">
            <h2>Gestión de Mesas</h2>
            <p className="page-description">
              Administra las mesas del restaurante
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Mesa
          </button>
        </div>

        <div className="users-filters card">
          <div className="filter-group">
            <label htmlFor="table-search">Buscar:</label>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="table-search"
                className="table-search-input"
                type="text"
                placeholder="Buscar por número de mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="table-status">Estado:</label>
            <select
              id="table-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="OCCUPIED">Ocupada</option>
              <option value="RESERVED">Reservada</option>
              <option value="OUT_OF_SERVICE">Fuera de servicio</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando mesas...</p>
          </div>
        ) : (
          <>
            {filteredTables.length > 0 ? (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Capacidad</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTables.map((table) => (
                      <tr key={table.id}>
                        <td>
                          <strong>Mesa {table.number}</strong>
                        </td>
                        <td>
                          <span className="capacity-info">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            {table.capacity} {table.capacity === 1 ? 'persona' : 'personas'}
                          </span>
                        </td>
                        <td>{getStatusBadge(table.status)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => handleEdit(table)}
                              title="Editar"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            {table.status !== 'OCCUPIED' && (
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(table.id)}
                                title="Eliminar"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="10" width="18" height="10" rx="2" />
                  <path d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
                </svg>
                <p>No hay mesas registradas</p>
                <p className="no-data-hint">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Intenta con otros filtros' 
                    : 'Comienza creando tu primera mesa'}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button className="btn-primary" onClick={handleCreate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Crear Primera Mesa
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalMode === 'create' ? 'Nueva Mesa' : 'Editar Mesa'}</h3>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="number">
                    Número de Mesa <span className="required">*</span>
                  </label>
                  <input
                    id="number"
                    type="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="Ej: 1"
                    min="1"
                    required
                    disabled={modalMode === 'edit'}
                    className={fieldErrors.number ? 'error' : ''}
                  />
                  {modalMode === 'edit' && (
                    <small className="form-hint">El número de mesa no se puede cambiar</small>
                  )}
                  {fieldErrors.number && (
                    <span className="error-message">{fieldErrors.number}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">
                    Capacidad <span className="required">*</span>
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="Ej: 4"
                    min="1"
                    max="20"
                    required
                    className={fieldErrors.capacity ? 'error' : ''}
                  />
                  <small className="form-hint">Número máximo de personas</small>
                  {fieldErrors.capacity && (
                    <span className="error-message">{fieldErrors.capacity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Estado <span className="required">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="OCCUPIED">Ocupada</option>
                    <option value="RESERVED">Reservada</option>
                    <option value="OUT_OF_SERVICE">Fuera de servicio</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-small"></span>
                        Guardando...
                      </>
                    ) : (
                      modalMode === 'create' ? 'Crear Mesa' : 'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </Layout>
  );
};

export default Tables;
