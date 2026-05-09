import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../api/orders';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500'  },
  preparing: { label: 'Preparing', bg: 'bg-amber-50',  text: 'text-amber-700', dot: 'bg-amber-500' },
  ready:     { label: 'Ready!',    bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-500' },
  served:    { label: 'Served',    bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-400'  },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500'   },
};

function timeAgo(isoString) {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const navigate              = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o =>
    filter === 'all'      ? true :
    filter === 'active'   ? ['confirmed','preparing','ready'].includes(o.status) :
    o.status === 'served'
  );

  const viewToken = (order) => {
    const tokenData = {
      items:       order.items.reduce((acc, item) => { acc[item._id] = item; return acc; }, {}),
      subtotal:    order.subtotal,
      tax:         order.tax,
      platformFee: order.platformFee,
      grandTotal:  order.grandTotal,
      orderMode:   order.orderMode,
      tableNo:     order.tableNo,
      restaurant:  order.restaurant,
      token:       order.token,
      orderId:     order._id,
      placedAt:    order.createdAt,
      status:      order.status,
    };
    sessionStorage.setItem('tt_last_order', JSON.stringify(tokenData));
    navigate(`/token/${order._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage all your orders</p>
          </div>
          <Link to="/restaurants"
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            + New order
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ key:'all', label:'All orders' },{ key:'active', label:'Active' },{ key:'served', label:'Completed' }].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                filter === tab.key ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-16 bg-gray-100" />
                <div className="p-4"><div className="h-3 bg-gray-100 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm mt-1 mb-6">Your order history will appear here</p>
            <Link to="/restaurants" className="bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
              Browse restaurants
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(order => {
              const cfg      = STATUS_CONFIG[order.status] || STATUS_CONFIG.served;
              const isActive = ['confirmed','preparing','ready'].includes(order.status);
              return (
                <div key={order._id}
                  className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${isActive ? 'border-red-200' : 'border-gray-200'}`}>
                  <div className={`px-5 py-4 flex items-center justify-between ${isActive ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {order.restaurant?.name}
                        <span className="text-gray-400 font-normal ml-2 text-xs">{order.restaurant?.cuisine}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Token #{order.token} · {order.tableNo} · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isActive ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-500 mb-4">
                      {order.items.map(i => `${i.name} × ${i.qty}`).join(' · ')}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">₹{order.grandTotal}</span>
                      <div className="flex gap-2">
                        {isActive && (
                          <button onClick={() => viewToken(order)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-xl transition-colors">
                            View token
                          </button>
                        )}
                        {order.status === 'served' && (
                          <Link to="/restaurants"
                            className="text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition-colors">
                            Reorder
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}