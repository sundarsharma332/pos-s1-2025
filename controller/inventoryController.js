const Product = require('../models/product');
const BusinessUser = require('../models/BusinessUser');

const VALID_CATEGORIES = [
  'Beer',
  'Wine',
  'Tobacco',
  'Grocery NT',
  'Grocery T',
  'Electronics',
  'Medicine',
  'Candy',
  'Others'
];

module.exports = {
  createProduct: async (req, res) => {
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
        taxRate,
        status
      } = req.body;

      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
      }

      const businessUser = await BusinessUser.findById(req.user.userId);
      if (!businessUser) {
        return res.status(404).json({
          success: false,
          message: 'Business user not found'
        });
      }

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

      if (barcode) {
        const existingBarcode = await Product.findOne({
          businessUserId: req.user.userId,
          barcode: barcode
        });

        if (existingBarcode) {
          return res.status(400).json({
            success: false,
            message: 'Barcode already exists in your inventory'
          });
        }
      }

      const productData = {
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
        taxRate: taxRate || 0,
        status: status || 'active'
      };

      const product = new Product(productData);
      await product.save();

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

  batchCreateProducts: async (req, res) => {
    console.log('📦 [batchCreateProducts] Starting batch creation for user:', req.user.userId);
    
    try {
      const { products, batchSize = 50 } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Products array is required and cannot be empty'
        });
      }

      if (products.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 1000 products allowed per batch'
        });
      }

      const businessUser = await BusinessUser.findById(req.user.userId);
      if (!businessUser) {
        return res.status(404).json({
          success: false,
          message: 'Business user not found'
        });
      }

      console.log(`📋 [batchCreateProducts] Processing ${products.length} products`);

      const validationResults = await validateProductsBatch(products, req.user.userId);
      
      console.log('🔍 [batchCreateProducts] Validation Results:', {
        valid: validationResults.validProducts.length,
        errors: validationResults.errors.length,
        skipped: validationResults.skippedProducts.length
      });

      // Log detailed errors for debugging
      if (validationResults.errors.length > 0) {
        console.log('❌ [batchCreateProducts] Validation Errors:', JSON.stringify(validationResults.errors, null, 2));
      }

      if (validationResults.errors.length > 0 && validationResults.validProducts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All products failed validation',
          totalProducts: products.length,
          validProducts: validationResults.validProducts.length,
          skippedProducts: validationResults.skippedProducts.length,
          errors: validationResults.errors,
          skipped: validationResults.skippedProducts,
          detailedErrors: validationResults.errors.map(err => ({
            row: err.row,
            product: err.product,
            issues: err.errors
          }))
        });
      }

      const results = {
        totalProducts: products.length,
        processedProducts: validationResults.validProducts.length,
        skippedProducts: validationResults.skippedProducts.length,
        successCount: 0,
        failedCount: 0,
        created: [],
        failed: [],
        skipped: validationResults.skippedProducts,
        validationErrors: validationResults.errors
      };

      if (validationResults.validProducts.length > 0) {
        const chunks = chunkArray(validationResults.validProducts, batchSize);
        console.log(`🔄 [batchCreateProducts] Processing ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          try {
            const productsToInsert = chunk.map(product => ({
              businessUserId: req.user.userId,
              businessId: businessUser.businessId,
              name: product.name,
              description: product.description || '',
              category: product.category,
              price: parseFloat(product.price),
              costPrice: parseFloat(product.costPrice) || 0,
              sku: product.sku?.toString().toUpperCase(),
              barcode: product.barcode?.toString(),
              stock: parseInt(product.stock) || 0,
              minStockLevel: parseInt(product.minStockLevel) || 5,
              weight: product.weight ? parseFloat(product.weight) : undefined,
              dimensions: product.dimensions || undefined,
              taxRate: parseFloat(product.taxRate) || 0,
              status: product.status || 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            }));

            const insertedProducts = await Product.insertMany(productsToInsert, { 
              ordered: false
            });

            results.successCount += insertedProducts.length;
            results.created.push(...insertedProducts.map(p => ({ 
              id: p._id, 
              name: p.name, 
              sku: p.sku,
              barcode: p.barcode 
            })));

          } catch (chunkError) {
            console.error(`❌ [batchCreateProducts] Chunk ${i + 1} error:`, chunkError);
            
            if (chunkError.name === 'BulkWriteError' && chunkError.result) {
              const { insertedCount = 0, writeErrors = [] } = chunkError.result;
              
              results.successCount += insertedCount;
              results.failedCount += writeErrors.length;
              
              if (chunkError.insertedDocs) {
                results.created.push(...chunkError.insertedDocs.map(p => ({ 
                  id: p._id, 
                  name: p.name, 
                  sku: p.sku,
                  barcode: p.barcode 
                })));
              }
              
              writeErrors.forEach((error, index) => {
                const failedProduct = chunk[error.index] || chunk[index];
                results.failed.push({
                  product: failedProduct,
                  error: error.errmsg || error.err?.message || 'Unknown database error'
                });
              });
            } else {
              results.failedCount += chunk.length;
              chunk.forEach(product => {
                results.failed.push({
                  product,
                  error: chunkError.message || 'Database insertion failed'
                });
              });
            }
          }
        }
      }

      console.log(`🎉 [batchCreateProducts] Completed: ${results.successCount} created, ${results.skippedProducts} skipped, ${results.failedCount} failed`);

      const hasSuccessfulInserts = results.successCount > 0;
      const responseStatus = hasSuccessfulInserts ? 201 : 400;

      res.status(responseStatus).json({
        success: hasSuccessfulInserts,
        message: `Batch processing completed: ${results.successCount} successful, ${results.failedCount} failed, ${results.skippedProducts} skipped`,
        results: {
          totalProducts: results.totalProducts,
          processedProducts: results.processedProducts,
          successCount: results.successCount,
          failedCount: results.failedCount,
          skippedCount: results.skippedProducts,
          validationErrorCount: results.validationErrors.length,
          successRate: results.processedProducts > 0 ? `${((results.successCount / results.processedProducts) * 100).toFixed(1)}%` : '0%',
          created: results.created,
          failed: results.failed,
          skipped: results.skipped,
          validationErrors: results.validationErrors
        }
      });

    } catch (error) {
      console.error('❌ [batchCreateProducts] Fatal error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during batch processing',
        error: error.message
      });
    }
  },

  getProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = { businessUserId: req.user.userId };
      
      if (category && category !== 'all') {
        filter.category = category;
      }
      
      if (status && status !== 'all') {
        filter.status = status;
      }

      let query = Product.find(filter);
      
      if (search) {
        query = Product.searchProducts(req.user.userId, search);
        if (category && category !== 'all') query = query.where('category', category);
        if (status && status !== 'all') query = query.where('status', status);
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      query = query.sort(sortOptions);

      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = query.skip(skip).limit(parseInt(limit));

      const products = await query.exec();
      
      const totalQuery = search 
        ? Product.searchProducts(req.user.userId, search)
        : Product.find(filter);
        
      if (search) {
        if (category && category !== 'all') totalQuery.where('category', category);
        if (status && status !== 'all') totalQuery.where('status', status);
      }
      
      const total = await totalQuery.countDocuments();

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

  getProduct: async (req, res) => {
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

  updateProduct: async (req, res) => {
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

      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
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

  deleteProduct: async (req, res) => {
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

  updateStock: async (req, res) => {
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

  getLowStockProducts: async (req, res) => {
    try {
      const products = await Product.getLowStockProducts(req.user.userId);

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

  getInventoryStats: async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId) 
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      const stats = await Product.aggregate([
        { 
          $match: { 
            businessUserId: userId
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
                      { $gt: [{ $ifNull: ['$stock', 0] }, 0] }
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

      const result = stats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        totalStock: 0,
        totalValue: 0,
        totalCostValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };

      result.potentialProfit = (result.totalValue || 0) - (result.totalCostValue || 0);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ [getInventoryStats] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

async function validateProductsBatch(products, userId) {
  const errors = [];
  const validProducts = [];
  const skippedProducts = [];
  const seenSKUs = new Set();
  const seenBarcodes = new Set();

  const existingProducts = await Product.find(
    { businessUserId: userId },
    { sku: 1, barcode: 1 }
  );

  const existingSKUs = new Set(existingProducts.map(p => p.sku?.toUpperCase()).filter(Boolean));
  const existingBarcodes = new Set(existingProducts.map(p => p.barcode).filter(Boolean));

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productErrors = [];
    let shouldSkip = false;

    console.log(`🔍 [validateProductsBatch] Validating product ${i + 1}:`, {
      name: product.name,
      category: product.category,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price
    });

    // Required field validation
    if (!product.name || String(product.name).trim() === '') {
      productErrors.push('Product name is required');
    }
    
    if (!product.sku || String(product.sku).trim() === '') {
      productErrors.push('SKU is required');
    }
    
    if (!product.barcode || String(product.barcode).trim() === '') {
      productErrors.push('Barcode is required');
    }
    
    if (!product.category || String(product.category).trim() === '') {
      productErrors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(String(product.category).trim())) {
      productErrors.push(`Invalid category "${product.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    
    // Price validation
    const price = parseFloat(product.price);
    if (isNaN(price) || price <= 0) {
      productErrors.push('Price is required and must be greater than 0');
    }
    
    // Stock validation
    const stock = parseInt(product.stock);
    if (isNaN(stock) || stock < 0) {
      productErrors.push('Stock is required and cannot be negative');
    }
    
    // Min stock level validation
    const minStockLevel = parseInt(product.minStockLevel);
    if (isNaN(minStockLevel) || minStockLevel < 0) {
      productErrors.push('Minimum stock level is required and cannot be negative');
    }
    
    // Status validation
    if (product.status && !['active', 'inactive'].includes(String(product.status).toLowerCase())) {
      productErrors.push('Status must be either "active" or "inactive"');
    }

    // SKU uniqueness validation
    if (product.sku) {
      const upperSKU = String(product.sku).toUpperCase();
      if (existingSKUs.has(upperSKU) || seenSKUs.has(upperSKU)) {
        productErrors.push(`SKU "${product.sku}" already exists`);
      } else {
        seenSKUs.add(upperSKU);
      }
    }

    // Barcode uniqueness validation
    if (product.barcode) {
      const barcodeStr = String(product.barcode);
      if (existingBarcodes.has(barcodeStr) || seenBarcodes.has(barcodeStr)) {
        shouldSkip = true;
        skippedProducts.push({
          row: i + 1,
          product: { 
            name: product.name, 
            sku: product.sku, 
            barcode: product.barcode 
          },
          reason: `Barcode "${product.barcode}" already exists - skipped`
        });
      } else {
        seenBarcodes.add(barcodeStr);
      }
    }

    console.log(`📊 [validateProductsBatch] Product ${i + 1} validation result:`, {
      hasErrors: productErrors.length > 0,
      shouldSkip,
      errors: productErrors
    });

    // Categorize the product
    if (shouldSkip) {
      continue;
    } else if (productErrors.length > 0) {
      errors.push({
        row: i + 1,
        product: { 
          name: product.name, 
          sku: product.sku, 
          barcode: product.barcode 
        },
        errors: productErrors
      });
    } else {
      const cleanProduct = {
        ...product,
        name: String(product.name).trim(),
        sku: String(product.sku).trim(),
        barcode: String(product.barcode).trim(),
        category: String(product.category).trim(),
        description: product.description ? String(product.description).trim() : '',
        price: parseFloat(product.price),
        costPrice: product.costPrice ? parseFloat(product.costPrice) : 0,
        stock: parseInt(product.stock) || 0,
        minStockLevel: parseInt(product.minStockLevel) || 5,
        taxRate: product.taxRate ? parseFloat(product.taxRate) : 0,
        status: product.status ? String(product.status).toLowerCase() : 'active',
        weight: product.weight ? parseFloat(product.weight) : undefined,
        dimensions: product.dimensions || undefined
      };
      
      validProducts.push(cleanProduct);
    }
  }

  console.log(`📊 [validateProductsBatch] Final validation result:`, {
    totalProducts: products.length,
    validProducts: validProducts.length,
    errors: errors.length,
    skipped: skippedProducts.length
  });

  return { validProducts, errors, skippedProducts };
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}