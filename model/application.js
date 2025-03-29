const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Freelancer', required: true },
  proposal: { type: String, required: true },
  bid_amount: { type: Number }, // Kept optional as in original
  cover_letter: { type: String, default: '' }, // Added
  attachments: { type: [String], default: [] }, // Added for file URLs
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  applied_at: { type: Date, default: Date.now }
});

applicationSchema.index({ project_id: 1, freelancer_id: 1 });

module.exports = mongoose.model('Application', applicationSchema);