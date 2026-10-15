const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST contact message
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.status(201).json({ message: 'Message received! I will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin-only: disabled unless ADMIN_TOKEN is set, and then the request must
// send it in the `x-admin-token` header. Anything else looks like a 404.
const requireAdmin = (req, res, next) => {
  const expected = process.env.ADMIN_TOKEN;
  const given = req.get('x-admin-token') || '';
  const ok = expected
    && given.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return res.status(404).json({ message: 'Not found' });
  next();
};

// GET all messages (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
