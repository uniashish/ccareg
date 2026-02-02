import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, logout } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FcGoogle } from "react-icons/fc"; // Google icon

export default function Login() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else navigate("/student");
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      const email = result.user.email;

      if (!email.endsWith("@sis-kg.org")) {
        alert("Please login using your school email (@sis-kg.org)");
        await logout();
        return;
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Google login failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        Checking login...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col items-center justify-center gap-6 bg-white p-10 rounded-3xl shadow-2xl transform transition-transform hover:scale-105">
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          CCA Registration Portal
        </h1>

        {!user && (
          <button
            onClick={handleLogin}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow hover:shadow-md transition-all transform active:scale-95"
          >
            <FcGoogle size={24} />
            <span className="text-gray-800 font-medium">
              Login with SISNEJ Google Account
            </span>
          </button>
        )}

        {user && (
          <p className="text-green-700 text-center">
            Logged in as {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
