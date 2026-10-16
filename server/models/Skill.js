const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 80 },
  // free-form so new categories can be created from the admin page
  category: { type: String, required: true, maxlength: 60 },
  level: { type: Number, min: 0, max: 100, default: 80 },
  icon: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Skill', skillSchema);
