import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './index.css'
import Home from './pages/Home.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import TrackComplaints from './pages/TrackComplaints.jsx'
import Login from './pages/Login.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import MinistryDashboard from './pages/MinistryDashboard.jsx'
import VendorDashboard from './pages/VendorDashboard.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AdminAnalytics from './pages/AdminAnalytics.jsx'
import MapPage from './pages/MapPage.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import VendorRegister from './pages/VendorRegister.jsx'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/report', element: <ReportIssue /> },
  { path: '/track', element: <TrackComplaints /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin', element: (
      <ProtectedAdminRoute>
        <AdminDashboard />
      </ProtectedAdminRoute>
    )
  },
  { path: '/admin/analytics', element: (
      <ProtectedAdminRoute>
        <AdminAnalytics />
      </ProtectedAdminRoute>
    )
  },
  { path: '/user', element: (
      <ProtectedRoute allowedRoles={['user']}>
        <UserDashboard />
      </ProtectedRoute>
    )
  },
  { path: '/ministry', element: (
      <ProtectedRoute allowedRoles={['ministry']}>
        <MinistryDashboard />
      </ProtectedRoute>
    )
  },
  { path: '/vendor', element: (
      <ProtectedRoute allowedRoles={['vendor']}>
        <VendorDashboard />
      </ProtectedRoute>
    )
  },
  { path: '/vendor/register', element: <VendorRegister /> },
  { path: '/profile', element: (
      <ProtectedRoute allowedRoles={['user', 'ministry', 'vendor']}>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  { path: '/map', element: (
      <ProtectedRoute allowedRoles={['user', 'ministry', 'vendor', 'admin']}>
        <MapPage />
      </ProtectedRoute>
    )
  },
])

const rootElement = document.getElementById('root')
createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AdminAuthProvider>
        <RouterProvider router={router} />
      </AdminAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)


