import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getOrder } from '../api/orders';
import PushNotificationButton from '../components/PushNotificationButton';

const STATUS_STEPS = [
  { key:'confirmed', label:'Order Confirmed',    sub:'Payment received',         },
  { key:'preparing', label:'Being Prepared',     sub:'Chef is working on it...', },
  { key:'ready',     label:'Ready for Pickup',   sub:"We'll call your token",    },
  { key:'served',    label:'Served / Collected', sub:'Enjoy your meal!',         },
];
const STATUS_INDEX = { confirmed:0, preparing:1, ready:2, served:3 };

const ITEM_STATUS_CFG = {
  pending:   { label:'Waiting',   bg:'bg-gray-100',   text:'text-gray-500',  icon:'⏳' },
  preparing: { label:'Cooking',   bg:'bg-amber-100',  text:'text-amber-700', icon:'🔥' },
  ready:     { label:'Ready',     bg:'bg-green-100',  text:'text-green-700', icon:'✅' },
  called:    { label:'Collect!',  bg:'bg-blue-100',   text:'text-blue-700',  icon:'📢' },
};

export default function Token() {
  const { orderId }             = useParams();
  const { socket }              = useSocket();
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [itemCalls, setItemCalls] = useState([]); // partial call notifications
  const navigate                = useNavigate();

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrder(orderId);
        setOrder(res.data.data);
      } catch (err) {
        const raw = sessionStorage.getItem('tt_last_order');
        if (raw) setOrder(JSON.parse(raw));
        else navigate('/restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  // Socket real-time
  useEffect(() => {
    if (!socket || !orderId) return;
    socket.emit('join_order', orderId);

    // Full order status update
    socket.on('order_status_update', ({ orderId: id, status, items }) => {
      const idStr = id?.toString();
      if (idStr === orderId || idStr === order?._id?.toString()) {
        setOrder(prev => {
          if (!prev) return prev;
          return { ...prev, status, ...(items ? { items } : {}) };
        });
      }
    });

    // Individual item called
    socket.on('item_called', ({ orderId: id, itemName, itemEmoji, itemQty, tableNo, items }) => {
      const idStr = id?.toString();
      if (idStr === orderId || idStr === order?._id?.toString()) {
        // Update items
        if (items) setOrder(prev => prev ? { ...prev, items } : prev);

        // Add to call notifications
        const call = {
          id:       Date.now(),
          itemName,
          itemEmoji,
          itemQty,
          tableNo,
        };
        setItemCalls(prev => [call, ...prev]);

        // Auto-remove after 8 seconds
        setTimeout(() => {
          setItemCalls(prev => prev.filter(c => c.id !== call.id));
        }, 8000);
      }
    });

    return () => {
      socket.off('order_status_update');
      socket.off('item_called');
    };
  }, [socket, orderId, order?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading your order...</div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const items = Array.isArray(order.items)
    ? order.items
    : Object.values(order.items || {});

  const placedTime = new Date(order.createdAt || order.placedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const calledCount  = items.filter(i => i.itemStatus === 'called').length;
  const readyCount   = items.filter(i => i.itemStatus === 'ready').length;
  const cookingCount = items.filter(i => i.itemStatus === 'preparing').length;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ── Item called banners ── */}
        {itemCalls.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {itemCalls.map(call => (
              <div key={call.id}
                className="bg-blue-600 text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-lg animate-pulse">
                <span className="text-3xl">📢</span>
                <div>
                  <p className="font-bold text-lg">
                    {call.itemEmoji} {call.itemName} ×{call.itemQty} IS READY — TOKEN #{order.token}
                  </p>
                  <p className="text-blue-100 text-sm">
                    {call.tableNo === 'Takeaway'
                      ? 'Please collect this item from the counter now!'
                      : `Please collect ${call.itemName} from ${call.tableNo}!`}
                  </p>
                </div>
                <button onClick={() => setItemCalls(prev => prev.filter(c => c.id !== call.id))}
                  className="ml-auto text-blue-200 hover:text-white text-xl flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Push notification banner */}
        <PushNotificationButton variant="banner" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Order placed successfully!</h1>
          <p className="text-gray-500 text-sm mt-1">
            Payment confirmed · {order.restaurant?.name} · {placedTime}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Token card ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Token number */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Your token number</p>
              <div className="w-40 h-40 rounded-full border-4 border-red-500 bg-red-50 flex flex-col items-center justify-center mx-auto mb-5 shadow-inner">
                <span className="text-6xl font-extrabold text-red-600 leading-none">{order.token}</span>
                <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">token</span>
              </div>
              <p className="text-gray-600 text-sm max-w-sm mx-auto leading-relaxed">
                Items may be served one by one as they get ready.
                <strong className="text-gray-800"> Watch for item-level notifications above.</strong>
              </p>

              {/* Info strip */}
              <div className="grid grid-cols-3 gap-0 mt-6 border border-gray-100 rounded-xl overflow-hidden">
                <div className="py-3 px-4 text-center border-r border-gray-100">
                  <div className="text-base font-bold text-gray-900">{order.tableNo}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Table / Mode</div>
                </div>
                <div className="py-3 px-4 text-center border-r border-gray-100">
                  <div className="text-base font-bold text-gray-900">#{String(order.token).padStart(4,'0')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Order ID</div>
                </div>
                <div className="py-3 px-4 text-center">
                  <div className="text-base font-bold text-gray-900">~25 min</div>
                  <div className="text-xs text-gray-400 mt-0.5">Est. time</div>
                </div>
              </div>

              {/* Item progress summary */}
              {items.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl py-2 text-center">
                    <div className="text-lg font-bold text-amber-700">{cookingCount}</div>
                    <div className="text-xs text-amber-600">Cooking</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl py-2 text-center">
                    <div className="text-lg font-bold text-green-700">{readyCount}</div>
                    <div className="text-xs text-green-600">Ready</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl py-2 text-center">
                    <div className="text-lg font-bold text-blue-700">{calledCount}</div>
                    <div className="text-xs text-blue-600">Called</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Link to="/restaurants"
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors text-center">
                  Back to home
                </Link>
                <Link to="/orders"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors text-center">
                  View all orders
                </Link>
              </div>
            </div>

            {/* ── Item by item status ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Your Items</h3>
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live updates
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item, idx) => {
                  const status = item.itemStatus || 'pending';
                  const iCfg   = ITEM_STATUS_CFG[status];
                  return (
                    <div key={idx}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${iCfg.bg} ${status === 'called' ? 'border-blue-300' : 'border-transparent'}`}>
                      <span className="text-2xl flex-shrink-0">{item.emoji || '🍽️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                          <span className="text-gray-400 font-normal ml-1">×{item.qty}</span>
                        </p>
                        <p className={`text-xs font-medium ${iCfg.text}`}>
                          {iCfg.icon} {iCfg.label}
                        </p>
                      </div>
                      {status === 'called' && (
                        <span className="flex-shrink-0 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg animate-pulse">
                          📢 Collect Now!
                        </span>
                      )}
                      {status === 'ready' && (
                        <span className="flex-shrink-0 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg">
                          ✅ Ready
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-5">

            {/* Order status tracker */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Order Status</h3>
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone    = idx < currentStep;
                  const isActive  = idx === currentStep;
                  const isPending = idx > currentStep;
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                          isDone   ? 'bg-emerald-500 text-white' :
                          isActive ? 'bg-red-600 text-white pulse-anim' :
                                     'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-6 mt-1 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-medium ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="flex flex-col gap-2 mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.emoji} {item.name} × {item.qty}</span>
                    <span className="font-medium text-gray-800">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                <div className="flex justify-between text-gray-500"><span>GST (5%)</span><span>₹{order.tax}</span></div>
                <div className="flex justify-between text-gray-500"><span>Platform fee</span><span>₹{order.platformFee}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100 mt-1">
                  <span>Total paid</span>
                  <span className="text-red-600">₹{order.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}