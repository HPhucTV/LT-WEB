import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingApi } from '../api'

export default function VnpayRedirectPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Đang tạo cổng thanh toán VNPay...')

  useEffect(() => {
    let isMounted = true

    async function createPayment() {
      try {
        const payment = await bookingApi.payWithVnpay(bookingId)
        const paymentUrl = payment.paymentUrl || payment.PaymentUrl

        if (!paymentUrl) {
          throw new Error('Không nhận được đường dẫn thanh toán VNPay.')
        }

        if (isMounted) {
          setMessage('Đang chuyển sang VNPay...')
          window.location.assign(paymentUrl)
        }
      } catch (err) {
        if (isMounted) {
          setMessage(err.message || 'Không thể tạo thanh toán VNPay.')
        }
      }
    }

    createPayment()

    return () => {
      isMounted = false
    }
  }, [bookingId])

  return (
    <main className="payment-result-page">
      <section className="payment-result-panel">
        <div className="payment-result-icon">VNPay</div>
        <h1>Chuyển đến VNPay</h1>
        <p>{message}</p>
        <div className="payment-result-meta">
          <span>Mã booking</span>
          <strong>{bookingId}</strong>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/customer/my-tours')}>
          Quay lại đơn đặt tour
        </button>
      </section>
    </main>
  )
}
