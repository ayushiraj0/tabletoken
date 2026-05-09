import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability, uploadImage } from '../../api/restaurants';

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice & Biryani', 'Beverages', 'Desserts'];
const EMPTY_FORM  = { name: '', category: 'Starters', price: '', emoji: '', isVeg: true, isAvailable: true, description: '', image: '' };

export default function MenuManagement() {
  const { user }                          = useAuth();
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeCat, setActiveCat]         = useState('All');
  const [search, setSearch]               = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editItem, setEditItem]           = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saveMsg, setSaveMsg]             = useState('');
  const [saving, setSaving]               = useState(false);
  const [imagePreview, setImagePreview]   = useState('');
  const [uploading, setUploading]         = useState(false);

  const restaurantId = user?.restaurantId;

  const fetchItems = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await getAllMenuItems(restaurantId);
      setItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(item => {
    const matchCat    = activeCat === 'All' || item.category === activeCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, price: item.price.toString(), description: item.description || '', image: item.image || '' });
    setImagePreview(item.image || '');
    setShowModal(true);
  };

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadImage(formData);
      setForm(prev => ({ ...prev, image: res.data.url }));
    } catch (err) {
      console.error('Upload failed:', err);
      setSaveMsg('Image upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { setSaveMsg('Please fill in name and price.'); return; }
    if (!form.image && !form.emoji) { setSaveMsg('Please upload an image or enter an emoji.'); return; }
    if (uploading) { setSaveMsg('Please wait — image is still uploading.'); return; }
    setSaving(true);
    try {
      if (editItem) {
        const res = await updateMenuItem(editItem._id, { ...form, price: parseInt(form.price) });
        setItems(prev => prev.map(i => i._id === editItem._id ? res.data.data : i));
      } else {
        const res = await addMenuItem(restaurantId, { ...form, price: parseInt(form.price) });
        setItems(prev => [...prev, res.data.data]);
      }
      setShowModal(false);
      setSaveMsg('');
      setImagePreview('');
    } catch (err) {
      setSaveMsg(err.response?.data?.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMenuItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleMenuItemAvailability(id);
      setItems(prev => prev.map(i => i._id === id ? res.data.data : i));
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} items · {items.filter(i => i.isAvailable).length} available</p>
        </div>
        <button onClick={openAdd}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          + Add Item
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 w-64" />
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeCat === cat ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading menu...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Item','Category','Price','Type','Available','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item._id} className={`hover:bg-gray-50 transition-colors ${!item.isAvailable ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Image or emoji */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{item.emoji}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400 max-w-[200px] truncate">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{item.category}</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-red-600">₹{item.price}</td>
                  <td className="px-5 py-3.5"><div className={`veg-dot ${item.isVeg ? 'veg' : 'nonveg'}`} /></td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggle(item._id)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${item.isAvailable ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)}
                        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg font-medium">Edit</button>
                      <button onClick={() => setDeleteConfirm(item._id)}
                        className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">🍽️</div><p>No items found</p></div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900 text-base">{editItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => { setShowModal(false); setSaveMsg(''); setImagePreview(''); }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-4">
              {saveMsg && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{saveMsg}</div>}

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Item Image</label>
                <div className="flex items-center gap-4">
                  {/* Preview box */}
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {imagePreview || form.image ? (
                      <img src={imagePreview || form.image} alt="preview" className="w-full h-full object-cover rounded-xl" />
                    ) : form.emoji ? (
                      <span className="text-4xl">{form.emoji}</span>
                    ) : (
                      <span className="text-3xl text-gray-300">🍽️</span>
                    )}
                  </div>

                  {/* Upload button */}
                  <div className="flex-1">
                    <label className="cursor-pointer block">
                      <div className={`w-full py-3 px-4 border-2 border-dashed rounded-xl text-sm text-center transition-colors ${
                        uploading
                          ? 'border-gray-200 bg-gray-50 text-gray-400'
                          : 'border-red-200 hover:border-red-400 hover:bg-red-50 text-gray-600'
                      }`}>
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Uploading...
                          </span>
                        ) : (
                          <>📷 Upload Photo</>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    <p className="text-xs text-gray-400 mt-1 text-center">JPG, PNG, WebP — max 5MB</p>
                    {(imagePreview || form.image) && (
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); setForm(prev => ({ ...prev, image: '' })); }}
                        className="w-full mt-1 text-xs text-red-500 hover:text-red-700"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                {/* Emoji fallback */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-gray-400 whitespace-nowrap">Emoji fallback:</span>
                  <input name="emoji" value={form.emoji} onChange={handleFormChange}
                    placeholder="🍛" maxLength={2}
                    className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-2xl text-center focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <div className="flex flex-wrap gap-1">
                    {['🍛','🍔','🍕','🍜','🥗','🍗','🧀','🍲','🫓','🍚','🍮','🥤','🫖','🥘'].map(e => (
                      <button key={e} type="button" onClick={() => setForm(prev => ({ ...prev, emoji: e }))}
                        className={`text-lg p-1 rounded-lg hover:bg-gray-100 transition-colors ${form.emoji === e ? 'bg-red-100 ring-2 ring-red-400' : ''}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Item name *</label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Paneer Tikka"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={2} placeholder="Short description..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select name="category" value={form.category} onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (₹) *</label>
                  <input name="price" value={form.price} onChange={handleFormChange} type="number" placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleFormChange} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <div className="veg-dot veg" /> Vegetarian
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleFormChange} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-gray-700">Available now</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => { setShowModal(false); setSaveMsg(''); setImagePreview(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-sm font-semibold">
                {saving ? 'Saving...' : uploading ? 'Uploading...' : editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-900 mb-2">Delete item?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}