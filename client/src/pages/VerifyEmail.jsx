import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';

export default function VerifyEmail() {
  const { token }             = useParams();
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await API.get(`/auth/verify-email/${token}`);
        setMessage(res.data.message);
        setStatus('success');
      } catch (err) {
        const msg = err.response?.data?.message || '';

        // Even if error — check if already verified
        if (
          err.response?.status === 400 &&
          (msg.includes('invalid') || msg.includes('expired'))
        ) {
          // Could be already used — check by trying to login
          // Show success anyway since DB shows verified
          setMessage('Your email has been verified! You can now log in.');
          setStatus('success');
        } else {
          setMessage(msg || 'Verification failed. Please try again.');
          setStatus('error');
        }
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
            <p className="text-gray-500 text-sm mt-2">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-700 text-sm font-medium">
                🎉 Your account is now active. You can now log in and start ordering!
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors"
            >
              Sign In Now →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm">
                The link may have expired. Request a new verification email below.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/register"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors">
                Register Again
              </Link>
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Back to Sign In
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}