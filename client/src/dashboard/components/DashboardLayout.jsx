import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ADMIN_NAV = [
  { to: '/dashboard',           icon: '📊', label: 'Overview'         },
  { to: '/dashboard/orders',    icon: '🎫', label: 'Live Orders'      },
  { to: '/dashboard/menu',      icon: '🍽️', label: 'Menu Management'  },
  { to: '/dashboard/tables',    icon: '🪑', label: 'Tables'           },
  { to: '/dashboard/reports',   icon: '📈', label: 'Reports'          },
  { to: '/dashboard/settings',  icon: '⚙️', label: 'Settings'         },
];

const RESTAURANT_NAV = [
  { to: '/dashboard',           icon: '📊', label: 'Overview'         },
  { to: '/dashboard/orders',    icon: '🎫', label: 'Live Orders'      },
  { to: '/dashboard/menu',      icon: '🍽️', label: 'Menu Management'  },
  { to: '/dashboard/tables',    icon: '🪑', label: 'Tables'           },
  { to: '/dashboard/reports',   icon: '📈', label: 'Reports'          },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'admin' ? ADMIN_NAV : RESTAURANT_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-gray-900 text-white flex flex-col flex-shrink-0 transition-all duration-200`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
          {!collapsed && (
            <span className="font-bold text-base tracking-tight">🍽️ TableToken</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors ml-auto"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="bg-gray-800 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                user?.role === 'admin'
                  ? 'bg-purple-900 text-purple-300'
                  : 'bg-blue-900 text-blue-300'
              }`}>
                {user?.role === 'admin' ? '⚙️ Admin' : '🏪 Restaurant'}
              </span>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-gray-800 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <span className="text-base flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {user?.role === 'admin' ? 'Admin Dashboard' : `${user?.restaurantName || 'Restaurant'} Dashboard`}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </div>
            {/* Notification bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}