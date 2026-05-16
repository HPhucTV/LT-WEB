import { useEffect, useMemo, useState } from 'react'
import { guideApi, scheduleApi, tourApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatDate } from '../../utils/format'

const STATUS_VALUES = ['Open', 'Closed', 'Full', 'Departed', 'Completed']

function toDateInput(value) {
  return value ? String(value).split('T')[0] : ''
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
  const { t } = useSettings()
  const toast = useToast()
  const [schedules, setSchedules] = useState([])
  const [tours, setTours] = useState([])
  const [filter, setFilter] = useState({ tourId: '', status: '', keyword: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formDates, setFormDates] = useState({ startDate: '', endDate: '' })
  const [availableGuides, setAvailableGuides] = useState([])

  useEffect(() => { loadData() }, [])

  function statusLabel(status) {
    if (status === 'Open') return t('openRegistration')
    if (status === 'Closed') return t('closedStatus')
    if (status === 'Full') return t('fullStatus')
    if (status === 'Departed') return t('departedStatus')
    if (status === 'Completed') return t('completedStatus')
    return status
  }

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
        toast.success(t('updateSchedule'))
      } else {
        await scheduleApi.create(tourId, payload)
        toast.success(t('addNewSchedule'))
      }
      setFormOpen(false)
      setEditItem(null)
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete schedule "${item.tourName}"?`)) return
    try {
      await scheduleApi.remove(item.id)
      toast.success(t('delete'))
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section className="schedule-page">
      <div className="schedule-summary">
        <article><span>{t('totalSchedules')}</span><strong>{stats.total}</strong></article>
        <article><span>{t('openStatus')}</span><strong>{stats.open}</strong></article>
        <article><span>{t('bookedSeats')}</span><strong>{stats.booked}</strong></article>
        <article><span>{t('available')}</span><strong>{stats.available}</strong></article>
      </div>

      <section className="toolbar">
        <div>
          <h2>{canManage ? t('scheduleTourTitle') : t('myGuideSchedule')}</h2>
          <p>{canManage ? t('scheduleTourHelp') : t('myGuideScheduleHelp')}</p>
        </div>
        <div className="toolbar-actions">
          <input value={filter.keyword} onChange={e => setFilter({ ...filter, keyword: e.target.value })} placeholder={t('searchTourGuide')} />
          <select value={filter.tourId} onChange={e => setFilter({ ...filter, tourId: e.target.value })}>
            <option value="">{t('allTours')}</option>
            {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">{t('allStatuses')}</option>
            {STATUS_VALUES.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
          </select>
          {canManage && <button className="btn-primary" onClick={openCreateForm}>+ {t('addSchedule')}</button>}
        </div>
      </section>

      {filteredSchedules.length === 0 ? (
        <p className="empty-msg">{t('matchingScheduleEmpty')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('tour')}</th>
                <th>{t('duration')}</th>
                <th>{t('guide')}</th>
                <th>{t('progress')}</th>
                <th>{t('status')}</th>
                <th>{t('note')}</th>
                {canManage && <th>{t('action')}</th>}
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
                    <td>{item.guideName || t('unassigned')}</td>
                    <td>
                      <div className="schedule-progress">
                        <div><span style={{ width: `${percent}%` }} /></div>
                        <small>{booked}/{totalSeats} {t('guests')}</small>
                      </div>
                    </td>
                    <td><span className={`status-badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td>
                    <td>{item.note || '-'}</td>
                    {canManage && (
                      <td className="row-actions">
                        <button className="btn-sm" onClick={() => openEditForm(item)}>{t('edit')}</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(item)}>{t('delete')}</button>
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
            <h2>{editItem ? t('updateSchedule') : t('addNewSchedule')}</h2>
            <div className="form-grid">
              <label>{t('tour')}
                <select name="tourId" required defaultValue={editItem?.tourId || ''} disabled={!!editItem}>
                  <option value="">{t('selectTour')}</option>
                  {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
                </select>
              </label>
              <label>{t('startDate')}
                <input name="startDate" type="date" required value={formDates.startDate} onChange={event => setFormDates({ ...formDates, startDate: event.target.value })} />
              </label>
              <label>{t('endDate')}
                <input name="endDate" type="date" required value={formDates.endDate} onChange={event => setFormDates({ ...formDates, endDate: event.target.value })} />
              </label>
              <label>{t('availableSeats')}
                <input name="availableSeats" type="number" min="1" required defaultValue={editItem?.availableSeats || 20} />
              </label>
              <label>{t('status')}
                <select name="status" defaultValue={editItem?.status || 'Open'}>
                  {STATUS_VALUES.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
                </select>
              </label>
              <label className="form-grid-wide">{t('guide')}
                <select name="guideUserId" defaultValue={editItem?.guideUserId || ''}>
                  <option value="">{t('unassigned')}</option>
                  {editItem?.guideUserId && !availableGuides.some(guide => guide.id === editItem.guideUserId) && (
                    <option value={editItem.guideUserId}>{editItem.guideName || t('currentGuide')}</option>
                  )}
                  {availableGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>{guide.fullName}{guide.availabilityNote ? ` - ${guide.availabilityNote}` : ''}</option>
                  ))}
                </select>
                <small>{formDates.startDate && formDates.endDate ? t('onlyAvailableGuides') : t('chooseDateForGuides')}</small>
              </label>
              <label className="form-grid-wide">{t('note')}
                <textarea name="note" rows="3" defaultValue={editItem?.note || ''} placeholder={t('internalTripNote')} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">{editItem ? t('update') : t('add')}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
