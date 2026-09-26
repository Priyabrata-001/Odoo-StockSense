const API_BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const method = options.method || 'GET';
  console.log(`[Frontend] Sending ${method} request to DB via API: ${url}`, options.body ? JSON.parse(options.body) : '');

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    console.error(`[Frontend] DB/API Error on ${method} ${url} - Status: ${response.status}`, data);
    const error = new Error(data.message || data.error || 'Request failed');
    error.data = data;
    error.status = response.status;
    throw error;
  }

  console.log(`[Frontend] DB/API Success on ${method} ${url} - Data Received:`, data);
  return data;
}

// ==========================================
// AUTH
// ==========================================

export const apiLogin = (loginId, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ loginId, password }) });

export const apiSignup = (loginId, email, password) =>
  request('/auth/signup', { method: 'POST', body: JSON.stringify({ loginId, email, password }) });

export const apiResetPassword = (identifier, newPassword) =>
  request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier, newPassword }) });

// ==========================================
// PRODUCTS
// ==========================================

export const apiGetProducts = (search, category) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category && category !== 'all') params.set('category', category);
  const qs = params.toString();
  return request(`/products${qs ? '?' + qs : ''}`);
};

export const apiGetProductById = (id) => request(`/products/${id}`);

export const apiGetProductStats = () => request('/products/stats');

export const apiGetCategories = () => request('/products/categories');

export const apiGetLowStockProducts = () => request('/products/low-stock');

export const apiGetOutOfStockProducts = () => request('/products/out-of-stock');

export const apiCreateProduct = (productData) =>
  request('/products', { method: 'POST', body: JSON.stringify(productData) });

export const apiUpdateProduct = (id, updates) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

export const apiDeleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });

// ==========================================
// RECEIPTS
// ==========================================

export const apiGetReceipts = () => request('/receipts');

export const apiCreateReceipt = (receiptData) =>
  request('/receipts', { method: 'POST', body: JSON.stringify(receiptData) });

export const apiValidateReceipt = (id) =>
  request(`/receipts/${id}/validate`, { method: 'PUT' });

// ==========================================
// DELIVERIES
// ==========================================

export const apiGetDeliveries = () => request('/deliveries');

export const apiCreateDelivery = (deliveryData) =>
  request('/deliveries', { method: 'POST', body: JSON.stringify(deliveryData) });

export const apiUpdateDeliveryStatus = (id, status) =>
  request(`/deliveries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// ==========================================
// TRANSFERS
// ==========================================

export const apiGetTransfers = () => request('/transfers');

export const apiCreateTransfer = (transferData) =>
  request('/transfers', { method: 'POST', body: JSON.stringify(transferData) });

export const apiValidateTransfer = (id) =>
  request(`/transfers/${id}/validate`, { method: 'PUT' });

// ==========================================
// ADJUSTMENTS
// ==========================================

export const apiGetAdjustments = () => request('/adjustments');

export const apiCreateAdjustment = (adjustmentData) =>
  request('/adjustments', { method: 'POST', body: JSON.stringify(adjustmentData) });

export const apiGetRecordedStock = (productId, location) =>
  request(`/adjustments/recorded-stock?productId=${productId}&location=${location}`);

// ==========================================
// MOVEMENTS / STOCK LEDGER
// ==========================================

export const apiGetMovements = () => request('/movements');

// ==========================================
// LOCATIONS
// ==========================================

export const apiGetLocations = () => request('/locations');

export const apiGetLocationsFull = () => request('/locations/full');

export const apiCreateLocation = (locationData) =>
  request('/locations', { method: 'POST', body: JSON.stringify(locationData) });

export const apiUpdateLocation = (id, updates) =>
  request(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
