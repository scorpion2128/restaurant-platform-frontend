import { useAuth } from '../context/AuthContext'
import { USER_ROLES, hasRole } from '../constants'
import Layout from '../components/Layout/Layout'
import AdminDashboard from '../components/Dashboard/AdminDashboard'
import UserDashboard from '../components/Dashboard/UserDashboard'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="dashboard-container fade-in">
        {hasRole(user, USER_ROLES.ADMIN) ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
