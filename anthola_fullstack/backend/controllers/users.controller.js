const User = require('../models/User');
const Booking = require('../models/Booking');
const { writeUsersSheet } = require('../utils/sheets');

async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 }).limit(200).lean();
  const counts = await Booking.aggregate([
    { $group: { _id: '$userId', bookingsCount: { $sum: 1 } } }
  ]);
  const bookingCounts = new Map(counts.map((row) => [String(row._id || ''), row.bookingsCount || 0]));
  return res.json({
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name || u.username,
      email: u.email,
      phone: u.phone,
      bookingsCount: bookingCounts.get(String(u._id)) || 0,
      registrationDate: u.createdAt,
      role: u.role,
      isBlocked: u.isBlocked
    }))
  });
}

async function setBlocked(req, res) {
  const id = req.params.id;
  const { isBlocked } = req.body || {};
  const user = await User.findByIdAndUpdate(id, { $set: { isBlocked: !!isBlocked } }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await writeUsersSheet();
  return res.json({ user: user.publicProfile() });
}

module.exports = { listUsers, setBlocked };
