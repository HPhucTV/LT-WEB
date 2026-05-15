export default function MomoPage() {
  return (
    <>
      <section className="toolbar">
        <div>
          <h2>Thanh toán MoMo</h2>
          <p>Quản lý giao dịch và trạng thái thanh toán qua MoMo.</p>
        </div>
      </section>
      <div className="dash-card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
        <h3>Bảng thanh toán MoMo</h3>
        <p style={{ color: '#64748b', maxWidth: 400, margin: '12px auto 0' }}>
          Thống kê và quản lý giao dịch MoMo chi tiết sẽ được bổ sung ở phiên bản tiếp theo.
        </p>
      </div>
    </>
  )
}
