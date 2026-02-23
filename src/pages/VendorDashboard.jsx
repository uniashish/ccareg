import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import VendorWelcomeCard from "../components/vendor/VendorWelcomeCard";
import sisBackground from "../assets/sisbackground.png";

export default function VendorDashboard() {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${sisBackground})` }}
    >
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 md:px-10">
        <VendorWelcomeCard
          vendorName={user?.displayName}
          vendorEmail={user?.email}
        />
      </main>
    </div>
  );
}
