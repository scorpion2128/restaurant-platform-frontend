import { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import Toast from '../Toast/Toast';
import PreReceiptPrint from './PreReceiptPrint';
import ReceiptPrint from './ReceiptPrint';
import './PaymentModal.css';

const PaymentModal = ({ tableId, onClose, onPaymentComplete }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('account'); // 'account' o 'payment'
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [methodAmount, setMethodAmount] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showPreReceipt, setShowPreReceipt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTableAccount();
  }, [tableId]);

  const loadTableAccount = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getTableAccount(tableId);
      if (response.success) {
        setAccount(response.data);
      } else {
        showToast('Error al cargar la cuenta', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error al cargar la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleAddPaymentMethod = () => {
    if (!methodAmount || parseFloat(methodAmount) <= 0) {
      showToast('Ingrese un monto válido', 'error');
      return;
    }

    const amount = parseFloat(methodAmount);
    const totalAdded = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    const remaining = account.totalWithIgv - totalAdded;

    if (amount > remaining) {
      showToast(`El monto no puede exceder S/ ${remaining.toFixed(2)}`, 'error');
      return;
    }

    if (selectedMethod === 'CASH') {
      const received = parseFloat(amountReceived);
      if (!amountReceived || received < amount) {
        showToast('Monto recibido debe ser mayor o igual al monto', 'error');
        return;
      }

      const changeGiven = received - amount;
      setPaymentMethods([
        ...paymentMethods,
        {
          method: selectedMethod,
          amount: amount,
          amountReceived: received,
          changeGiven: changeGiven
        }
      ]);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        {
          method: selectedMethod,
          amount: amount
        }
      ]);
    }

    // Reset form
    setMethodAmount('');
    setAmountReceived('');
  };

  const handleRemovePaymentMethod = (index) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const getTotalPaid = () => {
    return paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
  };

  const getRemaining = () => {
    return account.totalWithIgv - getTotalPaid();
  };

  const canConfirmPayment = () => {
    return paymentMethods.length > 0 && getRemaining() === 0;
  };

  const handleConfirmPayment = async () => {
    if (!canConfirmPayment()) {
      showToast('Debe cubrir el total de la cuenta', 'error');
      return;
    }

    try {
      setProcessing(true);
      const orderIds = account.orders.map(order => order.orderId);

      const response = await paymentService.processPayment({
        tableId: account.tableId,
        orderIds: orderIds,
        paymentMethods: paymentMethods,
        observations: null
      });

      if (response.success) {
        setReceiptData(response.data);
        setShowReceipt(true);
        showToast('Pago procesado exitosamente', 'success');
        // No cerrar automáticamente - permitir reimprimir
      } else {
        showToast('Error al procesar el pago', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error al procesar el pago', 'error');
    } finally {
      setProcessing(false);
    }
  };

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

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="payment-modal">
          <div className="loading">Cargando cuenta...</div>
        </div>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="payment-modal-header">
            <h2>
              {view === 'account' ? `💰 Cuenta - ${account.tableName}` : '💳 Procesar Pago'}
            </h2>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>

          {/* Content */}
          <div className="payment-modal-content">
            {view === 'account' ? (
              /* Vista de Cuenta */
              <>
                <div className="account-section">
                  <h3>Órdenes</h3>
                  {account.orders.map((order) => {
                    const groups = groupItemsByMenuAndSection(order.items);
                    return (
                      <div key={order.orderId} className="order-card">
                        <div className="order-card-header">
                          <span className="order-number">{order.orderNumber}</span>
                          <span className="order-date">
                            {new Date(order.createdAt).toLocaleString('es-PE')}
                          </span>
                        </div>
                        <div className="order-items-list">
                          {groups.map((group, groupIdx) => (
                            <div key={groupIdx} className="item-group-section">
                              {group.type === 'menu' ? (
                                <>
                                  <div className="group-label">MENÚ</div>
                                  {group.items.map((item, idx) => (
                                    <div key={idx} className="order-item-row">
                                      <span className="item-qty">{item.quantity}x</span>
                                      <span className="item-name">{item.productName}</span>
                                      {item.unitPrice > 0 && (
                                        <span className="item-price">S/ {item.subtotal.toFixed(2)}</span>
                                      )}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <div className="group-label">{group.sectionName.toUpperCase()}</div>
                                  {group.items.map((item, idx) => (
                                    <div key={idx} className="order-item-row">
                                      <span className="item-qty">{item.quantity}x</span>
                                      <span className="item-name">{item.productName}</span>
                                      <span className="item-price">S/ {item.subtotal.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="order-total">
                          Total: <strong>S/ {order.total.toFixed(2)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="account-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>S/ {account.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>IGV (18%):</span>
                    <span>S/ {account.igvAmount.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>TOTAL:</span>
                    <strong>S/ {account.totalWithIgv.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="account-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowPreReceipt(true)}
                  >
                    🖨️ Imprimir Pre-Cuenta
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => setView('payment')}
                  >
                    💳 Procesar Pago
                  </button>
                </div>
              </>
            ) : (
              /* Vista de Pago */
              <>
                <div className="payment-summary">
                  <div className="summary-info">
                    <div>Total a Pagar: <strong>S/ {account.totalWithIgv.toFixed(2)}</strong></div>
                    <div>Total Agregado: <strong>S/ {getTotalPaid().toFixed(2)}</strong></div>
                    <div className={getRemaining() > 0 ? 'remaining' : 'complete'}>
                      Restante: <strong>S/ {getRemaining().toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Lista de métodos agregados */}
                {paymentMethods.length > 0 && (
                  <div className="payment-methods-list">
                    <h4>Métodos de Pago Agregados:</h4>
                    {paymentMethods.map((pm, idx) => (
                      <div key={idx} className="payment-method-item">
                        <div className="method-info">
                          <span className="method-name">{getPaymentMethodLabel(pm.method)}</span>
                          <span className="method-amount">S/ {pm.amount.toFixed(2)}</span>
                          {pm.method === 'CASH' && (
                            <span className="method-details">
                              Recibido: S/ {pm.amountReceived.toFixed(2)} | 
                              Vuelto: S/ {pm.changeGiven.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button 
                          className="btn-remove"
                          onClick={() => handleRemovePaymentMethod(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar nuevo método */}
                {getRemaining() > 0 && (
                  <div className="add-payment-method">
                    <h4>Agregar Método de Pago:</h4>
                    
                    <div className="form-group">
                      <label>Método</label>
                      <select 
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                      >
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="YAPE">Yape</option>
                        <option value="PLIN">Plin</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Monto</label>
                      <input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={getRemaining()}
                        value={methodAmount}
                        onChange={(e) => setMethodAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    {selectedMethod === 'CASH' && (
                      <div className="form-group">
                        <label>Monto Recibido</label>
                        <input 
                          type="number"
                          step="0.01"
                          min={methodAmount || 0}
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          placeholder="0.00"
                        />
                        {amountReceived && methodAmount && (
                          <div className="change-preview">
                            Vuelto: S/ {(parseFloat(amountReceived) - parseFloat(methodAmount)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      className="btn-add-method"
                      onClick={handleAddPaymentMethod}
                    >
                      ➕ Agregar
                    </button>
                  </div>
                )}

                <div className="payment-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setView('account')}
                  >
                    ← Volver
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleConfirmPayment}
                    disabled={!canConfirmPayment() || processing}
                  >
                    {processing ? 'Procesando...' : '✅ Confirmar Pago e Imprimir'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Receipt Print */}
      {showPreReceipt && account && (
        <PreReceiptPrint 
          account={account}
          onClose={() => setShowPreReceipt(false)}
        />
      )}

      {/* Receipt Print */}
      {showReceipt && receiptData && (
        <ReceiptPrint 
          receipt={receiptData}
          onClose={() => {
            setShowReceipt(false);
            if (onPaymentComplete) {
              onPaymentComplete();
            }
            onClose();
          }}
        />
      )}

      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
};

export default PaymentModal;
