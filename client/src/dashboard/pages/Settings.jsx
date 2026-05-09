import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRestaurant, updateRestaurant } from '../../api/restaurants';

const DAY_LABELS = {
  mon:'Monday', tue:'Tuesday', wed:'Wednesday',
  thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday'
};

const DEFAULT_HOURS = {
  mon: { open:'09:00', close:'22:00', closed:false },
  tue: { open:'09:00', close:'22:00', closed:false },
  wed: { open:'09:00', close:'22:00', closed:false },
  thu: { open:'09:00', close:'22:00', closed:false },
  fri: { open:'09:00', close:'23:00', closed:false },
  sat: { open:'08:00', close:'23:00', closed:false },
  sun: { open:'10:00', close:'21:00', closed:false },
};

export default function Settings() {
  const { user }                    = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState('');
  const [saved, setSaved]           = useState('');
  const [error, setError]           = useState('');

  const [profile, setProfile] = useState({
    name:'', cuisine:'', phone:'', email:'', address:'', gst:'', upi:'',
  });
  const [hours, setHours]   = useState(DEFAULT_HOURS);
  const [notifs, setNotifs] = useState({
    newOrder:true, orderReady:true, lowStock:false, dailyReport:true,
  });

  const fetchRestaurant = useCallback(async () => {
    try {
      const res = await getMyRestaurant();
      const r   = res.data.data;
      setRestaurant(r);
      setProfile({
        name:    r.name    || '',
        cuisine: r.cuisine || '',
        phone:   r.phone   || '',
        email:   r.email   || '',
        address: r.address || '',
        gst:     r.gst     || '',
        upi:     r.upi     || '',
      });
      if (r.openingHours) setHours(r.openingHours);
    } catch (err) {
      setError('Failed to load restaurant settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRestaurant(); }, [fetchRestaurant]);

  const handleSave = async (section) => {
    if (!restaurant?._id) return;
    setSaving(section);
    setError('');
    try {
      let updateData = {};
      if (section === 'profile') updateData = { ...profile };
      if (section === 'hours')   updateData = { openingHours: hours };

      await updateRestaurant(restaurant._id, updateData);
      setSaved(section);
      setTimeout(() => setSaved(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving('');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 max-w-3xl">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(j => <div key={j} className="h-10 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your restaurant profile and preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Restaurant Profile ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Restaurant Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:'Restaurant name', key:'name'    },
            { label:'Cuisine type',    key:'cuisine'  },
            { label:'Phone number',    key:'phone'    },
            { label:'Email address',   key:'email'    },
            { label:'GST number',      key:'gst'      },
            { label:'UPI ID',          key:'upi'      },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{f.label}</label>
              <input
                value={profile[f.key]}
                onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Address</label>
            <textarea
              value={profile.address}
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          {saved === 'profile' && (
            <p className="text-sm text-green-600 font-medium">✅ Saved successfully</p>
          )}
          <button
            onClick={() => handleSave('profile')}
            disabled={saving === 'profile'}
            className="ml-auto bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {saving === 'profile' ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* ── Opening Hours ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Opening Hours</h3>
        <div className="flex flex-col gap-3">
          {Object.entries(hours).map(([day, val]) => (
            <div key={day} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 w-24">{DAY_LABELS[day]}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!val.closed}
                  onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], closed: !e.target.checked } }))}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-xs text-gray-500">Open</span>
              </label>
              {!val.closed ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time" value={val.open}
                    onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time" value={val.close}
                    onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-red-500 font-medium">Closed</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          {saved === 'hours' && (
            <p className="text-sm text-green-600 font-medium">✅ Saved successfully</p>
          )}
          <button
            onClick={() => handleSave('hours')}
            disabled={saving === 'hours'}
            className="ml-auto bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {saving === 'hours' ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="flex flex-col gap-4">
          {[
            { key:'newOrder',    label:'New order received',  desc:'Alert when a customer places an order'       },
            { key:'orderReady',  label:'Order marked ready',  desc:'Alert when kitchen marks an order ready'     },
            { key:'lowStock',    label:'Low stock alert',     desc:'Alert when menu items are marked unavailable'},
            { key:'dailyReport', label:'Daily report email',  desc:'Receive a summary at end of day'             },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${notifs[n.key] ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${notifs[n.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          {saved === 'notifs' && (
            <p className="text-sm text-green-600 font-medium">✅ Saved successfully</p>
          )}
          <button
            onClick={() => { setSaved('notifs'); setTimeout(() => setSaved(''), 2500); }}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white border border-red-200 rounded-2xl p-6">
        <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">These actions are irreversible. Please be careful.</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if(window.confirm('Close restaurant? Customers will not be able to order.')) {
                updateRestaurant(restaurant._id, { isOpen: false });
              }
            }}
            className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors"
          >
            🔒 Close Restaurant
          </button>
          <button
            onClick={() => {
              if(window.confirm('Mark restaurant as busy? Orders will show busy badge.')) {
                updateRestaurant(restaurant._id, { isBusy: true });
              }
            }}
            className="px-4 py-2 border border-amber-300 text-amber-600 hover:bg-amber-50 text-sm font-medium rounded-xl transition-colors"
          >
            ⚠️ Mark as Busy
          </button>
        </div>
      </div>
    </div>
  );
}