import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { tourApi } from '../api'
import Pagination from './Pagination'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { paginateItems } from '../utils/pagination'
import { formatVND } from '../utils/format'
import ScheduleList from './ScheduleList'
import TourForm from './TourForm'

export default function TourList() {
  const { tours, onRefresh } = useOutletContext()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useSettings()
  const isCustomer = user?.role?.toLowerCase() === 'customer' || !user?.role
  const toast = useToast()
  const querySearch = new URLSearchParams(location.search).get('search') || ''
  const [manualSearch, setManualSearch] = useState(null)
  const search = manualSearch ?? querySearch
  const [formOpen, setFormOpen] = useState(false)
  const [editTour, setEditTour] = useState(null)
  const [scheduleTour, setScheduleTour] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase()
    return tours.filter(tour =>
      tour.name.toLowerCase().includes(keyword)
      || tour.code.toLowerCase().includes(keyword)
      || tour.destination.toLowerCase().includes(keyword)
      || (tour.category || '').toLowerCase().includes(keyword))
  }, [search, tours])

  const pagination = useMemo(() => paginateItems(filtered, page, pageSize), [filtered, page, pageSize])

  async function handleDelete(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa tour "${name}"?`)) return
    try {
      await tourApi.remove(id)
      onRefresh()
      toast.success(`Đã xóa tour "${name}"`)
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
          <h2>{t('toursListTitle')}</h2>
          <p>{isCustomer ? t('toursListCustomerHelp') : t('toursListAdminHelp')}</p>
        </div>
        <div className="toolbar-actions">
          <input placeholder={t('searchTourCodeDestination')} value={search} onChange={event => {
            setManualSearch(event.target.value)
            setPage(1)
          }} />
          {!isCustomer && <button className="btn-primary" onClick={() => { setEditTour(null); setFormOpen(true) }}>+ {t('addTour')}</button>}
        </div>
      </section>

      {formOpen && <TourForm tour={editTour} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); onRefresh() }} />}

      {filtered.length === 0 ? (
        <p className="empty-msg">{t('noTours')}</p>
      ) : (
        <>
          <div className="tour-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', alignItems: 'stretch' }}>
            {pagination.items.map(tour => (
              <article key={tour.id} className="tour-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {tour.imageUrl && <img src={tour.imageUrl} alt={tour.name} style={{ width: '100%', objectFit: 'cover' }} />}
                <div className="tour-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div className="tour-heading">
                    <span>{tour.code}</span>
                    <span className={tour.isActive ? 'open' : 'closed'}>{tour.isActive ? t('openStatus') : t('closedStatus')}</span>
                  </div>
                  <h3>{tour.name}</h3>
                  <p>{tour.description || t('noDescription')}</p>
                  <dl>
                    <div><dt>{t('destination')}</dt><dd>{tour.destination}</dd></div>
                    <div><dt>{t('duration')}</dt><dd>{tour.durationDays} {t('days')}</dd></div>
                    <div><dt>{t('priceFrom')}</dt><dd>{formatVND(tour.price)}</dd></div>
                    <div><dt>{t('capacity')}</dt><dd>{tour.maxGuests} {t('guests')}</dd></div>
                    <div><dt>Đi đoàn</dt><dd>Tối thiểu {tour.minGroupGuests || 10} {t('guests')}</dd></div>
                  </dl>
                  <div className="card-actions" style={{ marginTop: 'auto' }}>
                    {isCustomer ? (
                      <button className="btn-primary full-width" onClick={() => navigate(`/tours/${tour.id}`)}>{t('viewBookTicket')}</button>
                    ) : (
                      <>
                        <button className="btn-sm" onClick={() => setScheduleTour(tour)}>{t('departureSchedule')}</button>
                        <button className="btn-sm" onClick={() => { setEditTour(tour); setFormOpen(true) }}>{t('edit')}</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(tour.id, tour.name)}>{t('delete')}</button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={value => {
              setPageSize(value)
              setPage(1)
            }}
            itemLabel="tour"
            pageSizeOptions={[6, 9, 12, 18]}
          />
        </>
      )}
    </>
  )
}
