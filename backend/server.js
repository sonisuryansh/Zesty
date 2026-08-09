// Start Server with Authenticated Socket.IO Real-time Engine
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const connectDB = require('./src/db/db');
const securityConfig = require('./src/config/security.config');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: securityConfig.ALLOWED_ORIGINS,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];
    if (!token) {
        // Allow public/anonymous connections for tracking while populating auth flag
        socket.user = { authenticated: false };
        return next();
    }
    try {
        const decoded = jwt.verify(token, securityConfig.JWT.ACCESS_SECRET);
        socket.user = { authenticated: true, ...decoded };
        next();
    } catch (err) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zesty_super_secret_jwt_key_2026');
            socket.user = { authenticated: true, ...decoded };
            next();
        } catch (e) {
            socket.user = { authenticated: false };
            next();
        }
    }
});

// Socket.IO Connection & Events
io.on('connection', (socket) => {
    // Join order room for live tracking
    socket.on('join_order_room', (orderId) => {
        socket.join(`order_${orderId}`);
    });

    // Delivery Partner Live GPS location stream
    socket.on('update_live_location', (data) => {
        // data: { orderId, riderId, latitude, longitude }
        io.to(`order_${data.orderId}`).emit('rider_location_updated', {
            riderId: data.riderId,
            latitude: data.latitude,
            longitude: data.longitude,
            updatedAt: new Date()
        });
    });

    // Real-time Order status updates
    socket.on('update_order_status', (data) => {
        // data: { orderId, status }
        io.to(`order_${data.orderId}`).emit('order_status_changed', {
            orderId: data.orderId,
            status: data.status,
            updatedAt: new Date()
        });
    });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Zesty Enterprise Server running on port ${PORT}`);
    });
});
