const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['Languages', 'Frameworks', 'Tools', 'Databases', 'Design', 'CS Fundamentals'] },
  level: { type: Number, min: 0, max: 100, default: 80 },
  icon: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Skill', skillSchema);
