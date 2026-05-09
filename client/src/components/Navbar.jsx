import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PushNotificationButton from './PushNotificationButton';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Hide navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span>🍽️</span>
          <span>TableToken</span>
        </Link>

        {/* Nav links - only when logged in */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/restaurants"
              className="text-gray-300 hover:text-white text-sm transition-colors"
            >
              Restaurants
            </Link>
            <Link
              to="/orders"
              className="text-gray-300 hover:text-white text-sm transition-colors"
            >
              My Orders
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Cart button */}
              <PushNotificationButton variant="icon" />

              <Link
                to="/restaurants"
                className="relative flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🛒 Cart
                {totalItems > 0 && (
                  <span className="bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User info + logout */}
              <div className="flex items-center gap-3 ml-2">
                <span className="text-sm text-gray-300 hidden md:block">
                  Hi, {user?.name?.split(' ')[0] || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}