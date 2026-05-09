const express = require('express');
const router  = express.Router();
const {
  getAllRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  getMyRestaurant,
} = require('../controllers/restaurantController');
const {
  getMenuItems,
  getAllMenuItems,
  addMenuItem,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/',    getAllRestaurants);
router.get('/my',  protect, authorize('restaurant'), getMyRestaurant);
router.get('/:id', getRestaurant);

// Protected routes
router.post('/', protect, authorize('admin'), createRestaurant);
router.put('/:id', protect, authorize('admin', 'restaurant'), updateRestaurant);

// Menu routes nested under restaurant
router.get('/:restaurantId/menu',     getMenuItems);
router.get('/:restaurantId/menu/all', protect, authorize('admin', 'restaurant'), getAllMenuItems);
router.post('/:restaurantId/menu',    protect, authorize('admin', 'restaurant'), addMenuItem);

module.exports = router;