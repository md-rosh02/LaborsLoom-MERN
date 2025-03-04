// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  payment: { type: Number, required: true },
  date: { type: Date, required: true },
  contractorId: { type: String, required: true },
  contractorName: { type: String, required: true },
  contractorUsername: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);