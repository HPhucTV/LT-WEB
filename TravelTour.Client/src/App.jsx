import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { SettingsProvider } from './contexts/SettingsContext'
import ProtectedRoute from './components/ProtectedRoute'

/* ─── Public pages ─── */
const HomePage = lazy(() => import('./components/HomePage'))
const TourDetails = lazy(() => import('./components/TourDetails'))
const LoginPage = lazy(() => import('./components/LoginPage'))

/* ─── Admin pages ─── */
const AdminLayout = lazy(() => import('./components/AdminLayout'))
const DashboardPage = lazy(() => import('./components/DashboardPage'))
const TourList = lazy(() => import('./components/TourList'))
const BookingList = lazy(() => import('./components/BookingList'))
const CustomerList = lazy(() => import('./components/CustomerList'))
const ReportPage = lazy(() => import('./components/ReportPage'))
const VnpayPage = lazy(() => import('./components/VnpayPage'))
const PaymentResultPage = lazy(() => import('./components/PaymentResultPage'))
const VnpayRedirectPage = lazy(() => import('./components/VnpayRedirectPage'))
const UsersPage = lazy(() => import('./components/UsersPage'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))
const SummerCampaignPage = lazy(() => import('./components/SummerCampaignPage'))

/* ─── Staff pages ─── */
const StaffLayout = lazy(() => import('./components/staff/StaffLayout'))
const StaffDashboard = lazy(() => import('./components/staff/StaffDashboard'))
const StaffSchedule = lazy(() => import('./components/staff/StaffSchedule'))
const StaffAvailability = lazy(() => import('./components/staff/StaffAvailability'))
const StaffNotifications = lazy(() => import('./components/staff/StaffNotifications'))

/* ─── Customer pages ─── */
const CustomerLayout = lazy(() => import('./components/customer/CustomerLayout'))
const CustomerDashboard = lazy(() => import('./components/customer/CustomerDashboard'))
const CustomerFavorites = lazy(() => import('./components/customer/CustomerFavorites'))
const CustomerReviews = lazy(() => import('./components/customer/CustomerReviews'))
const CustomerNotifications = lazy(() => import('./components/customer/CustomerNotifications'))
const CustomerSupport = lazy(() => import('./components/customer/CustomerSupport'))

import './App.css'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="route-loading">Đang tải...</div>}>
              <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/tours/:id" element={<TourDetails />} />
            <Route path="/promotions" element={<SummerCampaignPage audience="public" />} />
            <Route path="/payment/vnpay/:bookingId" element={<ProtectedRoute allowedRoles={['customer', '']}><VnpayRedirectPage /></ProtectedRoute>} />
            <Route path="/payment-result" element={<PaymentResultPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin — only Admin role */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tours" element={<TourList />} />
              <Route path="bookings" element={<BookingList />} />
              <Route path="schedule" element={<StaffSchedule canManage />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="reports" element={<ReportPage />} />
              <Route path="vnpay" element={<VnpayPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="promotions" element={<SummerCampaignPage />} />
            </Route>

            {/* Staff — only Staff role */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="schedule" element={<StaffSchedule />} />
              <Route path="availability" element={<StaffAvailability />} />
              <Route path="notifications" element={<StaffNotifications />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Customer — customer role or logged in without specific admin/staff role */}
            <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer', '']}><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="tours" element={<TourList />} />
              <Route path="my-tours" element={<BookingList />} />
              <Route path="favorites" element={<CustomerFavorites />} />
              <Route path="reviews" element={<CustomerReviews />} />
              <Route path="notifications" element={<CustomerNotifications />} />
              <Route path="support" element={<CustomerSupport />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
