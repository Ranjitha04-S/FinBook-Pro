const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  dueDate: { type: Date, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  category: { type: String, enum: ['finance', 'vatti'], required: true },
  isVisited: { type: Boolean, default: false },   // visited customer page
  isChecked: { type: Boolean, default: false },   // kept for compatibility
  isResolved: { type: Boolean, default: false },  // payment recorded = strikethrough
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
