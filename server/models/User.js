const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // never return password in queries
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'admin'],
    default: 'customer',
  },
  // Only for restaurant owners
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null,
  },
  restaurantName: {
    type: String,
    default: null,
  },
  // Email verification
  isVerified: {
    type:    Boolean,
    default: false,
  },
  verificationToken: {
    type:    String,
    default: null,
  },
  verificationTokenExpiry: {
    type:    Date,
    default: null,
  },

  // Push notification subscription
  pushSubscription: {
    type:    Object,
    default: null,
  },

  // Password reset
  resetPasswordToken: {
    type:    String,
    default: null,
  },
  resetPasswordExpiry: {
    type:    Date,
    default: null,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);