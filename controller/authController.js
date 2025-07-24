// controllers/authController.js
const BusinessUser = require('../models/BusinessUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  // Login for business users
  login: async (req, res) => {

    console.log('🔐 [login] Login attempt for:', req.body.email);
    console.log('🔐 [login] Login attempt for:', req.body.password);

    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      console.log('🔍 [login] Looking for user:', email);
      
      // Find user by email
      const user = await BusinessUser.findOne({ userEmail: email.toLowerCase() })
        .populate('onboardingRequestId', 'businessId requestDate');

      if (!user) {
        console.log('⚠️ [login] User not found or not approved:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password, or account not approved yet'
        });
      }

      // Check if account is locked
      if (user.isAccountLocked) {
        console.log('🔒 [login] Account is locked:', email);
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
          lockedUntil: user.lockUntil
        });
      }

      // Check if account is active
      if (user.accountStatus !== 'active') {
        console.log('⚠️ [login] Account not active:', email, 'Status:', user.accountStatus);
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact support.'
        });
      }

      console.log('🔑 [login] Verifying password...');
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log('❌ [login] Invalid password for:', email);
        
        // Increment login attempts
        await user.incLoginAttempts();
        
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log('✅ [login] Password verified for:', email);

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          userEmail: user.userEmail,
          businessId: user.businessId,
          businessName: user.businessName,
          accountStatus: user.accountStatus,
          subscriptionPlan: user.subscriptionPlan
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '30d' }
      );

      console.log('🎟️ [login] JWT token generated for:', email);

      // Prepare user data for response (exclude sensitive fields)
      const userData = {
        id: user._id,
        businessId: user.businessId,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        businessType: user.businessType,
        userEmail: user.userEmail,
        accountStatus: user.accountStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        trialExpiresAt: user.trialExpiresAt,
        approvedDate: user.approvedDate,
        lastLogin: user.lastLogin
      };

      console.log('✅ [login] Login successful for:', email);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userData
      });

    } catch (error) {
      console.error('❌ [login] Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  },

  // Verify JWT token
  verifyToken: async (req, res) => {
    console.log('🔍 [verifyToken] Verifying token...');

    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      
      // Get fresh user data
      const user = await BusinessUser.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      if (user.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active.'
        });
      }

      console.log('✅ [verifyToken] Token verified for:', user.userEmail);

      res.json({
        success: true,
        user: {
          id: user._id,
          businessId: user.businessId,
          businessName: user.businessName,
          businessAddress: user.businessAddress,
          businessType: user.businessType,
          userEmail: user.userEmail,
          accountStatus: user.accountStatus,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus,
          trialExpiresAt: user.trialExpiresAt
        }
      });

    } catch (error) {
      console.error('❌ [verifyToken] Token verification error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error during token verification'
      });
    }
  },

  // Logout (optional - mainly for cleanup)
  logout: async (req, res) => {
    console.log('👋 [logout] User logging out');

    try {
      // In a more sophisticated setup, you might want to:
      // 1. Blacklist the token
      // 2. Update last logout time
      // 3. Clean up any session data

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('❌ [logout] Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  },

// Get current user profile
getProfile: async (req, res) => {
  console.log('👤 [getProfile] Getting profile for user:', req.user?.userId);

  try {
    const user = await BusinessUser.findById(req.user.userId)
      .populate('onboardingRequestId', 'requestDate businessId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const responseData = {
      success: true,
      user: {
        id: user._id,
        businessId: user.businessId,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        businessType: user.businessType,
        userEmail: user.userEmail,
        accountStatus: user.accountStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        trialExpiresAt: user.trialExpiresAt,
        approvedDate: user.approvedDate,
        lastLogin: user.lastLogin,
        onboardingRequest: user.onboardingRequestId
      }
    };

    console.log('📤 [getProfile] Sending profile data:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('❌ [getProfile] Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

};