import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx'
import './index.css'
import Home from './pages/Home.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import TrackComplaints from './pages/TrackComplaints.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/report', element: <ReportIssue /> },
  { path: '/track', element: <TrackComplaints /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin', element: (
      <ProtectedAdminRoute>
        <AdminDashboard />
      </ProtectedAdminRoute>
    )
  },
])

const rootElement = document.getElementById('root')
createRoot(rootElement).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  </React.StrictMode>
)


