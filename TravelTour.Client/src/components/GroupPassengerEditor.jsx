function createPassenger(type = 'Adult') {
  return {
    fullName: '',
    dateOfBirth: '',
    passengerType: type,
    identityNumber: '',
    phone: '',
  }
}

export function createPassengerList(count = 1) {
  return Array.from({ length: Math.max(1, count) }, () => createPassenger())
}

export default function GroupPassengerEditor({ passengers, onChange, errors = [] }) {
  function updatePassenger(index, field, value) {
    onChange(passengers.map((passenger, passengerIndex) =>
      passengerIndex === index ? { ...passenger, [field]: value } : passenger))
  }

  function addPassenger(type = 'Adult') {
    onChange([...passengers, createPassenger(type)])
  }

  function removePassenger(index) {
    if (passengers.length === 1) return
    onChange(passengers.filter((_, passengerIndex) => passengerIndex !== index))
  }

  return (
    <div className="group-passenger-editor">
      <div className="form-actions" style={{ justifyContent: 'space-between' }}>
        <strong>Danh sách hành khách</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-secondary" onClick={() => addPassenger('Adult')}>+ Người lớn</button>
          <button type="button" className="btn-secondary" onClick={() => addPassenger('Child')}>+ Trẻ em</button>
        </div>
      </div>
      {passengers.map((passenger, index) => {
        const rowErrors = errors[index] || {}
        const isChild = passenger.passengerType === 'Child'
        return (
          <div key={`${index}-${passenger.passengerType}`} className="checkout-panel" style={{ marginBottom: 16 }}>
            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <strong>Hành khách {index + 1}</strong>
              {passengers.length > 1 && <button type="button" className="btn-sm btn-danger" onClick={() => removePassenger(index)}>Xóa</button>}
            </div>
            <div className="checkout-contact-grid">
              <label>
                Họ tên *
                <input value={passenger.fullName} onChange={event => updatePassenger(index, 'fullName', event.target.value)} />
                {rowErrors.fullName && <small>{rowErrors.fullName}</small>}
              </label>
              <label>
                Loại hành khách *
                <select value={passenger.passengerType} onChange={event => updatePassenger(index, 'passengerType', event.target.value)}>
                  <option value="Adult">Người lớn</option>
                  <option value="Child">Trẻ em</option>
                </select>
              </label>
              <label>
                Ngày sinh *
                <input type="date" value={passenger.dateOfBirth} onChange={event => updatePassenger(index, 'dateOfBirth', event.target.value)} />
                {rowErrors.dateOfBirth && <small>{rowErrors.dateOfBirth}</small>}
              </label>
              <label>
                CCCD/Hộ chiếu{isChild ? '' : ' *'}
                <input value={passenger.identityNumber} onChange={event => updatePassenger(index, 'identityNumber', event.target.value)} />
                {rowErrors.identityNumber && <small>{rowErrors.identityNumber}</small>}
              </label>
              <label>
                Số điện thoại *
                <input value={passenger.phone} onChange={event => updatePassenger(index, 'phone', event.target.value)} />
                {rowErrors.phone && <small>{rowErrors.phone}</small>}
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
