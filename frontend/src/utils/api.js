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
const CACHE_TTL = 30000;

api.interceptors.request.use(
  (config) => {
    // Never cache blob/binary/stream requests — exports, downloads, file uploads
    const isCacheable = config.method === 'get' && config.responseType !== 'blob' && config.responseType !== 'arraybuffer';

    if (isCacheable) {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
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
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const { config } = response;
    const isCacheable = config.method === 'get' && config.responseType !== 'blob' && config.responseType !== 'arraybuffer';

    if (isCacheable) {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    } else if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      cache.clear();
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
