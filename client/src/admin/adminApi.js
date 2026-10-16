/* Admin API client + session storage (sessionStorage: cleared when the browser closes) */
const SESSION_KEY = 'ag-admin-session';

export const getSession = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* memory only */ }
};

export const clearSession = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nothing stored */ }
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Render's free tier sleeps; the first request after a while can take ~50 s
const request = async (path, { method = 'GET', body, raw, headers = {}, auth = true, timeout = 70000 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const h = { ...headers };
  const session = auth ? getSession() : null;
  if (session) h.authorization = `Bearer ${session.token}`;
  if (body !== undefined) h['content-type'] = 'application/json';
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers: h,
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
      cache: 'no-store', // the public content route is cacheable; the editor must see fresh data
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('The server took too long to respond.', 0);
    throw new ApiError('Could not reach the server.', 0);
  } finally {
    clearTimeout(timer);
  }
};

// header values must be ISO-8859-1, so keep file names plain
const safeName = (name = '') => name.replace(/[^\w.-]+/g, '_').slice(0, 100);

export const adminApi = {
  status: () => request('/admin/status', { auth: false }),
  health: () => request('/health', { auth: false }),
  login: (password) => request('/admin/login', { method: 'POST', body: { password }, auth: false }),
  session: () => request('/admin/session'),
  content: () => request('/content', { auth: false }),
  saveProfile: (profile) => request('/admin/profile', { method: 'PUT', body: profile }),
  saveList: (section, items) => request(`/admin/${section}`, { method: 'PUT', body: items }),
  listMedia: () => request('/admin/media'),
  uploadMedia: (blob, name) => request('/admin/media', {
    method: 'POST',
    raw: blob,
    headers: { 'content-type': blob.type || 'image/webp', 'x-file-name': safeName(name) },
  }),
  deleteMedia: (id) => request(`/admin/media/${id}`, { method: 'DELETE' }),
  messages: () => request('/contact'),
  markMessage: (id, read) => request(`/contact/${id}`, { method: 'PATCH', body: { read } }),
  deleteMessage: (id) => request(`/contact/${id}`, { method: 'DELETE' }),
};
