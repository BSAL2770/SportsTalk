import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          SportsTalk
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/sports" className="hover:text-gray-300">
            Sports
          </Link>
          <Link to="/newPost" className="hover:text-gray-300">
            New Post
          </Link>

          {user ? (
            <>
              <span className="text-gray-300">@{user.username}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
