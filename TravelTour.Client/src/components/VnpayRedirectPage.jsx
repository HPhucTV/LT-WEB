import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingApi } from '../api'

export default function VnpayRedirectPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Dang tao cong thanh toan VNPay...')

  useEffect(() => {
    let isMounted = true

    async function createPayment() {
      try {
        const payment = await bookingApi.payWithVnpay(bookingId)
        const paymentUrl = payment.paymentUrl || payment.PaymentUrl

        if (!paymentUrl) {
          throw new Error('Khong nhan duoc duong dan thanh toan VNPay.')
        }

        if (isMounted) {
          setMessage('Dang chuyen sang VNPay...')
          window.location.assign(paymentUrl)
        }
      } catch (err) {
        if (isMounted) {
          setMessage(err.message || 'Khong the tao thanh toan VNPay.')
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
        <h1>Chuyen den VNPay</h1>
        <p>{message}</p>
        <div className="payment-result-meta">
          <span>Ma booking</span>
          <strong>{bookingId}</strong>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/customer/my-tours')}>
          Quay lai don dat tour
        </button>
      </section>
    </main>
  )
}
