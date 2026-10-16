const mongoose = require('mongoose');

// Singleton document holding all non-list site copy (hero, about, contact, links…)
const profileSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('Profile', profileSchema);
