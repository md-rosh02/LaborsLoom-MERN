// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  fname: { type: String, required: true },
  age: { type: Number },
  location: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  profileImage: { type: String },
  role: { type: String },
});

module.exports = mongoose.model('User', userSchema);