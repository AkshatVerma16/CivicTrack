import { useAdminAuth } from '../context/AdminAuthContext';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedAdminRoute({ children }) {
  const { token } = useAdminAuth();
  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  try {
    const decoded = jwtDecode(token)
    if (decoded.role !== 'admin') {
      return <Navigate to="/login" replace />
    }
    return children
  } catch (error) {
    localStorage.removeItem('token')
    return <Navigate to="/admin/login" replace />
  }
}







