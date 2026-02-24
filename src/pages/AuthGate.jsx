import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthProgress from "../components/common/AuthProgress";
import { GOOGLE_AUTH_LOADING_COPY } from "../constants/authCopy";

export default function AuthGate() {
  const { user, profile, loading } = useAuth();

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

  if (!profile) {
    return <p style={{ padding: 40 }}>Loading profile...</p>;
  }

  if (profile.role === "admin") return <Navigate to="/admin" />;
  if (profile.role === "student") return <Navigate to="/student" />;
  if (profile.role === "teacher") return <Navigate to="/teacher" />;
  if (profile.role === "vendor") return <Navigate to="/vendor" />;

  return <p>Invalid role</p>;
}
