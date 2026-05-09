const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
  },
  category: {
    type: String,
    enum: ['Indian', 'Chinese', 'Burgers', 'Pizza', 'Cafe', 'Other'],
    default: 'Other',
  },
  emoji: {
    type: String,
    default: '🍽️',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  priceFor2: {
    type: String,
    default: '₹200',
  },
  priceLevel: {
    type: String,
    enum: ['₹', '₹₹', '₹₹₹'],
    default: '₹₹',
  },
  isVeg: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  isBusy: {
    type: Boolean,
    default: false,
  },
  deliveryTime: {
    type: String,
    default: '25-35 min',
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  gst: {
    type: String,
  },
  upi: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  openingHours: {
    mon: { open: { type: String, default: '09:00' }, close: { type: String, default: '22:00' }, closed: { type: Boolean, default: false } },
    tue: { open: { type: String, default: '09:00' }, close: { type: String, default: '22:00' }, closed: { type: Boolean, default: false } },
    wed: { open: { type: String, default: '09:00' }, close: { type: String, default: '22:00' }, closed: { type: Boolean, default: false } },
    thu: { open: { type: String, default: '09:00' }, close: { type: String, default: '22:00' }, closed: { type: Boolean, default: false } },
    fri: { open: { type: String, default: '09:00' }, close: { type: String, default: '23:00' }, closed: { type: Boolean, default: false } },
    sat: { open: { type: String, default: '08:00' }, close: { type: String, default: '23:00' }, closed: { type: Boolean, default: false } },
    sun: { open: { type: String, default: '10:00' }, close: { type: String, default: '21:00' }, closed: { type: Boolean, default: false } },
  },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);