import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import dailyMenuService from '../services/dailyMenuService';
import Toast from '../components/Toast/Toast';
import Layout from '../components/Layout/Layout';
import TableSelector from '../components/TableSelector/TableSelector';
import PaymentModal from '../components/Payment/PaymentModal';
import './OrderTaking.css';

const OrderTaking = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [menuCombo, setMenuCombo] = useState({ entrada: null, plato: null, bebida: null });
  const [currentItemNotes, setCurrentItemNotes] = useState('');
  const [nextMenuGroupId, setNextMenuGroupId] = useState(1);

  useEffect(() => {
    if (selectedTable) {
      loadTodayMenu();
      loadTableOrders(selectedTable.id);
    }
  }, [selectedTable]);

  const loadTodayMenu = async () => {
    try {
      const today = new Date();
      const localDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
      ].join('-');
      const response = await dailyMenuService.getMenuByDate(localDate);

      if (response.success && response.data) {
        setMenus([response.data]);
      } else {
        setMenus([]);
      }
    } catch (error) {
      setMenus([]);
      showToast(error.message || 'No hay un menú configurado para hoy', 'error');
    }
  };

  const loadTableOrders = async (tableId = selectedTable?.id) => {
    if (!tableId) return;

    try {
      const response = await orderService.getActiveOrdersByTable(tableId);
      if (response.success) {
        setActiveOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error loading active orders:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleAddToCart = (item, sectionName) => {
    // Buscar si ya existe el item en el carrito
    const existingIndex = cart.findIndex(
      cartItem => cartItem.productId === item.productId && !cartItem.isPartOfMenu
    );

    if (existingIndex >= 0) {
      // Incrementar cantidad
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Agregar nuevo item
      const newItem = {
        productId: item.productId,
        productName: item.productName,
        quantity: 1,
        unitPrice: item.productPrice,
        notes: '',
        isPartOfMenu: false,
        menuGroupId: null,
        sectionName
      };
      setCart([...cart, newItem]);
    }
    showToast(`${item.productName} agregado al carrito`, 'success');
  };

  const handleCreateMenuCombo = () => {
    const { entrada, plato, bebida } = menuCombo;
    
    if (!entrada || !plato || !bebida) {
      showToast('Debes seleccionar entrada, plato de fondo y bebida', 'error');
      return;
    }

    const groupId = nextMenuGroupId;
    const menuPrice = 12.00; // Precio fijo del menú
    const pricePerItem = (menuPrice / 3).toFixed(2);

    const menuItems = [
      {
        productId: entrada.productId,
        productName: entrada.productName,
        quantity: 1,
        unitPrice: parseFloat(pricePerItem),
        notes: '',
        isPartOfMenu: true,
        menuGroupId: groupId,
        sectionName: 'ENTRADA'
      },
      {
        productId: plato.productId,
        productName: plato.productName,
        quantity: 1,
        unitPrice: parseFloat(pricePerItem),
        notes: '',
        isPartOfMenu: true,
        menuGroupId: groupId,
        sectionName: 'PLATO DE FONDO'
      },
      {
        productId: bebida.productId,
        productName: bebida.productName,
        quantity: 1,
        unitPrice: parseFloat(pricePerItem),
        notes: '',
        isPartOfMenu: true,
        menuGroupId: groupId,
        sectionName: 'BEBIDA'
      }
    ];

    setCart([...cart, ...menuItems]);
    setNextMenuGroupId(groupId + 1);
    setShowMenuModal(false);
    setMenuCombo({ entrada: null, plato: null, bebida: null });
    showToast('Menú agregado al carrito', 'success');
  };

  const updateCartItemQuantity = (index, delta) => {
    const updatedCart = [...cart];
    const newQuantity = updatedCart[index].quantity + delta;
    
    if (newQuantity <= 0) {
      // Remover item
      updatedCart.splice(index, 1);
    } else {
      updatedCart[index].quantity = newQuantity;
    }
    
    setCart(updatedCart);
  };

  const updateCartItemNotes = (index, notes) => {
    const updatedCart = [...cart];
    updatedCart[index].notes = notes;
    setCart(updatedCart);
  };

  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];
    
    // Si es parte de un menú, remover todo el grupo
    if (item.isPartOfMenu && item.menuGroupId) {
      const filtered = updatedCart.filter(
        cartItem => !(cartItem.isPartOfMenu && cartItem.menuGroupId === item.menuGroupId)
      );
      setCart(filtered);
    } else {
      updatedCart.splice(index, 1);
      setCart(updatedCart);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2);
  };

  const handleTableSelected = (table) => {
    setSelectedTable(table);
  };

  const handleBackToTableSelection = () => {
    if (cart.length > 0) {
      if (window.confirm('¿Estás seguro? Se perderá el pedido actual.')) {
        setSelectedTable(null);
        setCart([]);
        setNextMenuGroupId(1);
      }
    } else {
      setSelectedTable(null);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      showToast('Debes seleccionar una mesa', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        tableNumber: selectedTable.number,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || null,
          isPartOfMenu: item.isPartOfMenu,
          menuGroupId: item.menuGroupId
        }))
      };

      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        showToast('Pedido creado exitosamente', 'success');
        setCart([]);
        setSelectedTable(null);
        setNextMenuGroupId(1);
        loadTableOrders(selectedTable.id);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al crear el pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMenuItemsBySection = (menu) => {
    const sections = {};
    menu.items.forEach(item => {
      const sectionName = item.sectionName || 'Sin sección';
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      sections[sectionName].push(item);
    });
    return sections;
  };

  const getItemsBySection = (sectionName) => {
    if (menus.length === 0) return [];
    const sections = getMenuItemsBySection(menus[0]);
    const matchingSection = Object.keys(sections).find(
      name => name.toUpperCase() === sectionName.toUpperCase()
    );
    return matchingSection ? sections[matchingSection] : [];
  };

  const groupCartItemsByMenu = () => {
    const grouped = {};
    cart.forEach((item, index) => {
      if (item.isPartOfMenu && item.menuGroupId) {
        if (!grouped[item.menuGroupId]) {
          grouped[item.menuGroupId] = [];
        }
        grouped[item.menuGroupId].push({ ...item, index });
      } else {
        grouped[`individual-${index}`] = [{ ...item, index }];
      }
    });
    return grouped;
  };

  const hasDeliveredOrders = activeOrders.some(order => order.status === 'DELIVERED');

  const getOrderStatusLabel = (status) => ({
    PENDING: 'Pendiente',
    IN_PREPARATION: 'En preparación',
    READY: 'Para entregar',
    DELIVERED: 'Entregado'
  }[status] || status);

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setCart([]);
    setSelectedTable(null);
  };

  // Si no hay mesa seleccionada, mostrar selector de mesas
  if (!selectedTable) {
    return (
      <Layout>
        <TableSelector onTableSelected={handleTableSelected} />
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: '' })}
          />
        )}
      </Layout>
    );
  }

  // Si hay mesa seleccionada, mostrar interfaz de toma de pedido
  return (
    <Layout>
      <div className="order-taking">
        <div className="order-taking-header">
          <div className="header-left">
            <button className="btn-back" onClick={handleBackToTableSelection}>
              <span className="btn-back-icon" aria-hidden="true">←</span>
              <span>Mesas</span>
            </button>
            <h2>Tomar Pedido - Mesa {selectedTable.number}</h2>
          </div>
          <div className="header-right">
            {hasDeliveredOrders && (
              <button className="btn-view-account" onClick={() => setShowPaymentModal(true)}>
                💳 Ver cuenta / Pagar
              </button>
            )}
          </div>
        </div>

      <div className="order-taking-content">
        {/* Menú del día o Carta */}
        <div className="menu-section">
          <div className="menu-header">
            <h3>Menú del Día</h3>
            {menus.length > 0 && (
              <button
                className="btn-create-menu"
                onClick={() => setShowMenuModal(true)}
              >
                🍽️ Armar Menú (S/12)
              </button>
            )}
          </div>

          {menus.length > 0 ? (
            <div className="menu-sections">
              {Object.entries(getMenuItemsBySection(menus[0])).map(([sectionName, items]) => (
                <div key={sectionName} className="section-group">
                  <h4 className="section-title">{sectionName}</h4>
                  <div className="items-list">
                    {items.map((item) => (
                      <div key={item.id} className="menu-item-card">
                        <div className="item-info">
                          <span className="item-name">{item.productName}</span>
                          {!['ENTRADA', 'SOPA'].includes(sectionName) && (
                            <span className="item-price">
                              S/ {(item.productPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          className="btn-add"
                          onClick={() => handleAddToCart(item, sectionName)}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No hay un menú configurado para hoy</p>
          )}
        </div>

        {/* Carrito */}
        <div className="cart-section">
          <h3>Carrito</h3>
          {cart.length > 0 ? (
            <>
              <div className="cart-items">
                {Object.entries(groupCartItemsByMenu()).map(([groupKey, items]) => {
                  const isMenu = items[0].isPartOfMenu;
                  return (
                    <div key={groupKey} className={`cart-group ${isMenu ? 'menu-group' : ''}`}>
                      {isMenu && (
                        <div className="menu-badge-cart">
                          🍽️ Menú (S/12) - Grupo {items[0].menuGroupId}
                        </div>
                      )}
                      {items.map((item) => (
                        <div key={item.index} className="cart-item">
                          <div className="cart-item-main">
                            <span className="item-name-cart">
                              {item.productName}
                              {item.notes && <span className="has-notes"> ⚠️</span>}
                            </span>
                            <span className="item-subtotal">
                              S/ {(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <div className="cart-item-actions">
                            <span className="quantity-label">Cantidad</span>
                            <div className="quantity-controls">
                              <button onClick={() => updateCartItemQuantity(item.index, -1)} aria-label={`Disminuir cantidad de ${item.productName}`}>−</button>
                              <span aria-live="polite">{item.quantity}</span>
                              <button onClick={() => updateCartItemQuantity(item.index, 1)} aria-label={`Aumentar cantidad de ${item.productName}`}>+</button>
                            </div>
                          </div>
                          {!isMenu && (
                            <button
                              className="btn-remove-item"
                              onClick={() => removeFromCart(item.index)}
                            >
                              ×
                            </button>
                          )}
                          <div className="item-notes-input">
                            <input
                              type="text"
                              placeholder="Notas (opcional)"
                              value={item.notes}
                              onChange={(e) => updateCartItemNotes(item.index, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>Total:</strong>
                  <strong>S/ {calculateTotal()}</strong>
                </div>
                <button
                  className="btn-submit-order"
                  onClick={handleSubmitOrder}
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Pedido'}
                </button>
              </div>
            </>
          ) : (
            <p className="empty-cart">Carrito vacío</p>
          )}
        </div>

          {/* Pedidos activos */}
          <div className="active-orders-section">
            <h3>Pedidos de esta mesa</h3>
            {activeOrders.length > 0 ? (
              <div className="active-orders-list">
                {activeOrders.map((order) => (
                  <div key={order.id} className="active-order-card">
                    <div className="order-header-card">
                      <span className="order-number">{order.orderNumber}</span>
                      <span className={`order-status status-${order.status.toLowerCase()}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    {order.items?.length > 0 && (
                      <div className="active-order-items">
                        {order.items.slice(0, 4).map((item, index) => (
                          <div className="active-order-item" key={item.id || `${order.id}-${index}`}>
                            <span className="active-order-quantity">{item.quantity || 1}x</span>
                            <span className="active-order-item-name">
                              {item.productName || item.menuItemName || 'Producto'}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <span className="active-order-more">+{order.items.length - 4} producto{order.items.length - 4 !== 1 ? 's' : ''} más</span>
                        )}
                      </div>
                    )}
                    <div className="order-info">
                      <span>{order.items?.length || 0} producto{order.items?.length !== 1 ? 's' : ''}</span>
                      <strong>Total: S/ {Number(order.total ?? 0).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No tienes pedidos activos</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal armar menú */}
      {showMenuModal && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Armar Menú Completo</h3>
              <button className="btn-close" onClick={() => setShowMenuModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="menu-combo-section">
                <h4>Entrada</h4>
                <select
                  value={menuCombo.entrada?.id || ''}
                  onChange={(e) => {
                    const item = menus[0]?.items.find(i => i.id === parseInt(e.target.value));
                    setMenuCombo({ ...menuCombo, entrada: item });
                  }}
                >
                  <option value="">Seleccionar entrada</option>
                  {getItemsBySection('ENTRADA').map((item) => (
                    <option key={item.id} value={item.id}>{item.productName}</option>
                  ))}
                </select>
              </div>

              <div className="menu-combo-section">
                <h4>Plato de Fondo</h4>
                <select
                  value={menuCombo.plato?.id || ''}
                  onChange={(e) => {
                    const item = menus[0]?.items.find(i => i.id === parseInt(e.target.value));
                    setMenuCombo({ ...menuCombo, plato: item });
                  }}
                >
                  <option value="">Seleccionar plato de fondo</option>
                  {getItemsBySection('PLATO DE FONDO').map((item) => (
                    <option key={item.id} value={item.id}>{item.productName}</option>
                  ))}
                </select>
              </div>

              <div className="menu-combo-section">
                <h4>Bebida</h4>
                <select
                  value={menuCombo.bebida?.id || ''}
                  onChange={(e) => {
                    const item = menus[0]?.items.find(i => i.id === parseInt(e.target.value));
                    setMenuCombo({ ...menuCombo, bebida: item });
                  }}
                >
                  <option value="">Seleccionar bebida</option>
                  {getItemsBySection('BEBIDA').map((item) => (
                    <option key={item.id} value={item.id}>{item.productName}</option>
                  ))}
                </select>
              </div>

              <div className="menu-price-info">
                <strong>Precio del Menú: S/ 12.00</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowMenuModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleCreateMenuCombo}>
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          tableId={selectedTable.id}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </Layout>
  );
};

export default OrderTaking;
