// Socket.IO connection
const socket = io();

// Chart.js configuration
const chartConfig = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature',
            data: [],
            borderColor: '#1976d2',
            tension: 0.4,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
};

// Device charts storage
const deviceCharts = new Map();

// Initialize charts for each device
document.querySelectorAll('.device-card').forEach(card => {
    const deviceId = card.id.replace('device-', '');
    const chartElement = document.querySelector(`#chart-${deviceId}`);
    if (chartElement) {
        const ctx = chartElement.getContext('2d');
        const chart = new Chart(ctx, JSON.parse(JSON.stringify(chartConfig)));
        deviceCharts.set(deviceId, chart);
    }
});

// MQTT Settings Modal
const modal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeBtn = document.querySelector('.close-button');
const mqttForm = document.getElementById('mqttConfigForm');
const disconnectBtn = document.querySelector('.btn-disconnect');

// Open modal
if (settingsBtn) {
    settingsBtn.onclick = () => {
        modal.style.display = 'block';
    };
}

// Close modal
if (closeBtn) {
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// Click outside modal to close
window.onclick = (event) => {
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
};

// Handle MQTT form submission
if (mqttForm) {
    mqttForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(mqttForm);
        const config = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/mqtt/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                modal.style.display = 'none';
                updateMQTTStatus('Connected');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            alert('Failed to connect to MQTT: ' + error.message);
        }
    };
}

// Handle MQTT disconnect
if (disconnectBtn) {
    disconnectBtn.onclick = async () => {
        try {
            const response = await fetch('/api/mqtt/disconnect', {
                method: 'POST'
            });

            if (response.ok) {
                modal.style.display = 'none';
                updateMQTTStatus('Disconnected');
            } else {
                throw new Error('Disconnect failed');
            }
        } catch (error) {
            alert('Failed to disconnect MQTT: ' + error.message);
        }
    };
}

// Update device status
socket.on('deviceStatus', data => {
    const { deviceId, status, temperature, timestamp } = data;
    const deviceCard = document.querySelector(`#device-${deviceId}`);
    
    if (deviceCard) {
        const statusBadge = deviceCard.querySelector('.status-badge');
        const tempValue = deviceCard.querySelector('.temperature');
        const lastUpdate = deviceCard.querySelector('.metric-value:last-child');
        
        statusBadge.className = `status-badge ${status.toLowerCase()}`;
        statusBadge.textContent = status;
        tempValue.textContent = `${temperature}°C`;
        // แสดงเวลาโดยตรง (DB เก็บเป็นเวลาไทยแล้ว)
        const date = new Date(timestamp);
        const isoString = date.toISOString();
        
        // แสดงเป็น DD/MM/YYYY HH:MM:SS
        const dateStr = isoString.substring(0, 10); // YYYY-MM-DD
        const timeStr = isoString.substring(11, 19); // HH:MM:SS
        const [year, month, day] = dateStr.split('-');
        lastUpdate.textContent = `${day}/${month}/${year} ${timeStr}`;

        // Update chart
        const chart = deviceCharts.get(deviceId);
        if (chart) {
            const maxDataPoints = 20;
            // แสดงเฉพาะเวลา
            const timeLabel = isoString.substring(11, 19); // HH:MM:SS
            chart.data.labels.push(timeLabel);
            chart.data.datasets[0].data.push(temperature);

            if (chart.data.labels.length > maxDataPoints) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }

            chart.update();
        }
    }
});

// Update connection status
socket.on('backendStatus', status => {
    const statusElement = document.getElementById('backendStatus');
    if (statusElement) {
        statusElement.className = `status-value ${status ? 'connected' : 'disconnected'}`;
        statusElement.textContent = status ? 'Connected' : 'Disconnected';
    }
});

socket.on('mqttStatus', status => {
    updateMQTTStatus(status);
});

function updateMQTTStatus(status) {
    const statusElement = document.getElementById('mqttStatus');
    if (statusElement) {
        const isConnected = status === 'Connected';
        statusElement.className = `status-value ${isConnected ? 'connected' : 'disconnected'}`;
        statusElement.textContent = status;
    }
}

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const nav = document.querySelector('.app-nav');

if (menuToggle && nav) {
    menuToggle.onclick = () => {
        nav.classList.toggle('open');
    };
}