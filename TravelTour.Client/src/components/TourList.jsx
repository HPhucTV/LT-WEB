import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatVND } from '../utils/format'
import ScheduleList from './ScheduleList'
import TourForm from './TourForm'

export default function TourList() {
  const { tours, onRefresh } = useOutletContext()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isCustomer = user?.role?.toLowerCase() === 'customer' || !user?.role
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTour, setEditTour] = useState(null)
  const [scheduleTour, setScheduleTour] = useState(null)

  const filtered = tours.filter(tour => {
    const keyword = search.toLowerCase()
    return tour.name.toLowerCase().includes(keyword) || tour.code.toLowerCase().includes(keyword) || tour.destination.toLowerCase().includes(keyword)
  })

  async function handleDelete(id, name) {
    if (!confirm(`Xác nhận xoá tour "${name}"?`)) return
    try {
      await tourApi.remove(id)
      onRefresh()
      toast.success(`Đã xoá tour "${name}"`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (scheduleTour) {
    return <ScheduleList tour={scheduleTour} onBack={() => setScheduleTour(null)} />
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>Danh sách tour</h2>
          <p>{isCustomer ? 'Tìm kiếm và đặt các tour du lịch hấp dẫn.' : 'Quản lý thông tin tour, điểm đến, giá và sức chứa.'}</p>
        </div>
        <div className="toolbar-actions">
          <input placeholder="Tìm tour, mã tour, điểm đến..." value={search} onChange={event => setSearch(event.target.value)} />
          {!isCustomer && <button className="btn-primary" onClick={() => { setEditTour(null); setFormOpen(true) }}>+ Thêm tour</button>}
        </div>
      </section>

      {formOpen && <TourForm tour={editTour} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); onRefresh() }} />}

      {filtered.length === 0 ? (
        <p className="empty-msg">Không có tour nào.</p>
      ) : (
        <div className="tour-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', alignItems: 'stretch' }}>
          {filtered.map(tour => (
            <article key={tour.id} className="tour-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {tour.imageUrl && <img src={tour.imageUrl} alt={tour.name} style={{ width: '100%', objectFit: 'cover' }} />}
              <div className="tour-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div className="tour-heading">
                  <span>{tour.code}</span>
                  <span className={tour.isActive ? 'open' : 'closed'}>{tour.isActive ? 'Đang mở' : 'Đã đóng'}</span>
                </div>
                <h3>{tour.name}</h3>
                <p>{tour.description || 'Chưa có mô tả.'}</p>
                <dl>
                  <div><dt>Điểm đến</dt><dd>{tour.destination}</dd></div>
                  <div><dt>Thời gian</dt><dd>{tour.durationDays} ngày</dd></div>
                  <div><dt>Giá</dt><dd>{formatVND(tour.price)}</dd></div>
                  <div><dt>Sức chứa</dt><dd>{tour.maxGuests} khách</dd></div>
                </dl>
                <div className="card-actions" style={{ marginTop: 'auto' }}>
                  {isCustomer ? (
                    <button className="btn-primary full-width" onClick={() => navigate(`/tours/${tour.id}`)}>Xem chi tiết / Đặt vé</button>
                  ) : (
                    <>
                      <button className="btn-sm" onClick={() => setScheduleTour(tour)}>Lịch khởi hành</button>
                      <button className="btn-sm" onClick={() => { setEditTour(tour); setFormOpen(true) }}>Sửa</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(tour.id, tour.name)}>Xoá</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
