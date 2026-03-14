const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
  type: { type: String, enum: ['payment', 'interest'], default: 'payment' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Entry', entrySchema);
