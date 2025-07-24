// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { authenticateUser } = require('../mideleware/auth');

// Public routes
// POST /api/auth/login - Login for business users
router.post('/login', authController.login);

// POST /api/auth/verify-token - Verify JWT token
router.post('/verify-token', authController.verifyToken);

// POST /api/auth/logout - Logout (optional)
router.post('/logout', authController.logout);

// Protected routes (require authentication)
// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticateUser, authController.getProfile);

module.exports = router;