const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const Contact = require('../models/Contact');
const { requireAuth } = require('../lib/auth');
const { str } = require('../lib/sanitize');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Public form: a handful of messages per visitor is plenty
const sendLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many messages — please try again in a few minutes.' },
});

// POST contact message (also stored for the admin inbox)
router.post('/', sendLimit, async (req, res) => {
  // Honeypot: bots fill the hidden field; pretend it worked and drop it
  if (req.body?.botcheck) return res.status(201).json({ message: 'Message received!' });

  const name = str(req.body?.name, 100);
  const email = str(req.body?.email, 200);
  const message = str(req.body?.message, 5000);
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.status(201).json({ message: 'Message received! I will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all messages — admin session required (same login as the admin page)
router.get('/', requireAuth, async (req, res) => {
  try {
    const messages = await Contact.find().select('-__v').sort({ createdAt: -1 }).limit(500).lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a message read / unread
router.patch('/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  try {
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: { read: req.body?.read === true } },
      { new: true },
    ).select('-__v').lean();
    if (!message) return res.status(404).json({ message: 'Not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
