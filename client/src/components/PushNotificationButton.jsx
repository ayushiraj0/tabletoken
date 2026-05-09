import { usePushNotification } from '../hooks/usePushNotification';

export default function PushNotificationButton({ variant = 'banner' }) {
  const { permission, subscribed, loading, supported, subscribe, unsubscribe } = usePushNotification();

  // Not supported
  if (!supported) return null;

  // Already subscribed — show small toggle
  if (subscribed) {
    if (variant === 'icon') {
      return (
        <button
          onClick={unsubscribe}
          disabled={loading}
          title="Disable notifications"
          className="text-green-400 hover:text-gray-400 transition-colors text-lg"
        >
          🔔
        </button>
      );
    }
    return null; // Don't show banner if already subscribed
  }

  // Permission denied
  if (permission === 'denied') {
    if (variant === 'banner') {
      return (
        <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-500">
          <span>🔕</span>
          <span>Notifications blocked. Enable in browser settings to get order updates.</span>
        </div>
      );
    }
    return null;
  }

  // Not yet subscribed — show enable button
  if (variant === 'banner') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">Enable notifications</p>
            <p className="text-xs text-blue-600">Get notified when your food is ready — even if this tab is closed!</p>
          </div>
        </div>
        <button
          onClick={subscribe}
          disabled={loading}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Enabling...' : 'Enable'}
        </button>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={subscribe}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        🔔 {loading ? 'Enabling...' : 'Enable Notifications'}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={subscribe}
        disabled={loading}
        title="Enable notifications"
        className="text-gray-400 hover:text-blue-500 transition-colors text-lg"
      >
        🔕
      </button>
    );
  }

  return null;
}