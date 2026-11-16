import { request, BASE_HOST } from './Client';

export const requestService = {
  getAll: () => request('/DocumentRequests?pageSize=100'),
  getById: (id) => request(`/DocumentRequests/${id}`),
  getByUser: (userId) => request(`/DocumentRequests/user/${userId}?pageSize=100`),
  getByReference: (ref) => request(`/DocumentRequests/reference/${ref}`),
  create: (data) => request('/DocumentRequests', { method: 'POST', body: data }),
  createPayMongoCheckout: (data) => request('/DocumentRequests/checkout-session', { method: 'POST', body: data }),
  completePayMongoCheckout: (id) => request(`/DocumentRequests/checkout-session/${id}/complete`, { method: 'POST' }),
  createCheckout: (id) => request(`/DocumentRequests/${id}/checkout`, { method: 'POST' }),
  verifyPayment: (id) => request(`/DocumentRequests/${id}/verify-payment`, { method: 'POST' }),
  markCodPaid: (id) => request(`/DocumentRequests/${id}/mark-cod-paid`, { method: 'POST' }),
  update: (id, data) => request(`/DocumentRequests/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/DocumentRequests/${id}`, { method: 'DELETE' }),

  upload: (id, formData) => request(`/DocumentRequests/${id}/upload`, {
    method: 'POST',
    body: formData,
  }),
  downloadPaymentReceipt: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_HOST}/api/DocumentRequests/${id}/payment-receipt`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to download payment receipt');
    }

    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `payment-receipt-${id}`;
    return { blob: await response.blob(), filename };
  },
};