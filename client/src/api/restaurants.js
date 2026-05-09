import API from './axios';

export const getAllRestaurants = (params) =>
  API.get('/restaurants', { params });

export const getRestaurant = (id) =>
  API.get(`/restaurants/${id}`);

export const getMyRestaurant = () =>
  API.get('/restaurants/my');

export const updateRestaurant = (id, data) =>
  API.put(`/restaurants/${id}`, data);

// Menu
export const getMenuItems = (restaurantId) =>
  API.get(`/restaurants/${restaurantId}/menu`);

export const getAllMenuItems = (restaurantId) =>
  API.get(`/restaurants/${restaurantId}/menu/all`);

export const addMenuItem = (restaurantId, data) =>
  API.post(`/restaurants/${restaurantId}/menu`, data);

export const updateMenuItem = (id, data) =>
  API.put(`/menu/${id}`, data);

export const deleteMenuItem = (id) =>
  API.delete(`/menu/${id}`);

export const toggleMenuItemAvailability = (id) =>
  API.patch(`/menu/${id}/toggle`);
export const uploadImage = (formData) =>
  API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });