import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/auth';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await registerUser({
        name:     `${form.firstName} ${form.lastName}`,
        phone:    form.phone,
        email:    form.email,
        password: form.password,
      });
      // Don't login yet — redirect to check email page
      navigate('/check-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gray-900">🍽️ TableToken</Link>
          <p className="text-gray-500 text-sm mt-2">Create your account — it's free</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold mb-6">Create account</h1>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">First name</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Rahul"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Last name</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Kumar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Min. 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Repeat password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}