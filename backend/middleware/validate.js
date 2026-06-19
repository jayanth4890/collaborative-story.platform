const { z } = require('zod');

// Helper schema for Mongo Object ID validation
const objectIdSchema = z.string().refine((val) => {
  return /^[0-9a-fA-F]{24}$/.test(val);
}, {
  message: 'Invalid ID format',
});

// User Registration Schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

// User Login Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Story Creation Schema
const createStorySchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),
  content: z.string().optional(),
});

// Story Update Schema
const updateStorySchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
});

// Comment Schema
const commentSchema = z.object({
  text: z.string()
    .min(1, 'Comment text cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim(),
});

// Contribution Schema
const contributionSchema = z.object({
  storyId: objectIdSchema,
  content: z.string().min(1, 'Contribution content cannot be empty'),
});

// Contribution Review Schema
const reviewContributionSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be either approved or rejected' }),
  }),
  feedback: z.string().max(500, 'Feedback cannot exceed 500 characters').optional(),
});

// Invitation Schema
const invitationSchema = z.object({
  storyId: objectIdSchema,
  inviteeId: objectIdSchema,
});

// Respond Invitation Schema
const respondInvitationSchema = z.object({
  status: z.enum(['accepted', 'rejected'], {
    errorMap: () => ({ message: 'Status must be either accepted or rejected' }),
  }),
});

// Express validation middleware
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors: result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validateBody,
  registerSchema,
  loginSchema,
  createStorySchema,
  updateStorySchema,
  commentSchema,
  contributionSchema,
  reviewContributionSchema,
  invitationSchema,
  respondInvitationSchema,
};
