import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="p-6">Checking login...</div>;

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(role)) return <Navigate to="/login" />;

  return children;
}
