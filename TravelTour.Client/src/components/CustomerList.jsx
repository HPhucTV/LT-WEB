import { useEffect, useState } from 'react'
import { customerApi } from '../api'
import { useToast } from '../contexts/ToastContext'

export default function CustomerList() {
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    setLoading(true)
    try { setCustomers(await customerApi.list()) }
    catch { setCustomers([]) }
    finally { setLoading(false) }
  }

  async function handleSave(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const data = {
      fullName: form.get('fullName'),
      phone: form.get('phone'),
      email: form.get('email'),
      address: form.get('address'),
    }
    try {
      if (editItem) await customerApi.update(editItem.id, data)
      else await customerApi.create(data)
      setFormOpen(false)
      setEditItem(null)
      loadCustomers()
      toast.success(editItem ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng mới')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xác nhận xoá khách hàng "${name}"?`)) return
    try {
      await customerApi.remove(id)
      loadCustomers()
      toast.success(`Đã xoá khách hàng "${name}"`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>Quản lý khách hàng</h2>
          <p>Danh sách khách hàng và thông tin liên hệ.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setFormOpen(true) }}>+ Thêm khách hàng</button>
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSave}>
            <h2>{editItem ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}</h2>
            <div className="form-grid">
              <label>Họ tên<input name="fullName" required defaultValue={editItem?.fullName} /></label>
              <label>Số điện thoại<input name="phone" required defaultValue={editItem?.phone} /></label>
              <label>Email<input name="email" type="email" defaultValue={editItem?.email} /></label>
              <label>Địa chỉ<input name="address" defaultValue={editItem?.address} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
              <button type="submit" className="btn-primary">{editItem ? 'Cập nhật' : 'Thêm'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-msg">Đang tải...</p>
      ) : customers.length === 0 ? (
        <p className="empty-msg">Chưa có khách hàng nào.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Email</th><th>Địa chỉ</th><th>Hành động</th></tr></thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.fullName}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.address || '-'}</td>
                  <td className="row-actions">
                    <button className="btn-sm" onClick={() => { setEditItem(customer); setFormOpen(true) }}>Sửa</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(customer.id, customer.fullName)}>Xoá</button>
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
