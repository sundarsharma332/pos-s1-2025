// routes/inventory.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventoryController');
const { authenticateUser } = require('../mideleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Product CRUD operations
// POST /api/inventory/products - Create new product
router.post('/products', inventoryController.createProduct);

// POST /api/inventory/products/batch - Batch create products
router.post('/products/batch', inventoryController.batchCreateProducts);

// GET /api/inventory/products - Get all products with pagination and filters
router.get('/products', inventoryController.getProducts);

// GET /api/inventory/products/:id - Get single product
router.get('/products/:id', inventoryController.getProduct);

// PUT /api/inventory/products/:id - Update product
router.put('/products/:id', inventoryController.updateProduct);

// DELETE /api/inventory/products/:id - Delete product
router.delete('/products/:id', inventoryController.deleteProduct);

// Stock management
// PATCH /api/inventory/products/:id/stock - Update product stock
router.patch('/products/:id/stock', inventoryController.updateStock);

// Analytics and reports
// GET /api/inventory/low-stock - Get low stock products
router.get('/low-stock', inventoryController.getLowStockProducts);

// GET /api/inventory/stats - Get inventory statistics
router.get('/stats', inventoryController.getInventoryStats);

module.exports = router;