import { useSettings } from '../contexts/SettingsContext'

export default function VnpayPage() {
  const { t } = useSettings()

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{t('vnpayTitle')}</h2>
          <p>{t('vnpayHelp')}</p>
        </div>
      </section>
      <div className="dash-card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>VNPay</div>
        <h3>{t('vnpayBoard')}</h3>
        <p style={{ color: 'inherit', opacity: 0.72, maxWidth: 400, margin: '12px auto 0' }}>
          {t('vnpayComingSoon')}
        </p>
      </div>
    </>
  )
}
