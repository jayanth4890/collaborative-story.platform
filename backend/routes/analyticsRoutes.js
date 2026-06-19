const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route is at GET /api/dashboard/analytics
router.get('/analytics', protect, authorize('author', 'admin'), getAnalytics);

module.exports = router;
