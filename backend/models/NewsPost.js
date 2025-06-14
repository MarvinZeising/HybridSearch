const mongoose = require('mongoose');

module.exports = mongoose.model('Post', new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
}));
