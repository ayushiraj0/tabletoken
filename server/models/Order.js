const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem:   { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name:       { type: String,  required: true },
  price:      { type: Number,  required: true },
  emoji:      { type: String,  default: '🍽️' },
  isVeg:      { type: Boolean, default: true  },
  qty:        { type: Number,  required: true, min: 1 },
  itemStatus: {
    type:    String,
    enum:    ['pending', 'preparing', 'ready', 'called'],
    default: 'pending',
  },
});

const orderSchema = new mongoose.Schema({
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items:      [orderItemSchema],

  token:     { type: Number, required: true },
  orderMode: { type: String, enum: ['dine','takeaway'], default: 'dine' },
  tableNo:   { type: String, default: '' },

  subtotal:    { type: Number, required: true },
  tax:         { type: Number, required: true },
  platformFee: { type: Number, default: 5     },
  grandTotal:  { type: Number, required: true },

  status: {
    type:    String,
    enum:    ['confirmed', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'confirmed',
  },

  note:        { type: String, default: '' },
  confirmedAt: { type: Date, default: Date.now },
  preparingAt: { type: Date },
  readyAt:     { type: Date },
  servedAt:    { type: Date },
  cancelledAt: { type: Date },

  paymentStatus: { type: String, enum: ['pending','paid','refunded'], default: 'paid'   },
  paymentMethod: { type: String, enum: ['online','cash','wallet'],    default: 'online' },
}, { timestamps: true });

orderSchema.statics.generateToken = async function (restaurantId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastOrder = await this.findOne({
    restaurant: restaurantId,
    createdAt:  { $gte: today },
  }).sort({ token: -1 });
  return lastOrder ? (lastOrder.token % 99) + 1 : 1;
};

module.exports = mongoose.model('Order', orderSchema);