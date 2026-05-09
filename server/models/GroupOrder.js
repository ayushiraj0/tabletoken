const mongoose = require('mongoose');

const groupOrderSchema = new mongoose.Schema({
  // Who created the group
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },

  // Unique shareable link code
  code: {
    type: String,
    required: true,
    unique: true,
  },

  // Status of group order
  status: {
    type: String,
    enum: ['open', 'locked', 'placed'],
    default: 'open',
  },

  // Each member and their items
  members: [
    {
      user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name:  { type: String },
      items: [
        {
          menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
          name:     { type: String  },
          price:    { type: Number  },
          emoji:    { type: String  },
          isVeg:    { type: Boolean },
          qty:      { type: Number  },
        },
      ],
    },
  ],

  // Table info filled by host when placing
  tableNo:   { type: String, default: '' },
  orderMode: { type: String, enum: ['dine','takeaway'], default: 'dine' },

  // Final placed order reference
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

}, { timestamps: true });

module.exports = mongoose.model('GroupOrder', groupOrderSchema);