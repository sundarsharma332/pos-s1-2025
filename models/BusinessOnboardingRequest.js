// models/BusinessOnboardingRequest.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const businessOnboardingRequestSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessAddress: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  businessId: {
    type: String,
    unique: true
  },
  requestStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  // Add rejection reason field
  rejectionReason: {
    type: String,
    default: null
  },
  // Track if BusinessUser was created
  businessUserCreated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
businessOnboardingRequestSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate business ID before saving
businessOnboardingRequestSchema.pre('save', function(next) {
  if (!this.businessId) {
    this.businessId = 'BIZ_' + Date.now().toString(36).toUpperCase();
  }
  next();
});

// Virtual to populate related BusinessUser
businessOnboardingRequestSchema.virtual('businessUser', {
  ref: 'BusinessUser',
  localField: '_id',
  foreignField: 'onboardingRequestId',
  justOne: true
});

module.exports = mongoose.model('BusinessOnboardingRequest', businessOnboardingRequestSchema);