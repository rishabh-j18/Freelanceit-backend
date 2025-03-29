const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  milestone_index: { type: Number, required: true },
  amount: { type: Number, required: true },
  transaction_hash: { type: String, required: true },
  payment_date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'disputed'], default: 'pending' }
});

module.exports = mongoose.model('Payment', paymentSchema);