const socket = io('http://localhost:2052');

// Function to update device status in the UI
function updateDeviceStatus(deviceId, status) {
    const deviceElement = document.querySelector(`#device-${deviceId} .status`);
    if (deviceElement) {
        deviceElement.textContent = status;
        deviceElement.className = `status ${status.toLowerCase()}`;
    }
}

// Listen for device status updates
socket.on('deviceStatus', (data) => {
    updateDeviceStatus(data.deviceId, data.status);
});

// Listen for temperature updates
socket.on('temperatureUpdate', (data) => {
    const tempElement = document.querySelector(`#device-${data.deviceId} .temperature`);
    if (tempElement) {
        tempElement.textContent = `${data.temperature}°C`;
    }
});

// Initialize WebSocket connection
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
});

socket.on('error', (error) => {
    console.error('WebSocket error:', error);
});