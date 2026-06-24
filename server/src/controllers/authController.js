const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
      return res.status(400).json({ status: 'error', message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user.id,
          username: user.username,
          email: user.email,
          rating: user.rating,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        status: 'success',
        data: {
          _id: user.id,
          username: user.username,
          email: user.email,
          rating: user.rating,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get user profile (via token)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
