const Notification = require('../models/Notification');

async function listMine(req, res) {
  const q = {
    $or: [
      { userId: req.user.id },
      { role: req.user.role }
    ]
  };
  const notifications = await Notification.find(q).sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ notifications });
}

async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, $or: [{ userId: req.user.id }, { role: req.user.role }] },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification: notification.toObject() });
}

module.exports = { listMine, markRead };
