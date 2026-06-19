import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 30-second in-memory GET cache
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

api.interceptors.request.use(
  (config) => {
    // Only cache GET requests
    if (config.method === 'get') {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Resolve request from cache without sending network call
        config.adapter = () => {
          return Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: config.headers,
            config,
          });
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const { config } = response;

    // Cache successful GET responses
    if (config.method === 'get') {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    } else if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      // Clear cache on any write operation to prevent stale data
      cache.clear();
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
