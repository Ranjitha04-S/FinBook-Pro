const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Entry = require('../models/Entry');

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Entries aggregation
    const [todayEntries, weekEntries, monthEntries] = await Promise.all([
      Entry.aggregate([
        { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Entry.aggregate([
        { $match: { date: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Entry.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
    ]);

    // Total invested (inhandAmount given out)
    const totalInvested = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$inhandAmount' } } }
    ]);

    const todayNewAccounts = await Customer.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const closedCustomers = await Customer.countDocuments({ status: 'closed' });

    // Category breakdown
    const categoryStats = await Customer.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    res.json({
      todayCollection: todayEntries[0]?.total || 0,
      weekCollection: weekEntries[0]?.total || 0,
      monthCollection: monthEntries[0]?.total || 0,
      totalInvested: totalInvested[0]?.total || 0,
      todayNewAccounts,
      activeCustomers,
      closedCustomers,
      categoryStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Date-wise report
router.get('/date-report', async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const entries = await Entry.find({ date: { $gte: start, $lte: end } })
      .populate('customer', 'name phone category paymentType amount');

    const newAccounts = await Customer.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalCollected = entries.reduce((s, e) => s + e.amount, 0);
    const totalInvested = newAccounts.reduce((s, c) => s + (c.inhandAmount || 0), 0);

    res.json({ entries, newAccounts, totalCollected, totalInvested });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Monthly chart data (last 6 months)
router.get('/monthly-chart', async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const data = await Promise.all(months.map(async ({ year, month }) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const result = await Entry.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const invested = await Customer.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$inhandAmount' } } }
      ]);
      return {
        label: start.toLocaleString('default', { month: 'short' }),
        collection: result[0]?.total || 0,
        investment: invested[0]?.total || 0,
      };
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
