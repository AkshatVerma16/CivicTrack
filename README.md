# 🏛️ CivicTrack - Crowdsourced Civic Issue Reporting & Resolution System

CivicTrack is an end-to-end, multi-role civic management platform that empowers citizens to report civic issues using GPS-tagged photos, enables registered vendors to submit competitive bids, and provides government ministries and central administrators with oversight, fraud prevention, and financial disbursement workflows.

---

## 🌟 Key Features

### 👤 Citizen Portal
- **GPS-Tagged Reporting:** Citizens log complaints with live photo uploads and location metadata.
- **Interactive Map:** Dynamic issue mapping integrated with Google Maps.
- **Real-Time Lifecycle Tracking:** Monitor complaint progression across explicit states (`Open` → `In Progress` → `Completed` → `User Confirmed` → `Archived`).

### 🛠️ Vendor Marketplace
- **Bidding System:** Transparent bidding logic where vendors submit budget and timeframe estimates.
- **Progress Verification:** Vendors upload proof-of-work photos upon task execution and request final inspection.
- **Re-Bidding & Second Chance:** Vendors notified of first-strike warnings can submit corrected bids marked with a "Repeat Bidder" indicator.

### 🏛️ Ministry Panel
- **Bid Selection Engine:** Review and select optimal vendor bids based on cost and time efficiency.
- **Work Monitoring:** Track task progress and verify completed work before forwarding for confirmation.
- **Fraud Escalation:** Report suspicious vendor bids directly to Central Administration.

### 🛡️ Admin Governance & Financial Control
- **Two-Strike Moderation:** Issue initial warnings or execute account bans on fraudulent vendors.
- **Audit Trails & Soft Deletes:** Permanently archive historical records even when fraudulent accounts are deleted, preserving government audit trails.
- **Segregation of Duties (SoD) Payments:** Centralized bank-to-bank financial disbursement panel requiring Admin authorization after Ministry verification.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite, Axios, React Router DOM
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Integrations & Security:** Google Maps API, Multer (File Handling), JWT Authentication

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18+ recommended
- **MySQL Server:** Active local or remote instance

### Local Installation & Setup

1. **Clone the repository:**CivicTrack/
├── .gitignore
├── README.md
└── civictrack-app/
    ├── package.json
    ├── client/
    │   ├── .env.example
    │   ├── index.html
    │   ├── package.json
    │   ├── public/
    │   │   └── civictrack-logo.png
    │   └── src/
    │       ├── ErrorBoundary.jsx
    │       ├── components/
    │       │   ├── BidForm.jsx
    │       │   ├── BidsList.jsx
    │       │   └── ProtectedRoute.jsx
    │       ├── lib/
    │       │   └── adminVendorApi.js
    │       └── pages/
    │           ├── AdminAnalytics.jsx
    │           ├── AdminReportedVendorsPage.jsx
    │           ├── Login.jsx
    │           ├── MapPage.jsx
    │           ├── MinistryDashboard.jsx
    │           ├── ProfilePage.jsx
    │           ├── UserDashboard.jsx
    │           ├── VendorBiddingPage.jsx
    │           ├── VendorDashboard.jsx
    │           └── VendorRegister.jsx
    └── server/
        ├── .env.example
        ├── package.json
        ├── test-login.js
        ├── db/
        │   ├── add_bids_table.sql
        │   ├── add_profile_fields.sql
        │   ├── add_role_column.sql
        │   ├── add_statuses.sql
        │   ├── add_vendor_applications.sql
        │   └── add_vendors_table.sql
        ├── src/
        │   ├── db.js
        │   ├── update_enum.js
        │   ├── routes/
        │   │   ├── api.admin.js
        │   │   ├── api.admin.reset-password.js
        │   │   ├── api.bids.js
        │   │   ├── api.logs.js
        │   │   ├── api.ministries.js
        │   │   ├── api.notifications.js
        │   │   ├── api.payments.js
        │   │   ├── api.tasks.js
        │   │   ├── api.users.js
        │   │   └── api.vendors.js
        │   └── scripts/
        │       ├── check-vendor-db.js
        │       ├── cloudnary-api.js
        │       ├── create-bids-table.js
        │       ├── create-reported-complaints.js
        │       ├── create-vendor-table.js
        │       ├── fix-activity-logs.js
        │       ├── migrate-add-open-status.js
        │       ├── migrate-bids.js
        │       ├── migrate-completion-flow.js
        │       ├── migrate-payments.js
        │       ├── migrate-persistent-strikes.js
        │       ├── migrate-tasks-columns.js
        │       ├── migrate-user-confirmed.js
        │       ├── test-open-complaints.js
        │       └── test-vendor-query.js
        └── uploads/
   ```bash
   git clone [https://github.com/AkshatVerma16/CivicTrack.git](https://github.com/AkshatVerma16/CivicTrack.git)
   cd CivicTrack/civictrack-app
