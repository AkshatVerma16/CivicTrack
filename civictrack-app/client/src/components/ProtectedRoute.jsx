import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token } = useAdminAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Redirect to unauthorized page or role-specific dashboard
      if (userRole === 'admin') return <Navigate to="/admin" replace />;
      if (userRole === 'ministry') return <Navigate to="/ministry" replace />;
      if (userRole === 'vendor') return <Navigate to="/vendor" replace />;
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  } catch (error) {
    // Invalid token
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;