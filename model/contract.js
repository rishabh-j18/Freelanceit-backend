const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Freelancer', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  smart_contract_address:{type:String},
  terms: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'terminated'], default: 'active' },
  milestones: [
    {
      description: { type: String, required: true },
      due_date: { type: Date, required: true },
      payment_amount: { type: Number, required: true },
      status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'approved'], default: 'not_started' }
    }
  ]
});

module.exports = mongoose.model('Contract', contractSchema);