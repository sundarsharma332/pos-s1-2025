// routes/sales.js
const express = require('express');
const router = express.Router();
const salesController = require('../controller/transactionController');
const { authenticateUser } = require('../mideleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Transaction CRUD operations
// POST /api/sales/transactions - Create new transaction
router.post('/transactions', salesController.createTransaction);

// GET /api/sales/transactions - Get all transactions with pagination and filters
router.get('/transactions', salesController.getTransactions);

// GET /api/sales/transactions/:id - Get single transaction
router.get('/transactions/:id', salesController.getTransaction);

// PUT /api/sales/transactions/:id - Update transaction
router.put('/transactions/:id', salesController.updateTransaction);

// DELETE /api/sales/transactions/:id - Cancel transaction
router.delete('/transactions/:id', salesController.deleteTransaction);

// Analytics and reports
// GET /api/sales/stats - Get sales statistics
router.get('/stats', salesController.getSalesStats);

module.exports = router;