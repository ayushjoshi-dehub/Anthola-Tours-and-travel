const Contact = require('../models/Contact');

async function createMessage(req, res) {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ message: 'name, email, message are required' });

  const doc = await Contact.create({ name: String(name).trim(), email: String(email).trim(), message: String(message).trim() });
  return res.status(201).json({ message: 'ok', contact: doc.toObject() });
}

async function listMessages(req, res) {
  const msgs = await Contact.find({}).sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ messages: msgs });
}

async function resolveMessage(req, res) {
  const id = req.params.id;
  const doc = await Contact.findByIdAndUpdate(id, { $set: { status: 'RESOLVED' } }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Message not found' });
  return res.json({ message: 'ok', contact: doc.toObject() });
}

module.exports = { createMessage, listMessages, resolveMessage };
