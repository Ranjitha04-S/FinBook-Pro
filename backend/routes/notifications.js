const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET today's + upcoming notifications (pending)
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const notifications = await Notification.find({
      isResolved: false,
      dueDate: { $lte: today },
    }).populate('customer', 'name phone category paymentType amount').sort({ dueDate: 1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all upcoming notifications
router.get('/upcoming', async (req, res) => {
  try {
    const notifications = await Notification.find({ isResolved: false })
      .populate('customer', 'name phone category paymentType amount')
      .sort({ dueDate: 1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH check notification (mark as checked in the checklist)
router.patch('/:id/check', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isChecked: true },
      { new: true }
    ).populate('customer', 'name phone category');
    res.json(notif);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
