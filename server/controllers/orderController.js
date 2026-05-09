const Order      = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { sendPushToUser } = require('../routes/push');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private - customer
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      restaurantId, items, orderMode,
      tableNo, subtotal, tax,
      platformFee, grandTotal, note,
    } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const token = await Order.generateToken(restaurantId);

    const order = await Order.create({
      customer:    req.user._id,
      restaurant:  restaurantId,
      items,
      token,
      orderMode,
      tableNo:     orderMode === 'takeaway' ? 'Takeaway' : tableNo,
      subtotal,
      tax,
      platformFee: platformFee || 5,
      grandTotal,
      note:        note || '',
      status:      'confirmed',
      confirmedAt: new Date(),
    });

    await order.populate('restaurant', 'name cuisine');

    // ── Emit to restaurant dashboard in real-time ──
    const io = req.app.get('io');
    io.to(`restaurant_${restaurantId}`).emit('new_order', {
      order: {
        ...order.toObject(),
        customer: { name: req.user.name, phone: req.user.phone },
      },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my orders (customer)
// @route   GET /api/orders/my
// @access  Private - customer
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name cuisine emoji')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name cuisine emoji')
      .populate('customer',   'name phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for a restaurant
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private - restaurant or admin
exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = { restaurant: req.params.restaurantId };

    // Filter by status
    if (status && status !== 'all') query.status = status;

    // Always show today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    query.createdAt = { $gte: today, $lt: tomorrow };

    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private - restaurant or admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['confirmed', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'preparing')  order.preparingAt = new Date();
    if (status === 'ready')      order.readyAt     = new Date();
    if (status === 'served')     order.servedAt    = new Date();
    if (status === 'cancelled')  order.cancelledAt = new Date();

    // When served — mark ALL items as called so customer sees full update
    if (status === 'served') {
      order.items.forEach((item, idx) => {
        order.items[idx].itemStatus = 'called';
      });
      order.markModified('items');
    }

    // When ready — mark all pending/preparing items as ready
    if (status === 'ready') {
      order.items.forEach((item, idx) => {
        if (order.items[idx].itemStatus !== 'called') {
          order.items[idx].itemStatus = 'ready';
        }
      });
      order.markModified('items');
    }

    await order.save();

    const io = req.app.get('io');

    // Notify customer — include full items so Token page updates live
    io.to(`order_${order._id}`).emit('order_status_update', {
      orderId: order._id,
      token:   order.token,
      status,
      items:   order.items,
    });

    // Notify restaurant dashboard
    io.to(`restaurant_${order.restaurant}`).emit('order_updated', {
      orderId: order._id,
      status,
      items:   order.items,
    });

    // Send push notification to customer
    const pushPayloads = {
      preparing: {
        title: '👨‍🍳 Order being prepared!',
        body:  `Token #${order.token} — Your food is being cooked.`,
        icon:  '/logo192.png',
        url:   `/token/${order._id}`,
      },
      ready: {
        title: '✅ Order Ready!',
        body:  `Token #${order.token} — Your food is ready! Please collect.`,
        icon:  '/logo192.png',
        url:   `/token/${order._id}`,
      },
      served: {
        title: '🍽️ Enjoy your meal!',
        body:  `Token #${order.token} — Your order has been served.`,
        icon:  '/logo192.png',
        url:   `/token/${order._id}`,
      },
    };

    if (pushPayloads[status]) {
      await sendPushToUser(order.customer, pushPayloads[status]);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/orders/stats/:restaurantId
// @access  Private - restaurant or admin
exports.getRestaurantStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.find({
      restaurant: req.params.restaurantId,
      createdAt:  { $gte: today, $lt: tomorrow },
    });

    const totalOrders  = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const activeTokens = todayOrders.filter(o =>
      ['confirmed', 'preparing', 'ready'].includes(o.status)
    ).length;

    const servedOrders = todayOrders.filter(o => o.servedAt && o.confirmedAt);
    const avgPrepTime  = servedOrders.length > 0
      ? Math.round(servedOrders.reduce((sum, o) =>
          sum + (new Date(o.servedAt) - new Date(o.confirmedAt)) / 60000, 0
        ) / servedOrders.length)
      : 0;

    res.status(200).json({
      success: true,
      data: { totalOrders, totalRevenue, activeTokens, avgPrepTime },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update individual item status within an order
// @route   PATCH /api/orders/:id/item-status
// @access  Private - restaurant or admin
exports.updateItemStatus = async (req, res, next) => {
  try {
    const { itemIndex, itemStatus } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'called'];
    if (!validStatuses.includes(itemStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid item status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (itemIndex < 0 || itemIndex >= order.items.length) {
      return res.status(400).json({ success: false, message: 'Invalid item index' });
    }

    const calledItem = order.items[itemIndex];

    // Update individual item status
    order.items[itemIndex].itemStatus = itemStatus;

    // Auto-update order status based on all items
    // 'called' counts as done for order-level status
    const allItems      = order.items;
    const allDone       = allItems.every(i => ['ready','called'].includes(i.itemStatus));
    const anyPreparing  = allItems.some(i => i.itemStatus === 'preparing');
    const anyReadyOrCalled = allItems.some(i => ['ready','called'].includes(i.itemStatus));

    if (allDone) {
      order.status  = 'ready';
      order.readyAt = new Date();
    } else if (anyPreparing || anyReadyOrCalled) {
      order.status = 'preparing';
      if (!order.preparingAt) order.preparingAt = new Date();
    }

    await order.save();

    const io = req.app.get('io');

    // If item is being called — send push + emit socket
    if (itemStatus === 'called') {
      await sendPushToUser(order.customer, {
        title: `📢 ${calledItem.emoji} ${calledItem.name} is Ready!`,
        body:  `Token #${order.token} — Please collect ${calledItem.name} ×${calledItem.qty}`,
        icon:  '/logo192.png',
        url:   `/token/${order._id}`,
      });

      io.to(`order_${order._id}`).emit('item_called', {
        orderId:   order._id,
        token:     order.token,
        tableNo:   order.tableNo,
        itemName:  calledItem.name,
        itemEmoji: calledItem.emoji,
        itemQty:   calledItem.qty,
        itemIndex,
        items:     order.items,
      });
    }

    // Always notify customer of item update
    io.to(`order_${order._id}`).emit('order_status_update', {
      orderId: order._id,
      token:   order.token,
      status:  order.status,
      items:   order.items,
    });

    // Notify restaurant dashboard
    io.to(`restaurant_${order.restaurant}`).emit('order_updated', {
      orderId: order._id,
      status:  order.status,
      items:   order.items,
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};