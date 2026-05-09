import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/auth';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      localStorage.setItem('tt_token', res.data.token);
      login(res.data.user);
      navigate('/restaurants');
    } catch (err) {
      // Email not verified
      if (err.response?.data?.isUnverified) {
        navigate('/check-email', { state: { email: err.response.data.email } });
        return;
      }
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gray-900">🍽️ TableToken</Link>
          <p className="text-gray-500 text-sm mt-2">Sign in to continue ordering</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold mb-6">Welcome back</h1>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-gray-600">Password</label>
                <Link to="/forgot-password" className="text-xs text-red-600 hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password" name="password" value={form.password} onChange={handleChange} required
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 font-medium hover:underline">Register</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-4">
            Restaurant or Admin?{' '}
            <Link to="/dashboard/login" className="text-red-600 hover:underline">Go to Dashboard login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}