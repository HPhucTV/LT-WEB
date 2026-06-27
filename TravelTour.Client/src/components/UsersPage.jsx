import { useEffect, useMemo, useState } from 'react'
import { userApi } from '../api'
import Pagination from './Pagination'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { paginateItems } from '../utils/pagination'

const ROLE_KEYS = {
  Admin: 'adminRole',
  Sales: 'salesRole',
  Staff: 'staffRole',
  Customer: 'customerRole',
}

export default function UsersPage() {
  const toast = useToast()
  const { t } = useSettings()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { loadUsers() }, [])

  const pagination = useMemo(() => paginateItems(users, page, pageSize), [page, pageSize, users])

  useEffect(() => {
    if (pagination.currentPage !== page) {
      setPage(pagination.currentPage)
    }
  }, [page, pagination.currentPage])

  async function loadUsers() {
    setLoading(true)
    try { setUsers(await userApi.list()) }
    catch { setUsers([]) }
    finally { setLoading(false) }
  }

  async function handleRoleChange(id, role) {
    try {
      await userApi.updateRole(id, role)
      loadUsers()
      toast.success(t('update'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${name}"?`)) return
    try {
      await userApi.remove(id)
      loadUsers()
      toast.success(t('delete'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{t('usersTitle')}</h2>
          <p>{t('usersHelp')}</p>
        </div>
      </section>

      {loading ? (
        <p className="empty-msg">{t('loading')}</p>
      ) : users.length === 0 ? (
        <p className="empty-msg">{t('noUsers')}</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>{t('username')}</th><th>{t('fullName')}</th><th>{t('role')}</th><th>{t('action')}</th></tr>
              </thead>
              <tbody>
                {pagination.items.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.fullName}</td>
                    <td>
                      <select className={`status-select ${user.role.toLowerCase()}`} value={user.role} onChange={event => handleRoleChange(user.id, event.target.value)}>
                        {Object.entries(ROLE_KEYS).map(([value, key]) => (
                          <option key={value} value={value}>{t(key)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="row-actions">
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(user.id, user.username)}>{t('delete')}</button>
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
            itemLabel="người dùng"
          />
        </>
      )}
    </>
  )
}
