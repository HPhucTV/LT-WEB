import { useEffect, useState } from 'react'
import { reportApi, downloadBlob } from '../api'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { formatVND, formatDate, bookingStatusLabel } from '../utils/format'

export default function ReportPage() {
  const toast = useToast()
  const { t, settings } = useSettings()
  const [summary, setSummary] = useState(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [revenue, setRevenue] = useState(null)

  useEffect(() => { reportApi.summary().then(setSummary).catch(() => {}) }, [])

  function bookingLabel(status) {
    if (settings.language === 'vi') return bookingStatusLabel(status)
    if (status === 'Pending') return t('confirmPending')
    if (status === 'Confirmed') return t('confirmed')
    if (status === 'Cancelled') return t('cancelled')
    return status
  }

  async function loadRevenue() {
    try { setRevenue(await reportApi.revenue(from, to)) }
    catch (err) { toast.error(err.message) }
  }

  async function handleExportBookings() {
    try { downloadBlob(await reportApi.exportBookings(from, to), 'bookings.csv'); toast.success('CSV') }
    catch (err) { toast.error(err.message) }
  }

  async function handleExportRevenue() {
    try { downloadBlob(await reportApi.exportRevenue(from, to), 'revenue.csv'); toast.success('CSV') }
    catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <section className="toolbar">
        <div><h2>{t('reportsTitle')}</h2><p>{t('reportsHelp')}</p></div>
      </section>

      {summary && (
        <section className="metrics" aria-label={t('reportsTitle')}>
          <article><span>{t('totalTours')}</span><strong>{summary.totalTours}</strong></article>
          <article><span>{t('activeTours')}</span><strong>{summary.activeTours}</strong></article>
          <article><span>{t('totalBookings')}</span><strong>{summary.totalBookings}</strong></article>
          <article><span>{t('totalGuests')}</span><strong>{summary.totalGuests}</strong></article>
          <article className="metric-highlight"><span>{t('totalRevenue')}</span><strong>{formatVND(summary.totalRevenue)}</strong></article>
        </section>
      )}

      {summary?.topTours?.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 12px' }}>{t('topTours')}</h3>
          <div className="table-wrap" style={{ marginBottom: 24 }}>
            <table><thead><tr><th>{t('tour')}</th><th>{t('bookingCount')}</th><th>{t('revenue')}</th></tr></thead>
              <tbody>{summary.topTours.map((item, index) => <tr key={index}><td>{item.tourName}</td><td>{item.bookingCount}</td><td>{formatVND(item.revenue)}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}

      <div className="report-filter">
        <label>{t('fromDate')}<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>{t('toDate')}<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <button className="btn-primary" onClick={loadRevenue}>{t('viewReport')}</button>
        <button className="btn-secondary" onClick={handleExportBookings}>{t('exportBookingsCsv')}</button>
        <button className="btn-secondary" onClick={handleExportRevenue}>{t('exportRevenueCsv')}</button>
      </div>

      {revenue && (
        <>
          <p style={{ fontWeight: 700, fontSize: 18, margin: '16px 0 12px' }}>{t('revenue')}: {formatVND(revenue.totalRevenue)}</p>
          {revenue.items.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>{t('tour')}</th><th>{t('customerName')}</th><th>{t('guestCount')}</th><th>{t('totalAmount')}</th><th>{t('status')}</th><th>{t('createdDate')}</th></tr></thead>
                <tbody>{revenue.items.map(item => <tr key={item.id}><td>{item.id}</td><td>{item.tourName}</td><td>{item.customerName}</td><td>{item.guestCount}</td><td>{formatVND(item.totalAmount)}</td><td>{bookingLabel(item.status)}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {revenue.items.length > 0 && (
            <div className="chart-container">
              <h3>{t('revenueChart')}</h3>
              <div className="bar-chart">
                {(() => {
                  const grouped = {}
                  revenue.items.forEach(item => { grouped[item.tourName] = (grouped[item.tourName] || 0) + item.totalAmount })
                  const entries = Object.entries(grouped)
                  const max = Math.max(...entries.map(([, value]) => value))
                  return entries.map(([name, value]) => (
                    <div className="bar-row" key={name}>
                      <span className="bar-label">{name}</span>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} /></div>
                      <span className="bar-value">{formatVND(value)}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
