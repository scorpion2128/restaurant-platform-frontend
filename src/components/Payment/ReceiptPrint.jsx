import { useEffect, useRef } from 'react';
import './ReceiptPrint.css';

const ReceiptPrint = ({ receipt, onClose }) => {
  const { payment, restaurant, orders } = receipt;
  const printCalled = useRef(false);

  useEffect(() => {
    // Auto-abrir diálogo de impresión solo una vez
    if (!printCalled.current) {
      printCalled.current = true;
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getServiceLocation = () => payment.tableName?.startsWith('Delivery') ? 'Delivery' : payment.tableName;
  const getWaiterName = () => payment.waiterName
    ?.replace(/\s*[.,;:-]+\s*$/, '')
    .trim()
    .split(/\s+/)[0];
  const orderNumbers = orders.map(order => order.orderNumber).join(', ');

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'YAPE': 'Yape',
      'PLIN': 'Plin'
    };
    return labels[method] || method;
  };

  // Agrupar items por menú y sección
  const groupItemsByMenuAndSection = (items) => {
    const groups = [];
    const menuGroups = {};
    const individualGroups = {};

    items.forEach(item => {
      if (item.isPartOfMenu && item.menuGroupId) {
        // Items de menú
        if (!menuGroups[item.menuGroupId]) {
          menuGroups[item.menuGroupId] = [];
        }
        menuGroups[item.menuGroupId].push(item);
      } else {
        // Items individuales agrupados por sección
        const section = item.sectionName || 'Otros';
        if (!individualGroups[section]) {
          individualGroups[section] = [];
        }
        individualGroups[section].push(item);
      }
    });

    // Agregar grupos de menú
    Object.entries(menuGroups).forEach(([menuGroupId, items]) => {
      groups.push({
        type: 'menu',
        menuGroupId: parseInt(menuGroupId),
        items: items
      });
    });

    // Agregar grupos individuales por sección
    Object.entries(individualGroups).forEach(([sectionName, items]) => {
      groups.push({
        type: 'section',
        sectionName: sectionName,
        items: items
      });
    });

    return groups;
  };

  return (
    <div className="print-container">
      <div className="receipt-overlay" onClick={onClose}>
        <div className="receipt-preview" onClick={(e) => e.stopPropagation()}>
          <div className="receipt-content">
            {/* Header */}
            <div className="receipt-header">
              <h2>{restaurant.name}</h2>
              {restaurant.companyName && (
                <div className="company-name">{restaurant.companyName}</div>
              )}
              {restaurant.ruc && (
                <div>RUC: {restaurant.ruc}</div>
              )}
              {restaurant.address && (
                <div className="address">{restaurant.address}</div>
              )}
              {restaurant.phone && (
                <div>Tel: {restaurant.phone}</div>
              )}
              {restaurant.email && (
                <div>{restaurant.email}</div>
              )}
            </div>

            <div className="receipt-divider"></div>

            {/* Tipo de comprobante */}
            <div className="receipt-type">
              <h3>BOLETA DE VENTA</h3>
              <div className="receipt-number">Nro: {payment.paymentNumber}</div>
            </div>

            <div className="receipt-divider"></div>

            {/* Info básica */}
            <div className="receipt-section receipt-meta">
              <div className="receipt-row">
                <span>{orders.length > 1 ? 'Órdenes:' : 'Orden:'}</span>
                <span>{orderNumbers}</span>
              </div>
              <div className="receipt-row">
                <span>Fecha:</span>
                <span>{new Date(payment.paidAt).toLocaleString('es-PE')}</span>
              </div>
              <div className="receipt-row">
                <span>Mesa:</span>
                <span>{getServiceLocation()}</span>
              </div>
              <div className="receipt-row">
                <span>Mesero:</span>
                <span>{getWaiterName()}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Detalle de órdenes */}
            <div className="receipt-section">
              {orders.map((order) => {
                const groups = groupItemsByMenuAndSection(order.items);
                return (
                  <div key={order.orderId} className="receipt-order">
                    {groups.map((group, groupIdx) => (
                      <div key={groupIdx} className="receipt-group">
                        {group.type === 'menu' ? (
                          <>
                            <div className="receipt-group-label">MENÚ</div>
                            {group.items.map((item, idx) => (
                              <div key={idx} className="receipt-item">
                                <div className="item-line">
                                  <span className="item-line-qty">{item.quantity}</span>
                                  <span className="item-line-name">{item.productName}</span>
                                  {idx === 0 && (
                                    <span className="item-line-price">
                                      {group.items.reduce((total, menuItem) => total + Number(menuItem.subtotal || 0), 0).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            <div className="receipt-group-label">{group.sectionName.toUpperCase()}</div>
                            {group.items.map((item, idx) => (
                              <div key={idx} className="receipt-item">
                                <div className="item-line">
                                  <span className="item-line-qty">{item.quantity}</span>
                                  <span className="item-line-name">{item.productName}</span>
                                  <span className="item-line-price">{item.subtotal.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                    {order.packagingTotal > 0 && (
                      <div className="receipt-item packaging-receipt-item">
                        <div className="item-line">
                          <span className="item-line-qty">{order.packagingUnits}</span>
                          <span className="item-line-name">Empaque delivery</span>
                          <span className="item-line-price">{order.packagingTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="receipt-divider"></div>

            {/* Totales */}
            <div className="receipt-section receipt-totals">
              <div className="receipt-row">
                <span>Subtotal:</span>
                <span>{payment.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>IGV (18%):</span>
                <span>{payment.igvAmount.toFixed(2)}</span>
              </div>
              <div className="receipt-divider-bold"></div>
              <div className="receipt-row receipt-total">
                <span>TOTAL:</span>
                <strong>S/ {payment.totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Métodos de pago */}
            <div className="receipt-section">
              <h3>PAGOS:</h3>
              {payment.paymentMethods.map((method, idx) => (
                <div key={idx} className="payment-method-detail">
                  <div className="receipt-row">
                    <span>{getPaymentMethodLabel(method.paymentMethod)}:</span>
                    <span>{method.amount.toFixed(2)}</span>
                  </div>
                  {method.paymentMethod === 'CASH' && (
                    <>
                      <div className="receipt-row indent">
                        <span>Recibido:</span>
                        <span>{method.amountReceived.toFixed(2)}</span>
                      </div>
                      <div className="receipt-row indent">
                        <span>Vuelto:</span>
                        <span>{method.changeGiven.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            {/* Footer */}
            <div className="receipt-footer">
              {restaurant.receiptFooter && (
                <p>{restaurant.receiptFooter}</p>
              )}
              <p>¡Gracias por su preferencia!</p>
            </div>
          </div>

          <div className="receipt-actions">
            <button className="btn-print" onClick={handlePrint}>
              🖨️ Imprimir
            </button>
            <button className="btn-close-preview" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;
