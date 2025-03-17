const mongoose=require('mongoose');
const NonceSchema = new mongoose.Schema({
    wallet_address: String,
    nonce: String,
    created_at: { type: Date, default: Date.now, expires: 300 } // 300 seconds = 5 minutes
  });
const Nonce = mongoose.model('Nonce', NonceSchema);

module.exports=Nonce;