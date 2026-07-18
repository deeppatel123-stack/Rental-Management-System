import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import enterpriseRoutes from './routes/enterpriseRoutes.js';

import errorHandler from './middleware/errorHandler.js';
import { initCronJob, setSocketIoInstance } from './services/cronService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});


setSocketIoInstance(io);


app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '../public')));


connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/enterprise', enterpriseRoutes);


app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', env: process.env.NODE_ENV, timestamp: new Date() });
});


app.use(errorHandler);


io.on('connection', (socket) => {
    console.log(`🔌 Client connected to websockets: ${socket.id}`);

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`👤 User joined private alert room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected from websockets: ${socket.id}`);
    });
});


initCronJob();

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error(`💡 FIX: Run this command to free the port:`);
        console.error(`   netstat -ano | findstr :${PORT}  →  then: taskkill /PID <PID> /F\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
