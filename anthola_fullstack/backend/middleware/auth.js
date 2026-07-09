const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const User = require('../models/User');

function parseToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

async function resolveFromJwt(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    const user = await User.findById(decoded.id);
    if (!user) return null;
    if (user.isBlocked) return { blocked: true };
    return {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      email: user.email
    };
  } catch (_) {
    return null;
  }
}

async function resolveFromFirebase(token) {
  try {
    if (!admin.auth) return null;
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded || !decoded.email) return null;
    const user = await User.findOne({ email: decoded.email.toLowerCase() });
    if (!user) return null;
    if (user.isBlocked) return { blocked: true };
    return {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      email: user.email
    };
  } catch (_) {
    return null;
  }
}

// Primary auth is the app-issued JWT. Firebase ID tokens are an optional fallback.
async function authenticate(req) {
  const token = parseToken(req);
  if (!token) return null;
  const jwtUser = await resolveFromJwt(token);
  if (jwtUser) return jwtUser;
  const fbUser = await resolveFromFirebase(token);
  if (fbUser) return fbUser;
  return null;
}

async function optionalAuth(req, _res, next) {
  try {
    const user = await authenticate(req);
    if (user && !user.blocked) req.user = user;
  } catch (_) {
    // ignore
  }
  return next();
}

async function requireAuth(req, res, next) {
  const user = await authenticate(req);
  if (!user) return res.status(401).json({ message: 'Missing or invalid token' });
  if (user.blocked) return res.status(403).json({ message: 'User is blocked' });
  req.user = user;
  return next();
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
