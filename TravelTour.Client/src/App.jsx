import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { SettingsProvider } from './contexts/SettingsContext'
import ProtectedRoute from './components/ProtectedRoute'

/* ─── Public pages ─── */
import HomePage from './components/HomePage'
import TourDetails from './components/TourDetails'
import LoginPage from './components/LoginPage'

/* ─── Admin pages ─── */
import AdminLayout from './components/AdminLayout'
import DashboardPage from './components/DashboardPage'
import TourList from './components/TourList'
import BookingList from './components/BookingList'
import CustomerList from './components/CustomerList'
import ReportPage from './components/ReportPage'
import VnpayPage from './components/VnpayPage'
import PaymentResultPage from './components/PaymentResultPage'
import VnpayRedirectPage from './components/VnpayRedirectPage'
import UsersPage from './components/UsersPage'
import SettingsPage from './components/SettingsPage'
import SummerCampaignPage from './components/SummerCampaignPage'

/* ─── Staff pages ─── */
import StaffLayout from './components/staff/StaffLayout'
import StaffDashboard from './components/staff/StaffDashboard'
import StaffSchedule from './components/staff/StaffSchedule'
import StaffAvailability from './components/staff/StaffAvailability'
import StaffNotifications from './components/staff/StaffNotifications'

/* ─── Customer pages ─── */
import CustomerLayout from './components/customer/CustomerLayout'
import CustomerDashboard from './components/customer/CustomerDashboard'
import CustomerFavorites from './components/customer/CustomerFavorites'
import CustomerReviews from './components/customer/CustomerReviews'
import CustomerNotifications from './components/customer/CustomerNotifications'
import CustomerSupport from './components/customer/CustomerSupport'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <BrowserRouter>
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
          </BrowserRouter>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
