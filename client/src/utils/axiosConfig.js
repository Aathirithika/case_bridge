import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor – attach token only if one exists.  No crash if missing.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // If no token, the request goes out without an Authorization header.
        // The server's protect() middleware will attach a guest user automatically.
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor – log errors but never auto-redirect.
// Components decide what to do on failure.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Network Error: No response from server', error.request);
        } else {
            console.error('Request Setup Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;