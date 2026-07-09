if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
require('./config/firebase');
const { seedRoutesIfEmpty } = require('./controllers/routes.controller');
const { seedTourPackagesIfEmpty } = require('./controllers/tours.controller');
const { writeUsersSheet, writeBookingsSheet, writePaymentsSheet } = require('./utils/sheets');
const SeatLock = require('./models/SeatLock');

function setupSockets(io) {
  io.on('connection', (socket) => {
    socket.on('authenticate', (payload = {}) => {
      if (payload.userId) socket.join(`user:${String(payload.userId)}`);
      if (payload.role) socket.join(`role:${String(payload.role)}`);
    });

    socket.on('join', (room) => {
      if (room) socket.join(String(room));
    });

    socket.on('leave', (room) => {
      if (room) socket.leave(String(room));
    });
  });
}

async function cleanupExpiredSeatLocks() {
  await SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });
}

async function start() {
  const port = Number(process.env.PORT || 5000);
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('[db] connected');

    await Promise.all([
      seedRoutesIfEmpty(),
      seedTourPackagesIfEmpty(),
      cleanupExpiredSeatLocks()
    ]);
    await Promise.all([
      writeUsersSheet(),
      writeBookingsSheet(),
      writePaymentsSheet()
    ]);

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
        credentials: true
      }
    });
    app.set('io', io);
    setupSockets(io);

    server.listen(port, () => {
      console.log(`[server] http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
