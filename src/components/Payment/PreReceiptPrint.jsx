import { useEffect, useRef } from 'react';
import './ReceiptPrint.css';

const PreReceiptPrint = ({ account, onClose }) => {
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
          <div className="receipt-content pre-receipt">
            {/* Header */}
            <div className="receipt-header">
              <div className="watermark">PRE-CUENTA</div>
              <div className="watermark-subtitle">NO ES COMPROBANTE DE PAGO</div>
            </div>

            {/* Info básica */}
            <div className="receipt-section">
              <div className="receipt-row">
                <span>Fecha:</span>
                <span>{new Date().toLocaleString('es-PE')}</span>
              </div>
              <div className="receipt-row">
                <span>Mesa:</span>
                <span>{account.tableName}</span>
              </div>
              <div className="receipt-row">
                <span>Mesero:</span>
                <span>{account.waiter.fullName}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Detalle de órdenes */}
            <div className="receipt-section">
              <h3>DETALLE:</h3>
              {account.orders.map((order) => {
                const groups = groupItemsByMenuAndSection(order.items);
                return (
                  <div key={order.orderId} className="receipt-order">
                    <div className="receipt-order-header">
                      Orden: {order.orderNumber}
                    </div>
                    {order.packagingTotal > 0 && (
                      <div className="receipt-item"><span>{order.packagingUnits}x Empaque delivery</span><span>S/ {order.packagingTotal.toFixed(2)}</span></div>
                    )}
                    
                    {groups.map((group, groupIdx) => (
                      <div key={groupIdx} className="receipt-group">
                        {group.type === 'menu' ? (
                          <>
                            <div className="receipt-group-label">MENÚ</div>
                            {group.items.map((item, idx) => (
                              <div key={idx} className="receipt-item">
                                <div className="item-line">
                                  <span>{item.quantity}x {item.productName}</span>
                                  {item.unitPrice > 0 && (
                                    <span>S/ {item.subtotal.toFixed(2)}</span>
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
                                  <span>{item.quantity}x {item.productName}</span>
                                  <span>S/ {item.subtotal.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="receipt-divider"></div>

            {/* Totales */}
            <div className="receipt-section">
              <div className="receipt-row">
                <span>Subtotal:</span>
                <span>S/ {account.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>IGV (18%):</span>
                <span>S/ {account.igvAmount.toFixed(2)}</span>
              </div>
              <div className="receipt-divider-bold"></div>
              <div className="receipt-row receipt-total">
                <span>TOTAL:</span>
                <strong>S/ {account.totalWithIgv.toFixed(2)}</strong>
              </div>
            </div>

            <div className="receipt-footer">
              <p>* Esta es una pre-cuenta *</p>
              <p>Solicite su comprobante de pago</p>
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

export default PreReceiptPrint;
