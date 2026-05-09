import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartSidebar from '../components/CartSidebar';
import { getMenuItems } from '../api/restaurants';

export default function Menu() {
  const { restaurantInfo, cart, addItem, removeItem } = useCart();
  const [menuData, setMenuData]     = useState({ categories: [], items: [] });
  const [activeCategory, setActive] = useState(null);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const navigate                    = useNavigate();

  useEffect(() => {
    if (!restaurantInfo?._id) { navigate('/restaurants'); return; }
    fetchMenu();
  }, [restaurantInfo]);

  const fetchMenu = async () => {
    try {
      const res   = await getMenuItems(restaurantInfo._id);
      const items = res.data.data;
      const cats  = [...new Set(items.map(i => i.category))];
      setMenuData({ categories: cats, items });
      setActive(cats[0] || null);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCat = activeCategory || menuData.categories[0];

  const visibleItems = menuData.items.filter(item => {
    const matchCat    = item.category === currentCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        item.description?.toLowerCase().includes(search.toLowerCase());
    return search ? matchSearch : matchCat;
  });

  return (
    <div className="flex h-[calc(100vh-64px)]">

      {/* Category sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex-shrink-0 overflow-y-auto">
        <div className="px-4 pt-5 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
        </div>
        {menuData.categories.map(cat => {
          const count = menuData.items.filter(i => i.category === cat).length;
          return (
            <button key={cat} onClick={() => { setActive(cat); setSearch(''); }}
              className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center border-l-4 transition-colors ${
                currentCat === cat && !search
                  ? 'border-red-500 bg-red-50 text-red-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}>
              {cat}
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{count}</span>
            </button>
          );
        })}
      </aside>

      {/* Main menu area */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => navigate('/restaurants')}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">{restaurantInfo?.name || 'Menu'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {restaurantInfo?.cuisine} · ★ {restaurantInfo?.rating || '4.5'} · {restaurantInfo?.deliveryTime}
            </p>
          </div>

          {/* Group Order button */}
          <button
            onClick={() => navigate('/group/create', { state: { restaurant: restaurantInfo } })}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium transition-colors"
          >
            👥 Group Order
          </button>

          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-44 px-4 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>

        {/* Items */}
        <div className="px-6 py-5">
          {!search && (
            <h2 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
              {currentCat}
              <span className="text-sm font-normal text-gray-400 ml-2">({visibleItems.length} items)</span>
            </h2>
          )}
          {search && (
            <p className="text-sm text-gray-500 mb-4">
              Results for "<strong>{search}</strong>" ({visibleItems.length} found)
            </p>
          )}

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-4 py-5 border-b border-gray-100 animate-pulse">
                  <div className="w-24 h-24 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p>No items found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {visibleItems.map(item => (
                <MenuItem
                  key={item._id}
                  item={item}
                  qty={cart[item._id]?.qty || 0}
                  onAdd={() => addItem(item._id, item.name, item.price, item.emoji, item.isVeg, item.image)}
                  onRemove={() => removeItem(item._id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart sidebar */}
      <CartSidebar />
    </div>
  );
}

function MenuItem({ item, qty, onAdd, onRemove }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-gray-100 last:border-0">
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{item.emoji || '🍽️'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`veg-dot ${item.isVeg ? 'veg' : 'nonveg'}`} />
          <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{item.description}</p>
        <p className="text-base font-bold text-red-600">₹{item.price}</p>
      </div>
      <div className="flex-shrink-0 flex items-center">
        {qty === 0 ? (
          <button onClick={onAdd}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            + Add
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
            <button onClick={onRemove}
              className="w-7 h-7 rounded-lg bg-white border border-red-200 text-red-600 font-bold text-lg flex items-center justify-center hover:bg-red-50">−</button>
            <span className="text-sm font-bold text-red-700 min-w-[16px] text-center">{qty}</span>
            <button onClick={onAdd}
              className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-lg flex items-center justify-center hover:bg-red-700">+</button>
          </div>
        )}
      </div>
    </div>
  );
}