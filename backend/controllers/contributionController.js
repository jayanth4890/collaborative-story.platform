const Contribution = require('../models/Contribution');
const Story = require('../models/Story');
const { sanitizeRichText } = require('../utils/sanitize');

// @desc    Submit a contribution to a story
// @route   POST /api/contributions
// @access  Private
const createContribution = async (req, res) => {
  try {
    const { storyId, content } = req.body;

    if (!storyId || !content) {
      return res.status(400).json({ message: 'Story ID and contribution content are required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Verify story is ongoing
    if (story.status === 'completed') {
      return res.status(400).json({ message: 'Story is completed and read-only' });
    }

    // Verify user is an accepted contributor (or the author)
    const isContributor = story.contributors.some(
      (id) => id.toString() === req.user._id.toString()
    );
    const isAuthor = story.author.toString() === req.user._id.toString();

    if (!isContributor && !isAuthor) {
      return res.status(403).json({ message: 'Only accepted contributors or the author can submit contributions' });
    }

    const contribution = await Contribution.create({
      story: storyId,
      contributor: req.user._id,
      content: sanitizeRichText(content),
      status: 'pending',
    });

    const populatedContribution = await Contribution.findById(contribution._id)
      .populate('contributor', 'username email');

    // Emit Socket.IO notification to story author
    if (req.io) {
      req.io.to(`user_${story.author.toString()}`).emit('contribution_submitted', {
        message: `@${req.user.username} submitted a new section draft for "${story.title}"`,
        contribution: populatedContribution,
        storyId: story._id,
      });
    }

    res.status(201).json(populatedContribution);
  } catch (error) {
    console.error('Create contribution error:', error.message);
    res.status(500).json({ message: 'Server error creating contribution' });
  }
};

// @desc    Review a contribution (Approve/Reject)
// @route   PATCH /api/contributions/:id/review
// @access  Private
const reviewContribution = async (req, res) => {
  try {
    const { status, feedback } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status response' });
    }

    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribution not found' });
    }

    const story = await Story.findById(contribution.story);
    if (!story) {
      return res.status(404).json({ message: 'Associated story not found' });
    }

    // Verify current user is the author of the story
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the story author can review contributions' });
    }

    if (contribution.status !== 'pending') {
      return res.status(400).json({ message: `Contribution has already been ${contribution.status}` });
    }

    if (story.status === 'completed') {
      return res.status(400).json({ message: 'Story is already completed' });
    }

    contribution.status = status;
    contribution.feedback = feedback || '';
    await contribution.save();

    // If approved, append content to the story
    if (status === 'approved') {
      if (story.content && story.content.trim() !== '') {
        story.content = `${story.content}\n\n${contribution.content}`;
      } else {
        story.content = contribution.content;
      }
      await story.save();
    }

    const populatedContribution = await Contribution.findById(contribution._id)
      .populate('contributor', 'username email');

    // Send email notification to contributor
    const { sendContributionApprovedEmail, sendContributionRejectedEmail } = require('../utils/sendEmail');
    if (status === 'approved') {
      sendContributionApprovedEmail({
        contributorEmail: populatedContribution.contributor.email,
        contributorName: populatedContribution.contributor.username,
        storyTitle: story.title,
        feedback: feedback || '',
        storyId: story._id,
      }).catch((err) => console.error('Failed to send contribution approval email:', err));

      // Emit Socket.IO notifications to contributor and story details room
      if (req.io) {
        req.io.to(`user_${populatedContribution.contributor._id.toString()}`).emit('contribution_approved', {
          message: `Your contribution for "${story.title}" has been approved!`,
          storyId: story._id,
        });
        req.io.to(`story_${story._id.toString()}`).emit('story_updated', {
          message: `New section approved and appended to "${story.title}"!`,
          content: story.content,
          contribution: populatedContribution,
        });
      }
    } else if (status === 'rejected') {
      sendContributionRejectedEmail({
        contributorEmail: populatedContribution.contributor.email,
        contributorName: populatedContribution.contributor.username,
        storyTitle: story.title,
        feedback: feedback || '',
        storyId: story._id,
      }).catch((err) => console.error('Failed to send contribution rejection email:', err));

      // Emit Socket.IO notification to contributor
      if (req.io) {
        req.io.to(`user_${populatedContribution.contributor._id.toString()}`).emit('contribution_rejected', {
          message: `Your contribution for "${story.title}" was reviewed.`,
          storyId: story._id,
        });
      }
    }

    res.json(populatedContribution);
  } catch (error) {
    console.error('Review contribution error:', error.message);
    res.status(500).json({ message: 'Server error reviewing contribution' });
  }
};

// @desc    Get current user's contributions
// @route   GET /api/contributions/my-contributions
// @access  Private
const getMyContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ contributor: req.user._id })
      .populate('story', 'title status author')
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    console.error('Get my contributions error:', error.message);
    res.status(500).json({ message: 'Server error retrieving contributions' });
  }
};

// @desc    Get contributions for a specific story
// @route   GET /api/contributions/story/:storyId
// @access  Private
const getStoryContributions = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Verify user is the author or a contributor to access these
    const isContributor = story.contributors.some(
      (id) => id.toString() === req.user._id.toString()
    );
    const isAuthor = story.author.toString() === req.user._id.toString();

    if (!isContributor && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to view contributions for this story' });
    }

    const contributions = await Contribution.find({ story: req.params.storyId })
      .populate('contributor', 'username email')
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    console.error('Get story contributions error:', error.message);
    res.status(500).json({ message: 'Server error retrieving contributions' });
  }
};

module.exports = {
  createContribution,
  reviewContribution,
  getMyContributions,
  getStoryContributions,
};
