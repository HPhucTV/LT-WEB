import { useEffect, useMemo, useState } from 'react'
import { guideAvailabilityApi } from '../../api'
import { useToast } from '../../contexts/ToastContext'
import { formatDate } from '../../utils/format'

function toDateInput(value) {
  return value ? String(value).split('T')[0] : ''
}

function availabilityStatusLabel(status) {
  return status === 'Available' ? 'Còn trống' : status
}

export default function StaffAvailability() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try { setItems(await guideAvailabilityApi.mine()) }
    catch { setItems([]) }
    finally { setLoading(false) }
  }

  const upcomingItems = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return items
      .filter(item => new Date(item.endDate) >= today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  }, [items])

  async function handleSave(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      note: form.get('note')?.trim() || null,
    }

    try {
      if (editItem) {
        await guideAvailabilityApi.update(editItem.id, payload)
        toast.success('Đã cập nhật lịch trống')
      } else {
        await guideAvailabilityApi.create(payload)
        toast.success('Đã thêm lịch trống')
      }
      setFormOpen(false)
      setEditItem(null)
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Xoá lịch trống từ ${formatDate(item.startDate)} đến ${formatDate(item.endDate)}?`)) return
    try {
      await guideAvailabilityApi.remove(item.id)
      toast.success('Đã xoá lịch trống')
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section>
      <section className="toolbar">
        <div>
          <h2>Lịch trống của tôi</h2>
          <p>Khai báo khoảng thời gian có thể nhận tour để quản trị viên phân công.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setFormOpen(true) }}>+ Thêm lịch trống</button>
      </section>

      <div className="schedule-summary">
        <article><span>Tổng lịch trống</span><strong>{items.length}</strong></article>
        <article><span>Sắp tới</span><strong>{upcomingItems.length}</strong></article>
        <article><span>Đã qua</span><strong>{items.length - upcomingItems.length}</strong></article>
      </div>

      {upcomingItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
          {upcomingItems.slice(0, 6).map(item => (
            <article key={`card-${item.id}`} className="staff-card" style={{ padding: 18 }}>
              <span className="status-badge active">{availabilityStatusLabel(item.status)}</span>
              <h3 style={{ margin: '12px 0 6px', fontSize: 16 }}>{formatDate(item.startDate)} - {formatDate(item.endDate)}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{item.note || 'Sẵn sàng nhận tour trong khoảng thời gian này.'}</p>
            </article>
          ))}
        </div>
      )}

      {loading ? (
        <p className="empty-msg">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="empty-msg">Bạn chưa khai báo lịch trống nào.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Trạng thái</th><th>Ghi chú</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {upcomingItems.concat(items.filter(item => !upcomingItems.includes(item))).map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td><span className="status-badge active">{availabilityStatusLabel(item.status)}</span></td>
                  <td>{item.note || '-'}</td>
                  <td className="row-actions">
                    <button className="btn-sm" onClick={() => { setEditItem(item); setFormOpen(true) }}>Sửa</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(item)}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSave}>
            <h2>{editItem ? 'Cập nhật lịch trống' : 'Thêm lịch trống'}</h2>
            <div className="form-grid">
              <label>Ngày bắt đầu
                <input name="startDate" type="date" required defaultValue={toDateInput(editItem?.startDate)} />
              </label>
              <label>Ngày kết thúc
                <input name="endDate" type="date" required defaultValue={toDateInput(editItem?.endDate)} />
              </label>
              <label className="form-grid-wide">Ghi chú
                <textarea name="note" rows="3" defaultValue={editItem?.note || ''} placeholder="Ví dụ: ưu tiên tour miền Trung, có thể đi dài ngày..." />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
              <button type="submit" className="btn-primary">{editItem ? 'Cập nhật' : 'Thêm'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
