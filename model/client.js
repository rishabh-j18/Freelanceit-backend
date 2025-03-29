const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  company_name: { type: String, required: true },
  industry: { type: String, required: true },
  company_description: { type: String, default: '' }, // Added
  location: { type: String, default: '' }, // Added
  website: { type: String, default: '' }, // Added
  verification_status: { // Added
    payment_method: { type: Boolean, default: false }
  },
  created_at: { type: Date, default: Date.now }
});

clientSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);