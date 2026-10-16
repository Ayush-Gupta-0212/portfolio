const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Media = require('../models/Media');

// Public: serve an uploaded image. IDs are unique per upload, so cache forever.
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
  try {
    // hydrated (not lean) so `data` is a real Node Buffer of exactly the image bytes
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).end();
    res.set({
      'Content-Type': media.contentType,
      'Content-Length': media.data.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(media.data);
  } catch {
    res.status(500).end();
  }
});

module.exports = router;
