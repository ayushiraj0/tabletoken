const MenuItem   = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

// @desc    Get all menu items for a restaurant
// @route   GET /api/restaurants/:restaurantId/menu
// @access  Public
exports.getMenuItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({
      restaurant:  req.params.restaurantId,
      isAvailable: true,
    });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ALL menu items including unavailable (for dashboard)
// @route   GET /api/restaurants/:restaurantId/menu/all
// @access  Private - restaurant or admin
exports.getAllMenuItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.restaurantId });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

// @desc    Add menu item
// @route   POST /api/restaurants/:restaurantId/menu
// @access  Private - restaurant or admin
exports.addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Only owner or admin
    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const item = await MenuItem.create({
      ...req.body,
      restaurant: req.params.restaurantId,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private - restaurant or admin
exports.updateMenuItem = async (req, res, next) => {
  try {
    let item = await MenuItem.findById(req.params.id).populate('restaurant');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (item.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new:           true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private - restaurant or admin
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('restaurant');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (item.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle availability
// @route   PATCH /api/menu/:id/toggle
// @access  Private - restaurant or admin
exports.toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};