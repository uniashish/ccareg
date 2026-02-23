import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthProgress from "./common/AuthProgress";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <AuthProgress
        title="Checking access"
        subtitle="Confirming your permissions"
        fullscreen
      />
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(role)) return <Navigate to="/login" />;

  return children;
}
