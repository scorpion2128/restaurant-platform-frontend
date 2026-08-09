import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast/Toast';
import Layout from '../components/Layout/Layout';
import './OrdersMonitor.css';

const OrdersMonitor = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [filters, setFilters] = useState({
    status: 'ALL',
    tableNumber: '',
    searchTerm: ''
  });
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAllOrders(0, 100);
      if (response.success) {
        const allOrders = response.data.content || [];
        setOrders(allOrders);
      }
    } catch (error) {
      showToast('Error al cargar los pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filtrar por estado
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtrar por mesa
    if (filters.tableNumber) {
      filtered = filtered.filter(order => 
        order.tableId?.toString().includes(filters.tableNumber)
      );
    }

    // Filtrar por término de búsqueda (número de orden o mesero)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(term) ||
        order.waiterName.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        showToast('Estado actualizado correctamente', 'success');
        loadOrders();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al actualizar el estado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'IN_PREPARATION':
        return 'status-preparing';
      case 'READY':
        return 'status-ready';
      case 'DELIVERED':
        return 'status-delivered';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Pendiente',
      'IN_PREPARATION': 'En Preparación',
      'READY': 'Listo',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      preparing: orders.filter(o => o.status === 'IN_PREPARATION').length,
      ready: orders.filter(o => o.status === 'READY').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
  };

  const stats = getOrderStats();

  return (
    <Layout>
      <div className="orders-monitor">
        <div className="monitor-header">
        <h2>📊 Monitor de Pedidos</h2>
        <button className="btn-secondary" onClick={loadOrders} disabled={loading}>
          {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Pedidos</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card stat-preparing">
          <div className="stat-value">{stats.preparing}</div>
          <div className="stat-label">En Preparación</div>
        </div>
        <div className="stat-card stat-ready">
          <div className="stat-value">{stats.ready}</div>
          <div className="stat-label">Listos</div>
        </div>
        <div className="stat-card stat-delivered">
          <div className="stat-value">{stats.delivered}</div>
          <div className="stat-label">Entregados</div>
        </div>
        <div className="stat-card stat-amount">
          <div className="stat-value">S/ {stats.totalAmount.toFixed(2)}</div>
          <div className="stat-label">Monto Total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Estado:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="IN_PREPARATION">En Preparación</option>
            <option value="READY">Listo</option>
            <option value="DELIVERED">Entregado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Mesa:</label>
          <input
            type="text"
            placeholder="Número de mesa"
            value={filters.tableNumber}
            onChange={(e) => handleFilterChange('tableNumber', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Número de pedido o mesero"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>

        <button
          className="btn-clear-filters"
          onClick={() => setFilters({ status: 'ALL', tableNumber: '', searchTerm: '' })}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Lista de pedidos */}
      <div className="orders-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="monitor-order-card">
              <div
                className="order-summary"
                onClick={() => toggleOrderExpansion(order.id)}
              >
                <div className="order-info-row">
                  <span className="order-number">{order.orderNumber}</span>
                  <span className="table-info">
                    {order.orderType === 'DELIVERY' ? `Delivery · ${order.customerName}` : `Mesa ${order.tableId || 'N/A'}`}
                  </span>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className="order-amount">S/ {order.total ? order.total.toFixed(2) : '0.00'}</span>
                </div>
                <div className="order-meta">
                  <span className="waiter-name">👤 {order.waiterName}</span>
                  <span className="order-time">
                    🕐 {new Date(order.createdAt).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="expand-icon">
                    {expandedOrder === order.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <h4>Items del Pedido:</h4>
                  <div className="items-table">
                    {order.items.map((item) => (
                      <div key={item.id} className="item-row">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">
                          {item.productName}
                          {item.isPartOfMenu && (
                            <span className="menu-badge">🍽️ Menús</span>
                          )}
                        </span>
                        <span className="item-price">
                          S/ {item.unitPrice.toFixed(2)}
                        </span>
                        <span className="item-subtotal">
                          S/ {item.subtotal.toFixed(2)}
                        </span>
                        {item.notes && (
                          <div className="item-notes-display">
                            ⚠️ Nota: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <div className="order-actions">
                      {order.status === 'PENDING' && (
                        <button
                          className="btn-action btn-preparing"
                          onClick={() => handleUpdateStatus(order.id, 'IN_PREPARATION')}
                          disabled={loading}
                        >
                          Marcar En Preparación
                        </button>
                      )}
                      {order.status === 'IN_PREPARATION' && (
                        <button
                          className="btn-action btn-ready"
                          onClick={() => handleUpdateStatus(order.id, 'READY')}
                          disabled={loading}
                        >
                          Marcar Listo
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          className="btn-action btn-delivered"
                          onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          disabled={loading}
                        >
                          Marcar Entregado
                        </button>
                      )}
                      <button
                        className="btn-action btn-cancel"
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        disabled={loading}
                      >
                        Cancelar Pedido
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-orders-message">
            <p>No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
      </div>
    </Layout>
  );
};

export default OrdersMonitor;
