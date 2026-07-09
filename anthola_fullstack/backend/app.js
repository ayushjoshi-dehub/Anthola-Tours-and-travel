const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const routesRoutes = require('./routes/routes.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const toursRoutes = require('./routes/tours.routes');
const paymentsRoutes = require('./routes/payments.routes');
const exportsRoutes = require('./routes/exports.routes');
const usersRoutes = require('./routes/users.routes');
const ownerRoutes = require('./routes/owner.routes');
const contactRoutes = require('./routes/contact.routes');
const seatsRoutes = require('./routes/seats.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const { rateLimit } = require('./middleware/rateLimit');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
  credentials: true
}));

app.use(rateLimit({ windowMs: 60_000, max: 200, keyPrefix: 'api' }));

app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/tours', toursRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const frontendDir = path.join(__dirname, '..', 'frontend');
const frontendDistDir = path.join(frontendDir, 'dist');
const uploadsDir = path.join(__dirname, 'uploads');

// Log frontend paths for debugging
console.log('[frontend] __dirname:', __dirname);
console.log('[frontend] frontendDir:', frontendDir);
console.log('[frontend] frontendDistDir:', frontendDistDir);
console.log('[frontend] dist exists?', fs.existsSync(frontendDistDir));

app.use(express.static(frontendDistDir));
app.use(express.static(frontendDir));
app.use('/uploads', express.static(uploadsDir));

// SPA fallback: Only serve index.html for routes, not static assets
app.get('*', (req, res) => {
  // Don't serve index.html for static file requests (js, css, etc.)
  if (req.path.match(/\.\w+$/)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const fallbackDir = fs.existsSync(frontendDistDir) ? frontendDistDir : frontendDir;
  res.sendFile(path.join(fallbackDir, 'index.html'));
});

module.exports = app;
