const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  message_text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  is_read: { type: Boolean, default: false }
});

messageSchema.index({ sender_id: 1, receiver_id: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);