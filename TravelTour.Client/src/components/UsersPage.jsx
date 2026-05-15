import { useEffect, useState } from 'react'
import { userApi } from '../api'
import { useToast } from '../contexts/ToastContext'

const ROLE_LABELS = {
  Admin: 'Quản trị viên',
  Staff: 'Hướng dẫn viên',
  Customer: 'Khách hàng',
}

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try { setUsers(await userApi.list()) }
    catch { setUsers([]) }
    finally { setLoading(false) }
  }

  async function handleRoleChange(id, role) {
    try {
      await userApi.updateRole(id, role)
      loadUsers()
      toast.success('Đã cập nhật vai trò')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xoá người dùng "${name}"?`)) return
    try {
      await userApi.remove(id)
      loadUsers()
      toast.success(`Đã xoá người dùng "${name}"`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>Quản lý người dùng</h2>
          <p>Quản lý tài khoản và vai trò truy cập hệ thống.</p>
        </div>
      </section>

      {loading ? (
        <p className="empty-msg">Đang tải...</p>
      ) : users.length === 0 ? (
        <p className="empty-msg">Chưa có người dùng nào.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Tên đăng nhập</th><th>Họ tên</th><th>Vai trò</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>
                    <select className={`status-select ${user.role.toLowerCase()}`} value={user.role} onChange={event => handleRoleChange(user.id, event.target.value)}>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="row-actions">
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(user.id, user.username)}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
