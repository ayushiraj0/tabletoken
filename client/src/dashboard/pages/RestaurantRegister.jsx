import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function RestaurantRegister() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    restaurantName: '', cuisine: '', address: '',
  });
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
      const res = await API.post('/auth/register-restaurant', form);
      localStorage.setItem('tt_token', res.data.token);
      login(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-white">Register Your Restaurant</h1>
          <p className="text-gray-400 text-sm mt-1">Join TableToken and start accepting orders</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Raj Kumar"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="owner@restaurant.com"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 6 characters"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Restaurant Details</p>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Restaurant name</label>
              <input name="restaurantName" value={form.restaurantName} onChange={handleChange} required placeholder="Spice Garden"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Cuisine type</label>
              <input name="cuisine" value={form.cuisine} onChange={handleChange} required placeholder="North Indian · Mughlai"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} required rows={2}
                placeholder="Full restaurant address"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1">
              {loading ? 'Creating account...' : 'Register Restaurant'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/dashboard/login" className="text-red-400 hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}