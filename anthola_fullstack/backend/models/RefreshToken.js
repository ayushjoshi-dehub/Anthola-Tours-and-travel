const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    createdByIp: { type: String, default: '' },
    replacedByTokenHash: { type: String, default: '' }
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
