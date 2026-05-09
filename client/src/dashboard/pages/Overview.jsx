import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRestaurantStats, getRestaurantOrders } from '../../api/orders';

const HOURLY = [
  { hour:'9am',orders:3},{ hour:'10am',orders:5},{ hour:'11am',orders:8},
  { hour:'12pm',orders:14},{ hour:'1pm',orders:12},{ hour:'2pm',orders:9},
  { hour:'3pm',orders:6},{ hour:'4pm',orders:4},{ hour:'5pm',orders:7},
  { hour:'6pm',orders:11},{ hour:'7pm',orders:14},{ hour:'8pm',orders:10},
];

const STATUS_CFG = {
  confirmed: { label:'Confirmed', bg:'bg-blue-100',  text:'text-blue-700'  },
  preparing: { label:'Preparing', bg:'bg-amber-100', text:'text-amber-700' },
  ready:     { label:'Ready!',    bg:'bg-green-100', text:'text-green-700' },
  served:    { label:'Served',    bg:'bg-gray-100',  text:'text-gray-500'  },
};

export default function Overview() {
  const { user }                  = useAuth();
  const [stats, setStats]         = useState({ totalOrders:0, totalRevenue:0, activeTokens:0, avgPrepTime:0 });
  const [recentOrders, setRecent] = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate                  = useNavigate();
  const restaurantId              = user?.restaurantId;
  const maxOrders                 = Math.max(...HOURLY.map(h => h.orders));

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getRestaurantStats(restaurantId),
        getRestaurantOrders(restaurantId, { status: 'all' }),
      ]);
      setStats(statsRes.data.data);
      setRecent(ordersRes.data.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const STATS_CARDS = [
    { label:"Today's Orders",  value: stats.totalOrders,              icon:'🎫', color:'bg-blue-50 border-blue-200',    text:'text-blue-700'   },
    { label:"Today's Revenue", value:`₹${stats.totalRevenue}`,        icon:'💰', color:'bg-green-50 border-green-200',  text:'text-green-700'  },
    { label:'Active Tokens',   value: stats.activeTokens,             icon:'⏳', color:'bg-amber-50 border-amber-200',  text:'text-amber-700'  },
    { label:'Avg Prep Time',   value:`${stats.avgPrepTime || 0} min`, icon:'⏱️', color:'bg-purple-50 border-purple-200',text:'text-purple-700' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Good afternoon 👋</h2>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening at your restaurant today.</p>
        </div>
        <button onClick={() => navigate('/dashboard/orders')}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          <span className="animate-pulse">🔴</span> View Live Orders
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS_CARDS.map((s, i) => (
          <div key={i} className={`bg-white border rounded-2xl p-5 ${s.color}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.color} ${s.text}`}>Today</span>
            </div>
            <div className={`text-2xl font-extrabold ${s.text}`}>{loading ? '...' : s.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Orders per hour (today)</h3>
            <span className="text-xs text-gray-400">Total: {stats.totalOrders} orders</span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {HOURLY.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-red-500 rounded-t-md hover:bg-red-600 transition-colors"
                  style={{ height:`${(h.orders/maxOrders)*100}%`, minHeight:'4px' }} title={`${h.orders} orders`} />
                <span className="text-xs text-gray-400 whitespace-nowrap">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick actions</h3>
          <div className="flex flex-col gap-2">
            {[
              { icon:'🎫', label:'Live order queue',  desc:`${stats.activeTokens} active tokens`, to:'/dashboard/orders',  red:true  },
              { icon:'🍽️', label:'Add menu item',      desc:'Update your menu',                    to:'/dashboard/menu',    red:false },
              { icon:'🪑', label:'Manage tables',       desc:'View table status',                   to:'/dashboard/tables',  red:false },
              { icon:'📈', label:'View reports',        desc:'Sales & analytics',                   to:'/dashboard/reports', red:false },
            ].map((a, i) => (
              <button key={i} onClick={() => navigate(a.to)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${a.red ? 'bg-red-50 hover:bg-red-100 border border-red-200' : 'hover:bg-gray-50 border border-gray-100'}`}>
                <span className="text-xl">{a.icon}</span>
                <div>
                  <div className={`text-sm font-medium ${a.red ? 'text-red-700' : 'text-gray-800'}`}>{a.label}</div>
                  <div className="text-xs text-gray-400">{a.desc}</div>
                </div>
                <span className="ml-auto text-gray-300 text-sm">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent orders</h3>
          <button onClick={() => navigate('/dashboard/orders')} className="text-sm text-red-600 hover:underline font-medium">View all →</button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No orders today yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Token','Customer','Table','Items','Total','Status','Time'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o, i) => {
                  const cfg = STATUS_CFG[o.status] || STATUS_CFG.served;
                  const mins = Math.floor((Date.now() - new Date(o.createdAt)) / 60000);
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5"><span className="font-bold text-red-600 text-base">#{o.token}</span></td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{o.customer?.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{o.tableNo}</td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-[180px] truncate">{o.items.map(i => i.name).join(', ')}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">₹{o.grandTotal}</td>
                      <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{mins < 1 ? 'just now' : `${mins}m ago`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}