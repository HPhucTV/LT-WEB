/**
 * Format a number as Vietnamese Dong currency.
 * Used across all components — single source of truth.
 */
export function formatVND(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a date string to Vietnamese locale.
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

/**
 * Get human-readable payment status label.
 */
export function paymentStatusLabel(status) {
  switch (status) {
    case 'Paid': return 'Đã thanh toán'
    case 'PaymentCreated': return 'Chờ MoMo'
    case 'PaymentFailed': return 'Thất bại'
    default: return 'Chưa thanh toán'
  }
}

/**
 * Get human-readable booking status label.
 */
export function bookingStatusLabel(status) {
  switch (status) {
    case 'Pending': return 'Chờ xác nhận'
    case 'Confirmed': return 'Đã xác nhận'
    case 'Cancelled': return 'Đã huỷ'
    default: return status
  }
}
