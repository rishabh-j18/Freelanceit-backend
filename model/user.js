const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, default: null },
  password_hash: { type: String, default: null },
  wallet_address: { type: String, default: null },
  role: { type: String, enum: ['freelancer', 'client', 'admin'], required: true },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date },
  verification_token: { type: String }
});

userSchema.pre('save', function (next) {
  const hasEmailAndPassword = this.email && this.password_hash;
  const hasWallet = this.wallet_address;

  if (!hasEmailAndPassword && !hasWallet) {
    return next(new Error('User must provide either email/password or wallet address'));
  }
  next();
});

userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);