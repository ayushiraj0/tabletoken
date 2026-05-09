import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../api/orders';

export default function CartSidebar() {
  const {
    cart, addItem, removeItem,
    subtotal, tax, platformFee, grandTotal,
    totalItems, restaurantInfo, clearCart,
  } = useCart();

  const [orderMode, setOrderMode] = useState('dine');
  const [tableNo, setTableNo]     = useState('');
  const [note, setNote]           = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const cartItems = Object.entries(cart);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (orderMode === 'dine' && !tableNo.trim()) {
      setError('Please enter your table number, or switch to Takeaway.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const orderData = {
        restaurantId: restaurantInfo?._id,
        items: cartItems.map(([id, item]) => ({
          menuItem: id,
          name:     item.name,
          price:    item.price,
          emoji:    item.emoji,
          isVeg:    item.isVeg,
          qty:      item.qty,
        })),
        orderMode,
        tableNo:     orderMode === 'dine' ? tableNo.trim() : 'Takeaway',
        subtotal,
        tax,
        platformFee,
        grandTotal,
        note,
      };

      const res   = await placeOrder(orderData);
      const order = res.data.data;

      // Save for Token page
      sessionStorage.setItem('tt_last_order', JSON.stringify({
        ...orderData,
        token:      order.token,
        orderId:    order._id,
        placedAt:   order.createdAt,
        status:     'confirmed',
        restaurant: restaurantInfo,
        items:      cart,
      }));

      clearCart();
      navigate(`/token/${order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col sticky top-16 h-[calc(100vh-64px)]">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Your order
          {restaurantInfo && (
            <span className="text-xs text-gray-400 font-normal ml-2">from {restaurantInfo.name}</span>
          )}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-gray-400 text-sm">Your cart is empty</p>
            <p className="text-gray-300 text-xs mt-1">Add items from the menu</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {cartItems.map(([id, item]) => (
              <div key={id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price} each</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <button onClick={() => removeItem(id)}
                    className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 text-base flex items-center justify-center">−</button>
                  <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                  <button onClick={() => addItem(id, item.name, item.price, item.emoji, item.isVeg)}
                    className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-base flex items-center justify-center">+</button>
                </div>
                <span className="text-sm font-bold text-red-600 ml-3 w-14 text-right flex-shrink-0">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Order type</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => { setOrderMode('dine'); setError(''); }}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${orderMode === 'dine' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                🪑 Dine In
              </button>
              <button onClick={() => { setOrderMode('takeaway'); setError(''); }}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${orderMode === 'takeaway' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                🎫 Takeaway
              </button>
            </div>
            {orderMode === 'dine' ? (
              <input type="text" value={tableNo} onChange={e => { setTableNo(e.target.value); setError(''); }}
                placeholder="Enter table number (e.g. T-12)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
            ) : (
              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                🎫 Token will be generated after payment.
              </p>
            )}
          </div>

          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Special instructions (optional)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal ({totalItems} items)</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-gray-500"><span>GST (5%)</span><span>₹{tax}</span></div>
            <div className="flex justify-between text-gray-500"><span>Platform fee</span><span>₹{platformFee}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100 mt-1">
              <span>Total</span><span className="text-red-600">₹{grandTotal}</span>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-sm">
            {loading ? 'Placing order...' : `Pay ₹${grandTotal} & Get Token →`}
          </button>
        </div>
      )}
    </aside>
  );
}