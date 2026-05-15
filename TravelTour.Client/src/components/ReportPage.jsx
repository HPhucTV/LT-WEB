import { useEffect, useState } from 'react'
import { reportApi, downloadBlob } from '../api'
import { useToast } from '../contexts/ToastContext'
import { formatVND, formatDate, bookingStatusLabel } from '../utils/format'

export default function ReportPage() {
  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [revenue, setRevenue] = useState(null)

  useEffect(() => { reportApi.summary().then(setSummary).catch(() => {}) }, [])

  async function loadRevenue() {
    try { setRevenue(await reportApi.revenue(from, to)) }
    catch (err) { toast.error(err.message) }
  }

  async function handleExportBookings() {
    try { downloadBlob(await reportApi.exportBookings(from, to), 'danh-sach-dat-tour.csv'); toast.success('Đã xuất file CSV') }
    catch (err) { toast.error(err.message) }
  }

  async function handleExportRevenue() {
    try { downloadBlob(await reportApi.exportRevenue(from, to), 'bao-cao-doanh-thu.csv'); toast.success('Đã xuất file CSV') }
    catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <section className="toolbar">
        <div><h2>Báo cáo doanh thu</h2><p>Thống kê tổng hợp và chi tiết theo thời gian.</p></div>
      </section>

      {summary && (
        <section className="metrics" aria-label="Tổng hợp">
          <article><span>Tổng tour</span><strong>{summary.totalTours}</strong></article>
          <article><span>Tour đang mở</span><strong>{summary.activeTours}</strong></article>
          <article><span>Tổng đặt tour</span><strong>{summary.totalBookings}</strong></article>
          <article><span>Tổng khách hàng</span><strong>{summary.totalCustomers}</strong></article>
          <article><span>Tổng lượt khách</span><strong>{summary.totalGuests}</strong></article>
          <article className="metric-highlight"><span>Tổng doanh thu</span><strong>{formatVND(summary.totalRevenue)}</strong></article>
        </section>
      )}

      {summary?.topTours?.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 12px' }}>Top tour bán chạy</h3>
          <div className="table-wrap" style={{ marginBottom: 24 }}>
            <table><thead><tr><th>Tour</th><th>Số đặt tour</th><th>Doanh thu</th></tr></thead>
              <tbody>{summary.topTours.map((t, i) => <tr key={i}><td>{t.tourName}</td><td>{t.bookingCount}</td><td>{formatVND(t.revenue)}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}

      <div className="report-filter">
        <label>Từ ngày<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>Đến ngày<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <button className="btn-primary" onClick={loadRevenue}>Xem báo cáo</button>
        <button className="btn-secondary" onClick={handleExportBookings}>Xuất CSV đặt tour</button>
        <button className="btn-secondary" onClick={handleExportRevenue}>Xuất CSV doanh thu</button>
      </div>

      {revenue && (
        <>
          <p style={{ fontWeight: 700, fontSize: 18, margin: '16px 0 12px' }}>Doanh thu: {formatVND(revenue.totalRevenue)}</p>
          {revenue.items.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Tour</th><th>Khách hàng</th><th>Số khách</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
                <tbody>{revenue.items.map(b => <tr key={b.id}><td>{b.id}</td><td>{b.tourName}</td><td>{b.customerName}</td><td>{b.guestCount}</td><td>{formatVND(b.totalAmount)}</td><td>{bookingStatusLabel(b.status)}</td><td>{formatDate(b.createdAt)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {revenue.items.length > 0 && (
            <div className="chart-container">
              <h3>Biểu đồ doanh thu</h3>
              <div className="bar-chart">
                {(() => {
                  const grouped = {}
                  revenue.items.forEach(b => { grouped[b.tourName] = (grouped[b.tourName] || 0) + b.totalAmount })
                  const entries = Object.entries(grouped)
                  const max = Math.max(...entries.map(([, v]) => v))
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
