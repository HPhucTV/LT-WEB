import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, setToken, clearToken as clearStoredToken, isLoggedIn } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isLoggedIn())

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return }
    authApi.me()
      .then(data => setUser(data))
      .catch(() => { clearStoredToken(); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((result) => {
    setToken(result.token)
    const u = result.user || { id: result.id, username: result.username, fullName: result.fullName, role: result.role }
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => { clearStoredToken(); setUser(null) }, [])

  const role = (user?.role || '').toLowerCase()
  const isAdmin = role === 'admin'
  const isStaff = role === 'staff'
  const isSales = role === 'sales'
  const hasAdminAccess = isAdmin || isSales

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isStaff, isSales, hasAdminAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
