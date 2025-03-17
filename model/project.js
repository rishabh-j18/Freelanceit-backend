const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  categories: [String],
  required_skills: [String],
  created_at: { type: Date, default: Date.now }
});

projectSchema.index({ client_id: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);