import { useEffect, useMemo, useState } from 'react'
import { customerApi } from '../api'
import Pagination from './Pagination'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { paginateItems } from '../utils/pagination'

export default function CustomerList() {
  const toast = useToast()
  const { t } = useSettings()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { loadCustomers() }, [])

  const pagination = useMemo(() => paginateItems(customers, page, pageSize), [customers, page, pageSize])

  useEffect(() => {
    if (pagination.currentPage !== page) {
      setPage(pagination.currentPage)
    }
  }, [page, pagination.currentPage])

  async function loadCustomers() {
    setLoading(true)
    try { setCustomers(await customerApi.list()) }
    catch { setCustomers([]) }
    finally { setLoading(false) }
  }

  async function handleSave(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const data = {
      fullName: form.get('fullName'),
      phone: form.get('phone'),
      email: form.get('email'),
      address: form.get('address'),
    }
    try {
      if (editItem) await customerApi.update(editItem.id, data)
      else await customerApi.create(data)
      setFormOpen(false)
      setEditItem(null)
      loadCustomers()
      toast.success(editItem ? t('update') : t('addCustomer'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${name}"?`)) return
    try {
      await customerApi.remove(id)
      loadCustomers()
      toast.success(t('delete'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{t('customersTitle')}</h2>
          <p>{t('customersHelp')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setFormOpen(true) }}>+ {t('addCustomer')}</button>
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleSave}>
            <h2>{editItem ? t('editCustomer') : t('addNewCustomer')}</h2>
            <div className="form-grid">
              <label>{t('fullName')}<input name="fullName" required defaultValue={editItem?.fullName} /></label>
              <label>{t('phone')}<input name="phone" required defaultValue={editItem?.phone} /></label>
              <label>Email<input name="email" type="email" defaultValue={editItem?.email} /></label>
              <label>{t('address')}<input name="address" defaultValue={editItem?.address} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">{editItem ? t('update') : t('add')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-msg">{t('loading')}</p>
      ) : customers.length === 0 ? (
        <p className="empty-msg">{t('noCustomers')}</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>{t('fullName')}</th><th>{t('phone')}</th><th>Email</th><th>{t('address')}</th><th>{t('action')}</th></tr></thead>
              <tbody>
                {pagination.items.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.fullName}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.address || '-'}</td>
                    <td className="row-actions">
                      <button className="btn-sm" onClick={() => { setEditItem(customer); setFormOpen(true) }}>{t('edit')}</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(customer.id, customer.fullName)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={value => {
              setPageSize(value)
              setPage(1)
            }}
            itemLabel="khách hàng"
          />
        </>
      )}
    </>
  )
}
