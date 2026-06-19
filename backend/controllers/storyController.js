const Story = require('../models/Story');
const Contribution = require('../models/Contribution');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { sanitizeRichText, stripAllHtml } = require('../utils/sanitize');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    const { title, description, content } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const story = await Story.create({
      title,
      description,
      content: sanitizeRichText(content || ''),
      author: req.user._id,
      status: 'ongoing',
      contributors: [],
    });

    const populatedStory = await Story.findById(story._id).populate('author', 'username email');
    res.status(201).json(populatedStory);
  } catch (error) {
    console.error('Create story error:', error.message);
    res.status(500).json({ message: 'Server error during story creation' });
  }
};

// @desc    Get all stories
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res) => {
  try {
    // Admins can see all stories; other users see public stories or stories they author/contribute to
    const filter = req.user.role === 'admin'
      ? {}
      : {
          $or: [
            { isPublic: true },
            { author: req.user._id },
            { contributors: req.user._id }
          ]
        };

    // Parse pagination query parameters
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const total = await Story.countDocuments(filter);
    const stories = await Story.find(filter)
      .populate('author', 'username email')
      .populate('contributors', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.ceil(total / limit);
    const hasMore = page < pages;

    res.json({
      stories,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Get stories error:', error.message);
    res.status(500).json({ message: 'Server error retrieving stories' });
  }
};

// @desc    Get a story by ID
// @route   GET /api/stories/:id
// @access  Private
const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const authorId = story.author._id ? story.author._id.toString() : story.author.toString();
    const isAuthor = authorId === req.user._id.toString();
    const isContributor = story.contributors.some(c => {
      const contributorId = c._id ? c._id.toString() : c.toString();
      return contributorId === req.user._id.toString();
    });
    const isAdmin = req.user.role === 'admin';

    if (!story.isPublic && !isAuthor && !isContributor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: This story is private' });
    }

    res.json(story);
  } catch (error) {
    console.error('Get story error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.status(500).json({ message: 'Server error retrieving story details' });
  }
};

// @desc    Get my stories (stories authored or contributed to by the user)
// @route   GET /api/stories/my-stories
// @access  Private
const getMyStories = async (req, res) => {
  try {
    // Stories where user is author OR user is in contributors list
    const stories = await Story.find({
      $or: [{ author: req.user._id }, { contributors: req.user._id }],
    })
      .populate('author', 'username email')
      .populate('contributors', 'username email')
      .sort({ updatedAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get my stories error:', error.message);
    res.status(500).json({ message: 'Server error retrieving user stories' });
  }
};

// @desc    Update story metadata (only author can update, only if ongoing)
// @route   PUT /api/stories/:id
// @access  Private
const updateStory = async (req, res) => {
  try {
    const { title, description } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user is the author
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the author can update the story' });
    }

    // Check if story is ongoing
    if (story.status === 'completed') {
      return res.status(400).json({ message: 'Completed stories are read-only' });
    }

    story.title = title || story.title;
    story.description = description || story.description;

    const updatedStory = await story.save();
    const populatedStory = await Story.findById(updatedStory._id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    res.json(populatedStory);
  } catch (error) {
    console.error('Update story error:', error.message);
    res.status(500).json({ message: 'Server error updating story' });
  }
};

// @desc    Mark story as completed (only author can do this)
// @route   PATCH /api/stories/:id/complete
// @access  Private
const completeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user is the author
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the author can mark this story as completed' });
    }

    if (story.status === 'completed') {
      return res.status(400).json({ message: 'Story is already completed' });
    }

    story.status = 'completed';
    const updatedStory = await story.save();

    const populatedStory = await Story.findById(updatedStory._id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    // Send email notification to all contributors in the background
    const { sendStoryCompletedEmail } = require('../utils/sendEmail');
    if (populatedStory.contributors && populatedStory.contributors.length > 0) {
      populatedStory.contributors.forEach((contributor) => {
        sendStoryCompletedEmail({
          contributorEmail: contributor.email,
          contributorName: contributor.username,
          authorName: populatedStory.author.username,
          storyTitle: populatedStory.title,
          storyId: populatedStory._id,
        }).catch((err) => console.error(`Failed to send story completion email to ${contributor.email}:`, err));
      });
    }

    // Emit real-time notification to the story room
    if (req.io) {
      req.io.to(`story_${populatedStory._id.toString()}`).emit('story_completed', {
        message: `The story "${populatedStory.title}" is now complete!`,
        story: populatedStory,
      });
    }

    res.json(populatedStory);
  } catch (error) {
    console.error('Complete story error:', error.message);
    res.status(500).json({ message: 'Server error completing story' });
  }
};

// @desc    Export completed story as PDF
// @route   GET /api/stories/:id/export
// @access  Private
const exportStoryPDF = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const isAuthor = story.author.toString() === req.user._id.toString();
    const isContributor = story.contributors.some(
      (c) => c._id.toString() === req.user._id.toString()
    );

    // Permit export if the story is completed OR user is author/contributor
    if (story.status !== 'completed' && !isAuthor && !isContributor) {
      return res.status(403).json({
        message: 'Only authors or contributors can export ongoing stories. Complete the story to download.',
      });
    }

    const { generateStoryPDF } = require('../utils/pdfGenerator');
    generateStoryPDF(story, res);
  } catch (error) {
    console.error('Export PDF error:', error.message);
    res.status(500).json({ message: 'Server error during PDF generation' });
  }
};

const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    // Cascade delete contributions
    await Contribution.deleteMany({ story: story._id });
    // Cascade delete invitations
    await Invitation.deleteMany({ story: story._id });
    // Delete story
    await Story.findByIdAndDelete(story._id);
    res.json({ message: 'Story and all associated contributions/invitations deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error.message);
    res.status(500).json({ message: 'Server error deleting story' });
  }
};

module.exports = {
  createStory,
  getStories,
  getStoryById,
  getMyStories,
  updateStory,
  completeStory,
  exportStoryPDF,
  deleteStory,
};

// @desc    Publish a story
// @route   PATCH /api/stories/:id/publish
// @access  Private (Author/Admin)
const publishStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Check ownership or admin status
    const isAuthor = story.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to publish this story' });
    }

    if (story.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed stories can be published to the public feed' });
    }

    story.isPublic = true;
    story.publishedAt = new Date();
    await story.save();

    const populatedStory = await Story.findById(story._id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    res.json(populatedStory);
  } catch (error) {
    console.error('Publish story error:', error.message);
    res.status(500).json({ message: 'Server error publishing story' });
  }
};

// @desc    Get all public (published) stories
// @route   GET /api/stories/public
// @access  Public
const getPublicStories = async (req, res) => {
  try {
    const stories = await Story.find({ isPublic: true })
      .populate('author', 'username email')
      .populate('contributors', 'username email')
      .sort({ publishedAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get public stories error:', error.message);
    res.status(500).json({ message: 'Server error retrieving public stories' });
  }
};

// @desc    Get story by public ID
// @route   GET /api/stories/public/:id
// @access  Public
const getPublicStoryById = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, isPublic: true })
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    if (!story) {
      return res.status(404).json({ message: 'Published story not found' });
    }

    res.json(story);
  } catch (error) {
    console.error('Get public story by ID error:', error.message);
    res.status(500).json({ message: 'Server error retrieving public story details' });
  }
};

// @desc    Like a story
// @route   PATCH /api/stories/:id/like
// @access  Private
const likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const userId = req.user._id;
    const likeIndex = story.likes.indexOf(userId);

    if (likeIndex > -1) {
      // User has already liked, so unlike
      story.likes.splice(likeIndex, 1);
    } else {
      // Like
      story.likes.push(userId);
    }

    await story.save();
    
    const updatedStory = await Story.findById(story._id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');
      
    res.json(updatedStory);
  } catch (error) {
    console.error('Like story error:', error.message);
    res.status(500).json({ message: 'Server error liking story' });
  }
};

// @desc    Increment story views
// @route   POST /api/stories/:id/view
// @access  Public
const incrementViews = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    story.views = (story.views || 0) + 1;
    await story.save();

    res.json({ views: story.views });
  } catch (error) {
    console.error('Increment views error:', error.message);
    res.status(500).json({ message: 'Server error incrementing story views' });
  }
};

// @desc    Bookmark a story
// @route   PATCH /api/stories/:id/bookmark
// @access  Private
const bookmarkStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookmarkIndex = user.bookmarks.indexOf(story._id);
    let isBookmarked = false;

    if (bookmarkIndex > -1) {
      user.bookmarks.splice(bookmarkIndex, 1);
    } else {
      user.bookmarks.push(story._id);
      isBookmarked = true;
    }

    await user.save();
    res.json({ bookmarks: user.bookmarks, isBookmarked });
  } catch (error) {
    console.error('Bookmark story error:', error.message);
    res.status(500).json({ message: 'Server error bookmarking story' });
  }
};

// @desc    Get user bookmarked stories
// @route   GET /api/stories/my-bookmarks
// @access  Private
const getBookmarkedStories = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: [
        { path: 'author', select: 'username email' },
        { path: 'contributors', select: 'username email' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.bookmarks || []);
  } catch (error) {
    console.error('Get bookmarked stories error:', error.message);
    res.status(500).json({ message: 'Server error retrieving bookmarked stories' });
  }
};

// @desc    Add a comment to a story
// @route   POST /api/stories/:id/comment
// @access  Private
const commentOnStory = async (req, res) => {
  try {
    const { text } = req.body;
    const cleanText = stripAllHtml(text);
    if (!cleanText || cleanText.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const comment = {
      user: req.user._id,
      username: req.user.username,
      text: cleanText,
      createdAt: new Date(),
    };

    story.comments.push(comment);
    await story.save();

    const updatedStory = await Story.findById(story._id)
      .populate('author', 'username email')
      .populate('contributors', 'username email');

    res.status(201).json(updatedStory);
  } catch (error) {
    console.error('Comment on story error:', error.message);
    res.status(500).json({ message: 'Server error posting comment' });
  }
};

module.exports = {
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
};
