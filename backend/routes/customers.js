const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const Notification = require('../models/Notification');

// Calculate finance values — supports any amount (5k, 7k, 10k, 20k...)
function calcFinance(amount, paymentType) {
  const a = Number(amount);
  if (paymentType === 'daily' || paymentType === 'weekly') {
    // Profit = 15% of amount, installment = 10% of amount, 10 installments
    const profit = Math.round(a * 0.15);
    const installment = Math.round(a * 0.10);
    const totalInstallments = 10;
    return {
      inhandAmount: a - profit,
      installmentAmount: installment,
      totalInstallments,
      financeProfit: profit,
      remainingAmount: installment * totalInstallments,
    };
  } else {
    // monthly: give full amount, 13% of amount per month for 10 months
    const installment = Math.round(a * 0.13);
    const totalInstallments = 10;
    return {
      inhandAmount: a,
      installmentAmount: installment,
      totalInstallments,
      financeProfit: (installment * totalInstallments) - a,
      remainingAmount: installment * totalInstallments,
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
      if (type === 'payment') {
        customer.paidAmount += Number(amount);
        customer.remainingAmount = Math.max(0, customer.remainingAmount - Number(amount));
        if (customer.remainingAmount === 0) customer.status = 'closed';
      }
    }

    await customer.save();

    // Resolve & strikethrough current notification ONLY after payment recorded
    await Notification.findOneAndUpdate(
      { customer: customer._id, isResolved: false, isChecked: true },
      { isResolved: true },
      { sort: { dueDate: 1 } }
    );

    // Also resolve any unchecked due notification for this customer
    await Notification.findOneAndUpdate(
      { customer: customer._id, isResolved: false },
      { isResolved: true, isChecked: true },
      { sort: { dueDate: 1 } }
    );

    // Schedule next notification only if account still active
    if (customer.status === 'active') {
      await scheduleNextNotification(customer);
    }

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

// PUT edit customer details
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, alternatePhone, startDate, amount, paymentType, interestRate } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Update basic fields
    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.alternatePhone = alternatePhone ?? customer.alternatePhone;
    customer.startDate = startDate || customer.startDate;

    // If amount or paymentType changed, recalculate
    const amountChanged = amount && Number(amount) !== customer.amount;
    const typeChanged = paymentType && paymentType !== customer.paymentType;

    if (amountChanged || typeChanged) {
      const newAmount = Number(amount) || customer.amount;
      const newType = paymentType || customer.paymentType;
      customer.amount = newAmount;
      customer.paymentType = newType;

      if (customer.category === 'finance') {
        const calc = calcFinance(newAmount, newType);
        customer.inhandAmount = calc.inhandAmount;
        customer.installmentAmount = calc.installmentAmount;
        customer.totalInstallments = calc.totalInstallments;
        customer.financeProfit = calc.financeProfit;
        // Recalculate remaining based on what's already paid
        customer.remainingAmount = Math.max(0, calc.remainingAmount - customer.paidAmount);
      } else {
        const rate = Number(interestRate || customer.interestRate) / 100;
        customer.interestRate = Number(interestRate || customer.interestRate);
        customer.monthlyInterest = Math.round(newAmount * rate);
        customer.inhandAmount = newAmount;
        customer.remainingAmount = Math.max(0, newAmount - customer.paidAmount);
      }
    } else if (customer.category === 'vatti' && interestRate) {
      const rate = Number(interestRate) / 100;
      customer.interestRate = Number(interestRate);
      customer.monthlyInterest = Math.round(customer.amount * rate);
    }

    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE customer — closed accounts use PIN: DELETE2024, active accounts use FORCE2024
router.delete('/:id', async (req, res) => {
  try {
    const { pin } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (customer.status === 'closed') {
      // Closed account — normal delete PIN
      if (pin !== 'DELETE2024') {
        return res.status(403).json({ message: 'Invalid PIN. Use DELETE2024 for closed accounts.' });
      }
    } else {
      // Active account — force delete PIN (stronger)
      if (pin !== 'FORCE2024') {
        return res.status(403).json({ message: 'Invalid PIN. Use FORCE2024 to force delete active accounts.' });
      }
    }

    // Delete all related data
    await Entry.deleteMany({ customer: customer._id });
    await Notification.deleteMany({ customer: customer._id });
    await Customer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;