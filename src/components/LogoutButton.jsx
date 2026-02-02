import { logout } from "../firebase";

export default function LogoutButton() {
  return (
    <button
      onClick={logout}
      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
}
