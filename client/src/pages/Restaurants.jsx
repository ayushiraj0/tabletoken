import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getAllRestaurants } from '../api/restaurants';

const CATEGORIES = ['All', 'Indian', 'Burgers', 'Chinese', 'Pizza', 'Cafe'];

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch]           = useState('');
  const [activecat, setActivecat]     = useState('All');
  const [vegOnly, setVegOnly]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const { setRestaurant, clearCart }  = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, [activecat, vegOnly]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activecat !== 'All') params.category = activecat;
      if (vegOnly)             params.isVeg     = true;
      if (search)              params.search    = search;
      const res = await getAllRestaurants(params);
      setRestaurants(res.data.data);
    } catch (err) {
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.key === 'Enter') fetchRestaurants();
  };

  const openMenu = (restaurant) => {
    clearCart();
    setRestaurant(restaurant);
    navigate(`/menu/${restaurant._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurants near you</h1>
            <p className="text-sm text-gray-500 mt-1">Dhanbad, Jharkhand · {restaurants.length} restaurants open</p>
          </div>
          <input
            type="text" value={search} onChange={handleSearch}
            onKeyDown={handleSearch}
            placeholder="🔍  Search restaurants or dishes..."
            className="md:w-72 px-4 py-2.5 border border-gray-200 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActivecat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activecat === cat ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {cat}
            </button>
          ))}
          <button onClick={() => setVegOnly(v => !v)}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              vegOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Pure Veg
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchRestaurants} className="mt-4 bg-red-600 text-white px-5 py-2 rounded-xl text-sm">
              Retry
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg font-medium">No restaurants found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map(r => (
              <RestaurantCard key={r._id} restaurant={r} onOpen={openMenu} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const BG_COLORS = ['from-indigo-950 to-indigo-900','from-emerald-950 to-emerald-900','from-red-950 to-red-900','from-blue-950 to-blue-900','from-purple-950 to-purple-900','from-amber-950 to-amber-900'];

function RestaurantCard({ restaurant: r, onOpen }) {
  const bg = BG_COLORS[Math.abs(r.name.charCodeAt(0)) % BG_COLORS.length];
  return (
    <div onClick={() => onOpen(r)}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group">
      <div className={`h-36 bg-gradient-to-br ${bg} flex items-center justify-center text-6xl relative`}>
        {r.emoji}
        {r.isBusy ? (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Busy</span>
        ) : (
          <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Open</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{r.name}</h3>
          <span className="flex items-center gap-1 text-amber-500 font-semibold text-sm">★ {r.rating || '4.5'}</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">{r.cuisine}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span>⏱ {r.deliveryTime}</span>
          <span>·</span>
          <span>👥 {r.priceFor2} for two</span>
        </div>
        <div className="flex items-center gap-2">
          {r.isVeg ? (
            <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">Pure Veg</span>
          ) : (
            <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">Non-Veg</span>
          )}
          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">{r.priceLevel}</span>
        </div>
      </div>
    </div>
  );
}