import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider }    from './context/CartContext';
import { AuthProvider }    from './context/AuthContext';
import { SocketProvider }  from './context/SocketContext';

// Customer pages
import Navbar             from './components/Navbar';
import Landing            from './pages/Landing';
import Login              from './pages/Login';
import Register           from './pages/Register';
import Restaurants        from './pages/Restaurants';
import Menu               from './pages/Menu';
import Token              from './pages/Token';
import Orders             from './pages/Orders';
import CreateGroupOrder   from './pages/CreateGroupOrder';
import GroupOrder         from './pages/GroupOrder';
import CheckEmail         from './pages/CheckEmail';
import VerifyEmail        from './pages/VerifyEmail';
import ForgotPassword     from './pages/ForgotPassword';
import ResetPassword      from './pages/ResetPassword';
import ProtectedRoute     from './components/ProtectedRoute';

// Dashboard
import DashboardLogin      from './dashboard/pages/DashboardLogin';
import DashboardLayout     from './dashboard/components/DashboardLayout';
import Overview            from './dashboard/pages/Overview';
import LiveOrders          from './dashboard/pages/LiveOrders';
import MenuManagement      from './dashboard/pages/MenuManagement';
import Tables              from './dashboard/pages/Tables';
import Reports             from './dashboard/pages/Reports';
import Settings            from './dashboard/pages/Settings';
import DashboardRoute      from './components/DashboardRoute';
import RestaurantRegister  from './dashboard/pages/RestaurantRegister';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>

              {/* Dashboard */}
              <Route path="/dashboard/login"    element={<DashboardLogin />} />
              <Route path="/dashboard/register" element={<RestaurantRegister />} />
              <Route path="/dashboard" element={<DashboardRoute><DashboardLayout><Overview /></DashboardLayout></DashboardRoute>} />
              <Route path="/dashboard/orders"   element={<DashboardRoute><DashboardLayout><LiveOrders /></DashboardLayout></DashboardRoute>} />
              <Route path="/dashboard/menu"     element={<DashboardRoute><DashboardLayout><MenuManagement /></DashboardLayout></DashboardRoute>} />
              <Route path="/dashboard/tables"   element={<DashboardRoute><DashboardLayout><Tables /></DashboardLayout></DashboardRoute>} />
              <Route path="/dashboard/reports"  element={<DashboardRoute><DashboardLayout><Reports /></DashboardLayout></DashboardRoute>} />
              <Route path="/dashboard/settings" element={<DashboardRoute><DashboardLayout><Settings /></DashboardLayout></DashboardRoute>} />

              {/* Customer */}
              <Route path="/"         element={<><Navbar /><Landing /></>} />
              <Route path="/login"    element={<><Navbar /><Login /></>} />
              <Route path="/register" element={<><Navbar /><Register /></>} />
              <Route path="/restaurants" element={<ProtectedRoute><Navbar /><Restaurants /></ProtectedRoute>} />
              <Route path="/menu/:restaurantId" element={<ProtectedRoute><Navbar /><Menu /></ProtectedRoute>} />
              <Route path="/token/:orderId"     element={<ProtectedRoute><Navbar /><Token /></ProtectedRoute>} />
              <Route path="/orders"             element={<ProtectedRoute><Navbar /><Orders /></ProtectedRoute>} />

              {/* Group Order */}
              <Route path="/group/create" element={<ProtectedRoute><Navbar /><CreateGroupOrder /></ProtectedRoute>} />
              <Route path="/group/:code"  element={<ProtectedRoute><Navbar /><GroupOrder /></ProtectedRoute>} />

              {/* Email verification */}
              <Route path="/check-email"           element={<><Navbar /><CheckEmail /></>} />
              <Route path="/verify-email/:token"   element={<><Navbar /><VerifyEmail /></>} />

              {/* Forgot / Reset password */}
              <Route path="/forgot-password"       element={<><Navbar /><ForgotPassword /></>} />
              <Route path="/reset-password/:token" element={<><Navbar /><ResetPassword /></>} />

            </Routes>
          </BrowserRouter>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;