const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  issuer: { type: String, default: '', maxlength: 120 },
  date: { type: String, default: '', maxlength: 60 },
  link: { type: String, default: '' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
