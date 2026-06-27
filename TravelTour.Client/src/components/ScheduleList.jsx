import { useEffect, useMemo, useState } from 'react'
import { scheduleApi } from '../api'
import Pagination from './Pagination'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { paginateItems } from '../utils/pagination'
import { formatDate, formatVND } from '../utils/format'

export default function ScheduleList({ tour, onBack }) {
  const toast = useToast()
  const { t } = useSettings()
  const [schedules, setSchedules] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { loadSchedules() }, [tour.id])

  const pagination = useMemo(() => paginateItems(schedules, page, pageSize), [page, pageSize, schedules])

  useEffect(() => {
    if (pagination.currentPage !== page) {
      setPage(pagination.currentPage)
    }
  }, [page, pagination.currentPage])

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
      price: Number(form.get('price')),
      originalPrice: Number(form.get('originalPrice') || 0),
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
      toast.success(editItem ? t('updateSchedule') : t('addNewSchedule'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa lịch trình này?')) return
    try {
      await scheduleApi.remove(id)
      loadSchedules()
      toast.success(t('delete'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  function statusLabel(status) {
    if (status === 'Open') return t('openRegistration')
    if (status === 'Full') return t('fullStatus')
    return t('closedStatus')
  }

  return (
    <>
      <button className="btn-back" onClick={onBack}>← {t('backToTours')}</button>
      <section className="toolbar">
        <div>
          <h2>{t('scheduleTitle')} - {tour.name}</h2>
          <p>{t('scheduleHelp')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setFormOpen(true) }}>+ {t('addSchedule')}</button>
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSave}>
            <h2>{editItem ? t('updateSchedule') : t('addNewSchedule')}</h2>
            <div className="form-grid">
              <label>{t('startDate')}<input name="startDate" type="date" required defaultValue={editItem?.startDate?.split('T')[0]} /></label>
              <label>{t('endDate')}<input name="endDate" type="date" required defaultValue={editItem?.endDate?.split('T')[0]} /></label>
              <label>{t('availableSeats')}<input name="availableSeats" type="number" min="1" required defaultValue={editItem?.availableSeats || tour.maxGuests} /></label>
              <label>{t('priceVnd')}<input name="price" type="number" min="1" required defaultValue={editItem?.price || tour.price} /></label>
              <label>{t('originalPriceVnd')}<input name="originalPrice" type="number" min="0" defaultValue={editItem?.originalPrice || tour.originalPrice || 0} /></label>
              <label>{t('status')}
                <select name="status" defaultValue={editItem?.status || 'Open'}>
                  <option value="Open">{t('openRegistration')}</option>
                  <option value="Closed">{t('closedStatus')}</option>
                  <option value="Full">{t('fullStatus')}</option>
                </select>
              </label>
              <label>{t('guide')}<input name="guideName" defaultValue={editItem?.guideName || ''} /></label>
              <label>{t('note')}<input name="note" defaultValue={editItem?.note || ''} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">{editItem ? t('update') : t('add')}</button>
            </div>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className="empty-msg">{t('emptyCampaign')}</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>{t('startDate')}</th><th>{t('endDate')}</th><th>{t('availableSeats')}</th><th>{t('priceVnd')}</th><th>{t('guide')}</th><th>{t('status')}</th><th>{t('action')}</th></tr></thead>
              <tbody>
                {pagination.items.map(schedule => (
                  <tr key={schedule.id}>
                    <td>{schedule.id}</td>
                    <td>{formatDate(schedule.startDate)}</td>
                    <td>{formatDate(schedule.endDate)}</td>
                    <td>{schedule.availableSeats}</td>
                    <td>{formatVND(schedule.price)}</td>
                    <td>{schedule.guideName || t('unassigned')}</td>
                    <td><span className={schedule.status === 'Open' ? 'open' : 'closed'}>{statusLabel(schedule.status)}</span></td>
                    <td className="row-actions">
                      <button className="btn-sm" onClick={() => { setEditItem(schedule); setFormOpen(true) }}>{t('edit')}</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(schedule.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            itemLabel="lịch trình"
          />
        </>
      )}
    </>
  )
}
