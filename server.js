import express from 'express';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import indexRouter from './routes/index.js';
import manageRouter from './routes/manage.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.WS_ORIGIN || "http://localhost:2052",
        methods: ["GET", "POST"]
    }
});

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Security headers - suppress Chrome DevTools CSP warnings
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss:; connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* http://scbackend.refritech.co.th https://scbackend.refritech.co.th ws://scbackend.refritech.co.th wss://scbackend.refritech.co.th https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com;");
    next();
});

// Routes
app.use('/', indexRouter);
app.use('/manage/devices', manageRouter);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error - SealCool Monitoring',
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
});