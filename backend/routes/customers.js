const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, param, query } = require('express-validator');
const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const Notification = require('../models/Notification');
const { validate } = require('../middleware/validate');

// ─── Validation rule sets ───────────────────────────────────────────────────

const createCustomerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),

  body('alternatePhone')
    .optional({ checkFalsy: true })
    .matches(/^\d{10}$/).withMessage('Alternate phone must be exactly 10 digits'),

  body('category')
    .isIn(['finance', 'vatti']).withMessage('Category must be finance or vatti'),

  body('paymentType')
    .isIn(['daily', 'weekly', 'monthly']).withMessage('Payment type must be daily, weekly, or monthly'),

  body('amount')
    .isFloat({ min: 1 }).withMessage('Amount must be a positive number')
    .toFloat(),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),

  // Finance-specific
  body('totalInstallments')
    .if(body('category').equals('finance'))
    .if(body('paymentType').equals('monthly'))
    .isInt({ min: 1, max: 120 }).withMessage('Installments must be between 1 and 120')
    .toInt(),

  // Vatti-specific
  body('interestRate')
    .if(body('category').equals('vatti'))
    .isFloat({ min: 0.1, max: 15 }).withMessage('Interest rate must be between 0.1% and 15%')
    .toFloat(),
];

const payRules = [
  body('amount')
    .isFloat({ min: 1 }).withMessage('Payment amount must be a positive number')
    .toFloat(),

  body('type')
    .optional()
    .isIn(['payment', 'interest']).withMessage('Type must be payment or interest'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Note must be 200 characters or fewer'),
];

const editCustomerRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('phone')
    .optional()
    .matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),

  body('alternatePhone')
    .optional({ checkFalsy: true })
    .matches(/^\d{10}$/).withMessage('Alternate phone must be exactly 10 digits'),

  body('amount')
    .optional()
    .isFloat({ min: 1 }).withMessage('Amount must be a positive number')
    .toFloat(),

  body('paymentType')
    .optional()
    .isIn(['daily', 'weekly', 'monthly']).withMessage('Payment type must be daily, weekly, or monthly'),

  body('interestRate')
    .optional()
    .isFloat({ min: 0.1, max: 15 }).withMessage('Interest rate must be between 0.1% and 15%')
    .toFloat(),

  body('totalInstallments')
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage('Installments must be between 1 and 120')
    .toInt(),
];

// ─── Helpers ────────────────────────────────────────────────────────────────

// Calculate finance values — supports any amount (5k, 7k, 10k, 20k...)
function calcFinance(amount, paymentType, totalInstallments) {
  const a = Number(amount);
  if (paymentType === 'daily' || paymentType === 'weekly') {
    // Daily/Weekly: 15% profit upfront, 10% per installment × 10
    const profit = Math.round(a * 0.15);
    const installment = Math.round(a * 0.10);
    return {
      inhandAmount: a - profit,
      installmentAmount: installment,
      totalInstallments: 10,
      financeProfit: profit,
      remainingAmount: installment * 10,
    };
  } else {
    // Monthly: profit = ₹300 per month per ₹10,000
    const months = Number(totalInstallments) || 10;
    const profitPerMonth = Math.round((a / 10000) * 300);
    const totalProfit = profitPerMonth * months;
    const totalRepay = a + totalProfit;
    const installment = Math.round(totalRepay / months);
    return {
      inhandAmount: a,
      installmentAmount: installment,
      totalInstallments: months,
      financeProfit: totalProfit,
      remainingAmount: totalRepay,
    };
  }
}

async function scheduleNotification(customer) {
  let dueDate = new Date(customer.startDate || new Date());
  if (customer.paymentType === 'daily') dueDate.setDate(dueDate.getDate() + 1);
  else if (customer.paymentType === 'weekly') dueDate.setDate(dueDate.getDate() + 7);
  else dueDate.setMonth(dueDate.getMonth() + 1);

  await new Notification({
    customer: customer._id,
    dueDate,
    type: customer.paymentType,
    category: customer.category,
  }).save();
}

async function scheduleNextNotification(customer, session) {
  const lastNotif = await Notification.findOne({ customer: customer._id })
    .sort({ dueDate: -1 })
    .session(session);
  const baseDate = lastNotif ? new Date(lastNotif.dueDate) : new Date();
  let nextDue = new Date(baseDate);

  if (customer.paymentType === 'daily') nextDue.setDate(nextDue.getDate() + 1);
  else if (customer.paymentType === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
  else nextDue.setMonth(nextDue.getMonth() + 1);

  await new Notification({
    customer: customer._id,
    dueDate: nextDue,
    type: customer.paymentType,
    category: customer.category,
  }).save({ session });
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET all customers — supports ?page, ?limit, ?search, ?category, ?status
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status)   filter.status = status;
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name:  { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Customer.countDocuments(filter),
    ]);

    res.json({ customers, total, page, pages: Math.ceil(total / limit) });
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

// POST create customer ── validated
router.post('/', createCustomerRules, validate, async (req, res) => {
  try {
    const {
      name, phone, alternatePhone, category, paymentType,
      amount, startDate, interestRate, totalInstallments,
    } = req.body;

    let customerData = { name: name.trim(), phone: phone.trim(), alternatePhone, category, paymentType, amount, startDate };

    if (category === 'finance') {
      const calc = calcFinance(Number(amount), paymentType, totalInstallments);
      Object.assign(customerData, calc);
    } else {
      // vatti
      const rate = Number(interestRate) / 100;
      const monthlyInterest = Math.round(amount * rate);
      customerData.interestRate = interestRate;
      customerData.monthlyInterest = monthlyInterest;
      customerData.inhandAmount = amount;
      customerData.remainingAmount = amount;
    }

    const customer = new Customer(customerData);
    await customer.save();
    await scheduleNotification(customer);

    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH record payment ── validated + ACID session
// NOTE: Transactions require a replica set. On standalone MongoDB the session
// falls back to non-transactional mode automatically (via the catch block).
router.patch('/:id/pay', payRules, validate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, note, type } = req.body;
    const customer = await Customer.findById(req.params.id).session(session);
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Customer not found' });
    }

    // 1. Create payment entry
    const entry = new Entry({
      customer: customer._id,
      amount: Number(amount),
      note,
      type: type || 'payment',
    });
    await entry.save({ session });

    // 2. Update customer balance
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
    await customer.save({ session });

    // 3. Resolve checked notification (strikethrough after payment)
    await Notification.findOneAndUpdate(
      { customer: customer._id, isResolved: false, isChecked: true },
      { isResolved: true },
      { sort: { dueDate: 1 }, session }
    );

    // 4. Resolve any remaining unchecked due notification
    await Notification.findOneAndUpdate(
      { customer: customer._id, isResolved: false },
      { isResolved: true, isChecked: true },
      { sort: { dueDate: 1 }, session }
    );

    // 5. Schedule next notification only if account still active
    if (customer.status === 'active') {
      await scheduleNextNotification(customer, session);
    }

    await session.commitTransaction();
    res.json(customer);

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// PUT edit customer ── validated
router.put('/:id', editCustomerRules, validate, async (req, res) => {
  try {
    const { name, phone, alternatePhone, startDate, amount, paymentType, interestRate, totalInstallments } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    customer.name = name ? name.trim() : customer.name;
    customer.phone = phone ? phone.trim() : customer.phone;
    customer.alternatePhone = alternatePhone ?? customer.alternatePhone;
    customer.startDate = startDate || customer.startDate;

    const amountChanged = amount && Number(amount) !== customer.amount;
    const typeChanged = paymentType && paymentType !== customer.paymentType;
    const monthsChanged = totalInstallments && Number(totalInstallments) !== customer.totalInstallments;

    if (amountChanged || typeChanged || monthsChanged) {
      const newAmount = Number(amount) || customer.amount;
      const newType = paymentType || customer.paymentType;
      const newMonths = totalInstallments || customer.totalInstallments;
      customer.amount = newAmount;
      customer.paymentType = newType;

      if (customer.category === 'finance') {
        const calc = calcFinance(newAmount, newType, newMonths);
        customer.inhandAmount = calc.inhandAmount;
        customer.installmentAmount = calc.installmentAmount;
        customer.totalInstallments = calc.totalInstallments;
        customer.financeProfit = calc.financeProfit;
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

// DELETE customer ── closed: DELETE2024, active: FORCE2024
router.delete('/:id', async (req, res) => {
  try {
    const { pin } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (customer.status === 'closed') {
      if (pin !== 'DELETE2024') {
        return res.status(403).json({ message: 'Invalid PIN. Use DELETE2024 for closed accounts.' });
      }
    } else {
      if (pin !== 'FORCE2024') {
        return res.status(403).json({ message: 'Invalid PIN. Use FORCE2024 to force delete active accounts.' });
      }
    }

    await Entry.deleteMany({ customer: customer._id });
    await Notification.deleteMany({ customer: customer._id });
    await Customer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;