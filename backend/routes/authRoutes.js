const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  registerUser,
  loginUser,
  googleCallback,
  logoutUser,
  getMe,
  searchUsers,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const { validateBody, registerSchema, loginSchema } = require('../middleware/validate');

router.post('/register', validateBody(registerSchema), registerUser);
router.post('/login', validateBody(loginSchema), loginUser);
router.post('/logout', logoutUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }), googleCallback);

router.get('/me', protect, getMe);
router.get('/users', protect, searchUsers);

// Admin-only user management routes
router.get('/all-users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
