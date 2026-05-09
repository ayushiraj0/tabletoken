import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardLogin } from '../../api/auth';

export default function DashboardLogin() {
  const [role, setRole]       = useState('restaurant');
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await dashboardLogin({ email: form.email, password: form.password });
      localStorage.setItem('tt_token', res.data.token);
      login(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-white">TableToken</h1>
          <p className="text-gray-400 text-sm mt-1">Dashboard Portal</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-900 p-1 rounded-xl">
            <button onClick={() => setRole('restaurant')}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${role === 'restaurant' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              🏪 Restaurant
            </button>
            <button onClick={() => setRole('admin')}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${role === 'admin' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              ⚙️ Admin
            </button>
          </div>
          <h2 className="text-lg font-semibold text-white mb-5">
            {role === 'admin' ? 'Admin Sign In' : 'Restaurant Sign In'}
          </h2>
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="owner@restaurant.com"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1">
              {loading ? 'Signing in...' : 'Sign in to Dashboard'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-6">
            Customer ordering?{' '}
            <Link to="/" className="text-red-400 hover:underline">Go to main site →</Link>
          </p>
          <p className="text-center text-xs text-gray-500 mt-4">
            New restaurant?{' '}
            <Link to="/dashboard/register" className="text-red-400 hover:underline">
              Register here →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}