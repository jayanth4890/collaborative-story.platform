const Invitation = require('../models/Invitation');
const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Send an invitation to a contributor
// @route   POST /api/invitations
// @access  Private
const sendInvitation = async (req, res) => {
  try {
    const { storyId, inviteeId } = req.body;

    if (!storyId || !inviteeId) {
      return res.status(400).json({ message: 'Story ID and Invitee ID are required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Verify current user is the author of the story
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the story author can invite contributors' });
    }

    // Check if story is ongoing
    if (story.status === 'completed') {
      return res.status(400).json({ message: 'Cannot invite contributors to a completed story' });
    }

    // Verify invitee exists
    const invitee = await User.findById(inviteeId);
    if (!invitee) {
      return res.status(404).json({ message: 'Invited user not found' });
    }

    // Check if invitee is the author
    if (invitee._id.toString() === story.author.toString()) {
      return res.status(400).json({ message: 'You cannot invite yourself as a contributor' });
    }

    // Check if invitee is already an accepted contributor
    if (story.contributors.includes(invitee._id)) {
      return res.status(400).json({ message: 'User is already a contributor to this story' });
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      story: storyId,
      invitee: inviteeId,
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return res.status(400).json({ message: 'Invitation is already pending' });
      } else if (existingInvitation.status === 'accepted') {
        return res.status(400).json({ message: 'User has already accepted an invitation' });
      }
      // If rejected previously, we can set it back to pending or create/overwrite
      existingInvitation.status = 'pending';
      existingInvitation.inviter = req.user._id;
      await existingInvitation.save();

      // Send email notification to invitee
      const { sendInvitationEmail } = require('../utils/sendEmail');
      sendInvitationEmail({
        inviteeEmail: invitee.email,
        inviteeName: invitee.username,
        authorName: req.user.username,
        storyTitle: story.title,
        storyDesc: story.description,
        storyId: story._id,
      }).catch((err) => console.error('Failed to send invitation email:', err));

      // Emit real-time notification to invitee
      if (req.io) {
        req.io.to(`user_${inviteeId}`).emit('invitation_received', {
          message: `${req.user.username} invited you to collaborate on "${story.title}"`,
          invitation: existingInvitation,
        });
      }

      return res.json(existingInvitation);
    }

    const invitation = await Invitation.create({
      story: storyId,
      inviter: req.user._id,
      invitee: inviteeId,
      status: 'pending',
    });

    // Send email notification to invitee
    const { sendInvitationEmail } = require('../utils/sendEmail');
    sendInvitationEmail({
      inviteeEmail: invitee.email,
      inviteeName: invitee.username,
      authorName: req.user.username,
      storyTitle: story.title,
      storyDesc: story.description,
      storyId: story._id,
    }).catch((err) => console.error('Failed to send invitation email:', err));

    // Emit real-time notification to invitee
    if (req.io) {
      req.io.to(`user_${inviteeId}`).emit('invitation_received', {
        message: `${req.user.username} invited you to collaborate on "${story.title}"`,
        invitation,
      });
    }

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Send invitation error:', error.message);
    res.status(500).json({ message: 'Server error sending invitation' });
  }
};

// @desc    Respond to an invitation (Accept/Reject)
// @route   PATCH /api/invitations/:id
// @access  Private
const respondInvitation = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid response status' });
    }

    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Verify current user is the invitee
    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only respond to your own invitations' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation already ${invitation.status}` });
    }

    const story = await Story.findById(invitation.story).populate('author', 'username email');
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    invitation.status = status;
    await invitation.save();

    if (status === 'accepted') {
      // Add contributor to story if not already there
      if (!story.contributors.includes(req.user._id)) {
        story.contributors.push(req.user._id);
        await story.save();
      }

      // Send email notification to author
      const { sendInvitationAcceptedEmail } = require('../utils/sendEmail');
      sendInvitationAcceptedEmail({
        authorEmail: story.author.email,
        authorName: story.author.username,
        inviteeName: req.user.username,
        storyTitle: story.title,
        storyId: story._id,
      }).catch((err) => console.error('Failed to send invitation accepted email:', err));

      // Emit real-time notification to author
      if (req.io) {
        req.io.to(`user_${story.author._id.toString()}`).emit('invitation_accepted', {
          message: `${req.user.username} accepted your invitation to collaborate on "${story.title}"`,
          storyId: story._id,
        });
      }
    }

    res.json(invitation);
  } catch (error) {
    console.error('Respond invitation error:', error.message);
    res.status(500).json({ message: 'Server error responding to invitation' });
  }
};

// @desc    Get user invitations (where they are the invitee)
// @route   GET /api/invitations/my-invitations
// @access  Private
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitee: req.user._id })
      .populate('story', 'title description status')
      .populate('inviter', 'username email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error('Get my invitations error:', error.message);
    res.status(500).json({ message: 'Server error retrieving invitations' });
  }
};

// @desc    Get all invitations for a story (only story author)
// @route   GET /api/invitations/story/:storyId
// @access  Private
const getStoryInvitations = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the story author can view story invitations' });
    }

    const invitations = await Invitation.find({ story: req.params.storyId })
      .populate('invitee', 'username email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error('Get story invitations error:', error.message);
    res.status(500).json({ message: 'Server error retrieving story invitations' });
  }
};

module.exports = {
  sendInvitation,
  respondInvitation,
  getMyInvitations,
  getStoryInvitations,
};
