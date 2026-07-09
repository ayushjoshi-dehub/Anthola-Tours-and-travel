const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', ContactSchema);
