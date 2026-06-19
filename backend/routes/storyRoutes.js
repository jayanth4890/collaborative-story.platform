const express = require('express');
const router = express.Router();
const {
  createStory,
  getStories,
  getStoryById,
  getMyStories,
  updateStory,
  completeStory,
  exportStoryPDF,
  deleteStory,
  publishStory,
  getPublicStories,
  getPublicStoryById,
  likeStory,
  incrementViews,
  bookmarkStory,
  getBookmarkedStories,
  commentOnStory,
} = require('../controllers/storyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateBody, createStorySchema, updateStorySchema, commentSchema } = require('../middleware/validate');

// Public endpoints (no token required)
router.get('/public', getPublicStories);
router.get('/public/:id', getPublicStoryById);
router.post('/:id/view', incrementViews);

// Stories root endpoints
router.route('/')
  .post(protect, authorize('author', 'admin'), validateBody(createStorySchema), createStory)
  .get(protect, getStories);

// Private dashboard lists
router.get('/my-stories', protect, authorize('contributor', 'author', 'admin'), getMyStories);
router.get('/my-bookmarks', protect, getBookmarkedStories);

// Publish, like, bookmark, comment actions
router.patch('/:id/publish', protect, authorize('author', 'admin'), publishStory);
router.patch('/:id/like', protect, likeStory);
router.patch('/:id/bookmark', protect, bookmarkStory);
router.post('/:id/comment', protect, validateBody(commentSchema), commentOnStory);

// Wildcard endpoints
router.route('/:id')
  .get(protect, getStoryById)
  .put(protect, authorize('author', 'admin'), validateBody(updateStorySchema), updateStory)
  .delete(protect, authorize('admin'), deleteStory);

router.patch('/:id/complete', protect, authorize('author', 'admin'), completeStory);
router.get('/:id/export', protect, exportStoryPDF);

module.exports = router;
