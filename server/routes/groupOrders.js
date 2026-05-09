const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  createGroupOrder,
  joinGroupOrder,
  updateMyItems,
  getGroupOrder,
  placeGroupOrder,
} = require('../controllers/groupOrderController');

router.post('/',                  protect, createGroupOrder);  // Host creates
router.get('/:code',              protect, getGroupOrder);     // Get group details
router.post('/:code/join',        protect, joinGroupOrder);    // Friend joins
router.put('/:code/items',        protect, updateMyItems);     // Add/update items
router.post('/:code/place',       protect, placeGroupOrder);   // Host places order

module.exports = router;