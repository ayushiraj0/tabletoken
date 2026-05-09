import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api/axios';

export default function CheckEmail() {
  const location            = useLocation();
  const email               = location.state?.email || '';
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/resend-verification', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Email icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📧</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          We sent a verification link to
        </p>
        <p className="text-gray-900 font-semibold text-base mb-6">
          {email || 'your email address'}
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-3">What to do next:</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '1️⃣', text: 'Open your email inbox' },
              { icon: '2️⃣', text: 'Look for an email from TableToken' },
              { icon: '3️⃣', text: 'Click "Verify Email Address" button' },
              { icon: '4️⃣', text: 'Come back here and sign in!' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{step.icon}</span>
                <p className="text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resend */}
        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            ✅ Verification email resent! Check your inbox.
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">
            Didn't receive the email?{' '}
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-red-600 font-semibold hover:underline disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend email'}
            </button>
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors text-center"
          >
            Go to Sign In
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}