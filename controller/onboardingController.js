// // controllers/onboardingController.js
// const BusinessOnboardingRequest = require('../models/BusinessOnboardingRequest');

// module.exports = {
//   // Create new onboarding request
//   createRequest: async (req, res) => {
//     console.log('🔧 [createRequest] Received request body:', req.body);

//     try {
//       const { businessName, businessAddress, businessType, userEmail, password } = req.body;

//       console.log('🔍 [createRequest] Checking if email already exists:', userEmail);
//       const existingRequest = await BusinessOnboardingRequest.findOne({ userEmail });

//       if (existingRequest) {
//         console.log('⚠️ [createRequest] Email already registered:', userEmail);
//         return res.status(400).json({
//           success: false,
//           message: 'Email already registered'
//         });
//       }

//       console.log('📦 [createRequest] Creating new onboarding request...');
//       const newRequest = new BusinessOnboardingRequest({
//         businessName,
//         businessAddress,
//         businessType,
//         userEmail,
//         password
//       });

//       await newRequest.save();
//       console.log('✅ [createRequest] Request saved successfully:', newRequest._id);

//       res.status(201).json({
//         success: true,
//         message: 'Registration request submitted successfully',
//         requestId: newRequest._id,
//         businessId: newRequest.businessId,
//         businessName: newRequest.businessName,
//         userEmail: newRequest.userEmail,
//         requestStatus: newRequest.requestStatus
//       });

//     } catch (error) {
//       console.error('❌ [createRequest] Error creating request:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   },

//   // Get request status
//   getRequestStatus: async (req, res) => {
//     const { requestId } = req.params;
//     console.log(`🔎 [getRequestStatus] Fetching status for request ID: ${requestId}`);

//     try {
//       const request = await BusinessOnboardingRequest.findById(requestId).select('-password');

//       if (!request) {
//         console.log('⚠️ [getRequestStatus] Request not found:', requestId);
//         return res.status(404).json({
//           success: false,
//           message: 'Request not found'
//         });
//       }

//       console.log('✅ [getRequestStatus] Request found:', request._id);
//       res.json({
//         success: true,
//         data: request
//       });

//     } catch (error) {
//       console.error('❌ [getRequestStatus] Error getting status:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   },

//   // Get all requests (for admin dashboard and requests page)
//   getAllRequests: async (req, res) => {
//     console.log('📊 [getAllRequests] Fetching all onboarding requests');

//     try {
//       const requests = await BusinessOnboardingRequest.find({})
//         .select('-password')
//         .sort({ requestDate: -1 });

//       console.log(`✅ [getAllRequests] ${requests.length} total requests found`);
      
//       // Log breakdown by status
//       const statusBreakdown = requests.reduce((acc, req) => {
//         acc[req.requestStatus] = (acc[req.requestStatus] || 0) + 1;
//         return acc;
//       }, {});
      
//       console.log('📈 [getAllRequests] Status breakdown:', statusBreakdown);

//       res.json({
//         success: true,
//         count: requests.length,
//         data: requests,
//         breakdown: statusBreakdown
//       });

//     } catch (error) {
//       console.error('❌ [getAllRequests] Error fetching all requests:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   },

//   // Get all pending requests
//   getPendingRequests: async (req, res) => {
//     console.log('🔄 [getPendingRequests] Fetching all pending requests');

//     try {
//       const requests = await BusinessOnboardingRequest.find({ requestStatus: 'pending' })
//         .select('-password')
//         .sort({ requestDate: -1 });

//       console.log(`✅ [getPendingRequests] ${requests.length} pending requests found`);
//       res.json({
//         success: true,
//         count: requests.length,
//         data: requests
//       });

//     } catch (error) {
//       console.error('❌ [getPendingRequests] Error fetching pending requests:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   },

//   // Approve request
//   approveRequest: async (req, res) => {
//     const { requestId } = req.params;
//     console.log(`✅ [approveRequest] Approving request ID: ${requestId}`);

//     try {
//       const request = await BusinessOnboardingRequest.findByIdAndUpdate(
//         requestId,
//         { requestStatus: 'approved' },
//         { new: true }
//       );

//       if (!request) {
//         console.log('⚠️ [approveRequest] Request not found:', requestId);
//         return res.status(404).json({
//           success: false,
//           message: 'Request not found'
//         });
//       }

//       console.log('✅ [approveRequest] Request approved:', request._id);
//       res.json({
//         success: true,
//         message: 'Request approved successfully',
//         data: request
//       });

//     } catch (error) {
//       console.error('❌ [approveRequest] Error approving request:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   },

//   // Reject request
//   rejectRequest: async (req, res) => {
//     const { requestId } = req.params;
//     console.log(`🛑 [rejectRequest] Rejecting request ID: ${requestId}`);

//     try {
//       const request = await BusinessOnboardingRequest.findByIdAndUpdate(
//         requestId,
//         { requestStatus: 'rejected' },
//         { new: true }
//       );

//       if (!request) {
//         console.log('⚠️ [rejectRequest] Request not found:', requestId);
//         return res.status(404).json({
//           success: false,
//           message: 'Request not found'
//         });
//       }

//       console.log('✅ [rejectRequest] Request rejected:', request._id);
//       res.json({
//         success: true,
//         message: 'Request rejected',
//         data: request
//       });

//     } catch (error) {
//       console.error('❌ [rejectRequest] Error rejecting request:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }
// };


// controllers/onboardingController.js
const BusinessOnboardingRequest = require('../models/BusinessOnboardingRequest');
const BusinessUser = require('../models/BusinessUser');

module.exports = {
  // Create new onboarding request
  createRequest: async (req, res) => {
    console.log('🔧 [createRequest] Received request body:', req.body);

    try {
      const { businessName, businessAddress, businessType, userEmail, password } = req.body;

      console.log('🔍 [createRequest] Checking if email already exists:', userEmail);
      
      // Check in both onboarding requests and existing users
      const existingRequest = await BusinessOnboardingRequest.findOne({ userEmail });
      const existingUser = await BusinessUser.findOne({ userEmail });

      if (existingRequest || existingUser) {
        console.log('⚠️ [createRequest] Email already registered:', userEmail);
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      console.log('📦 [createRequest] Creating new onboarding request...');
      const newRequest = new BusinessOnboardingRequest({
        businessName,
        businessAddress,
        businessType,
        userEmail,
        password
      });

      await newRequest.save();
      console.log('✅ [createRequest] Request saved successfully:', newRequest._id);

      res.status(201).json({
        success: true,
        message: 'Registration request submitted successfully',
        requestId: newRequest._id,
        businessId: newRequest.businessId,
        businessName: newRequest.businessName,
        userEmail: newRequest.userEmail,
        requestStatus: newRequest.requestStatus
      });

    } catch (error) {
      console.error('❌ [createRequest] Error creating request:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get request status
  getRequestStatus: async (req, res) => {
    const { requestId } = req.params;
    console.log(`🔎 [getRequestStatus] Fetching status for request ID: ${requestId}`);

    try {
      const request = await BusinessOnboardingRequest.findById(requestId).select('-password');

      if (!request) {
        console.log('⚠️ [getRequestStatus] Request not found:', requestId);
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      console.log('✅ [getRequestStatus] Request found:', request._id);
      res.json({
        success: true,
        data: request
      });

    } catch (error) {
      console.error('❌ [getRequestStatus] Error getting status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get all requests (for admin dashboard and requests page)
  getAllRequests: async (req, res) => {
    console.log('📊 [getAllRequests] Fetching all onboarding requests');

    try {
      const requests = await BusinessOnboardingRequest.find({})
        .select('-password')
        .sort({ requestDate: -1 });

      console.log(`✅ [getAllRequests] ${requests.length} total requests found`);
      
      // Log breakdown by status
      const statusBreakdown = requests.reduce((acc, req) => {
        acc[req.requestStatus] = (acc[req.requestStatus] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 [getAllRequests] Status breakdown:', statusBreakdown);

      res.json({
        success: true,
        count: requests.length,
        data: requests,
        breakdown: statusBreakdown
      });

    } catch (error) {
      console.error('❌ [getAllRequests] Error fetching all requests:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get all pending requests
  getPendingRequests: async (req, res) => {
    console.log('🔄 [getPendingRequests] Fetching all pending requests');

    try {
      const requests = await BusinessOnboardingRequest.find({ requestStatus: 'pending' })
        .select('-password')
        .sort({ requestDate: -1 });

      console.log(`✅ [getPendingRequests] ${requests.length} pending requests found`);
      res.json({
        success: true,
        count: requests.length,
        data: requests
      });

    } catch (error) {
      console.error('❌ [getPendingRequests] Error fetching pending requests:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Approve request and create BusinessUser account
  approveRequest: async (req, res) => {
    const { requestId } = req.params;
    console.log(`✅ [approveRequest] Approving request ID: ${requestId}`);

    try {
      // Start a MongoDB session for transaction
      const session = await BusinessOnboardingRequest.startSession();
      
      await session.withTransaction(async () => {
        // Find and update the onboarding request
        const request = await BusinessOnboardingRequest.findById(requestId).session(session);

        if (!request) {
          throw new Error('Request not found');
        }

        if (request.requestStatus !== 'pending') {
          throw new Error('Request already processed');
        }

        // Check if BusinessUser already exists (prevent duplicate creation)
        const existingUser = await BusinessUser.findOne({ 
          userEmail: request.userEmail 
        }).session(session);

        if (existingUser) {
          throw new Error('Business user already exists');
        }

        // Update the onboarding request status
        request.requestStatus = 'approved';
        await request.save({ session });

        console.log('📝 [approveRequest] Creating BusinessUser account...');
        
        // Create the BusinessUser account
        const businessUser = new BusinessUser({
          onboardingRequestId: request._id,
          businessId: request.businessId,
          businessName: request.businessName,
          businessAddress: request.businessAddress,
          businessType: request.businessType,
          userEmail: request.userEmail,
          password: request.password, // Password is already hashed in the request
          accountStatus: 'active',
          approvedDate: new Date()
        });

        await businessUser.save({ session });
        console.log('✅ [approveRequest] BusinessUser created:', businessUser._id);
      });

      // Fetch the updated request data
      const updatedRequest = await BusinessOnboardingRequest.findById(requestId).select('-password');

      console.log('✅ [approveRequest] Request approved and user account created');
      
      res.json({
        success: true,
        message: 'Request approved successfully. Business account created.',
        data: updatedRequest
      });

    } catch (error) {
      console.error('❌ [approveRequest] Error approving request:', error);
      
      let errorMessage = 'Server error';
      if (error.message === 'Request not found') {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      } else if (error.message === 'Request already processed') {
        return res.status(400).json({
          success: false,
          message: 'Request has already been processed'
        });
      } else if (error.message === 'Business user already exists') {
        return res.status(400).json({
          success: false,
          message: 'Business user account already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  },

  // Reject request
  rejectRequest: async (req, res) => {
    const { requestId } = req.params;
    const { reason } = req.body;
    console.log(`🛑 [rejectRequest] Rejecting request ID: ${requestId}`);

    try {
      const request = await BusinessOnboardingRequest.findById(requestId);

      if (!request) {
        console.log('⚠️ [rejectRequest] Request not found:', requestId);
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (request.requestStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Request already processed'
        });
      }

      // If there's an existing BusinessUser (in case it was approved before), remove it
      const existingUser = await BusinessUser.findOne({ 
        onboardingRequestId: requestId 
      });

      if (existingUser) {
        await BusinessUser.findByIdAndDelete(existingUser._id);
        console.log('🗑️ [rejectRequest] Removed existing BusinessUser account');
      }

      // Update the request status
      request.requestStatus = 'rejected';
      if (reason) {
        request.rejectionReason = reason;
      }
      await request.save();

      console.log('✅ [rejectRequest] Request rejected:', request._id);
      res.json({
        success: true,
        message: 'Request rejected successfully',
        data: request
      });

    } catch (error) {
      console.error('❌ [rejectRequest] Error rejecting request:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get BusinessUser by email (for login purposes)
  getBusinessUserByEmail: async (req, res) => {
    const { email } = req.params;
    console.log(`👤 [getBusinessUserByEmail] Finding user: ${email}`);

    try {
      const user = await BusinessUser.findOne({ userEmail: email })
        .populate('onboardingRequestId', 'requestDate businessId')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ [getBusinessUserByEmail] User found:', user._id);
      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('❌ [getBusinessUserByEmail] Error finding user:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};