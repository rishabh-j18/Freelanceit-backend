const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contractSchema = new Schema({
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancer_id: { type: Schema.Types.ObjectId, ref: 'Freelancer', required: true },
  client_id: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  status: { 
    type: String, 
    enum: ['pending_tc', 'under_review', 'agreed', 'pending_payment', 'active', 'completed', 'terminated'], 
    default: 'pending_tc' 
  },
  terms_and_conditions: { type: String, default: '' }, // Stores the T&Cs text
  tc_status: { 
    type: String, 
    enum: ['draft', 'under_review', 'agreed', 'rejected'], 
    default: 'draft' 
  },
  tc_history: [{ 
    terms: String, 
    timestamp: { type: Date, default: Date.now }, 
    action: String, 
    comments: String 
  }], // Tracks T&Cs revisions (optional)
  created_at: { type: Date, default: Date.now }
});

const Contract = mongoose.model('Contract', contractSchema);
module.exports = Contract;