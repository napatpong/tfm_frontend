# SealCool Frontend

Frontend application สำหรับแสดงสถานะ MQTT Broker แบบ Real-time

## คุณสมบัติ

- 🎨 UI สวยงาม ใช้งานง่าย
- 📊 แสดงสถานะ MQTT Broker แบบ Real-time
- 🔄 อัพเดทข้อมูลอัตโนมัติทุก 5 วินาที
- ✅ แสดงสถานะการเชื่อมต่อกับ Backend
- 📱 Responsive Design (รองรับทุกขนาดหน้าจอ)

## การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# หรือใช้ yarn
yarn install
```

## การตั้งค่า

แก้ไขไฟล์ `.env` ตามความต้องการ:

```env
VITE_API_URL=http://localhost:2052
VITE_WS_URL=ws://localhost:2052
VITE_DOMAIN=tfm.refritech.co.th
```

## การรัน

```bash
# Development mode
npm run dev

# Build สำหรับ Production
npm run build

# Preview build
npm run preview
```

Frontend จะทำงานที่: http://localhost:3000

## คุณสมบัติหน้าจอ

### 1. Backend Connection Status
แสดงสถานะการเชื่อมต่อกับ Backend API:
- ✅ เชื่อมต่อแล้ว (สีเขียว)
- ❌ ไม่ได้เชื่อมต่อ (สีแดง)

### 2. MQTT Broker Status
แสดงข้อมูล MQTT Broker:
- สถานะการเชื่อมต่อ (Connected/Disconnected)
- Broker URL
- Username
- เวลาที่เชื่อมต่อล่าสุด
- Uptime
- จำนวนครั้งที่พยายามเชื่อมต่อใหม่
- ข้อความ Error (ถ้ามี)

### 3. Auto Refresh
- ข้อมูลจะอัพเดทอัตโนมัติทุก 5 วินาที
- แสดงเวลาอัพเดทล่าสุด

## การเชื่อมต่อกับ Backend

Frontend จะเรียก API endpoints ต่อไปนี้:

```javascript
// Test Connection
GET /api/test

// Get MQTT Status
GET /api/mqtt/status

// Health Check
GET /api/health
```

## โครงสร้างโปรเจค

```
sealcool_frontend/
├── src/
│   ├── services/
│   │   └── api.js           # API Client
│   ├── App.jsx              # Main Component
│   ├── App.css              # Styles
│   ├── main.jsx             # Entry Point
│   └── index.css            # Global Styles
├── public/
├── .env                     # Environment Variables
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## การ Build สำหรับ Production

```bash
# Build
npm run build

# ไฟล์ที่ build จะอยู่ในโฟลเดอร์ dist/
# นำไฟล์ใน dist/ ไป deploy บน web server
```

## ตัวอย่างการ Deploy

### ใช้กับ Nginx

```nginx
server {
    listen 80;
    server_name tfm.refritech.co.th;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### ใช้กับ Apache

```apache
<VirtualHost *:80>
    ServerName tfm.refritech.co.th
    DocumentRoot /path/to/dist
    
    <Directory /path/to/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## หมายเหตุ

- ต้องแน่ใจว่า Backend ทำงานก่อนที่จะเปิด Frontend
- สำหรับ Production ควรเปลี่ยน API URL เป็น domain จริง
- ตรวจสอบ CORS settings ใน Backend ให้ถูกต้อง
