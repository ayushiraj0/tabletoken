import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getRestaurantOrders, updateOrderStatus, updateItemStatus } from '../../api/orders';

const ORDER_STATUS_CFG = {
  confirmed: { label:'Confirmed', bg:'bg-blue-100',  text:'text-blue-700',  border:'border-blue-200',  dot:'bg-blue-500'  },
  preparing: { label:'Preparing', bg:'bg-amber-100', text:'text-amber-700', border:'border-amber-300', dot:'bg-amber-500' },
  ready:     { label:'Ready!',    bg:'bg-green-100', text:'text-green-700', border:'border-green-300', dot:'bg-green-500' },
  served:    { label:'Served',    bg:'bg-gray-100',  text:'text-gray-500',  border:'border-gray-200',  dot:'bg-gray-400'  },
};

const ITEM_STATUS_CFG = {
  pending:   { label:'Pending',   bg:'bg-gray-50',    border:'border-gray-200',  text:'text-gray-400',   icon:'⏳' },
  preparing: { label:'Preparing', bg:'bg-amber-50',   border:'border-amber-200', text:'text-amber-700',  icon:'🔥' },
  ready:     { label:'Ready',     bg:'bg-green-50',   border:'border-green-200', text:'text-green-700',  icon:'✅' },
  called:    { label:'Called',    bg:'bg-blue-50',    border:'border-blue-200',  text:'text-blue-700',   icon:'📢' },
};

const NEXT_ITEM_STATUS = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     null,
  called:    null,
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  return `${diff} min ago`;
}

export default function LiveOrders() {
  const { user }                        = useAuth();
  const { socket }                      = useSocket();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilter]       = useState('all');
  const [expandedId, setExpandedId]     = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [callBanner, setCallBanner]     = useState(null);

  const restaurantId = user?.restaurantId;

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await getRestaurantOrders(restaurantId, { status: filterStatus });
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Socket
  useEffect(() => {
    if (!socket || !restaurantId) return;
    socket.emit('join_restaurant', restaurantId);

    socket.on('new_order', ({ order }) => {
      setOrders(prev => [order, ...prev]);
    });
    socket.on('order_updated', ({ orderId, status, items }) => {
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, status, ...(items && { items }) } : o
      ));
    });
    return () => {
      socket.off('new_order');
      socket.off('order_updated');
    };
  }, [socket, restaurantId]);

  // Move item through status
  const handleItemStatus = async (orderId, itemIndex, currentStatus) => {
    const nextStatus = NEXT_ITEM_STATUS[currentStatus || 'pending'];
    if (!nextStatus) return;
    const key = `${orderId}-${itemIndex}`;
    setUpdatingItem(key);
    try {
      const res = await updateItemStatus(orderId, itemIndex, nextStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? res.data.data : o));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Call customer for a specific item
  const callForItem = async (order, itemIndex) => {
    const item = order.items[itemIndex];

    // Mark item as 'called'
    const key = `${order._id}-${itemIndex}`;
    setUpdatingItem(key);
    try {
      const res = await updateItemStatus(order._id, itemIndex, 'called');
      setOrders(prev => prev.map(o => o._id === order._id ? res.data.data : o));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingItem(null);
    }

    // Show banner
    setCallBanner({
      token:   order.token,
      table:   order.tableNo,
      item:    item.name,
      emoji:   item.emoji,
      qty:     item.qty,
    });
    setTimeout(() => setCallBanner(null), 5000);

    // Emit socket to customer
    if (socket) {
      socket.emit('call_item', {
        orderId:   order._id,
        token:     order.token,
        tableNo:   order.tableNo,
        itemName:  item.name,
        itemEmoji: item.emoji,
        itemQty:   item.qty,
      });
    }
  };

  // Call all ready items at once
  const callAllReady = (order) => {
    const readyItems = order.items
      .map((item, idx) => ({ ...item, idx }))
      .filter(item => item.itemStatus === 'ready');

    readyItems.forEach(item => callForItem(order, item.idx));
  };

  // Mark whole order served
  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const counts = {
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    served:    orders.filter(o => o.status === 'served').length,
  };

  const filtered = filterStatus === 'all'
    ? orders.filter(o => o.status !== 'served')
    : orders.filter(o => o.status === filterStatus);

  if (!restaurantId) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-4">🏪</div>
        <p className="font-medium">No restaurant linked to your account</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Order Queue</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.filter(o => o.status !== 'served').length} active orders
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-full font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Call banner */}
      {callBanner && (
        <div className="bg-green-600 text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-lg">
          <span className="text-3xl">📢</span>
          <div>
            <p className="font-bold text-lg">
              TOKEN #{callBanner.token} — {callBanner.emoji} {callBanner.item} ×{callBanner.qty} IS READY!
            </p>
            <p className="text-green-100 text-sm">
              {callBanner.table === 'Takeaway'
                ? 'Please collect this item from the counter.'
                : `Please collect ${callBanner.item} from ${callBanner.table}.`}
            </p>
          </div>
          <button onClick={() => setCallBanner(null)} className="ml-auto text-green-200 hover:text-white text-xl">×</button>
        </div>
      )}

      {/* Status filter */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key:'confirmed', label:'Confirmed', icon:'📋' },
          { key:'preparing', label:'Preparing', icon:'👨‍🍳' },
          { key:'ready',     label:'Ready',     icon:'✅' },
          { key:'served',    label:'Served',    icon:'🍽️' },
        ].map(s => {
          const cfg = ORDER_STATUS_CFG[s.key];
          return (
            <button key={s.key} onClick={() => setFilter(filterStatus === s.key ? 'all' : s.key)}
              className={`rounded-xl p-4 border text-left transition-all ${
                filterStatus === s.key ? `${cfg.bg} ${cfg.border} shadow-sm` : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-extrabold ${cfg.text}`}>{counts[s.key]}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-16 bg-gray-100" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-medium">No orders here — all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(order => {
            const cfg        = ORDER_STATUS_CFG[order.status];
            const isExpanded = expandedId === order._id;

            const totalItems  = order.items.length;
            const readyItems  = order.items.filter(i => i.itemStatus === 'ready').length;
            const calledItems = order.items.filter(i => i.itemStatus === 'called').length;
            const prepItems   = order.items.filter(i => i.itemStatus === 'preparing').length;
            const doneItems   = readyItems + calledItems;
            const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
            const hasReadyUncalled = readyItems > 0;

            return (
              <div key={order._id}
                className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                  hasReadyUncalled    ? 'border-green-400 shadow-green-100 shadow-md' :
                  order.status === 'preparing' ? 'border-amber-300' :
                  order.status === 'served'    ? 'border-gray-200 opacity-75' :
                                                  'border-gray-200'
                }`}>

                {/* Card header */}
                <div className={`px-5 py-3 flex items-center justify-between ${cfg.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-white rounded-xl px-3 py-1.5 shadow-sm">
                      <div className={`text-2xl font-extrabold ${cfg.text}`}>#{order.token}</div>
                      <div className="text-xs text-gray-400">token</div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.customer?.name}</p>
                      <p className="text-xs text-gray-500">
                        {order.tableNo} · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5 ${order.status !== 'served' ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </span>
                    <button onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center">
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {order.status !== 'confirmed' && order.status !== 'served' && (
                  <div className="px-5 py-2 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {calledItems > 0 && <span className="text-blue-600 font-medium">📢 {calledItems} called · </span>}
                          {readyItems > 0  && <span className="text-green-600 font-medium">✅ {readyItems} ready · </span>}
                          {prepItems > 0   && <span className="text-amber-600 font-medium">🔥 {prepItems} cooking · </span>}
                          <span>{order.items.filter(i => !i.itemStatus || i.itemStatus === 'pending').length} pending</span>
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* ── ITEM LIST ── */}
                <div className="px-5 py-3 border-b border-gray-100 flex flex-col gap-2">
                  {order.items.map((item, idx) => {
                    const status  = item.itemStatus || 'pending';
                    const iCfg    = ITEM_STATUS_CFG[status];
                    const isUpd   = updatingItem === `${order._id}-${idx}`;

                    return (
                      <div key={idx}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${iCfg.bg} ${iCfg.border}`}>

                        {/* Item info */}
                        <span className="text-xl flex-shrink-0">{item.emoji || '🍽️'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.name}
                            <span className="text-gray-400 font-normal ml-1">×{item.qty}</span>
                          </p>
                          <span className={`text-xs font-semibold ${iCfg.text}`}>
                            {iCfg.icon} {iCfg.label}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">

                          {/* Start / Done cooking button */}
                          {status === 'pending' && order.status !== 'served' && (
                            <button
                              onClick={() => handleItemStatus(order._id, idx, status)}
                              disabled={isUpd}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50">
                              {isUpd ? '...' : '🔥 Start'}
                            </button>
                          )}

                          {status === 'preparing' && order.status !== 'served' && (
                            <button
                              onClick={() => handleItemStatus(order._id, idx, status)}
                              disabled={isUpd}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50">
                              {isUpd ? '...' : '✅ Done'}
                            </button>
                          )}

                          {/* Call button — only when item is ready and not yet called */}
                          {status === 'ready' && order.status !== 'served' && (
                            <button
                              onClick={() => callForItem(order, idx)}
                              disabled={isUpd}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 animate-pulse">
                              {isUpd ? '...' : '📢 Call'}
                            </button>
                          )}

                          {/* Called badge */}
                          {status === 'called' && (
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700">
                              📢 Called
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Call all ready button */}
                  {hasReadyUncalled && order.status !== 'served' && (
                    <button
                      onClick={() => callAllReady(order)}
                      className="w-full mt-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      📢 Call All Ready Items ({readyItems})
                    </button>
                  )}

                  {/* Note */}
                  {order.note && (
                    <div className="mt-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 text-xs text-yellow-800">
                      📝 {order.note}
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm flex flex-col gap-1.5">
                    <div className="flex justify-between text-gray-500">
                      <span>Phone</span>
                      <span className="font-medium text-gray-700">{order.customer?.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Mode</span>
                      <span className="font-medium text-gray-700 capitalize">{order.orderMode}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200 mt-1">
                      <span>Total</span>
                      <span className="text-red-600">₹{order.grandTotal}</span>
                    </div>
                  </div>
                )}

                {/* Bottom actions */}
                <div className="px-5 py-3 flex gap-2">
                  {order.status !== 'served' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'served')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold transition-colors">
                      🍽️ Mark All Served
                    </button>
                  )}
                  {order.status === 'served' && (
                    <div className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium">
                      🎉 Order Complete
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}