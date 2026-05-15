import { formatVND } from '../utils/format'

export default function Dashboard({ tours = [], bookings = [] }) {
  const activeTours = tours.filter(t => t.isActive).length
  const avgPrice = tours.length > 0 ? tours.reduce((sum, t) => sum + t.price, 0) / tours.length : 0
  const totalRevenue = bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalAmount, 0)

  return (
    <section className="metrics" aria-label="Thống kê">
      <article><span>Tổng tour</span><strong>{tours.length}</strong></article>
      <article><span>Đang mở bán</span><strong>{activeTours}</strong></article>
      <article><span>Giá trung bình</span><strong>{formatVND(avgPrice)}</strong></article>
      <article><span>Tổng đặt tour</span><strong>{bookings.length}</strong></article>
      <article><span>Doanh thu</span><strong>{formatVND(totalRevenue)}</strong></article>
    </section>
  )
}
