import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Pagination from './Pagination'
import { useSettings } from '../contexts/SettingsContext'
import { paginateItems } from '../utils/pagination'
import { formatDate, formatVND } from '../utils/format'

function formatDateTime(value) {
  if (!value) return '...'
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function bookingTypeLabel(type) {
  return type === 'PrivateGroup' ? 'Đi theo đoàn' : 'Tour ghép'
}

export default function VnpayPage() {
  const { bookings = [] } = useOutletContext()
  const { t } = useSettings()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paidVnpayBookings = useMemo(() => {
    return bookings
      .filter(booking =>
        booking.paymentMethod === 'VNPay' &&
        booking.paymentStatus === 'Paid' &&
        booking.status === 'Confirmed')
      .sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt))
  }, [bookings])
  const pagination = useMemo(() => paginateItems(paidVnpayBookings, page, pageSize), [page, pageSize, paidVnpayBookings])

  const totalRevenue = paidVnpayBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
  const totalGuests = paidVnpayBookings.reduce((sum, booking) => sum + booking.guestCount, 0)

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{t('vnpayTitle')}</h2>
          <p>{t('vnpayHelp')}</p>
        </div>
      </section>

      <div className="vnpay-history-stats">
        <article>
          <span>Giao dịch thành công</span>
          <strong>{paidVnpayBookings.length}</strong>
        </article>
        <article>
          <span>Doanh thu VNPay</span>
          <strong>{formatVND(totalRevenue)}</strong>
        </article>
        <article>
          <span>Tổng khách đã đặt</span>
          <strong>{totalGuests}</strong>
        </article>
      </div>

      <section className="dash-card">
        <div className="dash-card-header">
          <div>
            <h3>Lịch sử đặt tour thành công</h3>
            <p className="vnpay-history-help">Danh sách khách hàng đã thanh toán thành công qua VNPay.</p>
          </div>
        </div>

        {paidVnpayBookings.length === 0 ? (
          <p className="empty-msg">Chưa có khách hàng thanh toán VNPay thành công.</p>
        ) : (
          <>
            <div className="table-wrap vnpay-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Khách hàng</th>
                    <th>Tour</th>
                    <th>Ngày đi</th>
                    <th>Hình thức</th>
                    <th>Số khách</th>
                    <th>Số tiền</th>
                    <th>Thời gian thanh toán</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map(booking => (
                    <tr key={booking.id}>
                      <td>
                        <strong>{booking.transactionId || `VNPAY-${String(booking.id).padStart(3, '0')}`}</strong>
                      </td>
                      <td>
                        <div className="vnpay-customer-cell">
                          <strong>{booking.customerName}</strong>
                          <span>{booking.customerEmail || booking.customerPhone}</span>
                        </div>
                      </td>
                      <td>{booking.tourName}</td>
                      <td>{formatDate(booking.startDate)}</td>
                      <td>{bookingTypeLabel(booking.bookingType)}</td>
                      <td>{booking.guestCount}</td>
                      <td>{formatVND(booking.totalAmount)}</td>
                      <td>{formatDateTime(booking.paidAt || booking.createdAt)}</td>
                      <td><span className="payment-badge paid">Đã thanh toán</span></td>
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
              itemLabel="giao dịch"
            />
          </>
        )}
      </section>
    </>
  )
}
