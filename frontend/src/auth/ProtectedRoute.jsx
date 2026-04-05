import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decoded = jwtDecode(token);
    const role = decoded.role;

    if (!allowedRoles.includes(role)) {
      return <Navigate to="/login" />;
    }

    return children;

  } catch (err) {
    return <Navigate to="/login" />;
  }
}

export default ProtectedRoute;