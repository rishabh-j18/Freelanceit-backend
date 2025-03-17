const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  raised_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open' },
  blockchain_reference:{type:String},
  resolution: { type: String },
  resolved_at: { type: Date }
});

module.exports = mongoose.model('Dispute', disputeSchema);