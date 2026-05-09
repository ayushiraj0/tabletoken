import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getGroupOrder, joinGroupOrder, updateMyItems, placeGroupOrder } from '../api/groupOrders';
import { getMenuItems } from '../api/restaurants';

export default function GroupOrder() {
  const { code }                    = useParams();
  const { user }                    = useAuth();
  const { socket }                  = useSocket();
  const navigate                    = useNavigate();
  const location                    = useLocation();

  const [group, setGroup]           = useState(null);
  const [menuItems, setMenuItems]   = useState([]);
  const [myCart, setMyCart]         = useState({});
  const [loading, setLoading]       = useState(true);
  const [placing, setPlacing]       = useState(false);
  const [copied, setCopied]         = useState(false);
  const [activeTab, setActiveTab]   = useState('menu'); // 'menu' | 'summary'
  const [tableNo, setTableNo]       = useState('');
  const [orderMode, setOrderMode]   = useState('dine');
  const [error, setError]           = useState('');
  const [notification, setNotif]    = useState('');

  const isHost = group?.host?._id === user?._id ||
                 group?.host === user?._id ||
                 location.state?.isHost;

  // Fetch group + menu
  const fetchGroup = useCallback(async () => {
    try {
      const res = await getGroupOrder(code);
      const g   = res.data.data;
      setGroup(g);

      // If order already placed redirect to token
      if (g.status === 'placed' && g.orderId) {
        navigate(`/token/${g.orderId}`);
        return;
      }

      // Fetch menu
      const menuRes = await getMenuItems(g.restaurant._id);
      setMenuItems(menuRes.data.data);

      // Restore my cart from group data
      const me = g.members.find(m =>
        (m.user?._id || m.user) === user?._id
      );
      if (me) {
        const cartObj = {};
        me.items.forEach(item => {
          cartObj[item.menuItem || item.name] = item;
        });
        setMyCart(cartObj);
      }
    } catch (err) {
      setError('Group not found or expired.');
    } finally {
      setLoading(false);
    }
  }, [code, user?._id, navigate]);

  // Join group on mount
  useEffect(() => {
    const init = async () => {
      try {
        await joinGroupOrder(code);
      } catch (err) {
        // Already member — ignore
      }
      fetchGroup();
    };
    init();
  }, [code, fetchGroup]);

  // Socket.io real-time
  useEffect(() => {
    if (!socket || !code) return;
    socket.emit('join_group', code);

    socket.on('member_joined', ({ name }) => {
      showNotif(`👋 ${name} joined the group!`);
      fetchGroup();
    });

    socket.on('items_updated', ({ name, items }) => {
      if (name !== user?.name) {
        const total = items.reduce((s, i) => s + i.qty, 0);
        showNotif(`🛒 ${name} updated their items (${total} items)`);
      }
      fetchGroup();
    });

    socket.on('order_placed', ({ orderId }) => {
      navigate(`/token/${orderId}`);
    });

    return () => {
      socket.off('member_joined');
      socket.off('items_updated');
      socket.off('order_placed');
    };
  }, [socket, code, user?.name, fetchGroup, navigate]);

  const showNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 3000);
  };

  // Add item to my cart
  const addItem = (item) => {
    const id = item._id;
    setMyCart(prev => ({
      ...prev,
      [id]: {
        menuItem: id,
        name:     item.name,
        price:    item.price,
        emoji:    item.emoji,
        isVeg:    item.isVeg,
        image:    item.image || '',
        qty:      (prev[id]?.qty || 0) + 1,
      },
    }));
  };

  // Remove item from my cart
  const removeItem = (itemId) => {
    setMyCart(prev => {
      const updated = { ...prev };
      if (updated[itemId]) {
        updated[itemId] = { ...updated[itemId], qty: updated[itemId].qty - 1 };
        if (updated[itemId].qty <= 0) delete updated[itemId];
      }
      return updated;
    });
  };

  // Save my items to server
  const saveMyItems = async () => {
    const items = Object.values(myCart).filter(i => i.qty > 0);
    try {
      await updateMyItems(code, items);
      showNotif('✅ Your items saved!');
    } catch (err) {
      setError('Failed to save items. Try again.');
    }
  };

  // Host places final order
  const handlePlaceOrder = async () => {
    if (!isHost) return;

    // Save my items first
    await saveMyItems();

    const allItems = getAllItems();
    if (allItems.length === 0) {
      setError('No items added yet. Ask your friends to add items first.');
      return;
    }

    setPlacing(true);
    try {
      const res = await placeGroupOrder(code, { tableNo, orderMode });
      navigate(`/token/${res.data.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  // Get all items combined from all members
  const getAllItems = () => {
    if (!group) return [];
    const combined = {};
    group.members.forEach(member => {
      member.items.forEach(item => {
        const key = item.name;
        if (combined[key]) {
          combined[key].qty += item.qty;
        } else {
          combined[key] = { ...item };
        }
      });
    });
    return Object.values(combined);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/group/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const link = `${window.location.origin}/group/${code}`;
    const text = encodeURIComponent(
      `Join my group order at ${group?.restaurant?.name}! 🍽️\nClick here to add your items: ${link}\nGroup code: ${code}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const myTotal       = Object.values(myCart).reduce((s, i) => s + i.price * i.qty, 0);
  const allItems      = getAllItems();
  const groupSubtotal = allItems.reduce((s, i) => s + i.price * i.qty, 0);
  const groupTax      = Math.round(groupSubtotal * 0.05);
  const groupTotal    = groupSubtotal + groupTax + 5;
  const myItemCount   = Object.values(myCart).reduce((s, i) => s + i.qty, 0);

  // Group menu by category
  const categories = [...new Set(menuItems.map(i => i.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">👥</div>
          <p className="text-gray-500 text-sm">Loading group order...</p>
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <button onClick={() => navigate('/restaurants')}
            className="bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-semibold mt-4">
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Notification toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg animate-bounce">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{group?.restaurant?.emoji || '🍽️'}</span>
            <div>
              <h1 className="font-bold text-gray-900 text-base">{group?.restaurant?.name}</h1>
              <p className="text-xs text-gray-500">
                Group Order · {group?.members?.length || 0} members · Code: <strong>{code}</strong>
              </p>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <button onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                copied ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {copied ? '✅ Copied!' : '🔗 Copy Link'}
            </button>
            <button onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-0 border-t border-gray-100">
          <button onClick={() => setActiveTab('menu')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'menu' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            🍽️ Menu {myItemCount > 0 && <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{myItemCount}</span>}
          </button>
          <button onClick={() => setActiveTab('summary')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'summary' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            👥 Group Summary
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0">

          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <div>
              {categories.map(cat => {
                const catItems = menuItems.filter(i => i.category === cat);
                return (
                  <div key={cat} className="mb-8">
                    <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      {cat}
                      <span className="text-sm font-normal text-gray-400 ml-2">({catItems.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {catItems.map(item => {
                        const qty = myCart[item._id]?.qty || 0;
                        return (
                          <div key={item._id}
                            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 transition-colors">
                            {/* Image/emoji */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">{item.emoji || '🍽️'}</span>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div className={`veg-dot ${item.isVeg ? 'veg' : 'nonveg'}`} />
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-1 mb-1">{item.description}</p>
                              <p className="text-sm font-bold text-red-600">₹{item.price}</p>
                            </div>
                            {/* Controls */}
                            {qty === 0 ? (
                              <button onClick={() => addItem(item)}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0">
                                + Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => removeItem(item._id)}
                                  className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold flex items-center justify-center">−</button>
                                <span className="text-sm font-bold text-red-700 w-4 text-center">{qty}</span>
                                <button onClick={() => addItem(item)}
                                  className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center">+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-gray-900">
                Group Summary — {group?.members?.length} members
              </h2>

              {/* Each member's items */}
              {group?.members?.map((member, idx) => {
                const memberId  = member.user?._id || member.user;
                const isMe      = memberId === user?._id;
                const memberTotal = member.items.reduce((s, i) => s + i.price * i.qty, 0);

                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className={`px-5 py-3 flex items-center justify-between ${isMe ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isMe ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {member.name} {isMe && <span className="text-red-500 text-xs">(You)</span>}
                            {(member.user?._id || member.user) === (group.host?._id || group.host) && (
                              <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Host</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{member.items.length} items</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-600">₹{memberTotal}</span>
                    </div>

                    {member.items.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 italic">No items added yet</div>
                    ) : (
                      <div className="px-5 py-3 flex flex-col gap-2">
                        {member.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.emoji} {item.name} × {item.qty}</span>
                            <span className="font-medium text-gray-600">₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Combined total */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Combined Total</h3>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{groupSubtotal}</span></div>
                  <div className="flex justify-between text-gray-500"><span>GST (5%)</span><span>₹{groupTax}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Platform fee</span><span>₹5</span></div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100 mt-1">
                    <span>Grand Total</span>
                    <span className="text-red-600">₹{groupTotal}</span>
                  </div>
                </div>
              </div>

              {/* Host place order */}
              {isHost && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Place Order (Host Only)</h3>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setOrderMode('dine')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${orderMode === 'dine' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-600'}`}>
                      🪑 Dine In
                    </button>
                    <button onClick={() => setOrderMode('takeaway')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${orderMode === 'takeaway' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-600'}`}>
                      🎫 Takeaway
                    </button>
                  </div>
                  {orderMode === 'dine' && (
                    <input type="text" value={tableNo} onChange={e => setTableNo(e.target.value)}
                      placeholder="Enter table number (e.g. T-12)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3" />
                  )}
                  {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
                  <button onClick={handlePlaceOrder} disabled={placing}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-4 rounded-xl text-base transition-colors">
                    {placing ? 'Placing order...' : `💳 Pay ₹${groupTotal} for Everyone`}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    You are paying for all {group?.members?.length} members
                  </p>
                </div>
              )}

              {!isHost && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                  <p className="text-sm text-amber-700 font-medium">⏳ Waiting for the host to place the order</p>
                  <p className="text-xs text-amber-600 mt-1">The host will pay and get the token for everyone</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MY CART SIDEBAR ── */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-4">

          {/* Members online */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Members ({group?.members?.length})
            </p>
            <div className="flex flex-col gap-2">
              {group?.members?.map((member, idx) => {
                const memberId = member.user?._id || member.user;
                const isMe     = memberId === user?._id;
                const isHostMember = memberId === (group.host?._id || group.host);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isMe ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {member.name} {isMe && '(You)'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {member.items.reduce((s, i) => s + i.qty, 0)} items · ₹{member.items.reduce((s,i) => s+i.price*i.qty, 0)}
                      </p>
                    </div>
                    {isHostMember && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Host</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* My cart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              My Items
            </p>

            {Object.values(myCart).length === 0 ? (
              <div className="text-center py-6 text-gray-300">
                <div className="text-3xl mb-2">🛒</div>
                <p className="text-xs">Add items from the menu</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {Object.values(myCart).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate flex-1">{item.emoji} {item.name} ×{item.qty}</span>
                    <span className="font-semibold text-red-600 ml-2 flex-shrink-0">₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-100 mt-1">
                  <span>My total</span>
                  <span className="text-red-600">₹{myTotal}</span>
                </div>
              </div>
            )}

            {Object.values(myCart).length > 0 && (
              <button onClick={saveMyItems}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                💾 Save My Items
              </button>
            )}
          </div>

          {/* Group code */}
          <div className="bg-gray-900 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Group Code</p>
            <p className="text-2xl font-extrabold text-white tracking-widest">{code}</p>
            <p className="text-xs text-gray-500 mt-1">Share with friends</p>
          </div>
        </aside>
      </div>
    </div>
  );
}