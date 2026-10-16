import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Render's free instance can take ~50 s to wake, so give the content call room
export const getContent = () => api.get('/content', { timeout: 70000 });

export default api;
