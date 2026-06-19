const express = require('express');
const router = express.Router();
const {
  createContribution,
  reviewContribution,
  getMyContributions,
  getStoryContributions,
} = require('../controllers/contributionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateBody, contributionSchema, reviewContributionSchema } = require('../middleware/validate');

router.post('/', protect, authorize('contributor', 'author', 'admin'), validateBody(contributionSchema), createContribution);
router.patch('/:id/review', protect, authorize('author', 'admin'), validateBody(reviewContributionSchema), reviewContribution);
router.get('/my-contributions', protect, authorize('contributor', 'author', 'admin'), getMyContributions);
router.get('/story/:storyId', protect, authorize('contributor', 'author', 'admin'), getStoryContributions);

module.exports = router;
