const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  file_path: { type: String, required: true },
  upload_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);