import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const result = useMemo(() => {
    const status = params.get('status')
    if (status === 'success') {
      return {
        title: 'Thanh toán thành công',
        message: 'Booking của bạn đã được xác nhận qua VNPay.',
        tone: '#16a34a',
      }
    }

    if (status === 'invalid-signature') {
      return {
        title: 'Không xác thực được giao dịch',
        message: 'Checksum VNPay không hợp lệ. Vui lòng liên hệ quản trị viên để kiểm tra.',
        tone: '#dc2626',
      }
    }

    return {
      title: 'Thanh toán chưa hoàn tất',
      message: 'Giao dịch VNPay thất bại hoặc đã bị hủy.',
      tone: '#ca8a04',
    }
  }, [params])

  return (
    <main className="payment-result-page">
      <section className="payment-result-panel">
        <div className="payment-result-icon" style={{ color: result.tone }}>VNPay</div>
        <h1>{result.title}</h1>
        <p>{result.message}</p>
        <div className="payment-result-meta">
          <span>Mã booking</span>
          <strong>{params.get('vnp_TxnRef') || '...'}</strong>
        </div>
        <button className="btn-primary" onClick={() => navigate('/customer/my-tours')}>
          Xem tour đã đặt
        </button>
      </section>
    </main>
  )
}
