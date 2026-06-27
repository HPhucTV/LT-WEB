import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatDate, formatVND } from '../utils/format'

function canPayRemaining(contract) {
  if (!contract?.remainingDueDate || contract.remainingPaymentStatus === 'Paid') return true
  const today = new Date().toISOString().slice(0, 10)
  return today <= contract.remainingDueDate
}

export default function ContractPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    bookingApi.getContract(id)
      .then(data => {
        if (!cancelled) setContract(data)
      })
      .catch(err => {
        if (!cancelled) toast.error(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id, toast])

  const paymentStage = useMemo(() => {
    if (!contract) return null
    if (contract.customerSignatureStatus !== 'Signed') return null
    if (contract.depositPaymentStatus !== 'Paid') return 'deposit'
    if (contract.remainingPaymentStatus !== 'Paid' && canPayRemaining(contract)) return 'remaining'
    return null
  }, [contract])

  async function handleSign() {
    setSubmitting(true)
    try {
      const updated = await bookingApi.signContract(id, { signedByName: user?.fullName || user?.username || contract.customerName })
      setContract(updated)
      toast.success('Đã xác nhận hợp đồng.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayment(stage) {
    setSubmitting(true)
    try {
      const payment = await bookingApi.payWithVnpay(id, stage)
      const paymentUrl = payment.paymentUrl || payment.PaymentUrl
      if (!paymentUrl) throw new Error(payment.message || 'Không nhận được đường dẫn thanh toán VNPay.')
      if (paymentUrl.startsWith('/')) navigate(paymentUrl)
      else window.location.href = paymentUrl
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <section className="checkout-state">Đang tải hợp đồng...</section>
  if (!contract) return <section className="checkout-state">Không tìm thấy hợp đồng.</section>

  const remainingOverdue = contract.remainingPaymentStatus !== 'Paid' && !canPayRemaining(contract)

  return (
    <main className="checkout-page">
      <section className="checkout-shell" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <section className="checkout-main">
          <div className="checkout-panel checkout-panel-title">
            <h1>Hợp đồng tour đoàn</h1>
          </div>

          <section className="checkout-panel">
            <h2><span></span>Thông tin hợp đồng</h2>
            <div className="checkout-contact-grid">
              <label>Mã booking<input value={`#${contract.id}`} disabled /></label>
              <label>Tour<input value={contract.tourName} disabled /></label>
              <label>Ngày khởi hành<input value={`${formatDate(contract.startDate)} - ${formatDate(contract.endDate)}`} disabled /></label>
              <label>Người lớn<input value={contract.adultCount} disabled /></label>
              <label>Trẻ em<input value={contract.childCount} disabled /></label>
              <label>Tổng hợp đồng<input value={formatVND(contract.contractAmount || contract.totalAmount)} disabled /></label>
              <label>Tiền cọc 30%<input value={formatVND(contract.depositAmount || 0)} disabled /></label>
              <label>Phần còn lại<input value={formatVND(contract.remainingAmount || 0)} disabled /></label>
              <label>Hạn thanh toán còn lại<input value={contract.remainingDueDate ? formatDate(contract.remainingDueDate) : '-'} disabled /></label>
            </div>
          </section>

          <section className="checkout-panel">
            <h2><span></span>Điều khoản</h2>
            <div className="checkout-contact-grid">
              <label className="span-2">Điều Khoản Thanh Toán<textarea value={contract.paymentTerms || 'Chưa có điều khoản thanh toán'} rows="5" disabled /></label>
              <label className="span-2">Điều Khoản Hoàn/Hủy Tour<textarea value={contract.cancellationTerms || 'Chưa có điều khoản hoàn/hủy tour'} rows="5" disabled /></label>
              <label className="span-2">Ghi chú yêu cầu<textarea value={contract.requestNote || '-'} rows="3" disabled /></label>
            </div>
          </section>

          <section className="checkout-panel">
            <h2><span></span>Thông tin đoàn</h2>
            <div className="checkout-contact-grid">
              <label>Người đại diện<input value={contract.customerName} disabled /></label>
              <label>Số điện thoại<input value={contract.customerPhone} disabled /></label>
              <label>Email<input value={contract.customerEmail} disabled /></label>
              <label>Tổng số khách<input value={contract.guestCount} disabled /></label>
            </div>
          </section>

          <section className="checkout-panel">
            <h2><span></span>Chữ ký điện tử</h2>
            <div className="checkout-contact-grid">
              <label>Sales ký<input value={contract.salesSignedByName || 'Chưa ký'} disabled /></label>
              <label>Thời gian Sales ký<input value={contract.salesSignedAt ? new Date(contract.salesSignedAt).toLocaleString('vi-VN') : '-'} disabled /></label>
              <label>Khách ký<input value={contract.customerSignedByName || 'Chưa ký'} disabled /></label>
              <label>Thời gian khách ký<input value={contract.customerSignedAt ? new Date(contract.customerSignedAt).toLocaleString('vi-VN') : '-'} disabled /></label>
            </div>
          </section>

          <section className="checkout-panel checkout-consent">
            {remainingOverdue && <div className="checkout-submit-error">Đã quá hạn thanh toán phần còn lại. Vui lòng liên hệ Sales hoặc Admin để được hỗ trợ.</div>}
            <div className="checkout-submit-row">
              <p>
                {contract.customerSignatureStatus !== 'Signed'
                  ? 'Khách hàng cần xác nhận hợp đồng trước khi thanh toán tiền cọc.'
                  : paymentStage === 'deposit'
                    ? 'Hợp đồng đã sẵn sàng để thanh toán tiền cọc 30% qua VNPay.'
                    : paymentStage === 'remaining'
                      ? 'Tiền cọc đã hoàn tất. Bạn có thể thanh toán phần còn lại trước hạn.'
                      : contract.remainingPaymentStatus === 'Paid'
                        ? 'Hợp đồng đã được thanh toán đầy đủ.'
                        : 'Không còn hành động thanh toán khả dụng trong luồng chuẩn.'}
              </p>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate('/customer/my-tours')}>Quay lại</button>
                {contract.customerSignatureStatus !== 'Signed' && (
                  <button className="btn-primary" type="button" disabled={submitting} onClick={handleSign}>
                    {submitting ? 'Đang xử lý...' : 'Xác nhận/Ký hợp đồng'}
                  </button>
                )}
                {paymentStage === 'deposit' && (
                  <button className="btn-primary" type="button" disabled={submitting} onClick={() => handlePayment('deposit')}>
                    {submitting ? 'Đang xử lý...' : 'Thanh toán cọc'}
                  </button>
                )}
                {paymentStage === 'remaining' && (
                  <button className="btn-primary" type="button" disabled={submitting} onClick={() => handlePayment('remaining')}>
                    {submitting ? 'Đang xử lý...' : 'Thanh toán phần còn lại'}
                  </button>
                )}
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}
