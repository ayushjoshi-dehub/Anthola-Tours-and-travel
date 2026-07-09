const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    ownerName: { type: String, trim: true, default: '' },
    panNumber: { type: String, trim: true, default: '' },
    businessRegistrationNumber: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, required: true },
    username: { type: String, trim: true, required: true, unique: true, index: true },
    email: { type: String, trim: true, required: true, unique: true, index: true },
    passwordHash: { type: String },
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    role: { type: String, enum: ['PASSENGER', 'BUS_OWNER'], default: 'PASSENGER' },
    isBlocked: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

UserSchema.methods.publicProfile = function () {
  return {
    id: this._id.toString(),
    name: this.name || this.companyName || this.username,
    fullName: this.name || '',
    companyName: this.companyName || '',
    ownerName: this.ownerName || '',
    panNumber: this.panNumber || '',
    businessRegistrationNumber: this.businessRegistrationNumber || '',
    address: this.address || '',
    username: this.username,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isBlocked: this.isBlocked,
    firebaseUid: this.firebaseUid || '',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', UserSchema);
