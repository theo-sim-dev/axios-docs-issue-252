const axios = require('axios');
const nock = require('nock');

let token = 'expired-token';
let refreshCalled = false;

// Mock GET /protected — allow it twice
nock('https://api.example.com')
  .get('/protected')
  .twice()
  .reply(function () {
    if (!refreshCalled) {
      return [401, { message: 'Token expired' }];
    }
    return [200, { success: true }];
  });

// Mock POST /auth/refresh
nock('https://api.example.com')
  .post('/auth/refresh')
  .reply(200, () => {
    token = 'new-token';
    refreshCalled = true;
    return { token };
  });

const instance = axios.create({
  baseURL: 'https://api.example.com',
  headers: { Authorization: `Bearer ${token}` }
});

// Request interceptor to log if it's a retry
instance.interceptors.request.use(config => {
  if (config._fromRetry) {
    console.log('Confirmed: Retried request is using error.config');
  } else {
    console.log('Initial request');
  }
  return config;
});

async function refreshToken() {
  console.log('Refreshing token...');
  const response = await axios.post('https://api.example.com/auth/refresh');
  token = response.data.token;
  instance.defaults.headers['Authorization'] = `Bearer ${token}`;
}

instance.interceptors.response.use(undefined, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;

    await refreshToken();

    error.config.headers['Authorization'] = `Bearer ${token}`;
    error.config._fromRetry = true; // Test if this error.config is being passed correctly to the Axios instance.

    console.log('Retrying request using error.config:', {
      url: error.config.url,
      method: error.config.method,
      headers: error.config.headers
    });

    return instance(error.config);
  }
  throw error;
});

instance.get('/protected')
  .then(res => {
    console.log('Final response:', res.data);
  })
  .catch(err => {
    console.error('Request failed:', err.message);
  });
