const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  name: { type: String, required: true },
  bio: { type: String, required: true },
  hourly_rate: { type: Number },
  portfolio: { type: [String], required: true },
  skills: { type: [String], required: true },
  created_at: { type: Date, default: Date.now }
});

freelancerSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Freelancer', freelancerSchema);