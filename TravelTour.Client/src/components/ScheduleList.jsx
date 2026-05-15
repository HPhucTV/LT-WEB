import { useEffect, useState } from 'react'
import { scheduleApi } from '../api'
import { useToast } from '../contexts/ToastContext'
import { formatDate } from '../utils/format'

export default function ScheduleList({ tour, onBack }) {
  const toast = useToast()
  const [schedules, setSchedules] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)

  useEffect(() => { loadSchedules() }, [tour.id])

  async function loadSchedules() {
    try { setSchedules(await scheduleApi.listByTour(tour.id)) }
    catch { setSchedules([]) }
  }

  async function handleSave(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const data = {
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      availableSeats: Number(form.get('availableSeats')),
      status: form.get('status'),
      guideName: form.get('guideName')?.trim() || null,
      note: form.get('note')?.trim() || null,
    }
    try {
      if (editItem) await scheduleApi.update(editItem.id, data)
      else await scheduleApi.create(tour.id, data)
      setFormOpen(false)
      setEditItem(null)
      loadSchedules()
      toast.success(editItem ? 'Đã cập nhật lịch' : 'Đã thêm lịch khởi hành')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xoá lịch khởi hành này?')) return
    try {
      await scheduleApi.remove(id)
      loadSchedules()
      toast.success('Đã xoá lịch')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <button className="btn-back" onClick={onBack}>← Quay lại danh sách tour</button>
      <section className="toolbar">
        <div>
          <h2>Lịch khởi hành - {tour.name}</h2>
          <p>Quản lý các đợt khởi hành cho tour này.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setFormOpen(true) }}>+ Thêm lịch</button>
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSave}>
            <h2>{editItem ? 'Cập nhật lịch' : 'Thêm lịch khởi hành'}</h2>
            <div className="form-grid">
              <label>Ngày bắt đầu<input name="startDate" type="date" required defaultValue={editItem?.startDate?.split('T')[0]} /></label>
              <label>Ngày kết thúc<input name="endDate" type="date" required defaultValue={editItem?.endDate?.split('T')[0]} /></label>
              <label>Số chỗ còn<input name="availableSeats" type="number" min="1" required defaultValue={editItem?.availableSeats || tour.maxGuests} /></label>
              <label>Trạng thái
                <select name="status" defaultValue={editItem?.status || 'Open'}>
                  <option value="Open">Mở đăng ký</option>
                  <option value="Closed">Đã đóng</option>
                  <option value="Full">Hết chỗ</option>
                </select>
              </label>
              <label>Hướng dẫn viên<input name="guideName" defaultValue={editItem?.guideName || ''} /></label>
              <label>Ghi chú<input name="note" defaultValue={editItem?.note || ''} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
              <button type="submit" className="btn-primary">{editItem ? 'Cập nhật' : 'Thêm'}</button>
            </div>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className="empty-msg">Chưa có lịch khởi hành nào.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Số chỗ còn</th><th>Hướng dẫn viên</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {schedules.map(schedule => (
                <tr key={schedule.id}>
                  <td>{schedule.id}</td>
                  <td>{formatDate(schedule.startDate)}</td>
                  <td>{formatDate(schedule.endDate)}</td>
                  <td>{schedule.availableSeats}</td>
                  <td>{schedule.guideName || 'Chưa phân công'}</td>
                  <td><span className={schedule.status === 'Open' ? 'open' : 'closed'}>{schedule.status === 'Open' ? 'Mở' : schedule.status === 'Full' ? 'Hết chỗ' : 'Đóng'}</span></td>
                  <td className="row-actions">
                    <button className="btn-sm" onClick={() => { setEditItem(schedule); setFormOpen(true) }}>Sửa</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(schedule.id)}>Xoá</button>
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
