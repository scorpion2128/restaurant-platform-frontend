import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import dailyMenuService from '../services/dailyMenuService';
import Toast from '../components/Toast/Toast';
import Layout from '../components/Layout/Layout';
import TableSelector from '../components/TableSelector/TableSelector';
import PaymentModal from '../components/Payment/PaymentModal';
import GroupedOrderItems, { countOrderSelections } from '../components/GroupedOrderItems/GroupedOrderItems';
import { useConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog';
import './OrderTaking.css';

const MENU_COMPLEMENT_PRICE = 1;

const normalizeSectionName = (sectionName = '') => sectionName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toUpperCase()
  .replace(/^ENTRADAS$/, 'ENTRADA')
  .replace(/^SOPAS$/, 'SOPA')
  .replace(/^PLATOS DE FONDO$/, 'PLATO DE FONDO')
  .replace(/^BEBIDAS$/, 'BEBIDA');

const getSectionLabel = (sectionName) => ({
  ENTRADA: 'Entradas',
  SOPA: 'Sopas',
  'PLATO DE FONDO': 'Platos de fondo',
  BEBIDA: 'Bebidas'
}[normalizeSectionName(sectionName)] || sectionName);

const OrderTaking = () => {
  const confirm = useConfirmDialog();
  const [selectedTable, setSelectedTable] = useState(null);
  const [serviceMode, setServiceMode] = useState('tables');
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [useMinimalDeliveryData, setUseMinimalDeliveryData] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [deliveryCustomer, setDeliveryCustomer] = useState({
    customerName: '', customerPhone: '', deliveryAddress: '', deliveryReference: '', orderChannel: 'WHATSAPP'
  });
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [menuCombo, setMenuCombo] = useState({ entrada: null, plato: null });
  const [currentItemNotes, setCurrentItemNotes] = useState('');
  const [nextMenuGroupId, setNextMenuGroupId] = useState(1);

  useEffect(() => {
    if (selectedTable) {
      loadTodayMenu();
      if (selectedTable.type !== 'DELIVERY') loadTableOrders(selectedTable.id);
    }
  }, [selectedTable]);

  useEffect(() => {
    if (serviceMode === 'delivery' && !selectedTable) loadDeliveryOrders();
  }, [serviceMode, selectedTable]);

  const loadDeliveryOrders = async () => {
    try {
      const response = await orderService.getActiveDeliveryOrders();
      if (response.success) setDeliveryOrders(response.data || []);
    } catch (error) {
      showToast(error.message || 'Error al cargar los pedidos delivery', 'error');
    }
  };

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

  const openMenuModal = () => {
    setMenuCombo({ entrada: null, plato: null });
    setShowMenuModal(true);
  };

  const closeMenuModal = () => {
    setMenuCombo({ entrada: null, plato: null });
    setShowMenuModal(false);
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
        ,deliveryPackaging: Boolean(item.deliveryPackaging)
      };
      setCart([...cart, newItem]);
    }
    showToast(`${item.productName} agregado al carrito`, 'success');
  };

  const handleCreateMenuCombo = () => {
    const { entrada, plato } = menuCombo;
    
    if (!entrada || !plato) {
      showToast('Debes seleccionar una entrada y un plato de fondo', 'error');
      return;
    }

    const mainCoursePrice = Number(plato.productPrice);
    if (!Number.isFinite(mainCoursePrice)) {
      showToast('El plato de fondo seleccionado no tiene un precio válido', 'error');
      return;
    }

    const groupId = nextMenuGroupId;

    const menuItems = [
      {
        productId: entrada.productId,
        productName: entrada.productName,
        quantity: 1,
        unitPrice: MENU_COMPLEMENT_PRICE,
        notes: '',
        isPartOfMenu: true,
        menuGroupId: groupId,
        sectionName: 'ENTRADA'
      },
      {
        productId: plato.productId,
        productName: plato.productName,
        quantity: 1,
        unitPrice: mainCoursePrice,
        notes: '',
        isPartOfMenu: true,
        menuGroupId: groupId,
        sectionName: 'PLATO DE FONDO'
      }
    ];

    setCart([...cart, ...menuItems]);
    setNextMenuGroupId(groupId + 1);
    closeMenuModal();
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

  const updateMenuGroupQuantity = (menuGroupId, delta) => {
    const groupItems = cart.filter(item => item.isPartOfMenu && item.menuGroupId === menuGroupId);
    if (groupItems.length === 0) return;

    const newQuantity = groupItems[0].quantity + delta;
    if (newQuantity <= 0) {
      setCart(cart.filter(item => !(item.isPartOfMenu && item.menuGroupId === menuGroupId)));
      return;
    }

    setCart(cart.map(item =>
      item.isPartOfMenu && item.menuGroupId === menuGroupId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const updateMenuGroupNotes = (menuGroupId, notes) => {
    setCart(cart.map(item =>
      item.isPartOfMenu && item.menuGroupId === menuGroupId
        ? { ...item, notes }
        : item
    ));
  };

  const removeMenuGroup = (menuGroupId) => {
    setCart(cart.filter(item => !(item.isPartOfMenu && item.menuGroupId === menuGroupId)));
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
    return (calculateItemsTotal() + calculatePackagingTotal()).toFixed(2);
  };

  const calculateItemsTotal = () => cart.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity), 0
  );

  const calculatePackagingUnits = () => {
    if (selectedTable?.type !== 'DELIVERY') return 0;
    const menuGroups = new Map();
    let units = 0;
    cart.forEach(item => {
      if (item.isPartOfMenu && item.menuGroupId) {
        if (!menuGroups.has(item.menuGroupId)) menuGroups.set(item.menuGroupId, item.quantity);
      } else if (item.deliveryPackaging) {
        units += item.quantity;
      }
    });
    return units + [...menuGroups.values()].reduce((sum, quantity) => sum + quantity, 0);
  };

  const calculatePackagingTotal = () => calculatePackagingUnits();

  const handleTableSelected = (table) => {
    setSelectedTable(table);
  };

  const handleBackToTableSelection = async () => {
    if (cart.length > 0) {
      const confirmed = await confirm({
        title: 'Descartar pedido actual',
        message: 'Los productos agregados al carrito se perderán al volver a las mesas.',
        confirmLabel: 'Descartar y volver',
        variant: 'warning'
      });
      if (confirmed) {
        setSelectedTable(null);
        setDeliveryCustomer({ customerName: '', customerPhone: '', deliveryAddress: '', deliveryReference: '', orderChannel: 'WHATSAPP' });
        setCart([]);
        setNextMenuGroupId(1);
      }
    } else {
      setSelectedTable(null);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      showToast('Debes seleccionar una mesa o iniciar un delivery', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        orderType: selectedTable.type === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN',
        ...(selectedTable.type === 'DELIVERY'
          ? deliveryCustomer
          : { tableNumber: selectedTable.number }),
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
        if (orderData.orderType === 'DELIVERY') {
          setServiceMode('delivery');
          loadDeliveryOrders();
        }
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
      name => normalizeSectionName(name) === normalizeSectionName(sectionName)
    );
    return matchingSection ? sections[matchingSection] : [];
  };

  const groupCartBySection = () => {
    const menuGroups = new Map();
    const productSections = new Map();

    cart.forEach((item, index) => {
      if (item.isPartOfMenu && item.menuGroupId) {
        if (!menuGroups.has(item.menuGroupId)) {
          menuGroups.set(item.menuGroupId, []);
        }
        menuGroups.get(item.menuGroupId).push({ ...item, index });
      } else {
        const sectionKey = normalizeSectionName(item.sectionName || 'OTROS');
        if (!productSections.has(sectionKey)) {
          productSections.set(sectionKey, []);
        }
        productSections.get(sectionKey).push({ ...item, index });
      }
    });

    const sections = [];
    if (menuGroups.size > 0) {
      sections.push({ key: 'menus', label: 'Menús', type: 'menus', entries: [...menuGroups.values()] });
    }
    const sectionPriority = { ENTRADA: 1, SOPA: 2, 'PLATO DE FONDO': 3, BEBIDA: 4 };
    [...productSections.entries()]
      .sort(([keyA], [keyB]) =>
        (sectionPriority[keyA] ?? 99) - (sectionPriority[keyB] ?? 99) || keyA.localeCompare(keyB)
      )
      .forEach(([key, entries]) => {
      sections.push({ key, label: getSectionLabel(key), type: 'products', entries });
      });
    return sections;
  };

  const hasDeliveredOrders = activeOrders.some(order => order.status === 'DELIVERED');

  const getOrderStatusLabel = (status) => ({
    PENDING: 'Pendiente',
    IN_PREPARATION: 'En preparación',
    READY: 'Listo',
    DELIVERED: 'Entregado'
  }[status] || status);

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setCart([]);
    setSelectedTable(null);
    setPaymentOrderId(null);
    loadDeliveryOrders();
  };

  const handleStartDelivery = (event) => {
    event.preventDefault();
    if (!deliveryCustomer.customerName.trim()) {
      showToast('Ingresa el nombre del cliente', 'error');
      return;
    }
    if (!useMinimalDeliveryData && (!deliveryCustomer.customerPhone.trim() || !deliveryCustomer.deliveryAddress.trim())) {
      showToast('Completa nombre, teléfono y dirección del cliente', 'error');
      return;
    }

    if (useMinimalDeliveryData) {
      setDeliveryCustomer(current => ({
        ...current,
        customerPhone: 'No registrado',
        deliveryAddress: 'Dirección conocida',
        deliveryReference: 'Cliente conocido',
        orderChannel: 'OTHER'
      }));
    }
    setShowDeliveryForm(false);
    setSelectedTable({ type: 'DELIVERY' });
    setActiveOrders([]);
  };

  const openDeliveryForm = () => {
    setDeliveryCustomer({ customerName: '', customerPhone: '', deliveryAddress: '', deliveryReference: '', orderChannel: 'WHATSAPP' });
    setUseMinimalDeliveryData(false);
    setShowDeliveryForm(true);
  };

  const handleDeliveryStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      showToast(status === 'DELIVERED' ? 'Pedido marcado como entregado' : 'Estado actualizado', 'success');
      loadDeliveryOrders();
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el pedido', 'error');
    }
  };

  // Selección del tipo de atención
  if (!selectedTable) {
    return (
      <Layout>
        <div className="order-mode-shell">
          <div className="order-mode-tabs" role="tablist" aria-label="Tipo de atención">
            <button className={serviceMode === 'tables' ? 'active' : ''} onClick={() => setServiceMode('tables')}>Mesas</button>
            <button className={serviceMode === 'delivery' ? 'active' : ''} onClick={() => setServiceMode('delivery')}>Delivery</button>
          </div>

          {serviceMode === 'tables' ? (
            <TableSelector onTableSelected={handleTableSelected} />
          ) : (
            <section className="delivery-dashboard">
              <div className="delivery-dashboard-header">
                <div>
                  <h2>Pedidos a domicilio</h2>
                  <p>Registra y realiza seguimiento a los pedidos delivery.</p>
                </div>
                <button className="btn-new-delivery" onClick={openDeliveryForm}>+ Nuevo delivery</button>
              </div>

              <div className="delivery-orders-grid">
                {deliveryOrders.map(order => (
                  <article className={`delivery-order-card delivery-status-${order.status.toLowerCase()}`} key={order.id}>
                    <div className="delivery-order-head">
                      <strong>{order.orderNumber}</strong>
                      <span>{getOrderStatusLabel(order.status)}</span>
                    </div>
                    <h3>{order.customerName}</h3>
                    {order.customerPhone && order.customerPhone !== 'No registrado' && (
                      <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                    )}
                    {order.deliveryAddress && order.deliveryAddress !== 'Dirección conocida' && (
                      <p>{order.deliveryAddress}</p>
                    )}
                    {order.deliveryReference && order.deliveryReference !== 'Cliente conocido' && (
                      <small>Ref.: {order.deliveryReference}</small>
                    )}
                    {order.items?.length > 0 && (
                      <GroupedOrderItems items={order.items} compact />
                    )}
                    <div className="delivery-order-summary">
                      <strong>S/ {Number(order.total || 0).toFixed(2)}</strong>
                    </div>
                    {order.status === 'READY' && (
                      <button onClick={() => handleDeliveryStatus(order.id, 'DELIVERED')}>Marcar como entregado</button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <button onClick={() => { setPaymentOrderId(order.id); setShowPaymentModal(true); }}>Cobrar pedido</button>
                    )}
                  </article>
                ))}
                {deliveryOrders.length === 0 && <div className="delivery-empty">No hay pedidos delivery activos.</div>}
              </div>
            </section>
          )}
        </div>

        {showDeliveryForm && (
          <div className="modal-overlay" onClick={() => setShowDeliveryForm(false)}>
            <div className="modal-content delivery-form-modal" onClick={event => event.stopPropagation()}>
              <div className="modal-header"><h2>Nuevo delivery</h2><button className="modal-close" onClick={() => setShowDeliveryForm(false)}>×</button></div>
              <form className="modal-form" onSubmit={handleStartDelivery}>
                <label className="delivery-minimal-toggle">
                  <input
                    type="checkbox"
                    checked={useMinimalDeliveryData}
                    onChange={event => setUseMinimalDeliveryData(event.target.checked)}
                  />
                  <span>
                    <strong>Cliente conocido</strong>
                    <small>Solo se solicitará el nombre del cliente.</small>
                  </span>
                </label>
                <div className="form-group"><label>Cliente *</label><input className="input" value={deliveryCustomer.customerName} onChange={e => setDeliveryCustomer({...deliveryCustomer, customerName: e.target.value})} /></div>
                {!useMinimalDeliveryData && (
                  <>
                    <div className="form-group"><label>Teléfono *</label><input className="input" type="tel" value={deliveryCustomer.customerPhone} onChange={e => setDeliveryCustomer({...deliveryCustomer, customerPhone: e.target.value})} /></div>
                    <div className="form-group"><label>Dirección *</label><input className="input" value={deliveryCustomer.deliveryAddress} onChange={e => setDeliveryCustomer({...deliveryCustomer, deliveryAddress: e.target.value})} /></div>
                    <div className="form-group"><label>Referencia</label><input className="input" value={deliveryCustomer.deliveryReference} onChange={e => setDeliveryCustomer({...deliveryCustomer, deliveryReference: e.target.value})} /></div>
                    <div className="form-group"><label>Canal del pedido</label><select className="input" value={deliveryCustomer.orderChannel} onChange={e => setDeliveryCustomer({...deliveryCustomer, orderChannel: e.target.value})}><option value="WHATSAPP">WhatsApp</option><option value="CALL">Llamada</option><option value="IN_PERSON">Presencial</option><option value="OTHER">Otro</option></select></div>
                  </>
                )}
                <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowDeliveryForm(false)}>Cancelar</button><button className="btn btn-primary" type="submit">Continuar al pedido</button></div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && paymentOrderId && (
          <PaymentModal orderId={paymentOrderId} onClose={() => { setShowPaymentModal(false); setPaymentOrderId(null); }} onPaymentComplete={handlePaymentComplete} />
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
  }

  // Si hay mesa seleccionada, mostrar interfaz de toma de pedido
  return (
    <Layout>
      <div className="order-taking">
        <div className="order-taking-header">
          <div className="header-left">
            <button className="btn-back" onClick={handleBackToTableSelection}>
              <span className="btn-back-icon" aria-hidden="true">←</span>
              <span>{selectedTable.type === 'DELIVERY' ? 'Delivery' : 'Mesas'}</span>
            </button>
            <h2>{selectedTable.type === 'DELIVERY' ? `Delivery - ${deliveryCustomer.customerName}` : `Mesa ${selectedTable.number}`}</h2>
          </div>
          <div className="header-right">
            {selectedTable.type !== 'DELIVERY' && hasDeliveredOrders && (
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
            <h3>Carta del día</h3>
            {menus.length > 0 && (
              <button
                className="btn-create-menu"
                onClick={openMenuModal}
              >
                🍽️ Armar menú
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
                          {!['ENTRADA', 'SOPA'].includes(normalizeSectionName(sectionName)) && (
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
                {groupCartBySection().map(section => (
                  <section key={section.key} className="cart-section-group">
                    <h4 className="cart-section-title">{section.label}</h4>
                    <div className="cart-section-entries">
                      {section.type === 'menus' ? section.entries.map(items => {
                        const menuQuantity = items[0].quantity;
                        const menuUnitPrice = items.reduce((total, item) => total + item.unitPrice, 0);
                        return (
                        <article key={items[0].menuGroupId} className="cart-entry-card menu-entry-card">
                          <div className="menu-cart-unified">
                          <div className="menu-entry-header">
                            <div className="menu-cart-components">
                              {items.map(item => (
                                <span key={item.index}>
                                  <small>{item.sectionName === 'ENTRADA' ? 'Entrada' : 'Fondo'}</small>
                                  <span>{item.productName}</span>
                                </span>
                              ))}
                            </div>
                            <strong className="item-subtotal">S/ {(menuUnitPrice * menuQuantity).toFixed(2)}</strong>
                            <button
                              className="btn-remove-group"
                              onClick={() => removeMenuGroup(items[0].menuGroupId)}
                              aria-label="Eliminar menú completo"
                            >
                              ×
                            </button>
                          </div>
                          <div className="cart-item-actions">
                            <span className="quantity-label">Cantidad</span>
                            <div className="quantity-controls">
                              <button onClick={() => updateMenuGroupQuantity(items[0].menuGroupId, -1)} aria-label="Disminuir cantidad de menús">−</button>
                              <span aria-live="polite">{menuQuantity}</span>
                              <button onClick={() => updateMenuGroupQuantity(items[0].menuGroupId, 1)} aria-label="Aumentar cantidad de menús">+</button>
                            </div>
                          </div>
                          <div className="item-notes-input">
                            <input
                              type="text"
                              placeholder="Notas (opcional)"
                              value={items[0].notes || ''}
                              onChange={(e) => updateMenuGroupNotes(items[0].menuGroupId, e.target.value)}
                            />
                          </div>
                        </div>
                        </article>
                        );
                      }) : section.entries.map(item => (
                        <article key={item.index} className="cart-entry-card product-entry-card">
                          <div className="product-entry-header">
                            <span className="item-name-cart">
                              {item.productName}
                              {item.notes && <span className="has-notes"> ⚠️</span>}
                            </span>
                            <span className="item-subtotal">
                              S/ {(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                            <button
                              className="btn-remove-group"
                              onClick={() => removeFromCart(item.index)}
                              aria-label={`Eliminar ${item.productName}`}
                            >
                              ×
                            </button>
                          </div>
                          <div className="product-entry-body">
                          <div className="cart-item-actions">
                            <span className="quantity-label">Cantidad</span>
                            <div className="quantity-controls">
                              <button onClick={() => updateCartItemQuantity(item.index, -1)} aria-label={`Disminuir cantidad de ${item.productName}`}>−</button>
                              <span aria-live="polite">{item.quantity}</span>
                              <button onClick={() => updateCartItemQuantity(item.index, 1)} aria-label={`Aumentar cantidad de ${item.productName}`}>+</button>
                            </div>
                          </div>
                          <div className="item-notes-input">
                            <input
                              type="text"
                              placeholder="Notas (opcional)"
                              value={item.notes}
                              onChange={(e) => updateCartItemNotes(item.index, e.target.value)}
                            />
                          </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div className="cart-footer">
                {selectedTable.type === 'DELIVERY' && calculatePackagingUnits() > 0 && (
                  <div className="packaging-summary">
                    <span>Empaque delivery ({calculatePackagingUnits()} {calculatePackagingUnits() === 1 ? 'unidad' : 'unidades'})</span>
                    <strong>S/ {calculatePackagingTotal().toFixed(2)}</strong>
                  </div>
                )}
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
                        <GroupedOrderItems items={order.items} />
                      </div>
                    )}
                    <div className="order-info">
                      <span>{countOrderSelections(order.items)} elemento{countOrderSelections(order.items) !== 1 ? 's' : ''}</span>
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
        <div className="modal-overlay order-taking-menu-overlay" onClick={closeMenuModal}>
          <div className="modal-content order-taking-menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Armar Menú</h3>
              <button className="btn-close" onClick={closeMenuModal} aria-label="Cerrar">×</button>
            </div>
            <div className="modal-body">
              <div className="menu-combo-section">
                <h4>Entrada <span className="required-mark" aria-hidden="true">*</span></h4>
                <select
                  required
                  aria-required="true"
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
                <h4>Plato de Fondo <span className="required-mark" aria-hidden="true">*</span></h4>
                <select
                  required
                  aria-required="true"
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

              <div className="menu-price-info">
                {menuCombo.plato ? (
                  <>
                    <span>Plato de fondo: S/ {Number(menuCombo.plato.productPrice).toFixed(2)}</span>
                    <span>Entrada: S/ {MENU_COMPLEMENT_PRICE.toFixed(2)}</span>
                    <strong>
                      Total del menú: S/ {(Number(menuCombo.plato.productPrice) + MENU_COMPLEMENT_PRICE).toFixed(2)}
                    </strong>
                  </>
                ) : (
                  <strong>Selecciona el plato de fondo para calcular el precio.</strong>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeMenuModal}>
                Cancelar
              </button>
              <button
                className="btn-confirm"
                onClick={handleCreateMenuCombo}
                disabled={!menuCombo.entrada || !menuCombo.plato}
              >
                Agregar al carrito
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
