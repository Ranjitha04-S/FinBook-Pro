const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const Notification = require('../models/Notification');

// Calculate finance values
function calcFinance(amount, paymentType) {
  const units = amount / 10000;
  if (paymentType === 'daily' || paymentType === 'weekly') {
    const profitPerUnit = 1500;
    const installmentPerUnit = 1000;
    const totalInstallments = 10;
    return {
      inhandAmount: amount - (units * profitPerUnit),
      installmentAmount: units * installmentPerUnit,
      totalInstallments,
      financeProfit: units * profitPerUnit,
      remainingAmount: units * installmentPerUnit * totalInstallments,
    };
  } else {
    // monthly: give full amount, 1300/10k per month for 10 months
    const installmentPerUnit = 1300;
    const totalInstallments = 10;
    return {
      inhandAmount: amount,
      installmentAmount: units * installmentPerUnit,
      totalInstallments,
      financeProfit: units * installmentPerUnit * totalInstallments - amount,
      remainingAmount: units * installmentPerUnit * totalInstallments,
    };
  }
}

// GET all customers
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status) filter.status = status;
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single customer with entries
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const entries = await Entry.find({ customer: req.params.id }).sort({ date: -1 });
    res.json({ customer, entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, alternatePhone, category, paymentType, amount, startDate, interestRate } = req.body;

    let customerData = { name, phone, alternatePhone, category, paymentType, amount, startDate };

    if (category === 'finance') {
      const calc = calcFinance(Number(amount), paymentType);
      Object.assign(customerData, calc);
    } else {
      // vatti
      const rate = Number(interestRate) / 100;
      const monthlyInterest = Math.round(amount * rate);
      customerData.interestRate = interestRate;
      customerData.monthlyInterest = monthlyInterest;
      customerData.inhandAmount = amount;
      customerData.remainingAmount = amount; // principal remaining
    }

    const customer = new Customer(customerData);
    await customer.save();

    // Create initial notifications
    await scheduleNotification(customer);

    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function scheduleNotification(customer) {
  const now = new Date();
  let dueDate = new Date(customer.startDate || now);

  if (customer.paymentType === 'daily') {
    dueDate.setDate(dueDate.getDate() + 1);
  } else if (customer.paymentType === 'weekly') {
    dueDate.setDate(dueDate.getDate() + 7);
  } else {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  const notif = new Notification({
    customer: customer._id,
    dueDate,
    type: customer.paymentType,
    category: customer.category,
  });
  await notif.save();
}

// PATCH update customer payment
router.patch('/:id/pay', async (req, res) => {
  try {
    const { amount, note, type } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const entry = new Entry({
      customer: customer._id,
      amount: Number(amount),
      note,
      type: type || 'payment',
    });
    await entry.save();

    if (customer.category === 'finance') {
      customer.paidAmount += Number(amount);
      customer.remainingAmount = Math.max(0, customer.remainingAmount - Number(amount));
      if (customer.remainingAmount === 0) customer.status = 'closed';
    } else {
      // vatti: check if they paid principal
      if (type === 'payment') {
        customer.paidAmount += Number(amount);
        customer.remainingAmount = Math.max(0, customer.remainingAmount - Number(amount));
        if (customer.remainingAmount === 0) customer.status = 'closed';
      }
    }

    await customer.save();

    // Schedule next notification
    if (customer.status === 'active') {
      await scheduleNextNotification(customer);
    }

    // Resolve current notification
    await Notification.findOneAndUpdate(
      { customer: customer._id, isResolved: false },
      { isResolved: true, isChecked: true },
      { sort: { dueDate: 1 } }
    );

    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function scheduleNextNotification(customer) {
  const lastNotif = await Notification.findOne({ customer: customer._id }).sort({ dueDate: -1 });
  const baseDate = lastNotif ? new Date(lastNotif.dueDate) : new Date();
  let nextDue = new Date(baseDate);

  if (customer.paymentType === 'daily') nextDue.setDate(nextDue.getDate() + 1);
  else if (customer.paymentType === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
  else nextDue.setMonth(nextDue.getMonth() + 1);

  const notif = new Notification({
    customer: customer._id,
    dueDate: nextDue,
    type: customer.paymentType,
    category: customer.category,
  });
  await notif.save();
}

module.exports = router;
