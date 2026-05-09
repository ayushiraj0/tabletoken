const multer             = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary         = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'tabletoken/menu',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

module.exports = multer({ storage });