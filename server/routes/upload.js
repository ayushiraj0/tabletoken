const express  = require('express');
const router   = express.Router();
const upload   = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'restaurant'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.status(200).json({
    success: true,
    url: req.file.path,
  });
});

module.exports = router;