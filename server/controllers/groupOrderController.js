const GroupOrder = require('../models/GroupOrder');
const Order      = require('../models/Order');
const { nanoid } = require('nanoid');

// Create group order
exports.createGroupOrder = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;
    const code = nanoid(8).toUpperCase(); // e.g. "AB12CD34"

    const group = await GroupOrder.create({
      host:       req.user._id,
      restaurant: restaurantId,
      code,
      members: [{
        user:  req.user._id,
        name:  req.user.name,
        items: [],
      }],
    });

    await group.populate('restaurant', 'name cuisine emoji');
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Get group order by code
exports.getGroupOrder = async (req, res, next) => {
  try {
    const group = await GroupOrder.findOne({ code: req.params.code })
      .populate('restaurant', 'name cuisine emoji _id')
      .populate('members.user', 'name');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Join group order
exports.joinGroupOrder = async (req, res, next) => {
  try {
    const group = await GroupOrder.findOne({ code: req.params.code });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    if (group.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Group order is locked' });
    }

    // Check if already a member
    const alreadyMember = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      group.members.push({
        user:  req.user._id,
        name:  req.user.name,
        items: [],
      });
      await group.save();
    }

    await group.populate('restaurant', 'name cuisine emoji _id');

    // Notify all members via socket
    const io = req.app.get('io');
    io.to(`group_${group.code}`).emit('member_joined', {
      name: req.user.name,
    });

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Update my items in group
exports.updateMyItems = async (req, res, next) => {
  try {
    const { items } = req.body;
    const group = await GroupOrder.findOne({ code: req.params.code });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIndex = group.members.findIndex(
      m => m.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(403).json({ success: false, message: 'You are not in this group' });
    }

    group.members[memberIndex].items = items;
    await group.save();

    // Notify host and all members via socket
    const io = req.app.get('io');
    io.to(`group_${group.code}`).emit('items_updated', {
      userId: req.user._id,
      name:   req.user.name,
      items,
    });

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Host places the final combined order
exports.placeGroupOrder = async (req, res, next) => {
  try {
    const { tableNo, orderMode } = req.body;
    const group = await GroupOrder.findOne({ code: req.params.code })
      .populate('restaurant');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only host can place
    if (group.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only host can place the order' });
    }

    // Combine all items from all members
    const allItems = [];
    group.members.forEach(member => {
      member.items.forEach(item => {
        // Check if item already exists in combined list
        const existing = allItems.find(i => i.name === item.name);
        if (existing) {
          existing.qty += item.qty;
        } else {
          allItems.push({
            ...item.toObject(),
            addedBy: member.name, // track who added
          });
        }
      });
    });

    if (allItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in group order' });
    }

    // Calculate totals
    const subtotal    = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax         = Math.round(subtotal * 0.05);
    const platformFee = 5;
    const grandTotal  = subtotal + tax + platformFee;

    // Generate token
    const token = await Order.generateToken(group.restaurant._id);

    // Create the order
    const order = await Order.create({
      customer:   req.user._id,
      restaurant: group.restaurant._id,
      items:      allItems,
      token,
      orderMode:  orderMode || 'dine',
      tableNo:    tableNo || 'Group Order',
      subtotal,
      tax,
      platformFee,
      grandTotal,
      note:       `Group Order — ${group.members.length} people — Code: ${group.code}`,
      status:     'confirmed',
      confirmedAt: new Date(),
    });

    // Lock the group
    group.status  = 'placed';
    group.orderId = order._id;
    group.tableNo = tableNo;
    await group.save();

    // Notify all members
    const io = req.app.get('io');
    io.to(`group_${group.code}`).emit('order_placed', {
      orderId: order._id,
      token:   order.token,
    });

    // Notify restaurant
    io.to(`restaurant_${group.restaurant._id}`).emit('new_order', {
      order: { ...order.toObject(), customer: { name: req.user.name } },
    });

    res.status(201).json({ success: true, data: { order, group } });
  } catch (error) {
    next(error);
  }
};