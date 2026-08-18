const AdminDashboard = ({ user }) => {
  const stats = [
    {
      title: 'Ventas del Día',
      value: 'S/ 2,450.00',
      change: '+12%',
      changeType: 'positive',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
      color: '#10b981'
    },
    {
      title: 'Pedidos Activos',
      value: '23',
      change: '+5',
      changeType: 'positive',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      ),
      color: '#3b82f6'
    },
    {
      title: 'Mesas Ocupadas',
      value: '15/25',
      change: '60%',
      changeType: 'neutral',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="10" width="18" height="10" rx="2" />
          <path d="M3 10V6a2 2 0 012-2h14a2 2 0 012 2v4" />
        </svg>
      ),
      color: '#f59e0b'
    },
    {
      title: 'Clientes Hoy',
      value: '87',
      change: '+18%',
      changeType: 'positive',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      color: '#8b5cf6'
    }
  ]

  const recentOrders = [
    { id: '001', table: 'Mesa 5', amount: 'S/ 85.50', status: 'En proceso', time: '10:30 AM' },
    { id: '002', table: 'Mesa 12', amount: 'S/ 120.00', status: 'Listo', time: '10:25 AM' },
    { id: '003', table: 'Mesa 8', amount: 'S/ 95.75', status: 'En proceso', time: '10:20 AM' },
    { id: '004', table: 'Mesa 3', amount: 'S/ 67.00', status: 'Pagado', time: '10:15 AM' },
    { id: '005', table: 'Mesa 15', amount: 'S/ 145.25', status: 'En proceso', time: '10:10 AM' }
  ]

  const topProducts = [
    { name: 'Ceviche Clásico', sales: 45, amount: 'S/ 1,125' },
    { name: 'Lomo Saltado', sales: 38, amount: 'S/ 950' },
    { name: 'Arroz con Mariscos', sales: 32, amount: 'S/ 800' },
    { name: 'Chicharrón de Pescado', sales: 28, amount: 'S/ 700' }
  ]

  const getStatusClass = (status) => {
    switch (status) {
      case 'Listo':
        return 'status-ready'
      case 'En proceso':
        return 'status-processing'
      case 'Pagado':
        return 'status-paid'
      default:
        return ''
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Bienvenido,
          </h1>
          <p className="dashboard-subtitle">
            Panel de control administrativo del restaurante
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <p className={`stat-change ${stat.changeType}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="dashboard-grid">
        {/* Pedidos recientes */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Pedidos Recientes</h2>
            <button className="btn-link">Ver todos</button>
          </div>
          <div className="orders-list">
            {recentOrders.map((order) => (
              <div key={order.id} className="order-item">
                <div className="order-info">
                  <span className="order-id">#{order.id}</span>
                  <span className="order-table">{order.table}</span>
                </div>
                <div className="order-details">
                  <span className="order-time">{order.time}</span>
                  <span className={`order-status ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <span className="order-amount">{order.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Productos Más Vendidos</h2>
            <button className="btn-link">Ver reporte</button>
          </div>
          <div className="products-list">
            {topProducts.map((product, index) => (
              <div key={index} className="product-item">
                <div className="product-rank">{index + 1}</div>
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-sales">{product.sales} ventas</p>
                </div>
                <span className="product-amount">{product.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
