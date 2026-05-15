import { useState } from 'react'
import { tourApi } from '../api'
import { useToast } from '../contexts/ToastContext'

const EMPTY = {
  code: '',
  name: '',
  destination: '',
  durationDays: 1,
  price: 0,
  originalPrice: 0,
  maxGuests: 20,
  category: 'Khám phá',
  description: '',
  imageUrl: '',
  isActive: true,
}

export default function TourForm({ tour, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(tour ?? EMPTY)
  const [error, setError] = useState('')
  const isEdit = !!tour

  function onChange(event) {
    const { name, value, type, checked } = event.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      if (isEdit) await tourApi.update(tour.id, form)
      else await tourApi.create(form)
      toast.success(isEdit ? 'Đã cập nhật tour' : 'Đã thêm tour mới')
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isEdit ? 'Cập nhật tour' : 'Thêm tour mới'}</h2>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <label>Mã tour<input name="code" required value={form.code} onChange={onChange} /></label>
          <label>Tên tour<input name="name" required value={form.name} onChange={onChange} /></label>
          <label>Điểm đến<input name="destination" required value={form.destination} onChange={onChange} /></label>
          <label>Số ngày<input name="durationDays" type="number" min="1" required value={form.durationDays} onChange={onChange} /></label>
          <label>Giá (VNĐ)<input name="price" type="number" min="0" required value={form.price} onChange={onChange} /></label>
          <label>Giá gốc (VNĐ)<input name="originalPrice" type="number" min="0" value={form.originalPrice} onChange={onChange} /></label>
          <label>Số khách tối đa<input name="maxGuests" type="number" min="1" required value={form.maxGuests} onChange={onChange} /></label>
          <label>Danh mục
            <select name="category" value={form.category} onChange={onChange}>
              <option value="Khám phá">Khám phá</option>
              <option value="Nghỉ dưỡng">Nghỉ dưỡng</option>
              <option value="Gia đình">Gia đình</option>
            </select>
          </label>
          <label className="span-2">URL hình ảnh<input name="imageUrl" value={form.imageUrl} onChange={onChange} /></label>
          <label className="span-2">Mô tả<textarea name="description" rows="3" value={form.description} onChange={onChange} /></label>
          <label className="checkbox-label"><input name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />Đang mở bán</label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
          <button type="submit" className="btn-primary">{isEdit ? 'Cập nhật' : 'Thêm'}</button>
        </div>
      </form>
    </div>
  )
}
