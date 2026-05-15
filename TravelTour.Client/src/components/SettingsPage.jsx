export default function SettingsPage() {
  return (
    <>
      <section className="toolbar">
        <div>
          <h2>Cài đặt</h2>
          <p>Cấu hình hệ thống và các tùy chọn vận hành.</p>
        </div>
      </section>
      <div className="dash-card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <h3>Cài đặt đang được hoàn thiện</h3>
        <p style={{ color: '#64748b', maxWidth: 400, margin: '12px auto 0' }}>
          Cấu hình cổng thanh toán, mẫu email và thiết lập hệ thống sẽ được bổ sung sau.
        </p>
      </div>
    </>
  )
}
