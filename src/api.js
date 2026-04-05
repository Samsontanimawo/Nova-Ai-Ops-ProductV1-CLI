/**
 * Nova CLI — API client
 * Handles authenticated requests to the Nova AI Ops backend
 */

import { getConfig, getToken } from './config.js';

export async function apiRequest(method, path, body = null, options = {}) {
  const config = getConfig();
  const token = getToken();
  const url = `${config.apiUrl}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'nova-cli/1.0.0',
  };

  if (token) {
    headers['Cookie'] = `nova_token=${token}`;
  }

  const fetchOptions = {
    method,
    headers,
    ...options,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  fetchOptions.signal = controller.signal;

  try {
    const res = await fetch(url, fetchOptions);
    clearTimeout(timeout);

    if (res.status === 401) {
      throw new Error('Authentication required. Run: nova login');
    }

    if (res.status === 403) {
      throw new Error('Permission denied. Check your role and organization.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and API URL.');
    }
    throw err;
  }
}

export const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
};
