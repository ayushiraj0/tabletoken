import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart]                 = useState({});
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  const addItem = (id, name, price, emoji, isVeg, image = '') => {
    setCart(prev => ({
      ...prev,
      [id]: {
        name, price, emoji, isVeg, image,
        qty: (prev[id]?.qty || 0) + 1,
      },
    }));
  };

  const removeItem = (id) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], qty: updated[id].qty - 1 };
        if (updated[id].qty <= 0) delete updated[id];
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart({});
    setRestaurantInfo(null);
  };

  const setRestaurant = (info) => setRestaurantInfo(info);

  const totalItems  = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const subtotal    = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
  const tax         = Math.round(subtotal * 0.05);
  const platformFee = 5;
  const grandTotal  = subtotal + tax + platformFee;

  return (
    <CartContext.Provider value={{
      cart, addItem, removeItem, clearCart,
      totalItems, subtotal, tax, platformFee, grandTotal,
      restaurantInfo, setRestaurant,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);