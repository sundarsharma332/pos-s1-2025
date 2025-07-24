// controllers/inventoryController.js
const Product = require('../models/product');
const BusinessUser = require('../models/BusinessUser');

module.exports = {
  // Create new product
  createProduct: async (req, res) => {
    console.log('📦 [createProduct] Creating product for user:', req.user.userId);

    try {
      const {
        name,
        description,
        category,
        price,
        costPrice,
        sku,
        barcode,
        stock,
        minStockLevel,
        weight,
        dimensions,
        taxRate
      } = req.body;

      // Get user's business info
      const businessUser = await BusinessUser.findById(req.user.userId);
      if (!businessUser) {
        return res.status(404).json({
          success: false,
          message: 'Business user not found'
        });
      }

      // Check if SKU already exists for this business
      if (sku) {
        const existingProduct = await Product.findOne({
          businessUserId: req.user.userId,
          sku: sku.toUpperCase()
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'SKU already exists in your inventory'
          });
        }
      }

      // Create new product
      const product = new Product({
        businessUserId: req.user.userId,
        businessId: businessUser.businessId,
        name,
        description,
        category,
        price,
        costPrice: costPrice || 0,
        sku: sku?.toUpperCase(),
        barcode,
        stock: stock || 0,
        minStockLevel: minStockLevel || 5,
        weight,
        dimensions,
        taxRate: taxRate || 0
      });

      await product.save();

      console.log('✅ [createProduct] Product created:', product._id);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });

    } catch (error) {
      console.error('❌ [createProduct] Error:', error);
      
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

 // Get all products for the business
getProducts: async (req, res) => {
  console.log('📋 [getProducts] Fetching products for user:', req.user.userId);

  try {
    const {
      page = 1,
      limit = 10,
      category,
      status, // Removed default value - now returns all by default
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter - only filter by businessUserId by default
    const filter = { businessUserId: req.user.userId };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Only filter by status if explicitly provided and not 'all'
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Handle search
    let query = Product.find(filter);
    
    if (search) {
      query = Product.searchProducts(req.user.userId, search);
      // Apply additional filters to search results
      if (category && category !== 'all') query = query.where('category', category);
      if (status && status !== 'all') query = query.where('status', status);
    }

    // Apply sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortOptions);

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));

    const products = await query.exec();
    
    // Get total count for pagination
    const totalQuery = search 
      ? Product.searchProducts(req.user.userId, search)
      : Product.find(filter);
      
    if (search) {
      if (category && category !== 'all') totalQuery.where('category', category);
      if (status && status !== 'all') totalQuery.where('status', status);
    }
    
    const total = await totalQuery.countDocuments();

    console.log(`✅ [getProducts] Found ${products.length} products (total: ${total})`);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ [getProducts] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
},

  // Get single product
  getProduct: async (req, res) => {
    console.log('🔍 [getProduct] Fetching product:', req.params.id);

    try {
      const product = await Product.findOne({
        _id: req.params.id,
        businessUserId: req.user.userId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      console.log('✅ [getProduct] Product found:', product.name);

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('❌ [getProduct] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    console.log('📝 [updateProduct] Updating product:', req.params.id);

    try {
      const {
        name,
        description,
        category,
        price,
        costPrice,
        sku,
        barcode,
        stock,
        minStockLevel,
        status,
        weight,
        dimensions,
        taxRate
      } = req.body;

      // Check if product exists and belongs to the user
      const product = await Product.findOne({
        _id: req.params.id,
        businessUserId: req.user.userId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if SKU already exists for another product
      if (sku && sku.toUpperCase() !== product.sku) {
        const existingProduct = await Product.findOne({
          businessUserId: req.user.userId,
          sku: sku.toUpperCase(),
          _id: { $ne: req.params.id }
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'SKU already exists in your inventory'
          });
        }
      }

      // Update product fields
      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (category !== undefined) product.category = category;
      if (price !== undefined) product.price = price;
      if (costPrice !== undefined) product.costPrice = costPrice;
      if (sku !== undefined) product.sku = sku.toUpperCase();
      if (barcode !== undefined) product.barcode = barcode;
      if (stock !== undefined) product.stock = stock;
      if (minStockLevel !== undefined) product.minStockLevel = minStockLevel;
      if (status !== undefined) product.status = status;
      if (weight !== undefined) product.weight = weight;
      if (dimensions !== undefined) product.dimensions = dimensions;
      if (taxRate !== undefined) product.taxRate = taxRate;

      await product.save();

      console.log('✅ [updateProduct] Product updated:', product.name);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });

    } catch (error) {
      console.error('❌ [updateProduct] Error:', error);
      
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

  // Delete product
  deleteProduct: async (req, res) => {
    console.log('🗑️ [deleteProduct] Deleting product:', req.params.id);

    try {
      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        businessUserId: req.user.userId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      console.log('✅ [deleteProduct] Product deleted:', product.name);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('❌ [deleteProduct] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Update stock
  updateStock: async (req, res) => {
    console.log('📊 [updateStock] Updating stock for product:', req.params.id);

    try {
      const { quantity, operation = 'set' } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity'
        });
      }

      if (!['add', 'subtract', 'set'].includes(operation)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Use: add, subtract, or set'
        });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        businessUserId: req.user.userId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.updateStock(quantity, operation);

      console.log(`✅ [updateStock] Stock updated: ${product.name} - ${operation} ${quantity}`);

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          productId: product._id,
          name: product.name,
          previousStock: operation === 'set' ? 'N/A' : 
            operation === 'add' ? product.stock - quantity : product.stock + quantity,
          currentStock: product.stock,
          operation,
          quantity
        }
      });

    } catch (error) {
      console.error('❌ [updateStock] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get low stock products
  getLowStockProducts: async (req, res) => {
    console.log('⚠️ [getLowStockProducts] Fetching low stock products for user:', req.user.userId);

    try {
      const products = await Product.getLowStockProducts(req.user.userId);

      console.log(`✅ [getLowStockProducts] Found ${products.length} low stock products`);

      res.json({
        success: true,
        count: products.length,
        data: products
      });

    } catch (error) {
      console.error('❌ [getLowStockProducts] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get inventory statistics
getInventoryStats: async (req, res) => {
  console.log('📈 [getInventoryStats] Fetching inventory stats for user:', req.user.userId);

  try {
    // Convert userId to ObjectId if it's a string
    const mongoose = require('mongoose');
    const userId = mongoose.Types.ObjectId.isValid(req.user.userId) 
      ? new mongoose.Types.ObjectId(req.user.userId)
      : req.user.userId;

    console.log('🔍 [getInventoryStats] Using userId for match:', userId);

    const stats = await Product.aggregate([
      { 
        $match: { 
          businessUserId: userId  // Use the converted ObjectId
        } 
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalStock: { $sum: '$stock' },
          totalValue: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$stock', 0] }, 
                { $ifNull: ['$price', 0] }
              ] 
            } 
          },
          totalCostValue: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$stock', 0] }, 
                { $ifNull: ['$costPrice', 0] }
              ] 
            } 
          },
          lowStockCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $lte: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$minStockLevel', 0] }] },
                    { $eq: ['$status', 'active'] },
                    { $gt: [{ $ifNull: ['$stock', 0] }, 0] }  // Not out of stock
                  ]
                },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: [{ $ifNull: ['$stock', 0] }, 0] },
                    { $eq: ['$status', 'active'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    console.log('📊 [getInventoryStats] Aggregation result:', stats);

    const result = stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      totalStock: 0,
      totalValue: 0,
      totalCostValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };

    // Calculate potential profit
    result.potentialProfit = (result.totalValue || 0) - (result.totalCostValue || 0);

    const responseData = {
      success: true,
      data: result
    };

    console.log('✅ [getInventoryStats] Stats calculated:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('❌ [getInventoryStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}
};