import express from 'express';
import axios from 'axios';

const router = express.Router();
const BACKEND_URL = 'http://localhost:2052';

// Get all devices
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/devices`);
        res.render('devices-manage', {
            title: 'Manage Devices',
            devices: response.data,
            message: req.query.message
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.render('devices-manage', {
            title: 'Manage Devices',
            devices: [],
            error: 'Error fetching devices'
        });
    }
});

// Show add device form
router.get('/add', async (req, res) => {
    try {
        const brokersResponse = await axios.get(`${BACKEND_URL}/api/brokers`);
        res.render('device-form', {
            title: 'Add Device',
            device: null,
            brokers: brokersResponse.data,
            action: '/manage/devices/add'
        });
    } catch (error) {
        console.error('Error fetching brokers:', error);
        res.render('device-form', {
            title: 'Add Device',
            device: null,
            brokers: [],
            action: '/manage/devices/add'
        });
    }
});

// Show edit device form
router.get('/edit/:id', async (req, res) => {
    try {
        const [deviceResponse, brokersResponse] = await Promise.all([
            axios.get(`${BACKEND_URL}/api/devices/${req.params.id}`),
            axios.get(`${BACKEND_URL}/api/brokers`)
        ]);
        res.render('device-form', {
            title: 'Edit Device',
            device: deviceResponse.data,
            brokers: brokersResponse.data,
            action: `/manage/devices/edit/${req.params.id}`
        });
    } catch (error) {
        res.redirect('/manage/devices?message=Device not found');
    }
});

// Add device
router.post('/add', async (req, res) => {
    try {
        await axios.post(`${BACKEND_URL}/api/devices`, req.body);
        res.redirect('/manage/devices?message=Device added successfully');
    } catch (error) {
        res.redirect('/manage/devices?message=Failed to add device');
    }
});

// Update device
router.post('/edit/:id', async (req, res) => {
    try {
        await axios.put(`${BACKEND_URL}/api/devices/${req.params.id}`, req.body);
        res.redirect('/manage/devices?message=Device updated successfully');
    } catch (error) {
        res.redirect('/manage/devices?message=Failed to update device');
    }
});

// Delete device
router.post('/delete/:id', async (req, res) => {
    try {
        await axios.delete(`${BACKEND_URL}/api/devices/${req.params.id}`);
        res.redirect('/manage/devices?message=Device deleted successfully');
    } catch (error) {
        res.redirect('/manage/devices?message=Failed to delete device');
    }
});

export default router;