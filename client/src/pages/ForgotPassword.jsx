import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            If <strong>{email}</strong> is registered, we've sent a password reset link.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 mb-6 text-left">
            <p className="text-blue-700 text-sm font-medium mb-2">What to do next:</p>
            <div className="flex flex-col gap-2">
              {[
                '1. Open your email inbox',
                '2. Click "Reset Password" button',
                '3. Set your new password',
                '4. Come back and sign in!',
              ].map((step, i) => (
                <p key={i} className="text-sm text-blue-600">{step}</p>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-6">Link expires in 1 hour.</p>
          <Link to="/login"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors">
            Back to Sign In
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
          <p className="text-gray-500 text-sm mt-2">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Forgot password?</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your email and we'll send you a reset link.
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
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-red-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}