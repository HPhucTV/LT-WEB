import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import travexLogo from '../assets/travex-logo.svg'

function getDashboardPath(role) {
  switch (role) {
    case 'admin': return '/admin'
    case 'staff': return '/staff'
    case 'customer': return '/customer'
    default: return '/customer'
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = mode === 'login'
        ? await authApi.login({ username, password })
        : await authApi.register({ username, password, fullName, email, phone, address })
      const user = login(result)
      toast.success(`Chào mừng, ${user.fullName || user.username}!`)
      navigate(getDashboardPath((user.role || '').toLowerCase()))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay"></div>
      <div className="login-content">
        <div className="login-hero">
          <button type="button" className="btn-back-home" onClick={() => navigate('/')}>← Về trang chủ</button>
          <h1>Bắt đầu chuyến phiêu lưu!</h1>
          <p>Khám phá thế giới cùng TraveX - hệ thống quản lý tour du lịch hàng đầu.</p>
        </div>
        <div className="login-form-container">
          <form className="login-card glass" onSubmit={handleSubmit}>
            <div className="login-brand"><img className="brand-logo" src={travexLogo} alt="TraveX" /><div><strong>TraveX</strong></div></div>
            <h2>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h2>
            {error && <p className="form-error">{error}</p>}
            {mode === 'register' && (
              <>
                <label>Họ tên<input required value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Nguyễn Văn A" /></label>
                <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="email@example.com" /></label>
                <label>Số điện thoại<input value={phone} onChange={event => setPhone(event.target.value)} placeholder="0901234567" /></label>
                <label>Địa chỉ<input value={address} onChange={event => setAddress(event.target.value)} placeholder="123 Đường ABC..." /></label>
              </>
            )}
            <label>Tên đăng nhập<input required value={username} onChange={event => setUsername(event.target.value)} placeholder="admin" /></label>
            <label>Mật khẩu<input type="password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="••••" /></label>
            <button type="submit" className="btn-primary login-btn" disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
            <p className="login-toggle">
              {mode === 'login'
                ? <>Chưa có tài khoản? <button type="button" onClick={() => { setMode('register'); setError('') }}>Đăng ký ngay</button></>
                : <>Đã có tài khoản? <button type="button" onClick={() => { setMode('login'); setError('') }}>Đăng nhập</button></>}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
