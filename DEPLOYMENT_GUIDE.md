# SealCool Frontend Deployment Guide (No Vite)

## 1. Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- Git

## 2. Clone the Repository
```sh
git clone https://github.com/napatpong/tfm_frontend.git
cd tfm_frontend
```

## 3. Install Dependencies
```sh
npm install
```

## 4. Environment Configuration
Edit `.env.production` with your production values:
```
API_URL=https://scbackend.refritech.co.th:2053
WS_URL=wss://scbackend.refritech.co.th:2053
DOMAIN=tfm.refritech.co.th
```
> **Note:** Remove the `VITE_` prefix if you are not using Vite. Update your code to use `process.env` or your chosen config loader.

## 5. Start the Frontend Server
```sh
npm start
```
Or use PM2 for process management:
```sh
pm install -g pm2
pm2 start ecosystem.config.cjs
```

## 6. Access the Application
- Open your browser and go to: `http://localhost:80` (or your configured port)

## 7. Directory Structure
- `src/` — React source code
- `public/` — Static assets (CSS, JS, images)
- `views/` — EJS templates for SSR
- `.env.production` — Environment variables
- `server.js` — Express server entry point

## 8. Useful Commands
- **Install dependencies:** `npm install`
- **Start server:** `npm start`
- **Restart with PM2:** `pm2 restart frontend`
- **View logs:** `pm2 logs frontend`

## 9. Notes
- Make sure your environment variables match your backend and domain setup.
- If you deploy to production, configure your reverse proxy (Nginx/Apache) to point to your Node.js server.
