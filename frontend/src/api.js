const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const defaultApiBaseUrl = isLocalDev
  ? 'http://localhost:5001/api'
  : 'https://transitops-1-lmkb.onrender.com/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
