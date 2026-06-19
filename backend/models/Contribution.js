const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Contribution content is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

contributionSchema.index({ story: 1, status: 1 });
contributionSchema.index({ contributor: 1, status: 1 });

const Contribution = mongoose.model('Contribution', contributionSchema);
module.exports = Contribution;
