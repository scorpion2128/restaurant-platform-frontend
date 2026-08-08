import { useState, useEffect, useRef } from 'react';
import { tableService } from '../../services/tableService';
import { orderService } from '../../services/orderService';
import Toast from '../Toast/Toast';
import './TableSelector.css';

const TableSelector = ({ onTableSelected }) => {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevReadyOrdersRef = useRef([]);

  useEffect(() => {
    loadTables();
    loadActiveOrders();
    
    // Polling cada 30 segundos para detectar cambios
    const interval = setInterval(() => {
      loadActiveOrders(true); // true = silencioso (sin spinner)
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAllTables();
      
      if (response.success) {
        setTables(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      showToast('Error al cargar las mesas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await orderService.getActiveOrdersByWaiter();
      
      if (response.success) {
        const orders = response.data || [];
        setActiveOrders(orders);
        
        // Detectar nuevas órdenes listas
        if (prevReadyOrdersRef.current.length > 0) {
          checkForNewReadyOrders(orders);
        }
        
        // Actualizar referencia de órdenes listas
        prevReadyOrdersRef.current = orders.filter(o => o.status === 'READY').map(o => o.id);
      }
    } catch (error) {
      console.error('Error al cargar órdenes activas:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const checkForNewReadyOrders = (currentOrders) => {
    const currentReadyIds = currentOrders.filter(o => o.status === 'READY').map(o => o.id);
    const newReadyOrders = currentReadyIds.filter(id => !prevReadyOrdersRef.current.includes(id));
    
    if (newReadyOrders.length > 0) {
      const count = newReadyOrders.length;
      showToast(
        `✅ ¡${count} pedido${count > 1 ? 's' : ''} listo${count > 1 ? 's' : ''} para entregar!`,
        'success'
      );
      
      // Reproducir sonido de notificación
      if (soundEnabled) {
        playNotificationSound();
      }
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURE');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignorar si el navegador bloquea
    } catch (error) {
      // Ignorar errores de audio
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Obtener órdenes de una mesa específica
  const getTableOrders = (tableId) => {
    return activeOrders.filter(order => order.tableId === tableId);
  };

  // Contar órdenes listas de una mesa
  const getReadyOrdersCount = (tableId) => {
    return getTableOrders(tableId).filter(order => order.status === 'READY').length;
  };

  // Calcular el total acumulado de todas las órdenes de una mesa
  const getTableTotal = (tableId) => {
    return getTableOrders(tableId).reduce((sum, order) => sum + (order.total || 0), 0);
  };

  // Calcular tiempo desde la orden más antigua de la mesa (solo estados activos que requieren acción)
  const getOldestOrderTime = (tableId) => {
    // Filtrar solo órdenes que requieren acción (excluir DELIVERED)
    const activeOrders = getTableOrders(tableId).filter(order => 
      order.status === 'PENDING' || order.status === 'IN_PREPARATION' || order.status === 'READY'
    );
    
    if (activeOrders.length === 0) return null;
    
    const now = new Date();
    const oldestOrder = activeOrders.reduce((oldest, order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate < new Date(oldest.createdAt) ? order : oldest;
    }, activeOrders[0]);
    
    const diffMs = now - new Date(oldestOrder.createdAt);
    return Math.floor(diffMs / 60000); // Convertir a minutos
  };

  // Calcular tiempo desde la orden entregada más antigua de la mesa
  const getOldestDeliveredOrderTime = (tableId) => {
    const deliveredOrders = getTableOrders(tableId).filter(order => 
      order.status === 'DELIVERED'
    );
    
    if (deliveredOrders.length === 0) return null;
    
    const now = new Date();
    const oldestOrder = deliveredOrders.reduce((oldest, order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate < new Date(oldest.createdAt) ? order : oldest;
    }, deliveredOrders[0]);
    
    const diffMs = now - new Date(oldestOrder.createdAt);
    return Math.floor(diffMs / 60000); // Convertir a minutos
  };

  // Formatear tiempo de forma compacta (para badge de mesa)
  const formatTimeCompact = (minutes) => {
    if (minutes === null || minutes === undefined) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Obtener clase de color según tiempo transcurrido
  const getTimeAlertClass = (minutes) => {
    if (minutes === null || minutes === undefined) return '';
    if (minutes >= 20) return 'time-critical'; // Rojo
    if (minutes >= 10) return 'time-warning'; // Amarillo
    return 'time-normal'; // Verde
  };

  // Verificar si hay órdenes que requieren mostrar tiempo
  const hasOrdersRequiringTime = (tableId) => {
    return getTableOrders(tableId).some(order => 
      order.status === 'PENDING' || order.status === 'IN_PREPARATION' || order.status === 'READY'
    );
  };

  // Obtener estado de la orden más antigua de la mesa
  const getOldestOrderStatus = (tableId) => {
    const activeOrders = getTableOrders(tableId).filter(order => 
      order.status === 'PENDING' || order.status === 'IN_PREPARATION' || order.status === 'READY'
    );
    
    if (activeOrders.length === 0) return null;
    
    const oldestOrder = activeOrders.reduce((oldest, order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate < new Date(oldest.createdAt) ? order : oldest;
    }, activeOrders[0]);
    
    return oldestOrder.status;
  };

  // Convertir estado a etiqueta en español (versión corta para badge)
  const getStatusLabelShort = (status) => {
    const labels = {
      'PENDING': 'Pendiente',
      'IN_PREPARATION': 'En Cocina',
      'READY': 'Listo'
    };
    return labels[status] || status;
  };

  // Verificar si una mesa tiene órdenes en estado READY
  const hasReadyOrders = (tableId) => {
    return getTableOrders(tableId).some(order => order.status === 'READY');
  };

  // Verificar si una mesa tiene órdenes en preparación
  const hasInPreparationOrders = (tableId) => {
    return getTableOrders(tableId).some(order => order.status === 'IN_PREPARATION');
  };

  // Verificar si una mesa tiene órdenes pendientes
  const hasPendingOrders = (tableId) => {
    return getTableOrders(tableId).some(order => order.status === 'PENDING');
  };

  // Verificar si una mesa solo tiene órdenes entregadas
  const hasOnlyDeliveredOrders = (tableId) => {
    const orders = getTableOrders(tableId);
    return orders.length > 0 && orders.every(order => order.status === 'DELIVERED');
  };

  // Obtener clase CSS para indicador de orden
  const getOrderIndicatorClass = (tableId) => {
    if (hasReadyOrders(tableId)) return 'order-indicator-ready';
    if (hasInPreparationOrders(tableId)) return 'order-indicator-preparation';
    if (hasPendingOrders(tableId)) return 'order-indicator-pending';
    if (hasOnlyDeliveredOrders(tableId)) return 'order-indicator-delivered';
    return 'order-indicator-pending';
  };

  // Contadores por estado
  const orderCounts = {
    pending: activeOrders.filter(o => o.status === 'PENDING').length,
    inPreparation: activeOrders.filter(o => o.status === 'IN_PREPARATION').length,
    ready: activeOrders.filter(o => o.status === 'READY').length,
    delivered: activeOrders.filter(o => o.status === 'DELIVERED').length,
    total: activeOrders.length
  };

  // Filtrar órdenes según el filtro seleccionado
  const getFilteredOrders = () => {
    switch (orderFilter) {
      case 'pending':
        return activeOrders.filter(o => o.status === 'PENDING');
      case 'preparation':
        return activeOrders.filter(o => o.status === 'IN_PREPARATION');
      case 'ready':
        return activeOrders.filter(o => o.status === 'READY');
      case 'delivered':
        return activeOrders.filter(o => o.status === 'DELIVERED');
      default:
        return activeOrders;
    }
  };

  // Traducir estado de orden
  const translateOrderStatus = (status) => {
    const translations = {
      'PENDING': 'Pendiente',
      'IN_PREPARATION': 'En Preparación',
      'READY': 'Listo',
      'DELIVERED': 'Entregado',
      'PAID': 'Pagado',
      'CANCELLED': 'Cancelado'
    };
    return translations[status] || status;
  };

  // Obtener tiempo transcurrido (para panel de órdenes - con "hace")
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return remainingMins > 0 ? `hace ${diffHours}h ${remainingMins}m` : `hace ${diffHours}h`;
  };

  // Navegar a una mesa específica desde la lista de órdenes
  const navigateToTable = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      onTableSelected(table);
    }
  };

  // Marcar pedido como entregado
  const handleMarkAsDelivered = async (orderId, event) => {
    event.stopPropagation(); // Evitar que se active el onClick de la tarjeta
    
    try {
      const response = await orderService.updateOrderStatus(orderId, 'DELIVERED');
      
      if (response.success) {
        showToast('✅ Pedido marcado como entregado', 'success');
        // Recargar órdenes activas
        await loadActiveOrders(true);
      } else {
        showToast('Error al actualizar el estado del pedido', 'error');
      }
    } catch (error) {
      console.error('Error al marcar como entregado:', error);
      showToast('Error al actualizar el estado del pedido', 'error');
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'AVAILABLE' || table.status === 'OCCUPIED') {
      // Permitir acceso a mesas disponibles y ocupadas
      onTableSelected(table);
    } else if (table.status === 'RESERVED') {
      showToast('Esta mesa está reservada', 'warning');
    } else if (table.status === 'OUT_OF_SERVICE') {
      showToast('Esta mesa está fuera de servicio', 'warning');
    }
  };

  const getTableStatusClass = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'table-available';
      case 'OCCUPIED':
        return 'table-occupied';
      case 'RESERVED':
        return 'table-reserved';
      case 'OUT_OF_SERVICE':
        return 'table-out-of-service';
      default:
        return '';
    }
  };

  const getTableStatusText = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Libre';
      case 'OCCUPIED':
        return 'Ocupada';
      case 'RESERVED':
        return 'Reservada';
      case 'OUT_OF_SERVICE':
        return 'No Disponible';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="table-selector-loading">
        <div className="spinner"></div>
        <p>Cargando mesas...</p>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="table-selector-empty">
        <p>No hay mesas configuradas en el sistema.</p>
        <p>Contacte al administrador para configurar las mesas.</p>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="table-selector">
      <div className="table-selector-header"></div>
      <div className="tables-grid">
        {tables.map((table) => {
          const tableOrders = getTableOrders(table.id);
          const hasOrders = tableOrders.length > 0;
          
          return (
            <div
              key={table.id}
              className={`table-card ${
                (table.status === 'AVAILABLE' || table.status === 'OCCUPIED') ? 'clickable' : 'not-clickable'
              }`}
              onClick={() => handleTableClick(table)}
            >
              {/* Círculo principal de la mesa */}
              <div className={`table-circle ${getTableStatusClass(table.status)}`}>
                <div className="table-number">{table.number}</div>
                
                {/* Indicador de órdenes en la esquina superior derecha */}
                {hasOrders && table.status === 'OCCUPIED' && (
                  <div className={`order-indicator ${getOrderIndicatorClass(table.id)}`}>
                  </div>
                )}
              </div>
              
              {/* Badge de estado debajo del círculo */}
              <div className={`table-status-badge ${getTableStatusClass(table.status)}`}>
                {getTableStatusText(table.status)}
              </div>
              
              {/* Información de órdenes */}
              {hasOrders && table.status === 'OCCUPIED' && (
                <div className="orders-info">
                  <div className="orders-summary">
                    {tableOrders.length} orden{tableOrders.length > 1 ? 'es' : ''} • S/{getTableTotal(table.id).toFixed(2)}
                  </div>
                  <div className="orders-status">
                    {hasOrdersRequiringTime(table.id) ? (
                      <>
                        {getReadyOrdersCount(table.id) > 0 && (
                          <span className="ready-count">{getReadyOrdersCount(table.id)} listo</span>
                        )}
                        {getReadyOrdersCount(table.id) > 0 && getOldestOrderTime(table.id) !== null && ' • '}
                        {getOldestOrderTime(table.id) !== null && (
                          <span className={`time-elapsed ${getTimeAlertClass(getOldestOrderTime(table.id))}`}>
                            {formatTimeCompact(getOldestOrderTime(table.id))}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="status-delivered">🥘 Entregado</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel de Órdenes Activas - Rediseñado Grande */}
      {orderCounts.total > 0 && (
        <div className="orders-section-large">
          <div className="orders-section-header">
            <div className="header-title">
              <h3>📋 Seguimiento de pedidos</h3>
            </div>
            
            <div className="header-controls">
              <div className="filter-group">
                <button 
                  className={`filter-btn ${orderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('all')}
                >
                  Todas
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'ready' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('ready')}
                >
                  Listas
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'preparation' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('preparation')}
                >
                  En Cocina
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('pending')}
                >
                  Pendientes
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'delivered' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('delivered')}
                >
                  Entregados
                </button>
              </div>
              
              <button 
                className="sound-toggle-btn"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
              >
                {soundEnabled ? '🔔' : '🔕'}
              </button>
            </div>
          </div>
          
          <div className="orders-grid-large">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const table = tables.find(t => t.id === order.tableId);
                return (
                  <div 
                    key={order.id} 
                    className={`order-card-large status-${order.status.toLowerCase()}`}
                    onClick={() => navigateToTable(order.tableId)}
                  >
                    <div className="order-card-header">
                      <div className="mesa-info">
                        <div className="mesa-number">Mesa {table?.number || '-'}</div>
                      </div>
                      <div className={`status-tag ${order.status.toLowerCase()}`}>
                        <div className="status-main">
                          {order.status === 'PENDING' && '⏳ Pendiente'}
                          {order.status === 'IN_PREPARATION' && '🍳 En Cocina'}
                          {order.status === 'READY' && '✅ Listo'}
                          {order.status === 'DELIVERED' && '📦 Entregado'}
                        </div>
                        <div className="status-time">
                          {getTimeAgo(order.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="order-card-body">
                      {/* Lista de platillos */}
                      {order.items && order.items.length > 0 && (
                        <div className="order-items-preview">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="item-preview">
                              <span className="item-quantity">{item.quantity}x</span>
                              <span className="item-name">{item.menuItemName || item.productName || 'Platillo'}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="items-more">
                              +{order.items.length - 3} más
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="order-meta">
                        {order.items && order.items.length > 0 && (
                          <span className="meta-item">
                            <span className="meta-icon">🍽️</span>
                            {order.items.length} platillo{order.items.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {/* Botón para marcar como entregado (solo si está listo) */}
                      {order.status === 'READY' && (
                        <button 
                          className="btn-mark-delivered"
                          onClick={(e) => handleMarkAsDelivered(order.id, e)}
                        >
                          📦 Marcar como Entregado
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-orders-large">
                <div className="no-orders-icon">📋</div>
                <p>No hay órdenes {orderFilter !== 'all' ? 'con este filtro' : 'activas'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default TableSelector;
