const express = require('express');
const router  = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrder,
  getRestaurantOrders,
  updateOrderStatus,
  getRestaurantStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/',     protect, authorize('customer'), placeOrder);
router.get('/my',    protect, authorize('customer'), getMyOrders);
router.get('/:id',   protect, getOrder);

// Dashboard routes
router.get('/restaurant/:restaurantId',        protect, authorize('admin', 'restaurant'), getRestaurantOrders);
router.get('/stats/:restaurantId',             protect, authorize('admin', 'restaurant'), getRestaurantStats);
router.patch('/:id/status',                    protect, authorize('admin', 'restaurant'), updateOrderStatus);

module.exports = router;

// Item level status update
const { updateItemStatus } = require('../controllers/orderController');
router.patch('/:id/item-status', protect, authorize('admin', 'restaurant'), updateItemStatus);