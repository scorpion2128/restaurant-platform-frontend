import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { USER_ROLES } from './constants'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Tables from './pages/Tables'
import ProductCategories from './pages/ProductCategories'
import Products from './pages/Products'
import MenuTemplates from './pages/MenuTemplates'
import DailyMenus from './pages/DailyMenus'
import OrderTaking from './pages/OrderTaking'
import KitchenDashboard from './pages/KitchenDashboard'
import OrdersMonitor from './pages/OrdersMonitor'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tables" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <Tables />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/product-categories" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <ProductCategories />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <Products />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/menu-templates" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <MenuTemplates />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/daily-menus" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <DailyMenus />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders/take" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.WAITER]}>
                <OrderTaking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.KITCHEN]}>
                <KitchenDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders/monitor" 
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <OrdersMonitor />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
