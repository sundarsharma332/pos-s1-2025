// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Link to business user
  businessUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessUser',
    required: true
  },
  businessId: {
    type: String,
    required: true
  },
  
  // Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Food & Beverages',
      'Electronics',
      'Clothing',
      'Books',
      'Health & Beauty',
      'Home & Garden',
      'Sports',
      'Automotive',
      'Office Supplies',
      'Other'
    ]
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  
  // Inventory Management
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true,
    default: null
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    min: [0, 'Minimum stock level cannot be negative'],
    default: 5
  },
  
  // Product Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  // Additional Details
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    default: null
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  
  // Tax Information
  taxRate: {
    type: Number,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
    default: 0
  },
  
  // Image URL (for future image upload feature)
  imageUrl: {
    type: String,
    default: null
  },
  
  // Tracking
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  lastSoldDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ businessUserId: 1 });
productSchema.index({ businessId: 1 });
productSchema.index({ sku: 1, businessUserId: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice && this.costPrice > 0) {
    return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for low stock alert
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStockLevel;
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    // Generate SKU: First 3 chars of name + timestamp
    const namePrefix = this.name.replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${namePrefix}${timestamp}`;
  }
  next();
});

// Static method to get low stock products for a business
productSchema.statics.getLowStockProducts = function(businessUserId) {
  return this.find({
    businessUserId,
    $expr: { $lte: ['$stock', '$minStockLevel'] },
    status: 'active'
  }).sort({ stock: 1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(businessUserId, searchTerm) {
  return this.find({
    businessUserId,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { sku: { $regex: searchTerm, $options: 'i' } },
      { barcode: { $regex: searchTerm, $options: 'i' } }
    ],
    status: 'active'
  });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'add') {
    this.stock += quantity;
  } else if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === 'set') {
    this.stock = Math.max(0, quantity);
  }
  return this.save();
};

// Instance method to record sale
productSchema.methods.recordSale = function(quantity) {
  this.totalSold += quantity;
  this.lastSoldDate = new Date();
  this.stock = Math.max(0, this.stock - quantity);
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);