import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthProgress from "../components/common/AuthProgress";
import { GOOGLE_AUTH_LOADING_COPY } from "../constants/authCopy";

export default function AuthGate() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <AuthProgress
        title={GOOGLE_AUTH_LOADING_COPY.title}
        subtitle={GOOGLE_AUTH_LOADING_COPY.subtitle}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!role) {
    return <p style={{ padding: 40 }}>Loading profile...</p>;
  }

  if (role === "admin") return <Navigate to="/admin" />;
  if (role === "student") return <Navigate to="/student" />;
  if (role === "teacher") return <Navigate to="/teacher" />;
  if (role === "vendor") return <Navigate to="/vendor" />;

  return <p>Invalid role</p>;
}
