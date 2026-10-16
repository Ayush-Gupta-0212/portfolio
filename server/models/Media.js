const mongoose = require('mongoose');

// Uploaded images live in MongoDB: Render's free disk is wiped on every restart.
// The admin page converts uploads to WebP in the browser, so they stay small.
const mediaSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
