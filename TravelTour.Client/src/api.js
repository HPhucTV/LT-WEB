import { handleMockRequest } from './mockApi'

const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function isLoggedIn() {
  return !!getToken()
}

async function request(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${url}`, { ...options, headers })
  } catch {
    console.warn(`[API Mock] Network error for ${url}. Using mock API.`)
    return handleMockRequest(url, options)
  }

  if (response.status >= 500) {
    console.warn(`[API Mock] Server error ${response.status} for ${url}. Using mock API.`)
    return handleMockRequest(url, options)
  }

  if (response.status === 401 && url === '/auth/login') {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.')
  }

  if (response.status === 401) {
    const currentToken = getToken()
    if (currentToken && currentToken.startsWith('mock_jwt_')) {
      console.warn(`[API Mock] Mock token detected for ${url}. Using mock API.`)
      return handleMockRequest(url, options)
    }
    if (currentToken) {
      clearToken()
      window.location.reload()
    }
    throw new Error('Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || `Lỗi ${response.status}`)
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    return response.blob()
  }

  return response.json()
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
}

// ─── Tours ──────────────────────────────────────────────────────────────────

export const tourApi = {
  list: () => request('/tours'),
  get: (id) => request(`/tours/${id}`),
  create: (data) => request('/tours', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tours/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/tours/${id}`, { method: 'DELETE' }),
  ratings: () => request('/tours/ratings'),
}

// ─── Schedules ──────────────────────────────────────────────────────────────

export const scheduleApi = {
  list: (params = {}) => {
    const query = new URLSearchParams()
    if (params.tourId) query.set('tourId', params.tourId)
    if (params.status) query.set('status', params.status)
    const suffix = query.toString() ? `?${query}` : ''
    return request(`/schedules${suffix}`)
  },
  listByTour: (tourId) => request(`/tours/${tourId}/schedules`),
  create: (tourId, data) =>
    request(`/tours/${tourId}/schedules`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignGuide: (id, guideUserId) =>
    request(`/schedules/${id}/assign-guide`, { method: 'PUT', body: JSON.stringify({ guideUserId }) }),
  remove: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
}

export const guideAvailabilityApi = {
  mine: () => request('/guide-availabilities/my'),
  create: (data) => request('/guide-availabilities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/guide-availabilities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/guide-availabilities/${id}`, { method: 'DELETE' }),
}

export const guideApi = {
  available: (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    return request(`/guides/available?${params}`)
  },
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export const bookingApi = {
  list: () => request('/bookings'),
  create: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  payWithVnpay: (id) => request(`/payments/vnpay/bookings/${id}`, { method: 'POST' }),
  remove: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
}

// ─── Customers ──────────────────────────────────────────────────────────────

export const customerApi = {
  list: () => request('/customers'),
  create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
}

// ─── Reports ────────────────────────────────────────────────────────────────

export const reportApi = {
  summary: () => request('/reports/summary'),
  revenue: (from, to) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return request(`/reports/revenue?${params}`)
  },
  exportBookings: (from, to) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return request(`/reports/export/bookings?${params}`)
  },
  exportRevenue: (from, to) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return request(`/reports/export/revenue?${params}`)
  },
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export const reviewApi = {
  listByTour: (tourId) => request(`/tours/${tourId}/reviews`),
  listMine: () => request('/reviews/me'),
  create: (tourId, data) => request(`/tours/${tourId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
}

// ─── Favorites ──────────────────────────────────────────────────────────────

export const favoriteApi = {
  list: () => request('/favorites'),
  add: (tourId) => request('/favorites', { method: 'POST', body: JSON.stringify({ tourId }) }),
  remove: (tourId) => request(`/favorites/${tourId}`, { method: 'DELETE' }),
}

// ─── Users (Admin) ──────────────────────────────────────────────────────────

export const userApi = {
  list: () => request('/users'),
  updateRole: (id, role) => request(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
}
