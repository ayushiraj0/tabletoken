const express = require('express');
const router  = express.Router();
const {
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

router.put('/:id',          protect, authorize('admin', 'restaurant'), updateMenuItem);
router.delete('/:id',       protect, authorize('admin', 'restaurant'), deleteMenuItem);
router.patch('/:id/toggle', protect, authorize('admin', 'restaurant'), toggleAvailability);

module.exports = router;