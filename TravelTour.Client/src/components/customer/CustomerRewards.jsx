import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { formatVND } from '../../utils/format'
import {
  REWARD_VOUCHERS,
  calculateRewardPoints,
  getAvailableRewardPoints,
  getUnusedRewardVouchers,
  loadRewardVouchers,
  redeemRewardVoucher,
} from '../../utils/rewards'

export default function CustomerRewards() {
  const { bookings = [] } = useOutletContext()
  const { user } = useAuth()
  const toast = useToast()
  const [redeemedVouchers, setRedeemedVouchers] = useState(() => loadRewardVouchers(user))

  useEffect(() => {
    setRedeemedVouchers(loadRewardVouchers(user))
  }, [user])

  const earnedPoints = useMemo(() => calculateRewardPoints(bookings), [bookings])
  const availablePoints = getAvailableRewardPoints(earnedPoints, redeemedVouchers)
  const unusedVouchers = getUnusedRewardVouchers(redeemedVouchers)

  function handleRedeem(reward) {
    if (availablePoints < reward.points) {
      toast.error('Bạn chưa đủ điểm để đổi voucher này.')
      return
    }

    setRedeemedVouchers(redeemRewardVoucher(user, redeemedVouchers, reward))
    toast.success(`Đã đổi ${reward.title}. Bạn có thể áp dụng voucher ở bước điền thông tin.`)
  }

  return (
    <section className="customer-rewards-page">
      <div className="customer-rewards-hero">
        <div>
          <span>TraveX Rewards</span>
          <h2>Đổi điểm thưởng lấy voucher giảm giá</h2>
          <p>Voucher sau khi đổi sẽ xuất hiện ở trang điền thông tin khi đặt tour.</p>
        </div>
        <div className="reward-points-box">
          <small>Điểm khả dụng</small>
          <strong>{availablePoints}</strong>
          <span>Tổng đã tích: {earnedPoints}</span>
        </div>
      </div>

      <div className="reward-voucher-grid">
        {REWARD_VOUCHERS.map(reward => (
          <article className="reward-voucher-card" key={reward.id}>
            <div>
              <span className="reward-voucher-code">{reward.code}</span>
              <h3>{reward.title}</h3>
              <p>{reward.description}</p>
            </div>
            <div className="reward-voucher-meta">
              <strong>{formatVND(reward.discountAmount)}</strong>
              <span>{reward.points} điểm</span>
            </div>
            <button
              className="btn-primary"
              type="button"
              disabled={availablePoints < reward.points}
              onClick={() => handleRedeem(reward)}
            >
              {availablePoints < reward.points ? 'Chưa đủ điểm' : 'Đổi voucher'}
            </button>
          </article>
        ))}
      </div>

      <section className="cust-card reward-wallet-card">
        <div className="cust-card-header">
          <h3>Ví voucher của bạn</h3>
          <span>{unusedVouchers.length} voucher khả dụng</span>
        </div>
        {redeemedVouchers.length === 0 ? (
          <p className="empty-msg">Bạn chưa đổi voucher nào.</p>
        ) : (
          <div className="reward-wallet-list">
            {redeemedVouchers.map(voucher => (
              <div className={`reward-wallet-item ${voucher.usedAt ? 'used' : ''}`} key={voucher.instanceId}>
                <div>
                  <strong>{voucher.title}</strong>
                  <span>{voucher.code} • {voucher.usedAt ? 'Đã dùng' : 'Có thể áp dụng khi checkout'}</span>
                </div>
                <b>-{formatVND(voucher.discountAmount)}</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
