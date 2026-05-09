import API from './axios';

export const createGroupOrder  = (data)         => API.post('/group-orders', data);
export const getGroupOrder     = (code)         => API.get(`/group-orders/${code}`);
export const joinGroupOrder    = (code)         => API.post(`/group-orders/${code}/join`);
export const updateMyItems     = (code, items)  => API.put(`/group-orders/${code}/items`, { items });
export const placeGroupOrder   = (code, data)   => API.post(`/group-orders/${code}/place`, data);