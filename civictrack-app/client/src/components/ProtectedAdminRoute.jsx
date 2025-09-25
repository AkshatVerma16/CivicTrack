import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function ProtectedAdminRoute({ children }) {
  const { isAuthed } = useAdminAuth()
  if (!isAuthed) return <Navigate to="/admin/login" replace />
  return children
}







