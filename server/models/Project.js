const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  tags: [{ type: String }],
  image: { type: String },
  github: { type: String },
  live: { type: String },
  featured: { type: Boolean, default: false },
  year: { type: Number },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
