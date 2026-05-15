import { useEffect, useMemo, useState } from 'react'
import { guideApi, scheduleApi, tourApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { formatDate } from '../../utils/format'

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Mở đăng ký' },
  { value: 'Closed', label: 'Đã đóng' },
  { value: 'Full', label: 'Hết chỗ' },
  { value: 'Departed', label: 'Đã khởi hành' },
  { value: 'Completed', label: 'Đã kết thúc' },
]

function toDateInput(value) {
  return value ? String(value).split('T')[0] : ''
}

function statusLabel(status) {
  return STATUS_OPTIONS.find(item => item.value === status)?.label || status
}

function statusClass(status) {
  if (status === 'Open') return 'active'
  if (status === 'Full') return 'warning'
  if (status === 'Closed') return 'inactive'
  return 'neutral'
}

function normalize(value) {
  return (value || '').trim().toLowerCase()
}

function isAssignedToGuide(schedule, user) {
  const guide = normalize(schedule.guideName)
  if (!guide) return false
  return guide === normalize(user?.fullName) || guide === normalize(user?.username)
}

export default function StaffSchedule({ canManage = false }) {
  const { user } = useAuth()
  const toast = useToast()
  const [schedules, setSchedules] = useState([])
  const [tours, setTours] = useState([])
  const [filter, setFilter] = useState({ tourId: '', status: '', keyword: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formDates, setFormDates] = useState({ startDate: '', endDate: '' })
  const [availableGuides, setAvailableGuides] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [scheduleData, tourData] = await Promise.all([scheduleApi.list(), tourApi.list()])
      setSchedules(scheduleData || [])
      setTours(tourData || [])
    } catch {
      setSchedules([])
      setTours([])
    }
  }

  const filteredSchedules = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase()
    const visibleSchedules = canManage ? schedules : schedules.filter(item => isAssignedToGuide(item, user))
    return visibleSchedules.filter(item => {
      const matchesTour = !filter.tourId || item.tourId === Number(filter.tourId)
      const matchesStatus = !filter.status || item.status === filter.status
      const haystack = `${item.tourName || ''} ${item.guideName || ''}`.toLowerCase()
      return matchesTour && matchesStatus && (!keyword || haystack.includes(keyword))
    })
  }, [canManage, filter, schedules, user])

  const stats = useMemo(() => {
    const visibleSchedules = canManage ? schedules : schedules.filter(item => isAssignedToGuide(item, user))
    return visibleSchedules.reduce((acc, item) => {
      acc.total += 1
      acc.open += item.status === 'Open' ? 1 : 0
      acc.booked += item.bookedSeats || 0
      acc.available += item.availableSeats || 0
      return acc
    }, { total: 0, open: 0, booked: 0, available: 0 })
  }, [canManage, schedules, user])

  useEffect(() => {
    if (!canManage || !formOpen || !formDates.startDate || !formDates.endDate) {
      setAvailableGuides([])
      return
    }

    guideApi.available(formDates.startDate, formDates.endDate)
      .then(data => setAvailableGuides(data || []))
      .catch(() => setAvailableGuides([]))
  }, [canManage, formDates, formOpen])

  function openCreateForm() {
    setEditItem(null)
    setFormDates({ startDate: '', endDate: '' })
    setFormOpen(true)
  }

  function openEditForm(item) {
    setEditItem(item)
    setFormDates({ startDate: toDateInput(item.startDate), endDate: toDateInput(item.endDate) })
    setFormOpen(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const tourId = Number(form.get('tourId'))
    const payload = {
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      availableSeats: Number(form.get('availableSeats')),
      status: form.get('status'),
      guideUserId: form.get('guideUserId') ? Number(form.get('guideUserId')) : null,
      guideName: null,
      note: form.get('note')?.trim() || null,
    }

    try {
      if (editItem) {
        await scheduleApi.update(editItem.id, payload)
        toast.success('Đã cập nhật lịch trình')
      } else {
        await scheduleApi.create(tourId, payload)
        toast.success('Đã thêm lịch trình')
      }
      setFormOpen(false)
      setEditItem(null)
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Xoá lịch của "${item.tourName}"?`)) return
    try {
      await scheduleApi.remove(item.id)
      toast.success('Đã xoá lịch trình')
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section className="schedule-page">
      <div className="schedule-summary">
        <article>
          <span>Tổng lịch</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Đang mở</span>
          <strong>{stats.open}</strong>
        </article>
        <article>
          <span>Đã đặt</span>
          <strong>{stats.booked}</strong>
        </article>
        <article>
          <span>Còn trống</span>
          <strong>{stats.available}</strong>
        </article>
      </div>

      <section className="toolbar">
        <div>
          <h2>{canManage ? 'Lịch trình tour' : 'Lịch hướng dẫn của tôi'}</h2>
          <p>{canManage ? 'Quản lý đợt khởi hành, phân công hướng dẫn viên và theo dõi số chỗ.' : 'Theo dõi các chuyến đi được phân công và số lượng khách.'}</p>
        </div>
        <div className="toolbar-actions">
          <input
            value={filter.keyword}
            onChange={e => setFilter({ ...filter, keyword: e.target.value })}
            placeholder="Tìm tour hoặc hướng dẫn viên..."
          />
          <select value={filter.tourId} onChange={e => setFilter({ ...filter, tourId: e.target.value })}>
            <option value="">Tất cả tour</option>
            {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {canManage && <button className="btn-primary" onClick={openCreateForm}>+ Thêm lịch</button>}
        </div>
      </section>

      {filteredSchedules.length === 0 ? (
        <p className="empty-msg">Chưa có lịch trình phù hợp.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tour</th>
                <th>Thời gian</th>
                <th>Hướng dẫn viên</th>
                <th>Tiến độ</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                {canManage && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map(item => {
                const booked = item.bookedSeats || 0
                const totalSeats = booked + (item.availableSeats || 0)
                const percent = totalSeats > 0 ? Math.round((booked / totalSeats) * 100) : 0

                return (
                  <tr key={item.id}>
                    <td><strong>{item.tourName}</strong></td>
                    <td>{formatDate(item.startDate)} - {formatDate(item.endDate)}</td>
                    <td>{item.guideName || 'Chưa phân công'}</td>
                    <td>
                      <div className="schedule-progress">
                        <div><span style={{ width: `${percent}%` }} /></div>
                        <small>{booked}/{totalSeats} khách</small>
                      </div>
                    </td>
                    <td><span className={`status-badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td>
                    <td>{item.note || '-'}</td>
                    {canManage && (
                      <td className="row-actions">
                        <button className="btn-sm" onClick={() => openEditForm(item)}>Sửa</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(item)}>Xoá</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {canManage && formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSave}>
            <h2>{editItem ? 'Cập nhật lịch trình' : 'Thêm lịch trình'}</h2>
            <div className="form-grid">
              <label>Tour
                <select name="tourId" required defaultValue={editItem?.tourId || ''} disabled={!!editItem}>
                  <option value="">Chọn tour</option>
                  {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
                </select>
              </label>
              <label>Ngày khởi hành
                <input
                  name="startDate"
                  type="date"
                  required
                  value={formDates.startDate}
                  onChange={event => setFormDates({ ...formDates, startDate: event.target.value })}
                />
              </label>
              <label>Ngày kết thúc
                <input
                  name="endDate"
                  type="date"
                  required
                  value={formDates.endDate}
                  onChange={event => setFormDates({ ...formDates, endDate: event.target.value })}
                />
              </label>
              <label>Số chỗ còn
                <input name="availableSeats" type="number" min="1" required defaultValue={editItem?.availableSeats || 20} />
              </label>
              <label>Trạng thái
                <select name="status" defaultValue={editItem?.status || 'Open'}>
                  {STATUS_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="form-grid-wide">Hướng dẫn viên
                <select name="guideUserId" defaultValue={editItem?.guideUserId || ''}>
                  <option value="">Chưa phân công</option>
                  {editItem?.guideUserId && !availableGuides.some(guide => guide.id === editItem.guideUserId) && (
                    <option value={editItem.guideUserId}>{editItem.guideName || 'Hướng dẫn viên hiện tại'}</option>
                  )}
                  {availableGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>
                      {guide.fullName}{guide.availabilityNote ? ` - ${guide.availabilityNote}` : ''}
                    </option>
                  ))}
                </select>
                <small>{formDates.startDate && formDates.endDate ? 'Chỉ hiển thị hướng dẫn viên đã khai báo rảnh và chưa bị trùng tour.' : 'Chọn ngày để xem hướng dẫn viên rảnh.'}</small>
              </label>
              <label className="form-grid-wide">Ghi chú
                <textarea name="note" rows="3" defaultValue={editItem?.note || ''} placeholder="Thông tin nội bộ cho chuyến đi" />
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
