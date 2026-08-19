import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast/Toast';
import Layout from '../components/Layout/Layout';
import { formatPeruTime } from '../utils/dateTime';
import './KitchenDashboard.css';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh cada 30 segundos
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadOrders = async () => {
    try {
      const response = await orderService.getOrdersForKitchen();
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
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

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  const groupItemsByMenuAndSection = (items) => {
    if (!items || items.length === 0) return { menus: [], sections: [] };
    
    const menuGroups = {};
    const sectionGroups = {};
    
    items.forEach((item) => {
      if (item.isPartOfMenu && item.menuGroupId) {
        // Agrupar por menú
        if (!menuGroups[item.menuGroupId]) {
          menuGroups[item.menuGroupId] = [];
        }
        menuGroups[item.menuGroupId].push(item);
      } else {
        // Agrupar por sección
        const sectionName = item.sectionName || 'Otros';
        
        if (!sectionGroups[sectionName]) {
          sectionGroups[sectionName] = [];
        }
        sectionGroups[sectionName].push(item);
      }
    });
    
    const menus = Object.values(menuGroups);
    const sections = Object.entries(sectionGroups).map(([name, items]) => ({
      name,
      items
    }));
    
    return { menus, sections };
  };

  const getSectionIcon = (sectionName) => {
    const normalized = sectionName.toUpperCase();
    
    if (normalized.includes('ENTRADA')) return '🥗';
    if (normalized.includes('SOPA')) return '🥗';
    if (normalized.includes('BEBIDA')) return '🥤';
    if (normalized.includes('PLATO')) return '🍛';
    if (normalized.includes('POSTRE')) return '🍰';
    
    return '📋';
  };

  const renderOrderCard = (order, showActions) => {
    const { menus, sections } = groupItemsByMenuAndSection(order.items);

    return (
      <div key={order.id} className="kitchen-order-card">
        <div className="order-header">
          <div className="order-title">
            <span className="order-number">{order.orderNumber}</span>
            <span className="table-badge">
              {order.orderType === 'DELIVERY' ? `DELIVERY · ${order.customerName}` : `MESA ${order.tableId || 'N/A'}`}
            </span>
          </div>
          <span className="order-time">
            {formatPeruTime(order.createdAt)}
          </span>
        </div>

        <div className="order-items">
          {/* Renderizar menús agrupados */}
          {menus.map((menuItems, menuIndex) => {
            const menuQuantity = menuItems[0].quantity;
            const menuNotes = menuItems.find(item => item.notes)?.notes;
            
            return (
              <div key={`menu-${menuIndex}`} className="item-group menu-group">
                <div className="menu-label">🍽️ Menú</div>
                {menuItems.map((item) => (
                  <div key={item.id} className="order-item">
                    <span className="item-quantity">{menuQuantity}x</span>
                    <span className="item-name">{item.productName}</span>
                  </div>
                ))}
                {menuNotes && (
                  <div className="group-notes">{menuNotes}</div>
                )}
              </div>
            );
          })}

          {/* Renderizar items agrupados por sección */}
          {sections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className="item-group section-group">
              <div className="section-label">
                {getSectionIcon(section.name)} {section.name}
              </div>
              {section.items.map((item) => (
                <div key={item.id}>
                  <div className="order-item">
                    <span className="item-quantity">{item.quantity}x</span>
                    <span className="item-name">{item.productName}</span>
                  </div>
                  {item.notes && (
                    <div className="group-notes">{item.notes}</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {showActions && (
          <div className="order-actions">
            {order.status === 'PENDING' && (
              <button
                className="btn-action btn-start"
                onClick={() => handleUpdateStatus(order.id, 'IN_PREPARATION')}
                disabled={loading}
              >
                Iniciar
              </button>
            )}
            {order.status === 'IN_PREPARATION' && (
              <button
                className="btn-action btn-ready"
                onClick={() => handleUpdateStatus(order.id, 'READY')}
                disabled={loading}
              >
                Listo
              </button>
            )}
            {order.status === 'READY' && (
              <button
                className="btn-action btn-delivered"
                onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                disabled={loading}
              >
                Entregado
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const pendingOrders = getOrdersByStatus('PENDING');
  const preparingOrders = getOrdersByStatus('IN_PREPARATION');
  const readyOrders = getOrdersByStatus('READY');

  return (
    <Layout>
      <div className="kitchen-dashboard">
        <div className="kitchen-header">
        <h2>🍳 Monitor de Cocina</h2>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Actualización automática</span>
          </label>
          <button className="btn-secondary" onClick={loadOrders}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="kitchen-columns">
        {/* Columna: Pendientes */}
        <div className="kitchen-column pending-column">
          <div className="column-header">
            <h3>📋 Pendientes</h3>
            <span className="count-badge">{pendingOrders.length}</span>
          </div>
          <div className="column-content">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => renderOrderCard(order, true))
            ) : (
              <p className="no-orders">No hay pedidos pendientes</p>
            )}
          </div>
        </div>

        {/* Columna: En Preparación */}
        <div className="kitchen-column preparing-column">
          <div className="column-header">
            <h3>👨‍🍳 Preparación</h3>
            <span className="count-badge">{preparingOrders.length}</span>
          </div>
          <div className="column-content">
            {preparingOrders.length > 0 ? (
              preparingOrders.map(order => renderOrderCard(order, true))
            ) : (
              <p className="no-orders">No hay pedidos en preparación</p>
            )}
          </div>
        </div>

        {/* Columna: Listos */}
        <div className="kitchen-column ready-column">
          <div className="column-header">
            <h3>✅ Listos</h3>
            <span className="count-badge">{readyOrders.length}</span>
          </div>
          <div className="column-content">
            {readyOrders.length > 0 ? (
              readyOrders.map(order => renderOrderCard(order, true))
            ) : (
              <p className="no-orders">No hay pedidos listos</p>
            )}
          </div>
        </div>
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

export default KitchenDashboard;
