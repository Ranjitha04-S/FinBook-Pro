const express  = require('express');
const router   = express.Router();
const PDFDocument = require('pdfkit');
const { Parser }  = require('json2csv');
const Entry    = require('../models/Entry');
const Customer = require('../models/Customer');

// ─── Helper ────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtCurrency(n) {
  return `\u20B9${Number(n || 0).toLocaleString('en-IN')}`;
}

// ─── GET /api/reports/customer/:id/csv ─────────────────────────────────────
// Downloads all payment entries for a customer as a CSV file.
router.get('/customer/:id/csv', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const entries = await Entry.find({ customer: req.params.id })
      .sort({ date: -1 })
      .lean();

    const rows = entries.map(e => ({
      Date:   fmtDate(e.date),
      Type:   e.type,
      Amount: e.amount,
      Note:   e.note || '',
    }));

    const parser = new Parser({ fields: ['Date', 'Type', 'Amount', 'Note'] });
    const csv    = parser.parse(rows);

    const filename = `${customer.name.replace(/\s+/g, '_')}_statement.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/reports/customer/:id/pdf ─────────────────────────────────────
// Downloads a full customer account statement as a PDF.
router.get('/customer/:id/pdf', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const entries = await Entry.find({ customer: req.params.id })
      .sort({ date: -1 })
      .lean();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `${customer.name.replace(/\s+/g, '_')}_statement.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Header ──
    doc.fillColor('#0F172A')
       .fontSize(22).font('Helvetica-Bold')
       .text('FinBook Pro', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#64748B')
       .text('Account Statement', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(0.5);

    // ── Customer info ──
    const col2 = 300;
    const startY = doc.y;
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Customer Details', 50, startY);
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Name    : ${customer.name}`,      50);
    doc.text(`Phone   : ${customer.phone}`,     50);
    doc.text(`Category: ${customer.category}`,  50);
    doc.text(`Type    : ${customer.paymentType}`, 50);

    // Right column summary
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0F172A')
       .text('Loan Summary', col2, startY);
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Loan Amount : ${fmtCurrency(customer.amount)}`, col2);
    if (customer.category === 'finance') {
      doc.text(`In-hand     : ${fmtCurrency(customer.inhandAmount)}`, col2);
      doc.text(`Total Repay : ${fmtCurrency(customer.installmentAmount * customer.totalInstallments)}`, col2);
    } else {
      doc.text(`Monthly Int : ${fmtCurrency(customer.monthlyInterest)}`, col2);
    }
    doc.text(`Paid So Far : ${fmtCurrency(customer.paidAmount)}`, col2);
    doc.text(`Remaining   : ${fmtCurrency(customer.remainingAmount)}`, col2);
    doc.text(`Status      : ${customer.status.toUpperCase()}`, col2);
    doc.text(`Start Date  : ${fmtDate(customer.startDate)}`, col2);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(0.5);

    // ── Transaction table ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0F172A').text('Transaction History');
    doc.moveDown(0.4);

    if (entries.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#94A3B8').text('No transactions found.');
    } else {
      // Table header row
      const rowH = 22;
      const cols = { date: 50, type: 160, amount: 270, note: 370 };
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
      const hY = doc.y;
      doc.rect(50, hY - 3, 495, rowH).fill('#F1F5F9').fillColor('#475569');
      doc.text('Date',   cols.date,   hY, { width: 100 });
      doc.text('Type',   cols.type,   hY, { width: 100 });
      doc.text('Amount', cols.amount, hY, { width: 90,  align: 'right' });
      doc.text('Note',   cols.note,   hY, { width: 175 });
      doc.moveDown(0.8);

      // Rows
      doc.font('Helvetica').fontSize(9).fillColor('#0F172A');
      entries.forEach((e, idx) => {
        if (doc.y > 730) { doc.addPage(); } // prevent overflow
        const rY = doc.y;
        if (idx % 2 === 0) doc.rect(50, rY - 2, 495, rowH).fill('#FAFAFA');
        doc.fillColor(e.type === 'payment' ? '#16A34A' : '#DC2626');
        doc.text(fmtDate(e.date),        cols.date,   rY, { width: 100 });
        doc.text(e.type,                 cols.type,   rY, { width: 100 });
        doc.text(fmtCurrency(e.amount),  cols.amount, rY, { width: 90, align: 'right' });
        doc.fillColor('#334155');
        doc.text(e.note || '—',          cols.note,   rY, { width: 175 });
        doc.moveDown(0.6);
      });
    }

    // ── Footer ──
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica')
       .text(`Generated on ${fmtDate(new Date())} by FinBook Pro`, { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/reports/entry/:id/pdf ────────────────────────────────────────
// Downloads a single payment receipt as PDF.
router.get('/entry/:id/pdf', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id).populate('customer');
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const doc = new PDFDocument({ margin: 60, size: 'A5' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${entry._id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0F172A')
       .text('FinBook Pro', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#64748B')
       .text('Payment Receipt', { align: 'center' });
    doc.moveDown(0.8);
    doc.moveTo(60, doc.y).lineTo(415, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(0.8);

    const line = (label, value, color = '#0F172A') => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#64748B').text(label, 60, doc.y, { continued: true, width: 130 });
      doc.font('Helvetica').fillColor(color).text(value);
      doc.moveDown(0.3);
    };

    line('Customer  :', entry.customer.name);
    line('Phone     :', entry.customer.phone);
    line('Amount    :', fmtCurrency(entry.amount), '#16A34A');
    line('Type      :', entry.type);
    line('Date      :', fmtDate(entry.date));
    line('Note      :', entry.note || '—');
    line('Loan Amt  :', fmtCurrency(entry.customer.amount));
    line('Remaining :', fmtCurrency(entry.customer.remainingAmount));

    doc.moveDown(1.2);
    doc.moveTo(60, doc.y).lineTo(415, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(0.6);
    doc.fontSize(8).fillColor('#94A3B8')
       .text(`Receipt ID: ${entry._id}`, { align: 'center' });
    doc.text(`Generated: ${fmtDate(new Date())}`, { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
