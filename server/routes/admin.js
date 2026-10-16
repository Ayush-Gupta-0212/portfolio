const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Certificate = require('../models/Certificate');
const Media = require('../models/Media');
const { requireDb } = require('../config/db');
const auth = require('../lib/auth');
const clean = require('../lib/sanitize');

const MAX_ITEMS = 100;
const MAX_UPLOAD = '5mb';

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = err instanceof clean.ValidationError || err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

/* ── Session ── */

// Lets the admin page explain what's missing instead of failing mysteriously
router.get('/status', (req, res) => {
  res.json({ configured: auth.isConfigured() });
});

router.post('/login', auth.loginThrottle, (req, res) => {
  if (!auth.isConfigured()) {
    return res.status(503).json({ message: 'Admin is not configured. Set ADMIN_PASSWORD on the server.' });
  }
  if (!auth.passwordMatches(req.body?.password)) {
    auth.recordFailure(req.ip);
    return res.status(401).json({ message: 'Wrong password.' });
  }
  auth.clearFailures(req.ip);
  res.json(auth.issueToken());
});

router.get('/session', auth.requireAuth, (req, res) => res.json({ ok: true }));

/* ── Content ── */

router.put('/profile', auth.requireAuth, requireDb, handle(async (req, res) => {
  const data = clean.profile(req.body);
  const doc = await Profile.findOneAndUpdate(
    { key: 'main' },
    { $set: { data } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  res.json({ profile: doc.data, updatedAt: doc.updatedAt });
}));

/*
 * Replace a whole ordered list: existing items (by _id) are updated, new ones
 * created, anything missing is deleted, and array position becomes `order`.
 */
const replaceList = async (Model, items, cleanItem) => {
  if (!Array.isArray(items)) throw new clean.ValidationError('Expected a list');
  if (items.length > MAX_ITEMS) throw new clean.ValidationError(`At most ${MAX_ITEMS} items`);
  const cleaned = items.map((item) => ({ id: item?._id, data: cleanItem(item) })); // validate all before writing

  const keep = [];
  for (const [order, { id, data }] of cleaned.entries()) {
    if (id && mongoose.isValidObjectId(id)) {
      const updated = await Model.findByIdAndUpdate(id, { $set: { ...data, order } }, { new: true, runValidators: true });
      if (updated) { keep.push(updated._id); continue; }
    }
    const created = await Model.create({ ...data, order });
    keep.push(created._id);
  }
  await Model.deleteMany({ _id: { $nin: keep } });
  return Model.find().select('-__v').sort({ order: 1 }).lean();
};

const listRoute = (Model, cleanItem) => handle(async (req, res) => {
  res.json({ items: await replaceList(Model, req.body, cleanItem) });
});

router.put('/projects', auth.requireAuth, requireDb, listRoute(Project, clean.project));
router.put('/skills', auth.requireAuth, requireDb, listRoute(Skill, clean.skill));
router.put('/certificates', auth.requireAuth, requireDb, listRoute(Certificate, clean.certificate));

/* ── Media ── */

router.get('/media', auth.requireAuth, requireDb, handle(async (req, res) => {
  const items = await Media.find().select('-data -__v').sort({ createdAt: -1 }).lean();
  res.json({ items: items.map((m) => ({ ...m, url: `/api/media/${m._id}` })) });
}));

router.post(
  '/media',
  auth.requireAuth,
  requireDb,
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: MAX_UPLOAD }),
  handle(async (req, res) => {
    const contentType = clean.sniffImage(req.body);
    if (!contentType) throw new clean.ValidationError('Upload a WebP, PNG, JPEG or GIF image.');
    const media = await Media.create({
      data: req.body,
      contentType,
      size: req.body.length,
      name: clean.str(req.get('x-file-name') || '', 120),
    });
    res.status(201).json({ _id: media._id, url: `/api/media/${media._id}`, size: media.size, contentType });
  }),
);

router.delete('/media/:id', auth.requireAuth, requireDb, handle(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  await Media.findByIdAndDelete(req.params.id);
  res.status(204).end();
}));

module.exports = router;
