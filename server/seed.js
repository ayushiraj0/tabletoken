const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const User       = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem   = require('./models/MenuItem');

dotenv.config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Clear existing data ──────────────────────────
  await User.deleteMany({});
  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ── Create Admin ─────────────────────────────────
  const admin = await User.create({
    name:     'Super Admin',
    isVerified: true,
    email:    'admin@tabletoken.com',
    phone:    '9999999999',
    password: 'admin123',
    role:     'admin',
  });
  console.log('👤 Admin created: admin@tabletoken.com / admin123');

  // ── Create Restaurant Owners ──────────────────────
  const owner1 = await User.create({
    name:     'Rajesh Kumar',
    email:    'owner@spicegarden.com',
    phone:    '9876543210',
    password: 'spice123',
    role:     'restaurant',
  });

  const owner2 = await User.create({
    name:     'Amit Shah',
    isVerified: true,
    email:    'owner@burgerrepublic.com',
    phone:    '9876543211',
    password: 'burger123',
    role:     'restaurant',
  });

  const owner3 = await User.create({
    name:     'Chen Wei',
    isVerified: true,
    email:    'owner@dragonwok.com',
    phone:    '9876543212',
    password: 'dragon123',
    role:     'restaurant',
  });

  // ── Create Restaurants ────────────────────────────
  const spiceGarden = await Restaurant.create({
    name:         'Spice Garden',
    description:  'Authentic North Indian and Mughlai cuisine in the heart of Dhanbad',
    cuisine:      'North Indian · Mughlai',
    category:     'Indian',
    emoji:        '🍛',
    rating:       4.6,
    totalRatings: 320,
    priceFor2:    '₹200',
    priceLevel:   '₹₹',
    isVeg:        true,
    isOpen:       true,
    isBusy:       false,
    deliveryTime: '25-35 min',
    address:      '12, Food Court, Sector 5, Dhanbad, Jharkhand - 826001',
    phone:        '0326-2345678',
    email:        'owner@spicegarden.com',
    owner:        owner1._id,
  });

  const burgerRepublic = await Restaurant.create({
    name:         'Burger Republic',
    description:  'Best American style burgers and fast food in Dhanbad',
    cuisine:      'American · Fast Food',
    category:     'Burgers',
    emoji:        '🍔',
    rating:       4.3,
    totalRatings: 215,
    priceFor2:    '₹350',
    priceLevel:   '₹₹',
    isVeg:        false,
    isOpen:       true,
    isBusy:       false,
    deliveryTime: '15-20 min',
    address:      '45, Main Road, Bank More, Dhanbad, Jharkhand - 826001',
    phone:        '0326-3456789',
    email:        'owner@burgerrepublic.com',
    owner:        owner2._id,
  });

  const dragonWok = await Restaurant.create({
    name:         'Dragon Wok',
    description:  'Authentic Chinese and Thai dishes made fresh to order',
    cuisine:      'Chinese · Thai',
    category:     'Chinese',
    emoji:        '🍜',
    rating:       4.4,
    totalRatings: 180,
    priceFor2:    '₹280',
    priceLevel:   '₹₹',
    isVeg:        false,
    isOpen:       true,
    isBusy:       true,
    deliveryTime: '20-30 min',
    address:      '8, Shastri Nagar, Dhanbad, Jharkhand - 826001',
    phone:        '0326-4567890',
    email:        'owner@dragonwok.com',
    owner:        owner3._id,
  });

  // ── Update owners with restaurantId ───────────────
  await User.findByIdAndUpdate(owner1._id, { restaurantId: spiceGarden._id,    restaurantName: 'Spice Garden'    });
  await User.findByIdAndUpdate(owner2._id, { restaurantId: burgerRepublic._id,  restaurantName: 'Burger Republic' });
  await User.findByIdAndUpdate(owner3._id, { restaurantId: dragonWok._id,       restaurantName: 'Dragon Wok'      });

  console.log('🏪 3 Restaurants created');

  // ── Spice Garden Menu ─────────────────────────────
  await MenuItem.insertMany([
    { restaurant: spiceGarden._id, name: 'Veg Seekh Kebab',   category: 'Starters',      price: 180, emoji: '🥗', isVeg: true,  isAvailable: true,  description: 'Spiced cottage cheese & vegetables grilled in tandoor. Served with mint chutney.' },
    { restaurant: spiceGarden._id, name: 'Chicken Tikka',     category: 'Starters',      price: 280, emoji: '🍗', isVeg: false, isAvailable: true,  description: 'Marinated chicken pieces grilled in tandoor with aromatic spices and yogurt.' },
    { restaurant: spiceGarden._id, name: 'Paneer Tikka',      category: 'Starters',      price: 220, emoji: '🧀', isVeg: true,  isAvailable: true,  description: 'Fresh cottage cheese marinated overnight in yogurt, ginger and spices.' },
    { restaurant: spiceGarden._id, name: 'Dal Makhani',       category: 'Main Course',   price: 160, emoji: '🍲', isVeg: true,  isAvailable: true,  description: 'Slow cooked black lentils simmered overnight in butter, cream and tomato.' },
    { restaurant: spiceGarden._id, name: 'Butter Chicken',    category: 'Main Course',   price: 280, emoji: '🍛', isVeg: false, isAvailable: true,  description: 'Tender chicken in rich tomato-based butter gravy. A classic Punjabi dish.' },
    { restaurant: spiceGarden._id, name: 'Palak Paneer',      category: 'Main Course',   price: 200, emoji: '🥬', isVeg: true,  isAvailable: true,  description: 'Cottage cheese cubes in smooth spiced spinach gravy.' },
    { restaurant: spiceGarden._id, name: 'Garlic Naan',       category: 'Breads',        price: 40,  emoji: '🫓', isVeg: true,  isAvailable: true,  description: 'Soft leavened bread baked in tandoor with garlic and butter.' },
    { restaurant: spiceGarden._id, name: 'Butter Roti',       category: 'Breads',        price: 30,  emoji: '🫓', isVeg: true,  isAvailable: true,  description: 'Whole wheat flatbread served with butter.' },
    { restaurant: spiceGarden._id, name: 'Veg Biryani',       category: 'Rice & Biryani', price: 180, emoji: '🍚', isVeg: true,  isAvailable: true,  description: 'Fragrant basmati rice cooked with mixed vegetables and whole spices.' },
    { restaurant: spiceGarden._id, name: 'Chicken Biryani',   category: 'Rice & Biryani', price: 250, emoji: '🍚', isVeg: false, isAvailable: true,  description: 'Slow-cooked basmati rice layered with marinated chicken.' },
    { restaurant: spiceGarden._id, name: 'Masala Chai',       category: 'Beverages',     price: 40,  emoji: '🫖', isVeg: true,  isAvailable: true,  description: 'Classic Indian spiced tea with ginger, cardamom and fresh milk.' },
    { restaurant: spiceGarden._id, name: 'Mango Lassi',       category: 'Beverages',     price: 80,  emoji: '🥭', isVeg: true,  isAvailable: true,  description: 'Chilled yogurt-based drink blended with sweet Alphonso mangoes.' },
    { restaurant: spiceGarden._id, name: 'Gulab Jamun',       category: 'Desserts',      price: 80,  emoji: '🍮', isVeg: true,  isAvailable: true,  description: 'Soft milk dumplings soaked in rose-flavoured sugar syrup. Served warm.' },
    { restaurant: spiceGarden._id, name: 'Kulfi Falooda',     category: 'Desserts',      price: 120, emoji: '🍨', isVeg: true,  isAvailable: true,  description: 'Traditional Indian ice cream with rose syrup, basil seeds and vermicelli.' },
  ]);

  // ── Burger Republic Menu ──────────────────────────
  await MenuItem.insertMany([
    { restaurant: burgerRepublic._id, name: 'Classic Chicken Burger', category: 'Burgers',   price: 180, emoji: '🍔', isVeg: false, isAvailable: true,  description: 'Crispy fried chicken fillet, lettuce, tomato, cheddar and house sauce.' },
    { restaurant: burgerRepublic._id, name: 'Veg Aloo Tikki Burger',  category: 'Burgers',   price: 120, emoji: '🍔', isVeg: true,  isAvailable: true,  description: 'Spiced potato patty with onion, chutney and fresh veggies.' },
    { restaurant: burgerRepublic._id, name: 'Double Smash Burger',    category: 'Burgers',   price: 280, emoji: '🍔', isVeg: false, isAvailable: true,  description: 'Two smashed beef patties, double cheddar, caramelised onions, pickles.' },
    { restaurant: burgerRepublic._id, name: 'Crispy Fries',           category: 'Sides',     price: 80,  emoji: '🍟', isVeg: true,  isAvailable: true,  description: 'Golden crispy fries seasoned with our signature spice mix.' },
    { restaurant: burgerRepublic._id, name: 'Onion Rings',            category: 'Sides',     price: 90,  emoji: '🧅', isVeg: true,  isAvailable: true,  description: 'Beer-battered onion rings, crispy outside, soft inside.' },
    { restaurant: burgerRepublic._id, name: 'Coca-Cola',              category: 'Beverages', price: 50,  emoji: '🥤', isVeg: true,  isAvailable: true,  description: '330ml chilled can.' },
    { restaurant: burgerRepublic._id, name: 'Thick Shake',            category: 'Beverages', price: 120, emoji: '🥤', isVeg: true,  isAvailable: true,  description: 'Choose from chocolate, vanilla or strawberry.' },
    { restaurant: burgerRepublic._id, name: 'Burger + Fries + Drink', category: 'Combos',    price: 280, emoji: '🍱', isVeg: false, isAvailable: true,  description: 'Classic chicken burger with crispy fries and a drink of your choice.' },
  ]);

  // ── Dragon Wok Menu ───────────────────────────────
  await MenuItem.insertMany([
    { restaurant: dragonWok._id, name: 'Veg Spring Rolls',      category: 'Starters',       price: 120, emoji: '🥢', isVeg: true,  isAvailable: true,  description: 'Crispy rolls stuffed with stir-fried vegetables. Served with sweet chilli sauce.' },
    { restaurant: dragonWok._id, name: 'Chicken Manchurian',     category: 'Starters',       price: 200, emoji: '🍗', isVeg: false, isAvailable: true,  description: 'Deep fried chicken in a spicy Manchurian sauce.' },
    { restaurant: dragonWok._id, name: 'Veg Fried Rice',         category: 'Noodles & Rice', price: 160, emoji: '🍚', isVeg: true,  isAvailable: true,  description: 'Wok-tossed basmati rice with fresh vegetables and soy sauce.' },
    { restaurant: dragonWok._id, name: 'Chicken Hakka Noodles',  category: 'Noodles & Rice', price: 180, emoji: '🍜', isVeg: false, isAvailable: true,  description: 'Hand-pulled noodles stir-fried with chicken and vegetables in dark soy.' },
    { restaurant: dragonWok._id, name: 'Paneer Schezwan',        category: 'Main Course',    price: 220, emoji: '🧀', isVeg: true,  isAvailable: true,  description: 'Cottage cheese in fiery Schezwan sauce with bell peppers and onions.' },
    { restaurant: dragonWok._id, name: 'Hot and Sour Soup',      category: 'Soups',          price: 100, emoji: '🍵', isVeg: true,  isAvailable: true,  description: 'Classic Chinese soup with tofu, mushroom and vinegar kick.' },
    { restaurant: dragonWok._id, name: 'Green Tea',              category: 'Beverages',      price: 60,  emoji: '🍵', isVeg: true,  isAvailable: true,  description: 'Freshly brewed authentic green tea.' },
  ]);

  console.log('🍽️  Menu items created for all restaurants');

  // ── Create sample customer ────────────────────────
  await User.create({
    name:     'Rahul Kumar',
    email:    'customer@demo.com',
    isVerified: true,
    phone:    '9876543000',
    password: 'customer123',
    role:     'customer',
  });

  console.log('👤 Sample customer: customer@demo.com / customer123');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed complete! Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Admin:              admin@tabletoken.com   / admin123');
  console.log('🏪 Spice Garden:       owner@spicegarden.com  / spice123');
  console.log('🍔 Burger Republic:    owner@burgerrepublic.com / burger123');
  console.log('🍜 Dragon Wok:         owner@dragonwok.com    / dragon123');
  console.log('👤 Customer:           customer@demo.com       / customer123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  mongoose.disconnect();
};

seedData().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});