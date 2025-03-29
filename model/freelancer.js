const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  bio: { type: String, required: true },
  hourly_rate: { type: Number, required: true }, // Made required
  skills: { type: [String], required: true },
  education: [
    {
      institution: String,
      degree: String,
      year: Number
    }
  ],
  certifications: [
    {
      name: String,
      issuer: String,
      date: Date
    }
  ],
  work_history: [
    {
      title: String,
      company: String,
      start_date: Date,
      end_date: Date,
      description: String
    }
  ],
  portfolio_items: [
    {
      title: String,
      description: String,
      image_url: String,
      link: String
    }
  ],
  languages: [String],
  availability: String,
  verification_status: {
    identity: Boolean,
    skills: [String]
  },
  profile_photo: { type: String }, // Added for profile picture URL
  created_at: { type: Date, default: Date.now }
});

freelancerSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Freelancer', freelancerSchema);