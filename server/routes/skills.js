const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');

// GET all skills grouped by category
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().sort({ category: 1, level: -1 });
    // Group by category
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});
    res.json({ all: skills, grouped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
