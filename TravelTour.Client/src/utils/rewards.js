export const REWARD_VOUCHERS = [
  {
    id: 'travex-50',
    code: 'TRAVEX50',
    title: 'Voucher 50.000đ',
    description: 'Giảm trực tiếp cho đơn đặt tour tiếp theo.',
    points: 100,
    discountAmount: 50000,
  },
  {
    id: 'travex-100',
    code: 'TRAVEX100',
    title: 'Voucher 100.000đ',
    description: 'Phù hợp cho tour gia đình hoặc nhóm nhỏ.',
    points: 180,
    discountAmount: 100000,
  },
  {
    id: 'travex-250',
    code: 'TRAVEX250',
    title: 'Voucher 250.000đ',
    description: 'Ưu đãi tốt cho tour đoàn và đơn giá trị cao.',
    points: 400,
    discountAmount: 250000,
  },
]

export function calculateRewardPoints(bookings = []) {
  const today = startOfDay(new Date())
  const totalSpent = bookings
    .filter(booking => booking.paymentStatus === 'Paid' || booking.status === 'Confirmed')
    .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
  const completed = bookings.filter(booking => booking.status !== 'Cancelled' && startOfDay(booking.startDate) < today).length
  return Math.floor(totalSpent / 100000) + completed * 20
}

export function getRewardStorageKey(user) {
  return `travex:reward-vouchers:${user?.username || user?.fullName || 'guest'}`
}

export function loadRewardVouchers(user) {
  try {
    const raw = localStorage.getItem(getRewardStorageKey(user))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRewardVouchers(user, vouchers) {
  localStorage.setItem(getRewardStorageKey(user), JSON.stringify(vouchers))
}

export function getSpentRewardPoints(vouchers = []) {
  return vouchers.reduce((sum, voucher) => sum + Number(voucher.points || 0), 0)
}

export function getAvailableRewardPoints(earnedPoints, vouchers = []) {
  return Math.max(0, Number(earnedPoints || 0) - getSpentRewardPoints(vouchers))
}

export function redeemRewardVoucher(user, vouchers, reward) {
  const redeemed = {
    ...reward,
    instanceId: `${reward.id}-${Date.now()}`,
    redeemedAt: new Date().toISOString(),
    usedAt: null,
  }
  const next = [redeemed, ...vouchers]
  saveRewardVouchers(user, next)
  return next
}

export function markRewardVoucherUsed(user, vouchers, instanceId) {
  const next = vouchers.map(voucher =>
    voucher.instanceId === instanceId ? { ...voucher, usedAt: new Date().toISOString() } : voucher)
  saveRewardVouchers(user, next)
  return next
}

export function getUnusedRewardVouchers(vouchers = []) {
  return vouchers.filter(voucher => !voucher.usedAt)
}

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}
