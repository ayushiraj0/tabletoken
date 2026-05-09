import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRestaurantOrders, getRestaurantStats } from '../../api/orders';

export default function Reports() {
  const { user }                  = useAuth();
  const [stats, setStats]         = useState({ totalOrders:0, totalRevenue:0, activeTokens:0, avgPrepTime:0 });
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState('today');
  const restaurantId              = user?.restaurantId;

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getRestaurantStats(restaurantId),
        getRestaurantOrders(restaurantId, { status: 'all' }),
      ]);
      setStats(statsRes.data.data);
      setOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Compute top items from real orders ──
  const itemMap = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = { name: item.name, emoji: item.emoji || '🍽️', orders: 0, revenue: 0 };
      }
      itemMap[item.name].orders  += item.qty;
      itemMap[item.name].revenue += item.price * item.qty;
    });
  });
  const topItems      = Object.values(itemMap).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
  const maxItemRev    = topItems.length > 0 ? Math.max(...topItems.map(i => i.revenue)) : 1;

  // ── Hourly breakdown from real orders ──
  const hourlyMap = {};
  for (let h = 9; h <= 21; h++) hourlyMap[h] = 0;
  orders.forEach(o => {
    const hr = new Date(o.createdAt).getHours();
    if (hourlyMap[hr] !== undefined) hourlyMap[hr]++;
  });
  const hourlyData = Object.entries(hourlyMap).map(([h, count]) => ({
    hour:   `${h > 12 ? h-12 : h}${h >= 12 ? 'pm' : 'am'}`,
    orders: count,
  }));
  const maxHourly = Math.max(...hourlyData.map(h => h.orders), 1);

  // ── Payment breakdown ──
  const onlineOrders = orders.filter(o => o.paymentMethod === 'online' || !o.paymentMethod).length;
  const cashOrders   = orders.filter(o => o.paymentMethod === 'cash').length;
  const walletOrders = orders.filter(o => o.paymentMethod === 'wallet').length;
  const total        = orders.length || 1;

  const SUMMARY = [
    { label:"Total orders",     value: stats.totalOrders,              change: '', up: true  },
    { label:"Total revenue",    value: `₹${stats.totalRevenue}`,       change: '', up: true  },
    { label:"Avg order value",  value: stats.totalOrders > 0 ? `₹${Math.round(stats.totalRevenue / stats.totalOrders)}` : '₹0', change:'', up:true },
    { label:"Active tokens",    value: stats.activeTokens,             change: '', up: true  },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Today's performance overview</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {['today'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {p === 'today' ? 'Today' : 'This week'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {SUMMARY.map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className="text-2xl font-extrabold text-gray-900">
              {loading ? '...' : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Hourly orders bar chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-5">Orders per hour (today)</h3>
          {loading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {hourlyData.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  {h.orders > 0 && (
                    <span className="text-xs text-gray-500 font-medium">{h.orders}</span>
                  )}
                  <div
                    className="w-full bg-red-500 hover:bg-red-600 rounded-t-lg transition-colors cursor-default"
                    style={{ height:`${(h.orders/maxHourly)*100}%`, minHeight: h.orders > 0 ? '4px' : '2px', opacity: h.orders > 0 ? 1 : 0.2 }}
                    title={`${h.orders} orders`}
                  />
                  <span className="text-xs text-gray-400 font-medium">{h.hour}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top items */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-5">Top selling items today</h3>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : topItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm">No orders yet today</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                        <span className="text-xs text-gray-400">{item.orders} orders</span>
                        <span className="text-sm font-bold text-red-600">₹{item.revenue}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width:`${(item.revenue/maxItemRev)*100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Today's Orders</h3>
          <span className="text-xs text-gray-400">{orders.length} total</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
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
                {orders.map((o, i) => {
                  const STATUS_COLORS = {
                    confirmed: 'bg-blue-100 text-blue-700',
                    preparing: 'bg-amber-100 text-amber-700',
                    ready:     'bg-green-100 text-green-700',
                    served:    'bg-gray-100 text-gray-500',
                    cancelled: 'bg-red-100 text-red-700',
                  };
                  const mins = Math.floor((Date.now() - new Date(o.createdAt)) / 60000);
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-red-600 text-base">#{o.token}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{o.customer?.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{o.tableNo}</td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-[180px] truncate">
                        {o.items.map(i => i.name).join(', ')}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">₹{o.grandTotal}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status] || STATUS_COLORS.served}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {mins < 1 ? 'just now' : `${mins}m ago`}
                      </td>
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