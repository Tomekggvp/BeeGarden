import axios from 'axios';

const api = axios.create({
  baseURL: 'https://beegarden.onrender.com', // http://localhost:5000  https://beegarden.onrender.com
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;