import express from 'express';
import axios from 'axios';

const router = express.Router();

// Example: Proxy all backend APIs
const BACKEND_API = process.env.API_URL || 'https://scbackend.refritech.co.th:2053';

// List all backend API endpoints
router.get('/', async (req, res) => {
  try {
    // You may want to fetch available endpoints from backend or define statically
    // Example static list:
    const endpoints = [
      '/api/devices',
      '/api/brokers',
      '/api/history',
      '/api/status',
      '/api/mqtt',
      // Add more as needed
    ];
    res.render('api-list', { endpoints, backend: BACKEND_API });
  } catch (err) {
    res.status(500).send('Error fetching API list');
  }
});

// Proxy example: GET /api/devices
router.get('/devices', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_API}/api/devices`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Add more proxy routes as needed

export default router;
