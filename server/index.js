const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const http         = require('http');
const { Server }   = require('socket.io');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/error');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ─────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Customer joins their order room
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📦 Joined order room: order_${orderId}`);
  });

  // Restaurant joins their room
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`🏪 Joined restaurant room: restaurant_${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ──────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu',        require('./routes/menu'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/upload',      require('./routes/upload'));
const { router: pushRouter } = require('./routes/push');
app.use('/api/push',        pushRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'TableToken API is running 🚀' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});
