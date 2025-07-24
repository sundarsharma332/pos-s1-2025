// controllers/salesController.js
const Transaction = require('../models/Transaction');
const Product = require('../models/product');
const BusinessUser = require('../models/BusinessUser');
const mongoose = require('mongoose');

module.exports = {
  // Create new transaction
//   createTransaction: async (req, res) => {
//     console.log('💰 [createTransaction] Creating transaction for user:', req.user.userId);

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       const {
//         items,
//         paymentMethod = 'cash',
//         customerName,
//         customerEmail,
//         customerPhone,
//         notes,
//         discountAmount = 0
//       } = req.body;

//       // Validate items
//       if (!items || !Array.isArray(items) || items.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Items are required'
//         });
//       }

//       // Get user's business info
//       const businessUser = await BusinessUser.findById(req.user.userId).session(session);
//       if (!businessUser) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(404).json({
//           success: false,
//           message: 'Business user not found'
//         });
//       }

//       let subtotal = 0;
//       let taxAmount = 0;
//       const processedItems = [];

//       // Process each item
//       for (const item of items) {
//         const { productId, quantity } = item;

//         // Get product details
//         const product = await Product.findOne({
//           _id: productId,
//           businessUserId: req.user.userId,
//           status: 'active'
//         }).session(session);

//         if (!product) {
//           await session.abortTransaction();
//           session.endSession();
//           return res.status(404).json({
//             success: false,
//             message: `Product not found: ${productId}`
//           });
//         }

//         // Check stock availability
//         if (product.stock < quantity) {
//           await session.abortTransaction();
//           session.endSession();
//           return res.status(400).json({
//             success: false,
//             message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
//           });
//         }

//         // Calculate totals
//         const unitPrice = product.price;
//         const totalPrice = unitPrice * quantity;
//         const itemTax = (totalPrice * (product.taxRate || 0)) / 100;

//         subtotal += totalPrice;
//         taxAmount += itemTax;

//         // Update product stock
//         await Product.findByIdAndUpdate(
//           productId,
//           { $inc: { stock: -quantity } },
//           { session }
//         );

//         processedItems.push({
//           productId,
//           productName: product.name,
//           sku: product.sku,
//           quantity,
//           unitPrice,
//           totalPrice
//         });
//       }

//       // Calculate final amounts
//       const totalAmount = subtotal + taxAmount - (discountAmount || 0);

//       // Create transaction
//       const transaction = new Transaction({
//         businessUserId: req.user.userId,
//         businessId: businessUser.businessId,
//         items: processedItems,
//         subtotal,
//         taxAmount,
//         discountAmount: discountAmount || 0,
//         totalAmount,
//         paymentMethod,
//         customerName,
//         customerEmail,
//         customerPhone,
//         notes
//       });

//       await transaction.save({ session });

//       await session.commitTransaction();
//       session.endSession();

//       console.log('✅ [createTransaction] Transaction created:', transaction.transactionNumber);

//       res.status(201).json({
//         success: true,
//         message: 'Transaction created successfully',
//         data: transaction
//       });

//     } catch (error) {
//       await session.abortTransaction();
//       session.endSession();
//       console.error('❌ [createTransaction] Error:', error);

//       if (error.name === 'ValidationError') {
//         const errors = Object.values(error.errors).map(err => err.message);
//         return res.status(400).json({
//           success: false,
//           message: 'Validation error',
//           errors
//         });
//       }

//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   },


createTransaction: async (req, res) => {
    console.log('💰 [createTransaction] Creating transaction for user:', req.user.userId);
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const {
        items,
        paymentMethod = 'cash',
        customerName,
        customerEmail,
        customerPhone,
        notes,
        discountAmount = 0
      } = req.body;
  
      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Items are required'
        });
      }
  
      // Get user's business info
      const businessUser = await BusinessUser.findById(req.user.userId).session(session);
      if (!businessUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Business user not found'
        });
      }
  
      let subtotal = 0;
      let taxAmount = 0;
      let totalCost = 0; // ✅ NEW: Track total cost
      const processedItems = [];
  
      // Process each item
      for (const item of items) {
        const { productId, quantity } = item;
  
        // Get product details
        const product = await Product.findOne({
          _id: productId,
          businessUserId: req.user.userId,
          status: 'active'
        }).session(session);
  
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            success: false,
            message: `Product not found: ${productId}`
          });
        }
  
        // Check stock availability
        if (product.stock < quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
          });
        }
  
        // Calculate totals
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;
        const itemTax = (totalPrice * (product.taxRate || 0)) / 100;
        
        // ✅ NEW: Calculate cost totals
        const costPrice = product.costPrice || 0;
        const itemTotalCost = costPrice * quantity;
  
        subtotal += totalPrice;
        taxAmount += itemTax;
        totalCost += itemTotalCost; // ✅ NEW: Add to total cost
  
        // Update product stock
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stock: -quantity } },
          { session }
        );
  
        processedItems.push({
          productId,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice,
          totalPrice,
          costPrice, // ✅ NEW: Include cost price
          totalCost: itemTotalCost // ✅ NEW: Include total cost for this item
        });
      }
  
      // Calculate final amounts
      const totalAmount = subtotal + taxAmount - (discountAmount || 0);
  
      // ✅ UPDATED: Create transaction with cost tracking
      const transaction = new Transaction({
        businessUserId: req.user.userId,
        businessId: businessUser.businessId,
        items: processedItems,
        subtotal,
        taxAmount,
        discountAmount: discountAmount || 0,
        totalAmount,
        totalCost, // ✅ NEW: Include total cost
        paymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        notes
      });
  
      await transaction.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      console.log('✅ [createTransaction] Transaction created:', transaction.transactionNumber);
      console.log(`💰 Sales: $${totalAmount.toFixed(2)}, Cost: $${totalCost.toFixed(2)}, Profit: $${(totalAmount - totalCost).toFixed(2)}`);
  
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      });
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('❌ [createTransaction] Error:', error);
  
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }
  
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get all transactions for the business
  getTransactions: async (req, res) => {
    console.log('📋 [getTransactions] Fetching transactions for user:', req.user.userId);

    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentMethod,
        search,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert userId to ObjectId
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId) 
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Build filter
      const filter = { businessUserId: userId };
      
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      if (paymentMethod && paymentMethod !== 'all') {
        filter.paymentMethod = paymentMethod;
      }

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Handle search
      let query = search 
        ? Transaction.searchTransactions(userId, search)
        : Transaction.find(filter);

      // Apply additional filters to search results
      if (search) {
        if (status && status !== 'all') query = query.where('status', status);
        if (paymentMethod && paymentMethod !== 'all') query = query.where('paymentMethod', paymentMethod);
        if (filter.createdAt) query = query.where('createdAt', filter.createdAt);
      }

      // Apply sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      query = query.sort(sortOptions);

      // Apply pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = query.skip(skip).limit(parseInt(limit));

      const transactions = await query.exec();
      
      // Get total count for pagination
      const totalQuery = search 
        ? Transaction.searchTransactions(userId, search)
        : Transaction.find(filter);
        
      if (search) {
        if (status && status !== 'all') totalQuery.where('status', status);
        if (paymentMethod && paymentMethod !== 'all') totalQuery.where('paymentMethod', paymentMethod);
        if (filter.createdAt) totalQuery.where('createdAt', filter.createdAt);
      }
      
      const total = await totalQuery.countDocuments();

      console.log(`✅ [getTransactions] Found ${transactions.length} transactions`);

      res.json({
        success: true,
        data: transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: skip + transactions.length < total,
          hasPrev: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error('❌ [getTransactions] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get single transaction
  getTransaction: async (req, res) => {
    console.log('🔍 [getTransaction] Fetching transaction:', req.params.id);

    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        businessUserId: req.user.userId
      }).populate('items.productId', 'name sku category');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      console.log('✅ [getTransaction] Transaction found:', transaction.transactionNumber);

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('❌ [getTransaction] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Update transaction
  updateTransaction: async (req, res) => {
    console.log('📝 [updateTransaction] Updating transaction:', req.params.id);

    try {
      const {
        status,
        customerName,
        customerEmail,
        customerPhone,
        notes
      } = req.body;

      // Check if transaction exists and belongs to the user
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        businessUserId: req.user.userId
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Only allow certain fields to be updated
      const allowedUpdates = {
        status,
        customerName,
        customerEmail,
        customerPhone,
        notes,
        updatedAt: new Date()
      };

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      const updatedTransaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        allowedUpdates,
        { new: true, runValidators: true }
      );

      console.log('✅ [updateTransaction] Transaction updated:', updatedTransaction.transactionNumber);

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: updatedTransaction
      });

    } catch (error) {
      console.error('❌ [updateTransaction] Error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Delete transaction (soft delete by changing status)
  deleteTransaction: async (req, res) => {
    console.log('🗑️ [deleteTransaction] Deleting transaction:', req.params.id);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        businessUserId: req.user.userId
      }).session(session);

      if (!transaction) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // If transaction was completed, restore the stock
      if (transaction.status === 'completed') {
        for (const item of transaction.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }

      // Mark as cancelled instead of hard delete
      transaction.status = 'cancelled';
      transaction.updatedAt = new Date();
      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      console.log('✅ [deleteTransaction] Transaction cancelled:', transaction.transactionNumber);

      res.json({
        success: true,
        message: 'Transaction cancelled successfully'
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('❌ [deleteTransaction] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Updated getSalesStats function in controllers/salesController.js

getSalesStats: async (req, res) => {
    console.log('📈 [getSalesStats] Fetching sales stats for user:', req.user.userId);
  
    try {
      const { period = 'today' } = req.query;
      
      // Convert userId to ObjectId
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId) 
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;
  
      // Define date ranges
      const now = new Date();
      let startDate, endDate = now;
  
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
  
      // ✅ UPDATED: Enhanced aggregation with cost and profit calculations
      const stats = await Transaction.aggregate([
        {
          $match: {
            businessUserId: userId,
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalSales: { $sum: '$totalAmount' }, // ✅ RENAMED: from totalRevenue to totalSales
            totalCosts: { $sum: '$totalCost' }, // ✅ NEW: Total costs
            totalProfit: { // ✅ NEW: Total profit calculation
              $sum: { $subtract: ['$totalAmount', '$totalCost'] }
            },
            totalTax: { $sum: '$taxAmount' },
            totalDiscount: { $sum: '$discountAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            averageCost: { $avg: '$totalCost' }, // ✅ NEW: Average cost per transaction
            averageProfit: { // ✅ NEW: Average profit per transaction
              $avg: { $subtract: ['$totalAmount', '$totalCost'] }
            },
            totalItemsSold: { $sum: { $sum: '$items.quantity' } }
          }
        },
        {
          // ✅ NEW: Add calculated fields
          $addFields: {
            profitMargin: { // ✅ NEW: Overall profit margin percentage
              $cond: {
                if: { $gt: ['$totalSales', 0] },
                then: {
                  $multiply: [
                    { $divide: ['$totalProfit', '$totalSales'] },
                    100
                  ]
                },
                else: 0
              }
            },
            costRatio: { // ✅ NEW: Cost as percentage of sales
              $cond: {
                if: { $gt: ['$totalSales', 0] },
                then: {
                  $multiply: [
                    { $divide: ['$totalCosts', '$totalSales'] },
                    100
                  ]
                },
                else: 0
              }
            }
          }
        }
      ]);
  
      // ✅ UPDATED: Enhanced default result structure
      const result = stats[0] || {
        totalTransactions: 0,
        totalSales: 0, // ✅ RENAMED: from totalRevenue
        totalCosts: 0, // ✅ NEW
        totalProfit: 0, // ✅ NEW
        totalTax: 0,
        totalDiscount: 0,
        averageOrderValue: 0,
        averageCost: 0, // ✅ NEW
        averageProfit: 0, // ✅ NEW
        totalItemsSold: 0,
        profitMargin: 0, // ✅ NEW
        costRatio: 0 // ✅ NEW
      };
  
      // ✅ NEW: Round decimal values for better display
      const formattedResult = {
        ...result,
        totalSales: Number(result.totalSales.toFixed(2)),
        totalCosts: Number(result.totalCosts.toFixed(2)),
        totalProfit: Number(result.totalProfit.toFixed(2)),
        totalTax: Number(result.totalTax.toFixed(2)),
        totalDiscount: Number(result.totalDiscount.toFixed(2)),
        averageOrderValue: Number(result.averageOrderValue.toFixed(2)),
        averageCost: Number(result.averageCost.toFixed(2)),
        averageProfit: Number(result.averageProfit.toFixed(2)),
        profitMargin: Number(result.profitMargin.toFixed(2)),
        costRatio: Number(result.costRatio.toFixed(2))
      };
  
      console.log('✅ [getSalesStats] Stats calculated for period:', period);
      console.log(`📊 Sales: $${formattedResult.totalSales}, Costs: $${formattedResult.totalCosts}, Profit: $${formattedResult.totalProfit} (${formattedResult.profitMargin}%)`);
  
      res.json({
        success: true,
        data: {
          period,
          ...formattedResult
        }
      });
  
    } catch (error) {
      console.error('❌ [getSalesStats] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get sales statistics
//   getSalesStats: async (req, res) => {
//     console.log('📈 [getSalesStats] Fetching sales stats for user:', req.user.userId);

//     try {
//       const { period = 'today' } = req.query;
      
//       // Convert userId to ObjectId
//       const userId = mongoose.Types.ObjectId.isValid(req.user.userId) 
//         ? new mongoose.Types.ObjectId(req.user.userId)
//         : req.user.userId;

//       // Define date ranges
//       const now = new Date();
//       let startDate, endDate = now;

//       switch (period) {
//         case 'today':
//           startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//           break;
//         case 'week':
//           startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//           break;
//         case 'month':
//           startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//           break;
//         case 'year':
//           startDate = new Date(now.getFullYear(), 0, 1);
//           break;
//         default:
//           startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//       }

//       const stats = await Transaction.aggregate([
//         {
//           $match: {
//             businessUserId: userId,
//             status: 'completed',
//             createdAt: { $gte: startDate, $lte: endDate }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             totalTransactions: { $sum: 1 },
//             totalRevenue: { $sum: '$totalAmount' },
//             totalTax: { $sum: '$taxAmount' },
//             totalDiscount: { $sum: '$discountAmount' },
//             averageOrderValue: { $avg: '$totalAmount' },
//             totalItemsSold: { $sum: { $sum: '$items.quantity' } }
//           }
//         }
//       ]);

//       const result = stats[0] || {
//         totalTransactions: 0,
//         totalRevenue: 0,
//         totalTax: 0,
//         totalDiscount: 0,
//         averageOrderValue: 0,
//         totalItemsSold: 0
//       };

//       console.log('✅ [getSalesStats] Stats calculated for period:', period);

//       res.json({
//         success: true,
//         data: {
//           period,
//           ...result
//         }
//       });

//     } catch (error) {
//       console.error('❌ [getSalesStats] Error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }
};