const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  category: { type: String, enum: ['finance', 'vatti'], required: true },
  paymentType: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  startDate: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true },

  // Finance fields
  inhandAmount: { type: Number }, // amount given to customer (for daily/weekly: amount - profit)
  installmentAmount: { type: Number }, // per payment
  totalInstallments: { type: Number },
  financeProfit: { type: Number }, // total profit locked in

  // Vatti fields
  interestRate: { type: Number }, // 1-15%
  monthlyInterest: { type: Number }, // calculated

  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
