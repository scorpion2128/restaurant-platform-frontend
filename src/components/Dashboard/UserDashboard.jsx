const UserDashboard = ({ user }) => {
  const myTasks = [
    { id: 1, table: 'Mesa 5', task: 'Tomar orden', priority: 'high', time: 'Ahora' },
    { id: 2, table: 'Mesa 12', task: 'Servir platos', priority: 'high', time: '2 min' },
    { id: 3, table: 'Mesa 8', task: 'Entregar cuenta', priority: 'medium', time: '5 min' },
    { id: 4, table: 'Mesa 3', task: 'Limpiar mesa', priority: 'low', time: '10 min' }
  ]

  const activeTables = [
    { number: 5, customers: 4, status: 'ordering', duration: '15 min' },
    { number: 12, customers: 2, status: 'eating', duration: '30 min' },
    { number: 8, customers: 6, status: 'paying', duration: '45 min' }
  ]

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ordering':
        return 'Ordenando'
      case 'eating':
        return 'Comiendo'
      case 'paying':
        return 'Por pagar'
      default:
        return status
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'ordering':
        return 'table-status-ordering'
      case 'eating':
        return 'table-status-eating'
      case 'paying':
        return 'table-status-paying'
      default:
        return ''
    }
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Hola, {user.firstName}
          </h1>
          <p className="dashboard-subtitle">
            Estas son tus tareas pendientes
          </p>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="quick-stats">
        <div className="quick-stat-card card">
          <div className="quick-stat-icon" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-label">Tareas Pendientes</p>
            <h3 className="quick-stat-value">{myTasks.length}</h3>
          </div>
        </div>

        <div className="quick-stat-card card">
          <div className="quick-stat-icon" style={{ backgroundColor: '#fed7aa', color: '#ea580c' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="10" width="18" height="10" rx="2" />
              <path d="M3 10V6a2 2 0 012-2h14a2 2 0 012 2v4" />
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-label">Mesas Activas</p>
            <h3 className="quick-stat-value">{activeTables.length}</h3>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="user-dashboard-grid">
        {/* Mis tareas */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Mis Tareas</h2>
          </div>
          <div className="tasks-list">
            {myTasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-content">
                  <div className="task-main">
                    <span className={`task-priority ${getPriorityClass(task.priority)}`}></span>
                    <div className="task-info">
                      <p className="task-table">{task.table}</p>
                      <p className="task-description">{task.task}</p>
                    </div>
                  </div>
                  <span className="task-time">{task.time}</span>
                </div>
                <button className="btn-task-complete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Completar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mesas activas */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Mesas Activas</h2>
          </div>
          <div className="tables-list">
            {activeTables.map((table) => (
              <div key={table.number} className="table-card">
                <div className="table-header">
                  <div className="table-number">Mesa {table.number}</div>
                  <span className={`table-status ${getStatusClass(table.status)}`}>
                    {getStatusLabel(table.status)}
                  </span>
                </div>
                <div className="table-details">
                  <div className="table-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    {table.customers} personas
                  </div>
                  <div className="table-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {table.duration}
                  </div>
                </div>
                <button className="btn btn-primary btn-table-action">
                  Ver detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
