const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

// GET entries by date
router.get('/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const entries = await Entry.find({
      date: { $gte: start, $lte: end }
    }).populate('customer', 'name phone category paymentType');

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET entries for a customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const entries = await Entry.find({ customer: req.params.customerId }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
