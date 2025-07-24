// 


const jwt = require('jsonwebtoken');
const BusinessUser = require('../models/BusinessUser');

// Middleware to authenticate business users
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // DETAILED LOGGING - START
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Full request headers:', req.headers);
    console.log('Auth header (raw):', authHeader);
    console.log('Auth header type:', typeof authHeader);
    console.log('Auth header length:', authHeader ? authHeader.length : 'N/A');
    
    if (!authHeader) {
      console.log('❌ No auth header found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Better token extraction with validation
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove "Bearer " (7 characters)
      console.log('✅ Found Bearer prefix, extracted token');
    } else {
      token = authHeader; // In case token is sent without "Bearer "
      console.log('⚠️ No Bearer prefix found, using full header as token');
    }
    
    // DETAILED TOKEN LOGGING
    console.log('Extracted token (raw):', token);
    console.log('Token type:', typeof token);
    console.log('Token length:', token ? token.length : 'N/A');
    console.log('Token first 50 chars:', token ? token.substring(0, 50) + '...' : 'N/A');
    console.log('Token last 20 chars:', token && token.length > 20 ? '...' + token.substring(token.length - 20) : token);
    
    // Check if token contains any weird characters
    if (token) {
      console.log('Token contains non-printable chars:', /[^\x20-\x7E]/.test(token));
      console.log('Token after trim:', token.trim());
      console.log('Token trim length:', token.trim().length);
    }
    
    // Check if token is empty or just whitespace
    if (!token || token.trim() === '') {
      console.log('❌ Token is empty or whitespace only');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    console.log('🔍 About to verify token with JWT...');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('Using fallback secret:', !process.env.JWT_SECRET);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    console.log('✅ Token verified successfully');
    console.log('Decoded payload:', decoded);
    
    // Optional: Check if user still exists and is active
    const user = await BusinessUser.findById(decoded.userId);
    if (!user || user.accountStatus !== 'active') {
      console.log('❌ User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or inactive account.'
      });
    }

    console.log('✅ User found and active');
    console.log('=== AUTH DEBUG END ===');
    
    // Add user info to request
    req.user = decoded;
    next();
    
  } catch (error) {
    console.log('=== AUTH ERROR DEBUG ===');
    console.error('Auth middleware error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.log('=== AUTH ERROR END ===');
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware for admin authentication (with same logging)
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Same detailed logging for admin
    console.log('=== ADMIN AUTH DEBUG INFO ===');
    console.log('Auth header (raw):', authHeader);
    console.log('Auth header type:', typeof authHeader);
    console.log('Auth header length:', authHeader ? authHeader.length : 'N/A');
    
    if (!authHeader) {
      console.log('❌ No auth header found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Better token extraction with validation
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
      console.log('✅ Found Bearer prefix, extracted token');
    } else {
      token = authHeader;
      console.log('⚠️ No Bearer prefix found, using full header as token');
    }
    
    console.log('Extracted token (raw):', token);
    console.log('Token length:', token ? token.length : 'N/A');
    console.log('Token first 50 chars:', token ? token.substring(0, 50) + '...' : 'N/A');
    
    // Check if token is empty or just whitespace
    if (!token || token.trim() === '') {
      console.log('❌ Token is empty or whitespace only');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    console.log('🔍 About to verify admin token with JWT...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    console.log('✅ Admin token verified successfully');
    console.log('Decoded payload:', decoded);
    
    // Check if user has admin privileges
    if (!decoded.isAdmin) {
      console.log('❌ User is not admin');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    console.log('✅ Admin access granted');
    console.log('=== ADMIN AUTH DEBUG END ===');

    req.user = decoded;
    next();
    
  } catch (error) {
    console.log('=== ADMIN AUTH ERROR DEBUG ===');
    console.error('Admin auth middleware error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.log('=== ADMIN AUTH ERROR END ===');
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin
};