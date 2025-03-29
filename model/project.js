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
  location: { type: String },
  experience_level: { type: String, default: 'Intermediate' }, // Added
  milestones: [ // Added
    {
      title: { type: String, required: true },
      description: { type: String, default: '' },
      due_date: { type: Date, required: true },
      amount: { type: Number, required: true }
    }
  ],
  payment_terms: { type: String, default: 'Fixed Price' }, // Added
  created_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null }
});

projectSchema.index({ client_id: 1, status: 1 });
projectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);