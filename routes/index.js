import express from 'express';
import axios from 'axios';

const router = express.Router();
const BACKEND_URL = 'http://localhost:2052';

// Home page route
router.get('/', (req, res) => {
    res.render('home', { 
        title: 'SealCool Monitor - Home',
        backendConnected: true,
        backendStatus: 'Connected',
        mqttConnected: false,
        mqttStatus: 'Disconnected',
        activePath: '/'
    });
});

// MQTT Debug page
router.get('/mqtt-debug', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/devices`);
        res.render('mqtt-debug', {
            title: 'MQTT Debug Monitor',
            devices: response.data,
            activePath: '/mqtt-debug'
        });
    } catch (error) {
        res.render('mqtt-debug', {
            title: 'MQTT Debug Monitor',
            devices: [],
            activePath: '/mqtt-debug'
        });
    }
});

// Live Monitor page - Table View
router.get('/live-monitor', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/devices`);
        console.log('📱 Loaded devices for live-monitor:', response.data.length);
        res.render('live-monitor', {
            title: 'Live Monitor',
            devices: response.data,
            activePath: '/live-monitor'
        });
    } catch (error) {
        console.error('❌ Error loading devices:', error.message);
        res.render('live-monitor', {
            title: 'Live Monitor',
            devices: [],
            activePath: '/live-monitor'
        });
    }
});

// Live Monitor page - Card View
router.get('/live-monitor-cards', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/devices`);
        console.log('📱 Loaded devices for live-monitor-cards:', response.data.length);
        res.render('live-monitor-cards', {
            title: 'Live Monitor - Cards',
            devices: response.data,
            activePath: '/live-monitor-cards'
        });
    } catch (error) {
        console.error('❌ Error loading devices:', error.message);
        res.render('live-monitor-cards', {
            title: 'Live Monitor - Cards',
            devices: [],
            activePath: '/live-monitor-cards'
        });
    }
});

// Devices Monitor page (Original Cards View)
router.get('/devices-monitor', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/devices`);
        console.log('📱 Loaded devices for devices-monitor:', response.data.length);
        res.render('devices-monitor', {
            title: 'Monitor Devices',
            devices: response.data,
            activePath: '/devices-monitor'
        });
    } catch (error) {
        console.error('❌ Error loading devices:', error.message);
        res.render('devices-monitor', {
            title: 'Monitor Devices',
            devices: [],
            activePath: '/devices-monitor'
        });
    }
});

// Manage Brokers page
router.get('/manage/brokers', (req, res) => {
    res.render('manage-brokers', {
        title: 'Manage MQTT Brokers - SealCool',
        activePath: '/manage/brokers'
    });
});

// Data History page
router.get('/data-history', (req, res) => {
    res.render('data-history', {
        title: 'Data History - SealCool Monitor',
        activePath: '/data-history'
    });
});

const indexRouter = router;
export default indexRouter;