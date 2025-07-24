// routes/onboarding.js
const express = require('express');
const router = express.Router();
const onboardingController = require('../controller/onboardingController');

// Public routes
// POST /api/onboarding - Create new onboarding request
router.post('/', onboardingController.createRequest);
// GET /api/onboarding/status/:requestId - Get request status
router.get('/status/:requestId', onboardingController.getRequestStatus);
// Admin routes
// GET /api/onboarding/all - Get all requests
router.get('/all', onboardingController.getAllRequests);
// GET /api/onboarding/pending - Get all pending requests
router.get('/pending', onboardingController.getPendingRequests);
// PATCH /api/onboarding/:requestId/approve - Approve request (creates BusinessUser)
router.patch('/:requestId/approve', onboardingController.approveRequest);
// PATCH /api/onboarding/:requestId/reject - Reject request
router.patch('/:requestId/reject', onboardingController.rejectRequest);
// Business User routes
// GET /api/onboarding/user/:email - Get BusinessUser by email (for login)
router.get('/user/:email', onboardingController.getBusinessUserByEmail);

module.exports = router;