import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { settings, updateSetting, t } = useSettings()
  const toast = useToast()
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })

  function saveProfile(e) {
    e.preventDefault()
    localStorage.setItem('travex_profile_draft', JSON.stringify(profile))
    toast.success(t('profileSaved'))
  }

  function changePassword(e) {
    e.preventDefault()
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      toast.warn(t('passwordMissing'))
      return
    }
    if (passwords.next.length < 6) {
      toast.warn(t('passwordShort'))
      return
    }
    if (passwords.next !== passwords.confirm) {
      toast.error(t('passwordMismatch'))
      return
    }
    setPasswords({ current: '', next: '', confirm: '' })
    toast.success(t('passwordChecked'))
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{t('settingsTitle')}</h2>
          <p>{t('settingsSubtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={logout}>{t('logout')}</button>
      </section>

      <div className="settings-grid">
        <form className="dash-card settings-card" onSubmit={saveProfile}>
          <div className="settings-card-header">
            <div className="settings-icon">TK</div>
            <div>
              <h3>{t('accountTitle')}</h3>
              <p>{t('accountSubtitle')}</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              {t('fullName')}
              <input value={profile.fullName} onChange={e => setProfile(prev => ({ ...prev, fullName: e.target.value }))} />
            </label>
            <label>
              {t('username')}
              <input value={profile.username} onChange={e => setProfile(prev => ({ ...prev, username: e.target.value }))} />
            </label>
            <label>
              Email
              <input type="email" value={profile.email} onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))} placeholder="name@travex.vn" />
            </label>
            <label>
              {t('phone')}
              <input value={profile.phone} onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))} placeholder="090..." />
            </label>
          </div>

          <button className="btn-primary" type="submit">{t('saveProfile')}</button>
        </form>

        <form className="dash-card settings-card" onSubmit={changePassword}>
          <div className="settings-card-header">
            <div className="settings-icon settings-icon-blue">BM</div>
            <div>
              <h3>{t('securityTitle')}</h3>
              <p>{t('securitySubtitle')}</p>
            </div>
          </div>

          <div className="form-grid settings-password-grid">
            <label>
              {t('currentPassword')}
              <input type="password" value={passwords.current} onChange={e => setPasswords(prev => ({ ...prev, current: e.target.value }))} />
            </label>
            <label>
              {t('newPassword')}
              <input type="password" value={passwords.next} onChange={e => setPasswords(prev => ({ ...prev, next: e.target.value }))} />
            </label>
            <label>
              {t('confirmPassword')}
              <input type="password" value={passwords.confirm} onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} />
            </label>
          </div>

          <button className="btn-primary" type="submit">{t('changePassword')}</button>
        </form>

        <section className="dash-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon settings-icon-orange">TB</div>
            <div>
              <h3>{t('notificationsTitle')}</h3>
              <p>{t('notificationsSubtitle')}</p>
            </div>
          </div>

          <div className="settings-list">
            <label className="settings-switch">
              <span>
                <strong>{t('bookingEmail')}</strong>
                <small>{t('bookingEmailHelp')}</small>
              </span>
              <input type="checkbox" checked={settings.emailBookings} onChange={e => updateSetting('emailBookings', e.target.checked)} />
            </label>
            <label className="settings-switch">
              <span>
                <strong>{t('promoEmail')}</strong>
                <small>{t('promoEmailHelp')}</small>
              </span>
              <input type="checkbox" checked={settings.emailPromos} onChange={e => updateSetting('emailPromos', e.target.checked)} />
            </label>
            <label className="settings-switch">
              <span>
                <strong>{t('inAppNotifications')}</strong>
                <small>{t('inAppNotificationsHelp')}</small>
              </span>
              <input type="checkbox" checked={settings.inAppNotifications} onChange={e => updateSetting('inAppNotifications', e.target.checked)} />
            </label>
          </div>
        </section>

        <section className="dash-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon settings-icon-purple">GD</div>
            <div>
              <h3>{t('appearanceTitle')}</h3>
              <p>{t('appearanceSubtitle')}</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              {t('language')}
              <select value={settings.language} onChange={e => updateSetting('language', e.target.value)}>
                <option value="vi">{t('vietnamese')}</option>
                <option value="en">{t('english')}</option>
              </select>
            </label>
          </div>

          <label className="settings-switch settings-switch-inline">
            <span>
              <strong>{t('compactTables')}</strong>
              <small>{t('compactTablesHelp')}</small>
            </span>
            <input type="checkbox" checked={settings.compactTables} onChange={e => updateSetting('compactTables', e.target.checked)} />
          </label>
        </section>
      </div>
    </>
  )
}
