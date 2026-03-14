# FinBook Pro — Full Stack MERN Application

A professional mobile-first finance management system for tracking Finance and Vatti loans.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
git clone <your-repo>
cd sr-finance
docker-compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
npm install
# Create .env file:
echo "MONGO_URI=mongodb://localhost:27017/sr-finance" > .env
echo "JWT_SECRET=your_secret_key_here" >> .env
echo "PORT=5000" >> .env
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

---

## 💼 Business Logic

### Finance Accounts

| Payment Type | Customer Gets | Pays Per Period | Duration |
|---|---|---|---|
| Daily / Weekly | Principal - ₹1,500/10K | ₹1,000/10K | 10 payments |
| Monthly | Full principal | ₹1,300/10K | 10 months |

**Example (₹30,000 — Daily/Weekly):**
- Customer receives: ₹25,500 (₹30,000 - ₹4,500)
- Pays: ₹3,000 per day/week × 10 = ₹30,000
- Your profit: ₹4,500

**Example (₹20,000 — Monthly):**
- Customer receives: ₹20,000
- Pays: ₹2,600/month × 10 = ₹26,000
- Your profit: ₹6,000

### Vatti Accounts

- Customer receives the full amount
- Pays monthly interest (1–15% of principal) until they can repay principal in full
- If principal paid = account closed

**Example (₹10,000 — 10% interest):**
- Customer receives: ₹10,000
- Monthly interest: ₹1,000 (pay every month)
- Close account: Pay ₹10,000 principal at once

---

## 📱 Features

### Home Dashboard
- Today's collection amount (hero stat)
- Weekly & monthly collection totals
- Total capital invested
- Pending collections count
- 6-month area chart (collected vs invested)
- Customer list with category filter (All / Finance / Vatti)
- Per-customer repayment progress bar

### New Customer
- Step 1: Choose Finance or Vatti
- Step 2: Fill name, phone, alternate phone, date, amount, payment type
- Live calculation preview before saving
- Auto-schedules first notification after creation

### Customer Profile
- Full profile with progress ring
- Finance terms: inhand amount, installment, total installments, profit
- Vatti terms: interest rate, monthly interest, remaining principal
- Entry history with date, time, amount
- One-tap "Record Payment" sheet
  - Suggested amount auto-filled
  - Interest vs Principal toggle (for Vatti)
- Account auto-closes when fully paid

### Notifications
- **Today's Due**: Customers who need payment collected today
- **Upcoming**: Future scheduled collections
- Checkbox checklist: tap checkbox → marks checked → redirects to customer page
- Checked items show with strikethrough
- Category & payment type badges per notification
- Cron job runs daily at 8am to generate new notifications

### Calendar Report
- Custom built calendar (no external library needed)
- Tap any date to see:
  - Total amount collected that day
  - Total amount invested (new accounts)
  - List of all payments with customer name & time
  - List of new accounts created

---

## 🏗️ Architecture

```
sr-finance/
├── backend/
│   ├── models/
│   │   ├── Customer.js      # Finance/Vatti schema
│   │   ├── Entry.js         # Payment entries
│   │   └── Notification.js  # Scheduled reminders
│   ├── routes/
│   │   ├── auth.js          # JWT login
│   │   ├── customers.js     # CRUD + payment logic
│   │   ├── entries.js       # Entry queries
│   │   ├── notifications.js # Checklist API
│   │   └── dashboard.js     # Stats & reports
│   ├── controllers/
│   │   └── notificationController.js  # Cron logic
│   └── server.js            # Express + MongoDB + Cron
│
├── frontend/src/
│   ├── pages/
│   │   ├── Login.js         # Auth screen
│   │   ├── Home.js          # Dashboard
│   │   ├── NewCustomer.js   # Create account form
│   │   ├── CustomerProfile.js  # Profile + entries + pay
│   │   ├── Notifications.js # Checklist
│   │   └── Calendar.js      # Date report
│   ├── components/
│   │   ├── layout/NavBar.js
│   │   └── common/PageHeader.js
│   ├── context/AuthContext.js
│   ├── utils/api.js
│   └── index.css            # Mobile-first design system
│
└── docker-compose.yml
```

---

## 🔔 Notification System

Notifications are generated automatically:
- On new customer creation (first payment due)
- After every payment recorded (next due date scheduled)
- Daily at 8:00 AM via cron job (catches any missed)

| Payment Type | Notification Frequency |
|---|---|
| Daily | Every 24 hours |
| Weekly | Every 7 days |
| Monthly | Every 30 days |

---

## 🛡️ Data Safety

- No delete operations exposed in the API
- All payments are append-only entries
- MongoDB data persisted via Docker volume
- JWT tokens expire after 30 days

---

## 📞 Support

Built for SR Finance Management System.
Logo: **SR Finance**
