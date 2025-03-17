const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, default:""},
  password_hash: { type: String, required: true, default:"" },
  wallet_address:{type:String},
  role: { type: String, enum: ['freelancer', 'client', 'admin'], required: true },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);