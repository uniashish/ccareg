import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthProgress from "../components/common/AuthProgress";

export default function AuthGate() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <AuthProgress
        title="Preparing your workspace"
        subtitle="Checking login and profile"
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
