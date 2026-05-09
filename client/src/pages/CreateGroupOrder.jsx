import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createGroupOrder } from '../api/groupOrders';

export default function CreateGroupOrder() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const location              = useLocation();
  const restaurant            = location.state?.restaurant;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCreate = async () => {
    if (!restaurant?._id) {
      setError('Please select a restaurant first.');
      return;
    }
    setLoading(true);
    try {
      const res   = await createGroupOrder({ restaurantId: restaurant._id });
      const group = res.data.data;
      navigate(`/group/${group.code}`, { state: { isHost: true, restaurant } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group order.');
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No restaurant selected</h2>
          <p className="text-gray-500 text-sm mb-6">Please select a restaurant first to create a group order.</p>
          <button onClick={() => navigate('/restaurants')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors">
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👥</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Group Order</h1>
          <p className="text-gray-500 text-sm mt-2">
            Invite your friends to add their items — you pay together!
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* Restaurant info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-6">
            <span className="text-3xl">{restaurant.emoji || '🍽️'}</span>
            <div>
              <p className="font-semibold text-gray-900">{restaurant.name}</p>
              <p className="text-xs text-gray-500">{restaurant.cuisine}</p>
            </div>
          </div>

          {/* Host info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-base flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Group host — you will pay</p>
            </div>
            <span className="ml-auto bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
              Host
            </span>
          </div>

          {/* How it works */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 mb-2">How group order works:</p>
            <div className="flex flex-col gap-2">
              {[
                '1. Create group → get a unique link',
                '2. Share link with friends via WhatsApp',
                '3. Everyone adds their own items',
                '4. You review and pay for everyone',
                '5. One token for the whole group!',
              ].map((step, i) => (
                <p key={i} className="text-xs text-blue-600">{step}</p>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Creating group...' : '🚀 Create Group & Get Link'}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full mt-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}