const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  name: { type: String, required: true },
  company_name: { type: String, required: true },
  industry: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

clientSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);