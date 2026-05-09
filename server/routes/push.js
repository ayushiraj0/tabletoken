const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const User     = require('../models/User');
const webpush  = require('../config/webpush');

// @desc    Save push subscription
// @route   POST /api/push/subscribe
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'No subscription provided' });
    }

    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });

    res.status(200).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Unsubscribe from push
// @route   POST /api/push/unsubscribe
// @access  Private
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: null });
    res.status(200).json({ success: true, message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper — send push to a user
const sendPushToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (!user?.pushSubscription) return;

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null });
    }
    console.error('Push failed:', err.message);
  }
};

module.exports = { router, sendPushToUser };