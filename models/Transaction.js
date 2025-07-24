// // const mongoose = require('mongoose');

// // const transactionItemSchema = new mongoose.Schema({
// //   productId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Product',
// //     required: true
// //   },
// //   productName: {
// //     type: String,
// //     required: true
// //   },
// //   sku: {
// //     type: String,
// //     required: true
// //   },
// //   quantity: {
// //     type: Number,
// //     required: true,
// //     min: 1
// //   },
// //   unitPrice: {
// //     type: Number,
// //     required: true,
// //     min: 0
// //   },
// //   totalPrice: {
// //     type: Number,
// //     required: true,
// //     min: 0
// //   }
// // });

// // const transactionSchema = new mongoose.Schema({
// //   businessUserId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'BusinessUser',
// //     required: true,
// //     index: true
// //   },
// //   businessId: {
// //     type: String,
// //     required: true,
// //     index: true
// //   },
// //   transactionNumber: {
// //     type: String,
// //     // REQUIRED CHANGE: Remove `required: true` here
// //     unique: true
// //   },
// //   items: [transactionItemSchema],
// //   subtotal: {
// //     type: Number,
// //     required: true,
// //     min: 0
// //   },
// //   taxAmount: {
// //     type: Number,
// //     default: 0,
// //     min: 0
// //   },
// //   discountAmount: {
// //     type: Number,
// //     default: 0,
// //     min: 0
// //   },
// //   totalAmount: {
// //     type: Number,
// //     required: true,
// //     min: 0
// //   },
// //   paymentMethod: {
// //     type: String,
// //     enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'other'],
// //     default: 'cash'
// //   },
// //   status: {
// //     type: String,
// //     enum: ['completed', 'pending', 'cancelled', 'refunded'],
// //     default: 'completed'
// //   },
// //   customerName: {
// //     type: String,
// //     trim: true
// //   },
// //   customerEmail: {
// //     type: String,
// //     trim: true,
// //     lowercase: true
// //   },
// //   customerPhone: {
// //     type: String,
// //     trim: true
// //   },
// //   notes: {
// //     type: String,
// //     trim: true
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now,
// //     index: true
// //   },
// //   updatedAt: {
// //     type: Date,
// //     default: Date.now
// //   }
// // });

// // // Generate transaction number
// // transactionSchema.pre('save', async function(next) {
// //   if (this.isNew) {
// //     const today = new Date();
// //     const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
// //     const count = await this.constructor.countDocuments({
// //       businessUserId: this.businessUserId,
// //       createdAt: {
// //         $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
// //         $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
// //       }
// //     });
// //     this.transactionNumber = `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
// //   }
// //   this.updatedAt = new Date();
// //   next();
// // });

// // // Static method to search transactions
// // transactionSchema.statics.searchTransactions = function(businessUserId, searchTerm) {
// //   return this.find({
// //     businessUserId,
// //     $or: [
// //       { transactionNumber: { $regex: searchTerm, $options: 'i' } },
// //       { customerName: { $regex: searchTerm, $options: 'i' } },
// //       { customerEmail: { $regex: searchTerm, $options: 'i' } },
// //       { 'items.productName': { $regex: searchTerm, $options: 'i' } },
// //       { 'items.sku': { $regex: searchTerm, $options: 'i' } }
// //     ]
// //   });
// // };

// // module.exports = mongoose.model('Transaction', transactionSchema);


// // models/Transaction.js

// const mongoose = require('mongoose');

// // Schema for individual items within a transaction
// const transactionItemSchema = new mongoose.Schema({
//   productId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product', // Reference to your Product model
//     required: true
//   },
//   productName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   sku: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: [1, 'Quantity must be at least 1']
//   },
//   unitPrice: {
//     type: Number,
//     required: true,
//     min: [0, 'Unit price cannot be negative']
//   },
//   totalPrice: { // Calculated: quantity * unitPrice
//     type: Number,
//     required: true,
//     min: [0, 'Total price cannot be negative']
//   }
// }, { _id: true }); // _id: true ensures each item in the array has its own _id

// // Main Transaction Schema
// const transactionSchema = new mongoose.Schema({
//   businessUserId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'BusinessUser', // Reference to your BusinessUser model
//     required: true,
//     index: true // Index for faster queries
//   },
//   businessId: { // This might be a string ID from your Business model or similar
//     type: String,
//     required: true,
//     index: true // Index for faster queries
//   },
//   transactionNumber: {
//     type: String,
//     // IMPORTANT CHANGE: Removed 'required: true' here.
//     // The pre-save hook will generate this before validation.
//     unique: true, // Ensures unique transaction numbers
//     trim: true
//   },
//   items: [transactionItemSchema], // Array of sub-documents for transaction items
//   subtotal: {
//     type: Number,
//     required: true,
//     min: [0, 'Subtotal cannot be negative']
//   },
//   taxAmount: {
//     type: Number,
//     default: 0,
//     min: [0, 'Tax amount cannot be negative']
//   },
//   discountAmount: {
//     type: Number,
//     default: 0,
//     min: [0, 'Discount amount cannot be negative']
//   },
//   totalAmount: { // Final amount to be paid
//     type: Number,
//     required: true,
//     min: [0, 'Total amount cannot be negative']
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cash', 'card'],
//     default: 'cash'
//   },
//   status: {
//     type: String,
//     enum: ['completed', 'pending', 'cancelled', 'refunded'],
//     default: 'completed' // Most transactions will be completed immediately
//   },
//   customerName: {
//     type: String,
//     trim: true,
//     default: 'Walk-in Customer' // Default for quick transactions
//   },
//   customerEmail: {
//     type: String,
//     trim: true,
//     lowercase: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'], // Basic email validation
//     sparse: true // Allows null/undefined if not provided, still enforces uniqueness if present
//   },
//   customerPhone: {
//     type: String,
//     trim: true,
//     // Add more robust phone validation if needed
//     sparse: true
//   },
//   notes: {
//     type: String,
//     trim: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     index: true // Index for date-based queries (e.g., reports by day/week/month)
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Pre-save hook to generate transactionNumber and update updatedAt timestamp
// transactionSchema.pre('save', async function(next) {
//   // Only generate transactionNumber if it's a new document
//   if (this.isNew) {
//     const today = new Date();
//     // Format date as YYYYMMDD (e.g., 20250715)
//     const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

//     // Count existing transactions for the same business user on the same day
//     const count = await this.constructor.countDocuments({
//       businessUserId: this.businessUserId,
//       createdAt: {
//         $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()), // Start of today
//         $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) // Start of tomorrow
//       }
//     });

//     // Generate unique transaction number: TXN-YYYYMMDD-####
//     this.transactionNumber = `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
//   }
//   // Always update updatedAt on save
//   this.updatedAt = new Date();
//   next();
// });

// // Static method to search transactions (useful for reports/search features)
// transactionSchema.statics.searchTransactions = function(businessUserId, searchTerm) {
//   const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive regex
//   return this.find({
//     businessUserId, // Filter by the specific business user
//     $or: [ // Search across multiple fields
//       { transactionNumber: searchRegex },
//       { customerName: searchRegex },
//       { customerEmail: searchRegex },
//       { 'items.productName': searchRegex }, // Search within nested item names
//       { 'items.sku': searchRegex } // Search within nested item SKUs
//     ]
//   });
// };

// module.exports = mongoose.model('Transaction', transactionSchema);



// models/Transaction.js

const mongoose = require('mongoose');

// Schema for individual items within a transaction
const transactionItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  // ✅ NEW COST TRACKING FIELDS
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Total cost cannot be negative'],
    default: 0
  }
}, { _id: true });

// Main Transaction Schema
const transactionSchema = new mongoose.Schema({
  businessUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessUser',
    required: true,
    index: true
  },
  businessId: {
    type: String,
    required: true,
    index: true
  },
  transactionNumber: {
    type: String,
    unique: true,
    trim: true
  },
  items: [transactionItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  // ✅ NEW COST TRACKING FIELD
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Total cost cannot be negative'],
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'ebt', 'wallet', 'check', 'others'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'refunded'],
    default: 'completed'
  },
  customerName: {
    type: String,
    trim: true,
    default: 'Walk-in Customer'
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    sparse: true
  },
  customerPhone: {
    type: String,
    trim: true,
    sparse: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ NEW VIRTUAL: Calculate profit for this transaction
transactionSchema.virtual('profit').get(function() {
  return this.totalAmount - this.totalCost;
});

// ✅ NEW VIRTUAL: Calculate profit margin percentage
transactionSchema.virtual('profitMargin').get(function() {
  if (this.totalAmount > 0) {
    return ((this.totalAmount - this.totalCost) / this.totalAmount * 100).toFixed(2);
  }
  return 0;
});

// Pre-save hook to generate transactionNumber and update updatedAt timestamp
transactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await this.constructor.countDocuments({
      businessUserId: this.businessUserId,
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });

    this.transactionNumber = `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// Static method to search transactions
transactionSchema.statics.searchTransactions = function(businessUserId, searchTerm) {
  const searchRegex = new RegExp(searchTerm, 'i');
  return this.find({
    businessUserId,
    $or: [
      { transactionNumber: searchRegex },
      { customerName: searchRegex },
      { customerEmail: searchRegex },
      { 'items.productName': searchRegex },
      { 'items.sku': searchRegex }
    ]
  });
};

module.exports = mongoose.model('Transaction', transactionSchema);