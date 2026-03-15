const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET today's due notifications
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const notifications = await Notification.find({
      isResolved: false,
      dueDate: { $lte: today },
    }).populate('customer', 'name phone category paymentType amount installmentAmount monthlyInterest').sort({ dueDate: 1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all upcoming notifications
router.get('/upcoming', async (req, res) => {
  try {
    const notifications = await Notification.find({ isResolved: false })
      .populate('customer', 'name phone category paymentType amount installmentAmount monthlyInterest')
      .sort({ dueDate: 1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH — mark as visited (redirecting to customer page)
// This does NOT strikethrough — only payment recording does that
router.patch('/:id/visit', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isVisited: true },
      { new: true }
    ).populate('customer', 'name phone category');
    res.json(notif);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
