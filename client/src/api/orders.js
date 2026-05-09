import API from './axios';

export const placeOrder = (data) =>
  API.post('/orders', data);

export const getMyOrders = () =>
  API.get('/orders/my');

export const getOrder = (id) =>
  API.get(`/orders/${id}`);

export const getRestaurantOrders = (restaurantId, params) =>
  API.get(`/orders/restaurant/${restaurantId}`, { params });

export const getRestaurantStats = (restaurantId) =>
  API.get(`/orders/stats/${restaurantId}`);

export const updateOrderStatus = (id, status) =>
  API.patch(`/orders/${id}/status`, { status });

export const updateItemStatus = (orderId, itemIndex, itemStatus) =>
  API.patch(`/orders/${orderId}/item-status`, { itemIndex, itemStatus });