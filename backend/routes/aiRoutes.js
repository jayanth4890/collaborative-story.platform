const express = require('express');
const router = express.Router();
const {
  suggestNextParagraph,
  generatePlotTwist,
  improveWriting,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All AI routes require authentication
router.post('/suggest', protect, suggestNextParagraph);
router.post('/plot-twist', protect, generatePlotTwist);
router.post('/improve', protect, improveWriting);

module.exports = router;
