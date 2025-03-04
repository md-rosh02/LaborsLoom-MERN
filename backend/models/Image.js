const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  data: {
    type: String, // Base64 string
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add to your Image model
imageSchema.pre('remove', function(next) {
    // Add any additional cleanup here
    console.log(`Deleting image: ${this._id}`);
    next();
  });

module.exports = mongoose.model('Image', imageSchema);