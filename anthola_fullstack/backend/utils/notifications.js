const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

async function createNotification({ userId = null, role = null, type, title, message, payload = {}, io }) {
  const notification = await Notification.create({
    userId,
    role,
    type,
    title,
    message,
    payload
  });

  if (io) {
    if (userId) io.to(`user:${String(userId)}`).emit('notification:new', notification.toObject());
    if (role) io.to(`role:${String(role)}`).emit('notification:new', notification.toObject());
  }

  return notification;
}

async function logActivity({ actorId = null, actorRole = null, action, entityType = '', entityId = '', summary, metadata = {}, io }) {
  const log = await ActivityLog.create({
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    summary,
    metadata
  });

  if (io) {
    io.to('role:BUS_OWNER').emit('activity:new', log.toObject());
    if (actorId) io.to(`user:${String(actorId)}`).emit('activity:new', log.toObject());
  }

  return log;
}

async function collectRecipientIdsByRole(role) {
  const users = await User.find({ role: String(role).toUpperCase() }).select('_id').lean();
  return users.map((user) => String(user._id));
}

module.exports = {
  createNotification,
  logActivity,
  collectRecipientIdsByRole
};
