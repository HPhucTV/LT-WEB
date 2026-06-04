import { useState } from 'react'
import { tourApi } from '../api'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'

const EMPTY = {
  code: '',
  name: '',
  destination: '',
  durationDays: 1,
  price: 0,
  originalPrice: 0,
  promotionTitle: '',
  promotionDescription: '',
  discountStartDate: '',
  discountEndDate: '',
  maxGuests: 20,
  minGroupGuests: 10,
  category: 'Khám phá',
  description: '',
  imageUrl: '',
  isActive: true,
}

export default function TourForm({ tour, onClose, onSaved }) {
  const toast = useToast()
  const { t } = useSettings()
  const [form, setForm] = useState(tour ? { ...EMPTY, ...tour, minGroupGuests: tour.minGroupGuests || 10 } : EMPTY)
  const [error, setError] = useState('')
  const isEdit = !!tour

  function onChange(event) {
    const { name, value, type, checked } = event.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }))
  }

  function applyDiscountPercent(event) {
    const percent = Number(event.target.value)
    if (!form.originalPrice || percent < 0 || percent > 100) return
    setForm(prev => ({
      ...prev,
      price: Math.round(prev.originalPrice * (1 - percent / 100)),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const payload = {
      ...form,
      promotionTitle: form.promotionTitle || '',
      promotionDescription: form.promotionDescription || '',
      discountStartDate: form.discountStartDate || null,
      discountEndDate: form.discountEndDate || null,
    }
    try {
      if (isEdit) await tourApi.update(tour.id, payload)
      else await tourApi.create(payload)
      toast.success(isEdit ? t('updateTour') : t('addNewTour'))
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isEdit ? t('updateTour') : t('addNewTour')}</h2>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <label>{t('tourCode')}<input name="code" required value={form.code} onChange={onChange} /></label>
          <label>{t('tourName')}<input name="name" required value={form.name} onChange={onChange} /></label>
          <label>{t('destination')}<input name="destination" required value={form.destination} onChange={onChange} /></label>
          <label>{t('daysCount')}<input name="durationDays" type="number" min="1" required value={form.durationDays} onChange={onChange} /></label>
          <label>{t('maxGuests')}<input name="maxGuests" type="number" min="1" required value={form.maxGuests} onChange={onChange} /></label>
          <label>Khách tối thiểu đi đoàn<input name="minGroupGuests" type="number" min="1" max={form.maxGuests || undefined} required value={form.minGroupGuests} onChange={onChange} /></label>
          <label>{t('category')}
            <select name="category" value={form.category} onChange={onChange}>
              <option value="Khám phá">{t('explore')}</option>
              <option value="Nghỉ dưỡng">{t('resort')}</option>
              <option value="Gia đình">{t('family')}</option>
            </select>
          </label>
          <label className="span-2">{t('imageUrl')}<input name="imageUrl" value={form.imageUrl} onChange={onChange} /></label>
          <label className="span-2">{t('description')}<textarea name="description" rows="3" value={form.description} onChange={onChange} /></label>
          <div className="form-grid-wide discount-panel">
            <div className="discount-panel-header">
              <strong>{t('promotionConfig')}</strong>
              <small>{t('promotionConfigHelp')}</small>
            </div>
            <div className="discount-grid">
              <label>{t('originalPriceVnd')}<input name="originalPrice" type="number" min="0" value={form.originalPrice} onChange={onChange} /></label>
              <label>{t('salePriceVnd')}<input name="price" type="number" min="0" required value={form.price} onChange={onChange} /></label>
              <label>{t('discountPercent')}<input type="number" min="0" max="100" placeholder="15" onChange={applyDiscountPercent} /></label>
              <label>{t('promotionTitle')}<input name="promotionTitle" value={form.promotionTitle || ''} onChange={onChange} /></label>
              <label>{t('discountStartDate')}<input name="discountStartDate" type="date" value={(form.discountStartDate || '').split('T')[0]} onChange={onChange} /></label>
              <label>{t('discountEndDate')}<input name="discountEndDate" type="date" value={(form.discountEndDate || '').split('T')[0]} onChange={onChange} /></label>
              <label className="span-2">{t('promotionDescription')}<textarea name="promotionDescription" rows="2" value={form.promotionDescription || ''} onChange={onChange} /></label>
            </div>
          </div>
          <label className="checkbox-label"><input name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />{t('activeForSale')}</label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn-primary">{isEdit ? t('update') : t('add')}</button>
        </div>
      </form>
    </div>
  )
}
