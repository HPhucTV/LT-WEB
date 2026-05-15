/** Reusable "coming soon" placeholder for staff pages. */
export default function StaffPlaceholder({ icon, title, description }) {
  return (
    <div className="staff-card" style={{ padding: 48, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#64748b', marginBottom: 0 }}>{description}</p>
      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>Tính năng đang được phát triển.</p>
    </div>
  )
}
