const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

function normalizeRole(role) {
  const value = String(role || 'PASSENGER').trim().toUpperCase();
  return value === 'BUS_OWNER' ? 'BUS_OWNER' : 'PASSENGER';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(user, token, req) {
  const expiresAt = new Date(Date.now() + refreshTtlMs());
  const familyId = crypto.randomUUID();
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    familyId,
    expiresAt,
    createdByIp: req.ip || ''
  });
  return { familyId, expiresAt };
}

function refreshTtlMs() {
  const ttl = String(process.env.REFRESH_TOKEN_TTL || '7d').toLowerCase();
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * (multipliers[unit] || multipliers.d);
}

function buildUsername({ companyName, ownerName, fullName, email, phone }) {
  const base = slugify(companyName || ownerName || fullName || email || phone || 'user');
  return base || `user-${Date.now()}`;
}

async function signup(req, res) {
  try {
    const body = req.body || {};
    const { email: inputEmail, password, role } = body;

    if (!inputEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const email = normalizeEmail(inputEmail);
    const normalizedRole = normalizeRole(role);

    let payload;
    if (normalizedRole === 'BUS_OWNER') {
      const companyName = String(body.companyName || '').trim();
      const ownerName = String(body.ownerName || '').trim();
      const phone = String(body.phone || '').trim();
      const panNumber = String(body.panNumber || '').trim();
      const businessRegistrationNumber = String(body.businessRegistrationNumber || '').trim();
      const address = String(body.address || '').trim();
      if (!companyName || !ownerName || !phone || !panNumber || !businessRegistrationNumber || !address) {
        return res.status(400).json({ message: 'All bus owner registration fields are required' });
      }
      payload = {
        name: companyName,
        companyName,
        ownerName,
        email,
        phone,
        panNumber,
        businessRegistrationNumber,
        address
      };
    } else {
      const fullName = String(body.fullName || body.name || '').trim();
      const phone = String(body.phone || '').trim();
      if (!fullName || !phone) {
        return res.status(400).json({ message: 'Full name and phone number are required' });
      }
      payload = { name: fullName, email, phone };
    }

    // Check if user already exists
    let user = await User.findOne({
      email: new RegExp(`^${escapeRegex(email)}$`, 'i')
    });

    if (user) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const username = String(body.username || buildUsername({
      companyName: payload.companyName,
      ownerName: payload.ownerName,
      fullName: payload.name,
      email: payload.email,
      phone: payload.phone
    })).trim().toLowerCase();

    const passwordHash = await bcrypt.hash(password, 12);

    user = await User.create({
      ...payload,
      username,
      passwordHash,
      role: normalizedRole
    });

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return res.status(201).json({
      token,
      refreshToken,
      user: user.publicProfile()
    });
  } catch (error) {
    console.error('[auth controller] signup failed:', error.message);
    return res.status(500).json({ message: 'Signup failed', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
}

async function login(req, res) {
  try {
    const { email: inputEmail, password } = req.body || {};

    if (!inputEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const email = normalizeEmail(inputEmail);

    let user = await User.findOne({
      email: new RegExp(`^${escapeRegex(email)}$`, 'i')
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(401).json({ message: 'User account is blocked' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return res.json({
      token,
      refreshToken,
      user: user.publicProfile()
    });
  } catch (error) {
    console.error('[auth controller] login failed:', error.message);
    return res.status(500).json({ message: 'Login failed', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    return res.json({
      token,
      refreshToken: newRefreshToken,
      user: user.publicProfile()
    });
  } catch (error) {
    console.error('[auth] refresh failed:', error.message);
    return res.status(500).json({ message: 'Refresh failed' });
  }
}

async function logout(req, res) {
  return res.json({ ok: true });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: user.publicProfile() });
}

async function forgotPassword(req, res) {
  let token;
  try {
    const { email, username, phone } = req.body || {};
    const identity = String(email || username || phone || '').trim();
    if (!identity) return res.status(400).json({ message: 'Email or username is required' });

    const user = await User.findOne({
      $or: [
        { email: new RegExp(`^${escapeRegex(identity)}$`, 'i') },
        { username: new RegExp(`^${escapeRegex(identity)}$`, 'i') },
        { phone: identity }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    token = crypto.randomBytes(20).toString('hex');
    
    // Use updateOne to avoid validation issues on other fields
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: token,
        resetPasswordExpire: Date.now() + 3600000
      }
    );

    if (!process.env.SMTP_USER) {
      return res.json({ message: 'Reset email sent', token });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset',
      html: `<p>You requested a password reset</p>
             <p>Click <a href="${resetUrl}">here</a> to reset your password</p>
             <p>This link expires in 1 hour.</p>`
    });

    return res.json({ message: 'Reset email sent' });
  } catch (error) {
    console.error('[auth] forgot-password failed:', error.message);
    console.error('[auth] error details:', error);
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        message: 'Reset email could not be sent, but the reset token was created for local testing.',
        token,
        error: error.message
      });
    }
    return res.status(500).json({ message: 'Password reset failed' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body || {};

    if (!password || password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Use updateOne to avoid validation issues on other fields
    await User.updateOne(
      { _id: user._id },
      {
        passwordHash,
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined
      }
    );

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('[auth] reset-password failed:', error.message);
    console.error('[auth] error details:', error);
    return res.status(500).json({ message: 'Password reset failed', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  normalizeRole,
  normalizeEmail
};
