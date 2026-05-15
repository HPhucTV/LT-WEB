import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Route guard that checks user role.
 * @param {string[]} allowedRoles - e.g. ['admin'] or ['admin','staff']
 */
export default function ProtectedRoute({ children, allowedRoles = ['admin', 'staff'] }) {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>

  const role = (user?.role || '').toLowerCase()
  if (!user || !allowedRoles.includes(role)) return <Navigate to="/login" replace />

  return children
}
