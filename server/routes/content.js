const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Certificate = require('../models/Certificate');

const LIST_FIELDS = '-__v -createdAt';

// Everything the public site shows, in one request
router.get('/', async (req, res) => {
  try {
    const [profileDoc, projects, skills, certificates] = await Promise.all([
      Profile.findOne({ key: 'main' }).lean(),
      Project.find().select(LIST_FIELDS).sort({ order: 1, createdAt: 1 }).lean(),
      Skill.find().select(LIST_FIELDS).sort({ order: 1, createdAt: 1 }).lean(),
      Certificate.find().select(LIST_FIELDS).sort({ order: 1, createdAt: 1 }).lean(),
    ]);
    // revalidate every time (cheap 304s via ETag) so edits from the admin show up immediately
    res.set('Cache-Control', 'no-cache');
    res.json({
      // false until content has been imported/saved from the admin page
      initialized: Boolean(profileDoc),
      updatedAt: profileDoc?.updatedAt ?? null,
      profile: profileDoc?.data ?? null,
      projects,
      skills,
      certificates,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
