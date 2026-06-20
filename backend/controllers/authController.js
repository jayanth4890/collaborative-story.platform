const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCookieOptions } = require('../utils/cookieOptions');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    // Check if user exists (by email or username)
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: 'author',
    });

    if (user) {
      const token = generateToken(user._id);
      res.cookie('token', token, getCookieOptions());
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.cookie('token', token, getCookieOptions());
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// @desc    Search users (excluding current user and existing contributors) for invitation
// @route   GET /api/auth/users
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const search = req.query.search;
    if (!search || search.trim() === '') {
      return res.json([]);
    }

    // Find users matches username or email, excluding current user
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    })
      .select('username email')
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['reader', 'contributor', 'author', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admins cannot modify their own role' });
    }
    user.role = role;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Update role error:', error.message);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admins cannot delete themselves' });
    }
    await User.findByIdAndDelete(user._id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

const googleCallback = (req, res) => {
  if (!req.user) {
    console.error('[OAuth] googleCallback fired with no req.user — passport authentication failed upstream');
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
  const token = generateToken(req.user._id);
  res.cookie('token', token, getCookieOptions());
  console.log(`[OAuth] Cookie set for user ${req.user._id}, redirecting to ${process.env.FRONTEND_URL}/auth/callback`);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
};

const logoutUser = (req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  googleCallback,
  logoutUser,
  getMe,
  searchUsers,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
