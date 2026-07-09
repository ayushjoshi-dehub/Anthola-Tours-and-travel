const admin = require('../config/firebase');
const User = require('../models/User');

function parseToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function optionalAuth(req, _res, next) {
  const token = parseToken(req);
  if (!token) return next();
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken && decodedToken.email) {
      const user = await User.findOne({ email: decodedToken.email.toLowerCase() });
      if (user && !user.isBlocked) {
        req.user = {
          id: user._id.toString(),
          username: user.username,
          role: user.role
        };
      }
    }
  } catch (err) {
    // ignore
  }
  return next();
}

async function requireAuth(req, res, next) {
  const token = parseToken(req);
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken || !decodedToken.email) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    const user = await User.findOne({ email: decodedToken.email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'User profile not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: 'User is blocked' });
    }
    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role
    };
    return next();
  } catch (err) {
    console.error('[auth] requireAuth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireBusOwner(req, res, next) {
  if (!req.user || req.user.role !== 'BUS_OWNER') {
    return res.status(403).json({ message: 'Bus owner access only' });
  }
  return next();
}

function requirePassenger(req, res, next) {
  if (!req.user || req.user.role !== 'PASSENGER') {
    return res.status(403).json({ message: 'Passenger access only' });
  }
  return next();
}

function requireAnyRole(...roles) {
  const allowed = new Set(roles.map((role) => String(role || '').trim().toUpperCase()));
  return (req, res, next) => {
    if (!req.user || !allowed.has(String(req.user.role || '').toUpperCase())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    return next();
  };
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireBusOwner,
  requirePassenger,
  requireOwner: requireBusOwner,
  requireAdmin: requireBusOwner,
  requireAnyRole
};
