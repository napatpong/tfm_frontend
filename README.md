# SealCool Frontend# SealCool Frontend



## Overview

This is the frontend for the SealCool monitoring system. It uses React, EJS views, and an Express server. Vite is not used.

## OverviewFrontend application สำหรับแสดงสถานะ MQTT Broker แบบ Real-time

## Getting Started

This is the frontend for the SealCool monitoring system. It uses React, EJS views, and an Express server. Vite is not used.

### 1. Prerequisites

- Node.js (v18+ recommended)- 📊 แสดงสถานะ MQTT Broker แบบ Real-time

- npm (v9+ recommended)

- Git## Quick Start- 🔄 อัพเดทข้อมูลอัตโนมัติทุก 5 วินาที



### 2. Clone the Repository- ✅ แสดงสถานะการเชื่อมต่อกับ Backend

```sh

git clone https://github.com/napatpong/tfm_frontend.git### 1. Prerequisites- 📱 Responsive Design (รองรับทุกขนาดหน้าจอ)

cd tfm_frontend

```- Node.js (v18+ recommended)



### 3. Install Dependencies- npm (v9+ recommended)## การติดตั้ง

```sh

npm install- Git

```

```bash

### 4. Environment Configuration

Edit `.env.production` with your production values:### 2. Clone the Repository# ติดตั้ง dependencies

```

API_URL=https://scbackend.refritech.co.th:2053```shnpm install

WS_URL=wss://scbackend.refritech.co.th:2053

DOMAIN=tfm.refritech.co.thgit clone https://github.com/napatpong/tfm_frontend.git

```

> **Note:** Remove the `VITE_` prefix if you are not using Vite. Update your code to use `process.env` or your chosen config loader.cd tfm_frontend# หรือใช้ yarn



### 5. Start the Frontend Server```yarn install

```sh

npm start```

```

Or use PM2 for process management:### 3. Install Dependencies

```sh

pm install -g pm2```sh## การตั้งค่า

pm2 start ecosystem.config.cjs

```npm install



### 6. Access the Application```แก้ไขไฟล์ `.env` ตามความต้องการ:

- Open your browser and go to: `http://localhost:80` (or your configured port)



## Directory Structure

- `src/` — React source code### 4. Environment Configuration```env

- `public/` — Static assets (CSS, JS, images)

- `views/` — EJS templates for SSREdit `.env.production` with your production values:VITE_API_URL=http://localhost:2052

- `.env.production` — Environment variables

- `server.js` — Express server entry point```VITE_WS_URL=ws://localhost:2052



## Useful CommandsAPI_URL=https://scbackend.refritech.co.th:2053VITE_DOMAIN=tfm.refritech.co.th

- **Install dependencies:** `npm install`

- **Start server:** `npm start`WS_URL=wss://scbackend.refritech.co.th:2053```

- **Restart with PM2:** `pm2 restart frontend`

- **View logs:** `pm2 logs frontend`DOMAIN=tfm.refritech.co.th



## Notes```## การรัน

- Make sure your environment variables match your backend and domain setup.

- For production, configure your reverse proxy (Nginx/Apache) to point to your Node.js server.> **Note:** Remove the `VITE_` prefix if you are not using Vite. Update your code to use `process.env` or your chosen config loader.


```bash

### 5. Start the Frontend Server# Development mode

```shnpm run dev

npm start

```# Build สำหรับ Production

Or use PM2 for process management:

```sh# Preview build

pm install -g pm2## คุณสมบัติหน้าจอ

pm2 start ecosystem.config.cjs

```

### 2. MQTT Broker Status

### 6. Access the Application- Broker URL

- Open your browser and go to: `http://localhost:80` (or your configured port)- Username

- เวลาที่เชื่อมต่อล่าสุด

## Directory Structure- Uptime

- `src/` — React source code- จำนวนครั้งที่พยายามเชื่อมต่อใหม่

- `public/` — Static assets (CSS, JS, images)- ข้อความ Error (ถ้ามี)

- `views/` — EJS templates for SSR

- `.env.production` — Environment variables### 3. Auto Refresh

- `server.js` — Express server entry point- ข้อมูลจะอัพเดทอัตโนมัติทุก 5 วินาที

- แสดงเวลาอัพเดทล่าสุด

## Useful Commands

- **Install dependencies:** `npm install`## การเชื่อมต่อกับ Backend

- **Start server:** `npm start`

- **Restart with PM2:** `pm2 restart frontend`Frontend จะเรียก API endpoints ต่อไปนี้:

- **View logs:** `pm2 logs frontend`

```javascript

## Notes// Test Connection

- Make sure your environment variables match your backend and domain setup.GET /api/test

- For production, configure your reverse proxy (Nginx/Apache) to point to your Node.js server.

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
