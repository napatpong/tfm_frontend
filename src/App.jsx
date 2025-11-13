import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { getMQTTStatus, getHealthStatus, testAPI, connectMQTT, disconnectMQTT } from './services/api';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  DevicesOther as DevicesIcon,
  Home as HomeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Devices from './components/Devices';
import './App.css';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: drawerWidth,
    }),
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

function Home() {
  const [mqttStatus, setMqttStatus] = useState(null);
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    message: 'กำลังเชื่อมต่อ...'
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const pauseRefresh = useRef(false);
  const ws = useRef(null);
  const [mqttMessages, setMqttMessages] = useState([]);
  const [subscribeTopic, setSubscribeTopic] = useState('');
  const [groupedMessages, setGroupedMessages] = useState({});
  const [consolidatedData, setConsolidatedData] = useState({});
  const [mqttConfig, setMqttConfig] = useState({
    protocol: 'wss',
    broker: 'www.earth-link.co',
    port: '3885',
    username: 'earthlinkiot',
    password: 'bifrost12345678'
  });

  // ทดสอบการเชื่อมต่อกับ Backend
  const checkBackendConnection = async () => {
    try {
      const response = await testAPI();
      
      if (response.success) {
        setBackendStatus(prev => {
          // อัพเดทเฉพาะเมื่อสถานะเปลี่ยน
          if (!prev.connected) {
            return {
              connected: true,
              message: 'เชื่อมต่อสำเร็จ',
              data: response
            };
          }
          return prev;
        });
        return true;
      }
    } catch (error) {
      setBackendStatus(prev => {
        // อัพเดทเฉพาะเมื่อสถานะเปลี่ยน
        if (prev.connected) {
          return {
            connected: false,
            message: `ไม่สามารถเชื่อมต่อได้: ${error.message}`
          };
        }
        return prev;
      });
      return false;
    }
  };

  // ดึงข้อมูล MQTT Status
  const fetchMQTTStatus = async () => {
    try {
      const response = await getMQTTStatus();
      
      if (response.success) {
        const newData = response.data;
        // อัพเดททุกครั้งเพื่อให้ uptime เปลี่ยน แต่ไม่ทำให้กระพริบ
        setMqttStatus(newData);
        setLastUpdate(new Date().toLocaleString('th-TH'));
      }
    } catch (error) {
      // Silent error
    } finally {
      if (loading) setLoading(false);
    }
  };

  // เริ่มต้นตอน mount (run once)
  useEffect(() => {
    const init = async () => {
      const isConnected = await checkBackendConnection();
      
      if (isConnected) {
        await fetchMQTTStatus();
        connectWebSocket();
      } else {
        setLoading(false);
      }
    };

    init();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // WebSocket connection
  const connectWebSocket = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://localhost:2053';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected to:', wsUrl);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket received:', data);
        
        if (data.type === 'mqtt_status') {
          setMqttStatus(data.data);
          setLastUpdate(new Date().toLocaleString('th-TH'));
        } else if (data.type === 'mqtt_message') {
          console.log('MQTT Message received:', data.data);
          
          // จัดกลุ่มข้อมูลตาม MAC และ range
          const parsedData = parseMessage(data.data.message);
          console.log('Parsed message data:', parsedData);
          if (parsedData) {
            // ใช้ ### เป็น separator เพื่อหลีกเลี่ยง : ใน MAC
            const key = `${parsedData.mac}###${parsedData.type}###${parsedData.range}`;
            console.log('Creating grouped key:', key);
            console.log('Current groupedMessages:', Object.keys(groupedMessages));
            setGroupedMessages(prev => ({
              ...prev,
              [key]: {
                ...data.data,
                parsedData: parsedData,
                timestamp: new Date().toISOString()
              }
            }));
            
            // รวมข้อมูลทั้งหมดของ MAC เดียวกัน
            if (parsedData.type === 'DATA') {
              setConsolidatedData(prev => {
                const macKey = parsedData.mac;
                const currentData = prev[macKey] || { 
                  values: {}, 
                  lastUpdate: {},
                  topic: data.data.topic 
                };
                
                // อัพเดทเฉพาะค่าที่เปลี่ยน
                parsedData.data.forEach(item => {
                  const idx = parseInt(item.label.replace('data', ''));
                  currentData.values[idx] = item.value;
                  currentData.lastUpdate[idx] = new Date().toISOString();
                });
                
                const updatedData = {
                  ...prev,
                  [macKey]: {
                    ...currentData,
                    timestamp: new Date().toISOString()
                  }
                };
                
                console.log('Consolidated Data Updated:', updatedData);
                return updatedData;
              });
            }
          }
          
          // เก็บ history แบบเดิม (50 ข้อความล่าสุด)
          setMqttMessages(prev => [data.data, ...prev].slice(0, 50));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (backendStatus.connected) {
          connectWebSocket();
        }
      }, 5000);
    };
  };

  // Auto-refresh ทุก 5 วินาที
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!pauseRefresh.current) {
        await checkBackendConnection();
        // WebSocket จะอัพเดท mqttStatus อัตโนมัติ ไม่ต้อง fetch ซ้ำ
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Handle MQTT connection
  const handleConnect = async () => {
    pauseRefresh.current = true; // หยุด refresh
    setConnecting(true);
    try {
      const response = await connectMQTT(mqttConfig);
      
      if (response.success) {
        setShowConfig(false);
        await fetchMQTTStatus();
      }
    } catch (error) {
      // Silent error
    } finally {
      setConnecting(false);
      pauseRefresh.current = false; // เริ่ม refresh อีกครั้ง
    }
  };

  // Handle MQTT disconnection
  const handleDisconnect = async () => {
    try {
      await disconnectMQTT();
      await fetchMQTTStatus();
    } catch (error) {
      // Silent error
    }
  };

  // Handle toggle config
  const handleToggleConfig = (show) => {
    setShowConfig(show);
    pauseRefresh.current = show; // หยุด refresh เมื่อเปิดฟอร์ม
  };

  // Handle subscribe to topic
  const handleSubscribe = () => {
    if (subscribeTopic && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'mqtt_subscribe',
        topic: subscribeTopic
      }));
      setSubscribeTopic('');
    }
  };

  // Clear messages
  const clearMessages = () => {
    setMqttMessages([]);
    setGroupedMessages({});
    setConsolidatedData({});
  };

  const formatDate = (date) => {
    if (!date) return '-';
    if (typeof date === 'string') return date;
    return new Date(date).toLocaleString('th-TH');
  };

  // แยก MAC address จาก topic
  const extractMAC = (topic) => {
    const match = topic.match(/([0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2})/i);
    return match ? match[1] : null;
  };

  // Parse ข้อมูล MQTT message
  const parseMessage = (message) => {
    try {
      // MAC address มี format XX:XX:XX:XX:XX:XX (6 คู่ของ hex)
      // ดึง MAC ออกมาก่อน
      const macRegex = /^([0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}):/i;
      const macMatch = message.match(macRegex);
      
      if (!macMatch) {
        console.error('No MAC address found in message:', message);
        return null;
      }
      
      const mac = macMatch[1];
      // ตัดส่วน MAC ออก แล้ว split ส่วนที่เหลือ
      const remainingMessage = message.substring(mac.length + 1); // +1 เพื่อตัด : ที่ตามหลัง MAC
      const parts = remainingMessage.split(':');
      
      if (parts.length >= 1) {
        const dataType = parts[0];
        
        // กรณี DATA:start:end:value1:value2:...
        if (dataType === 'DATA' && parts.length >= 3) {
          const dataStart = parseInt(parts[1]);
          const dataEnd = parseInt(parts[2]);
          const dataCount = dataEnd - dataStart + 1;
          const dataValues = parts.slice(3, 3 + dataCount);
          
          return {
            mac: mac,
            type: 'DATA',
            range: `${dataStart}-${dataEnd}`,
            data: dataValues.map((value, index) => ({
              label: `data${dataStart + index}`,
              value: value
            }))
          };
        }
        
        // กรณี COIL_DATA หรือรูปแบบอื่นๆ
        if (parts.length >= 2) {
          const values = parts.slice(1);
          return {
            mac: mac,
            type: dataType,
            range: values.length > 0 ? values[0] : '0', // ใช้ค่าแรกเป็น range identifier
            data: values.map((value, index) => ({
              label: `value${index}`,
              value: value
            }))
          };
        }
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
    return null;
  };

  // ฟังก์ชันแปลง hex เป็น signed 16-bit integer
  const hexToSigned16 = (hexString) => {
    if (!hexString || hexString === '-') return '-';
    
    try {
      // ตัด 0x ออกถ้ามี และเอาแค่ 16-bit (4 hex digits สุดท้าย)
      const cleanHex = hexString.replace(/^0x/i, '').slice(-4);
      
      // แปลงเป็น unsigned 16-bit
      let value = parseInt(cleanHex, 16);
      
      // ถ้า NaN ให้คืนค่า -
      if (isNaN(value)) return '-';
      
      // แปลงเป็น signed 16-bit (ถ้า bit ที่ 15 เป็น 1 แปลว่าเป็นเลขลบ)
      if (value > 0x7FFF) {
        value = value - 0x10000;
      }
      
      return value;
    } catch (error) {
      return '-';
    }
  };

  // Parameter names mapping จากไฟล์ Excel
  const parameterNames = {
    0: "Room temp",
    1: "Coil temp",
    2: "Relay Status",
    3: "Fault Status",
    4: "Digital Input Status",
    5: "System Status",
    6: "Comp run Hr",
    7: "Comp R Phase CT",
    8: "Comp Y Phase CT",
    9: "Comp B Phase CT",
    10: "P2 (Maximum Setpoint)",
    11: "P3 (Minimum Setpoint)",
    12: "P4",
    13: "P5",
    14: "P6",
    15: "P7",
    16: "P8 (DEF Cycle)",
    17: "P9",
    18: "P10",
    19: "P11",
    20: "P12",
    21: "P13 (Set Stop DEF End Temp.)",
    22: "DI-D",
    23: "OPS",
    24: "QFD",
    25: "CND6",
    26: "CND7",
    27: "L1",
    28: "L2",
    29: "L3",
    30: "L4",
    31: "L5",
    32: "L7",
    33: "L8",
    34: "BUZ",
    35: "AL",
    36: "ADT",
    37: "ADD",
    38: "THD",
    39: "C-UL",
    40: "C-OL",
    41: "C2",
    42: "D0",
    43: "D1",
    44: "D2",
    45: "D3",
    46: "D4",
    47: "E1",
    48: "T-ON",
    49: "T-OFF",
    50: "E7",
    51: "E8",
    52: "LD",
    53: "LSD",
    54: "PDN",
    55: "CCRH",
    56: "LOCK",
    57: "PO",
    58: "PDIS",
    59: "FS",
    60: "Setpoint",
    61: "QFS",
    62: "Reserved"
  };

  // Unit mapping จากไฟล์ Excel
  const parameterUnits = {
    0: "°C",
    1: "°C",
    2: "-",
    3: "-",
    4: "-",
    5: "-",
    6: "hr(s)",
    7: "A.",
    8: "A.",
    9: "A.",
    10: "°C",
    11: "°C",
    12: "°C",
    13: "°C",
    14: "min(s)",
    15: "min(s)",
    16: "hr(s)",
    17: "min(s)",
    18: "-",
    19: "min(s)",
    20: "-",
    21: "°C",
    22: "-",
    23: "-",
    24: "hr(s)",
    25: "sec.",
    26: "-",
    27: "°C",
    28: "min(s)",
    29: "-",
    30: "°C",
    31: "°C",
    32: "-",
    33: "-",
    34: "-",
    35: "-",
    36: "min(s)",
    37: "sec.",
    38: "sec.",
    39: "A.",
    40: "A.",
    41: "sec.",
    42: "-",
    43: "-",
    44: "Volts",
    45: "sec.",
    46: "-",
    47: "-",
    48: "min(s)",
    49: "min(s)",
    50: "-",
    51: "min(s)",
    52: "min(s)",
    53: "-",
    54: "-",
    55: "-",
    56: "-",
    57: "-",
    58: "-",
    59: "-",
    60: "°C",
    61: "°C",
    62: "-"
  };

  // Scale mapping จากไฟล์ Excel (ถ้ามี scale = 10)
  const parameterScales = {
    0: 10,   // Room temp
    1: 10,   // Coil temp
    7: 10,   // Comp R Phase CT
    8: 10,   // Comp Y Phase CT
    9: 10,   // Comp B Phase CT
    10: 10,  // P2 (Maximum Setpoint)
    11: 10,  // P3 (Minimum Setpoint)
    12: 10,  // P4
    13: 10,  // P5
    21: 10,  // P13 (Set Stop DEF End Temp.)
    27: 10,  // L1
    30: 10,  // L4
    31: 10,  // L5
    39: 10,  // C-UL
    40: 10,  // C-OL
    60: 10,  // Setpoint
    61: 10   // QFS
  };

  // ฟังก์ชันคำนวณค่าจริงจาก signed value และ scale
  const calculateScaledValue = (signedValue, scale) => {
    if (signedValue === '-' || signedValue === null || signedValue === undefined) {
      return '-';
    }
    
    if (scale === 10) {
      // หาร 10 และแสดงทศนิยม 1 ตำแหน่ง
      return (signedValue / 10).toFixed(1);
    }
    
    return signedValue;
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🔌 SealCool MQTT Monitor</h1>
          <p className="domain">Domain: tfm.refritech.co.th</p>
        </header>

        {/* สถานะการเชื่อมต่อ Backend */}
        <div className={`status-card ${backendStatus.connected ? 'connected' : 'disconnected'}`}>
          <div className="status-header">
            <h2>🖥️ Backend Connection</h2>
            <span className={`status-badge ${backendStatus.connected ? 'success' : 'error'}`}>
              {backendStatus.connected ? '● เชื่อมต่อแล้ว' : '● ไม่ได้เชื่อมต่อ'}
            </span>
          </div>
          <div className="status-body">
            <p className="status-message">{backendStatus.message}</p>
            {backendStatus.data && (
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Server:</span>
                  <span className="value">{backendStatus.data.server}</span>
                </div>
                <div className="info-item">
                  <span className="label">Timestamp:</span>
                  <span className="value">{formatDate(backendStatus.data.timestamp)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MQTT Configuration Panel */}
        {backendStatus.connected && (
          <div className="config-panel">
            {!mqttStatus?.connected && (
              <button 
                className="config-toggle-btn"
                onClick={() => handleToggleConfig(!showConfig)}
              >
                {showConfig ? '✖ ปิด' : '⚙️ ตั้งค่า MQTT'}
              </button>
            )}

            {mqttStatus?.connected && (
              <button 
                className="disconnect-btn"
                onClick={handleDisconnect}
              >
                🔌 ตัดการเชื่อมต่อ MQTT
              </button>
            )}

            {showConfig && (
              <div className="config-form">
                <h3>🔧 ตั้งค่าการเชื่อมต่อ MQTT</h3>
                
                <div className="form-group">
                  <label>Protocol:</label>
                  <select 
                    value={mqttConfig.protocol}
                    onChange={(e) => setMqttConfig({...mqttConfig, protocol: e.target.value})}
                  >
                    <option value="mqtt">MQTT</option>
                    <option value="mqtts">MQTTS (SSL/TLS)</option>
                    <option value="ws">WebSocket</option>
                    <option value="wss">WSS (Secure WebSocket)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Broker:</label>
                  <input 
                    type="text"
                    value={mqttConfig.broker}
                    onChange={(e) => setMqttConfig({...mqttConfig, broker: e.target.value})}
                    placeholder="mqtt.example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Port:</label>
                  <input 
                    type="number"
                    value={mqttConfig.port}
                    onChange={(e) => setMqttConfig({...mqttConfig, port: e.target.value})}
                    placeholder="1883"
                  />
                </div>

                <div className="form-group">
                  <label>Username:</label>
                  <input 
                    type="text"
                    value={mqttConfig.username}
                    onChange={(e) => setMqttConfig({...mqttConfig, username: e.target.value})}
                    placeholder="username"
                  />
                </div>

                <div className="form-group">
                  <label>Password:</label>
                  <input 
                    type="password"
                    value={mqttConfig.password}
                    onChange={(e) => setMqttConfig({...mqttConfig, password: e.target.value})}
                    placeholder="password"
                  />
                </div>

                <button 
                  className="connect-btn"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? '⏳ กำลังเชื่อมต่อ...' : '🔌 เชื่อมต่อ'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* สถานะ MQTT Broker */}
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : mqttStatus ? (
          <div className={`status-card mqtt-card ${mqttStatus.connected ? 'connected' : 'disconnected'}`}>
            <div className="status-header">
              <h2>📡 MQTT Broker Status</h2>
              <span className={`status-badge ${mqttStatus.connected ? 'success' : 'error'}`}>
                {mqttStatus.connected ? '● Connected' : '● Disconnected'}
              </span>
            </div>
            <div className="status-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Broker:</span>
                  <span className="value">{mqttStatus.broker}</span>
                </div>
                <div className="info-item">
                  <span className="label">Username:</span>
                  <span className="value">{mqttStatus.username}</span>
                </div>
                <div className="info-item">
                  <span className="label">Last Connected:</span>
                  <span className="value">{formatDate(mqttStatus.lastConnected)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Uptime:</span>
                  <span className="value">
                    {mqttStatus.connected ? `${mqttStatus.uptime} seconds` : '-'}
                  </span>
                </div>
                {mqttStatus.reconnectAttempts > 0 && (
                  <div className="info-item">
                    <span className="label">Reconnect Attempts:</span>
                    <span className="value">{mqttStatus.reconnectAttempts}</span>
                  </div>
                )}
                {mqttStatus.error && (
                  <div className="info-item error-item">
                    <span className="label">Error:</span>
                    <span className="value error-text">{mqttStatus.error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="status-card disconnected">
            <p>ไม่สามารถดึงข้อมูล MQTT Broker ได้</p>
          </div>
        )}

        {/* MQTT Topic Subscription */}
        {mqttStatus?.connected && (
          <div className="mqtt-subscribe-panel">
            <h3>📥 Subscribe to MQTT Topic</h3>
            <div className="subscribe-form">
              <input 
                type="text"
                value={subscribeTopic}
                onChange={(e) => setSubscribeTopic(e.target.value)}
                placeholder="ระบุ topic (เช่น sensor/temperature)"
                onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <button onClick={handleSubscribe} disabled={!subscribeTopic}>
                Subscribe
              </button>
            </div>

            {mqttStatus.subscribedTopics && mqttStatus.subscribedTopics.length > 0 && (
              <div className="subscribed-topics">
                <p><strong>Topics ที่ติดตาม:</strong></p>
                <ul>
                  {mqttStatus.subscribedTopics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* MQTT Consolidated Data Display - All 63 values (0-62) */}
        {Object.keys(consolidatedData).length > 0 && (
          <div className="mqtt-messages-panel">
            <div className="messages-header">
              <h3>📊 MQTT Consolidated Data (All Values 0-62)</h3>
              <button onClick={clearMessages} className="clear-btn">
                🗑️ Clear
              </button>
            </div>
            <div className="consolidated-messages">
              {(() => {
                console.log('Rendering consolidatedData:', consolidatedData);
                return Object.entries(consolidatedData).map(([mac, data]) => {
                  console.log('Rendering MAC:', mac, 'Data:', data);
                  return (
                    <div key={mac} className="consolidated-item">
                      <div className="message-meta">
                        <span className="message-topic">
                          📍 {data.topic}
                          <span className="mac-badge"> MAC: {mac}</span>
                        </span>
                        <span className="message-time">{formatDate(data.timestamp)}</span>
                      </div>
                      
                      {/* ตารางแสดง 63 ค่า */}
                      <div className="values-table-container">
                        <table className="values-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Hexdata</th>
                              <th>Value</th>
                              <th>Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 63 }, (_, idx) => {
                              const value = data.values[idx];
                              const lastUpdate = data.lastUpdate[idx];
                              const isRecent = lastUpdate && (new Date() - new Date(lastUpdate) < 2000);
                              const signedValue = hexToSigned16(value);
                              const scale = parameterScales[idx];
                              const scaledValue = calculateScaledValue(signedValue, scale);
                              const paramName = parameterNames[idx] || `data${idx}`;
                              const unit = parameterUnits[idx] || '-';
                              
                              return (
                                <tr 
                                  key={idx}
                                  className={`${value ? 'has-value' : 'empty-value'} ${isRecent ? 'updated' : ''}`}
                                >
                                  <td className="param-cell">{paramName}</td>
                                  <td className="hexdata-cell">{value || '-'}</td>
                                  <td className="value-cell-signed">{scaledValue}</td>
                                  <td className="unit-cell">{unit}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* MQTT Messages Display - Grouped by MAC and Range */}
        {Object.keys(groupedMessages).length > 0 && (
          <div className="mqtt-messages-panel" style={{marginTop: '20px'}}>
            <div className="messages-header">
              <h3>📄 Raw Data (Grouped by Range) - Total: {Object.keys(groupedMessages).length} ranges</h3>
            </div>
            <div className="raw-data-section">
              {(() => {
                console.log('Rendering groupedMessages:', groupedMessages);
                return Object.entries(groupedMessages)
                  .sort(([keyA], [keyB]) => {
                    const [macA, typeA, rangeA] = keyA.split('###');
                    const [macB, typeB, rangeB] = keyB.split('###');
                    if (macA !== macB) return macA.localeCompare(macB);
                    if (typeA !== typeB) return typeA.localeCompare(typeB);
                    return rangeA.localeCompare(rangeB);
                  })
                  .map(([key, msg]) => {
                    const parsedData = msg.parsedData;
                    console.log('Rendering raw data row:', key, msg);
                    return (
                      <div key={key} className="raw-data-row">
                        <div className="raw-range-label">
                          {parsedData.type} [{parsedData.range}]:
                        </div>
                        <div className="raw-message-text">{msg.message}</div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        )}

        {/* Hidden old grouped view */}
        {Object.keys(groupedMessages).length > 0 && false && (
          <div className="mqtt-messages-panel">
            <div className="messages-header">
              <h3>📨 MQTT Data (Grouped & Updated Realtime)</h3>
              <button onClick={clearMessages} className="clear-btn">
                🗑️ Clear
              </button>
            </div>
            <div className="grouped-messages">
              {Object.entries(groupedMessages)
                .sort(([keyA], [keyB]) => {
                  // จัดเรียงตาม MAC และ range
                  const [macA, typeA, rangeA] = keyA.split('_');
                  const [macB, typeB, rangeB] = keyB.split('_');
                  if (macA !== macB) return macA.localeCompare(macB);
                  if (typeA !== typeB) return typeA.localeCompare(typeB);
                  return rangeA.localeCompare(rangeB);
                })
                .map(([key, msg]) => {
                  const mac = extractMAC(msg.topic);
                  const parsedData = msg.parsedData;
                  
                  return (
                    <div key={key} className="grouped-message-item">
                      <div className="message-meta">
                        <span className="message-topic">
                          📍 {msg.topic}
                          {mac && <span className="mac-badge"> MAC: {mac}</span>}
                        </span>
                        <span className="message-time">{formatDate(msg.timestamp)}</span>
                      </div>
                      
                      {/* แสดงข้อมูลดิบ */}
                      <div className="raw-data-compact">
                        <div className="raw-message">{msg.message}</div>
                      </div>
                      
                      {/* แสดงข้อมูลที่ parse แล้ว */}
                      {parsedData && (
                        <div className="parsed-data-compact">
                          <div className="data-header-compact">
                            <strong>{parsedData.type}</strong>
                            {parsedData.range && <span className="data-range"> [{parsedData.range}]</span>}
                          </div>
                          <div className="data-grid-compact">
                            {parsedData.data.map((item, idx) => (
                              <div key={idx} className="data-item-compact">
                                <span className="data-label-compact">{item.label}:</span>
                                <span className="data-value-compact">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* MQTT Messages Display - History (Hidden by default, for reference) */}
        {mqttMessages.length > 0 && false && (
          <div className="mqtt-messages-panel">
            <div className="messages-header">
              <h3>📨 MQTT Messages History</h3>
              <button onClick={clearMessages} className="clear-btn">
                🗑️ Clear
              </button>
            </div>
            <div className="messages-list">
              {mqttMessages.map((msg, index) => {
                const mac = extractMAC(msg.topic);
                const parsedData = parseMessage(msg.message);
                
                return (
                  <div key={index} className="message-item">
                    <div className="message-meta">
                      <span className="message-topic">
                        📍 {msg.topic}
                        {mac && <span className="mac-badge"> MAC: {mac}</span>}
                      </span>
                      <span className="message-time">{formatDate(msg.timestamp)}</span>
                    </div>
                    
                    {/* แสดงข้อมูลดิบ */}
                    <div className="raw-data">
                      <div className="raw-data-label">📄 Raw Data:</div>
                      <div className="message-content">{msg.message}</div>
                    </div>
                    
                    {/* แสดงข้อมูลที่ parse แล้ว */}
                    {parsedData && (
                      <div className="parsed-data">
                        <div className="data-header">
                          <strong>📊 {parsedData.type} from MAC: {parsedData.mac}</strong>
                          {parsedData.range && <span className="data-range"> [{parsedData.range}]</span>}
                        </div>
                        <div className="data-grid">
                          {parsedData.data.map((item, idx) => (
                            <div key={idx} className="data-row">
                              <span className="data-label">{item.label}:</span>
                              <span className="data-value">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ข้อมูลเพิ่มเติม */}
        <div className="footer-info">
          <p>🔄 อัพเดทล่าสุด: {lastUpdate ? formatDate(lastUpdate) : '-'}</p>
          <p className="update-note">ข้อมูลจะอัพเดทอัตโนมัติทุก 5 วินาที</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem' }}>
        <nav className="nav-links" style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
          <Link to="/devices">Devices</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/devices" element={<Devices />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;