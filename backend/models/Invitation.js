const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one active/pending invitation per story
invitationSchema.index({ story: 1, invitee: 1 }, { unique: true });
invitationSchema.index({ invitee: 1, status: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
