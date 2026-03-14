const Notification = require('../models/Notification');
const Customer = require('../models/Customer');

async function generateNotifications() {
  const activeCustomers = await Customer.find({ status: 'active' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const customer of activeCustomers) {
    const existing = await Notification.findOne({
      customer: customer._id,
      isResolved: false,
      dueDate: { $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    if (!existing) {
      const lastNotif = await Notification.findOne({ customer: customer._id }).sort({ dueDate: -1 });
      const baseDate = lastNotif ? new Date(lastNotif.dueDate) : new Date(customer.startDate);
      let nextDue = new Date(baseDate);

      if (customer.paymentType === 'daily') nextDue.setDate(nextDue.getDate() + 1);
      else if (customer.paymentType === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else nextDue.setMonth(nextDue.getMonth() + 1);

      if (nextDue <= new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        await Notification.create({
          customer: customer._id,
          dueDate: nextDue,
          type: customer.paymentType,
          category: customer.category,
        });
      }
    }
  }
}

module.exports = { generateNotifications };
