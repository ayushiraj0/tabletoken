import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function ResetPassword() {
  const { token }               = useParams();
  const navigate                = useNavigate();
  const [form, setForm]         = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Password Reset!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been updated successfully. Redirecting to login...
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 text-sm font-medium">
              🎉 You can now sign in with your new password.
            </p>
          </div>
          <Link to="/login"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors">
            Sign In Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gray-900">🍽️ TableToken</Link>
          <p className="text-gray-500 text-sm mt-2">Set your new password</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Create new password</h1>
            <p className="text-sm text-gray-500 mt-2">
              Choose a strong password for your account.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                New password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repeat password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
              />
            </div>

            {/* Password strength indicator */}
            {form.password && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${
                      form.password.length >= i * 3
                        ? i <= 1 ? 'bg-red-500'
                        : i <= 2 ? 'bg-amber-500'
                        : i <= 3 ? 'bg-blue-500'
                        : 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {form.password.length < 6  ? 'Too short' :
                   form.password.length < 9  ? 'Weak' :
                   form.password.length < 12 ? 'Medium' : 'Strong'} password
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-red-600 font-medium hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}