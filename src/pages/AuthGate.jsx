import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthGate() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <p style={{ padding: 40 }}>Checking login...</p>;
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

  return <p>Invalid role</p>;
}
