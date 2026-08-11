# 🏛️ CivicTrack

### Crowdsourced Civic Issue Reporting, Transparent Vendor Bidding & Governance Platform

<p align="center">
  <img src="civictrack-app/client/public/civictrack-logo.png" alt="CivicTrack Logo" width="180"/>
</p>

<p align="center">
  <strong>Report. Resolve. Verify. Govern.</strong>
</p>

<p align="center">
  A multi-role civic governance ecosystem that connects citizens, vendors, ministries, and administrators through a transparent digital workflow.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-workflow">Workflow</a> •
  <a href="#-installation--setup">Setup</a> •
  <a href="#-api-overview">API</a> •
  <a href="#-future-enhancements">Future Scope</a>
</p>

---

## 📌 Overview

**CivicTrack** is an end-to-end civic issue management and governance platform designed to make the process of reporting, assigning, executing, verifying, and financially closing civic complaints more **transparent, accountable, and traceable**.

The platform creates a digital bridge between:

* 👤 **Citizens** — Report civic issues and verify their resolution
* 🛠️ **Vendors / Contractors** — Discover tasks and submit competitive bids
* 🏛️ **Ministries** — Evaluate bids, assign work, and verify progress
* 🛡️ **Central Administrators** — Manage vendors, detect suspicious activity, and control financial disbursements

Instead of treating a complaint as a simple ticket, CivicTrack manages the **complete lifecycle of a civic issue**, from the initial GPS-tagged report to final citizen verification and fund disbursement.

---

# 🎯 Problem Statement

Traditional civic complaint systems often suffer from:

* Lack of transparency in task allocation
* Limited visibility into complaint progress
* Difficulty verifying whether work was actually completed
* Unclear vendor selection processes
* Potentially fraudulent or unrealistic bids
* Weak accountability for repeated vendor misconduct
* Limited auditability of financial transactions

### 💡 CivicTrack's Approach

CivicTrack introduces a structured workflow:

```text
Citizen Report
      ↓
Open Civic Task
      ↓
Competitive Vendor Bidding
      ↓
Ministry Evaluation
      ↓
Vendor Assignment
      ↓
Progress + Proof Upload
      ↓
Ministry Verification
      ↓
Citizen Confirmation
      ↓
Admin Fund Disbursement
      ↓
Archived Audit History
```

Every important stage leaves a traceable record.

---

# ✨ Key Features

## 👤 Citizen Portal

### 📍 GPS-Tagged Issue Reporting

Citizens can report civic problems by providing:

* Issue description
* Live/current location
* GPS coordinates
* Supporting photographs

This helps authorities understand **what happened and where it happened**.

### 🗺️ Interactive Complaint Map

Civic issues can be visualized geographically through Google Maps integration.

Users can identify complaints based on their location and understand the distribution of civic problems.

### ✅ Citizen Verification

A task does not immediately become permanently closed after vendor completion.

The workflow includes:

```text
Open
 ↓
In Progress
 ↓
Completed
 ↓
User Confirmed
 ↓
Archived
```

Citizens can provide proof-of-resolution photos before the issue is finally closed.

---

# 🛠️ Vendor Marketplace

## 💰 Competitive Bidding

Registered vendors can browse available civic tasks and submit bids containing:

* Estimated project cost
* Expected completion timeline
* Relevant task information

This creates a structured bidding environment for task allocation.

## 📈 Progress Tracking

After receiving a task, vendors can submit:

* Work progress updates
* Proof-of-work photographs
* Completion evidence

This allows ministries to monitor execution rather than relying only on a final status update.

## 🔄 Re-Bidding Mechanism

CivicTrack introduces a vendor accountability workflow.

If a suspicious or problematic bid receives a **Strike 1 warning**, the vendor can:

1. View the feedback
2. Review the previous bid history
3. Submit a corrected bid
4. Receive a `Repeat Bidder` indicator

This creates an opportunity for correction while maintaining historical accountability.

---

# 🏛️ Ministry Dashboard

The Ministry panel acts as the operational decision-making layer.

### Smart Bid Evaluation

Ministry officials can compare vendor bids using factors such as:

* Cost
* Estimated completion time
* Vendor history
* Task suitability

The ministry can then approve the most appropriate bid.

### 📊 Task Monitoring

Ministries can monitor:

```text
Assigned Vendor
      ↓
Work Started
      ↓
Progress Updates
      ↓
Proof of Work
      ↓
Completion Verification
```

### 🚨 Fraud Escalation

Suspicious or unrealistic bids can be escalated to the Central Administration for further action.

---

# 🛡️ Central Administration & Governance

The Admin panel provides centralized control over vendor governance, audit history, and financial workflows.

## ⚠️ Two-Strike Vendor Moderation

CivicTrack implements a structured vendor moderation system.

### Strike 1 — Warning

When a vendor is reported:

```text
Reported Bid
     ↓
Admin Review
     ↓
Strike 1
     ↓
Bid Archived
     ↓
Complaint Re-opened
     ↓
Vendor Can Re-Bid
```

The original bid remains preserved in historical records.

### Strike 2 — Ban

Repeated violations result in:

```text
Second Violation
      ↓
Vendor Account Disabled
      ↓
Future Warning Action Restricted
      ↓
Historical Records Preserved
```

This prevents repeated abuse while maintaining an auditable history.

---

# 💳 Financial Disbursement

CivicTrack separates **task verification** from **financial disbursement**.

Funds are released only after the required verification workflow has been completed.

### Financial Flow

```text
Vendor Completes Task
        ↓
Ministry Verifies Completion
        ↓
Payment Becomes Eligible
        ↓
Admin Reviews Payment
        ↓
Bank Details Verified
        ↓
Fund Disbursement
        ↓
Transaction Recorded
```

The system maintains separation of responsibilities to support a **Segregation of Duties (SoD)** approach.

---

# 🔐 Security & Accountability

CivicTrack is designed around role-based access and auditability.

### Security Components

* 🔑 JWT-based authentication
* 👥 Role-Based Access Control (RBAC)
* 🛡️ Protected frontend routes
* 🔒 Role-specific backend APIs
* 📋 Activity/audit logging
* 🗃️ Historical record preservation
* 🧾 Soft-delete approach for vendor records
* 📸 Proof-of-work media storage

### Supported Roles

```text
                CivicTrack
                    │
        ┌───────────┼───────────┐
        │           │           │
     Citizen      Vendor     Ministry
                                │
                                │
                              Admin
```

Each role receives access only to the functionality required for its responsibilities.

---

# 🧩 System Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                       CIVICTRACK                             │
└──────────────────────────────────────────────────────────────┘

                         FRONTEND
┌──────────────────────────────────────────────────────────────┐
│ React.js + Vite + Tailwind CSS                              │
│                                                              │
│ Citizen │ Vendor │ Ministry │ Admin Dashboards               │
└───────────────────────────────┬──────────────────────────────┘
                                │
                         REST API / Axios
                                │
                                ▼
                         BACKEND SERVER
┌──────────────────────────────────────────────────────────────┐
│ Node.js + Express.js                                        │
│                                                              │
│ Authentication │ Tasks │ Bids │ Vendors │ Payments           │
│ Ministries │ Admin │ Notifications │ Logs                    │
└───────────────────────────────┬──────────────────────────────┘
                                │
                         mysql2 Connection Pool
                                │
                                ▼
                            MySQL DB
┌──────────────────────────────────────────────────────────────┐
│ Users │ Tasks │ Vendors │ Bids │ Payments │ Logs             │
│ Reports │ Notifications │ Historical Records                 │
└──────────────────────────────────────────────────────────────┘

             External Integrations
        ┌──────────────┬──────────────┐
        │ Google Maps  │ File Storage │
        │     API      │   / Uploads  │
        └──────────────┴──────────────┘
```

---

# 🔄 Complete Issue Lifecycle

The complete CivicTrack lifecycle can be represented as:

```text
┌─────────────────────┐
│ Citizen Reports     │
│ Civic Issue         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      OPEN           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Vendor Bidding      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Ministry Selects    │
│ Optimal Bid         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    IN PROGRESS      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Vendor Uploads      │
│ Progress + Proof    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     COMPLETED       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Ministry Verifies   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   USER CONFIRMED    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Admin Disburses     │
│ Funds               │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      ARCHIVED       │
└─────────────────────┘
```

---

# 🧱 Tech Stack

| Layer           | Technology       |
| --------------- | ---------------- |
| Frontend        | React.js         |
| Build Tool      | Vite             |
| Styling         | Tailwind CSS     |
| Routing         | React Router DOM |
| HTTP Client     | Axios            |
| Backend         | Node.js          |
| API Framework   | Express.js       |
| Database        | MySQL            |
| Database Driver | mysql2           |
| Authentication  | JWT              |
| Authorization   | RBAC             |
| File Upload     | Multer           |
| Maps            | Google Maps API  |
| Version Control | Git / GitHub     |

---

# 📂 Project Structure

```text
CivicTrack/
│
├── .gitignore
├── README.md
│
└── civictrack-app/
    │
    ├── package.json
    │
    ├── client/
    │   ├── .env.example
    │   ├── index.html
    │   ├── package.json
    │   │
    │   ├── public/
    │   │   └── civictrack-logo.png
    │   │
    │   └── src/
    │       ├── ErrorBoundary.jsx
    │       │
    │       ├── components/
    │       │   ├── BidForm.jsx
    │       │   ├── BidsList.jsx
    │       │   └── ProtectedRoute.jsx
    │       │
    │       ├── lib/
    │       │   └── adminVendorApi.js
    │       │
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
    │
    └── server/
        ├── .env.example
        ├── package.json
        ├── test-login.js
        │
        ├── db/
        │   ├── add_bids_table.sql
        │   ├── add_profile_fields.sql
        │   ├── add_role_column.sql
        │   ├── add_statuses.sql
        │   ├── add_vendor_applications.sql
        │   └── add_vendors_table.sql
        │
        ├── src/
        │   ├── db.js
        │   ├── update_enum.js
        │   │
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
        │   │
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
        │
        └── uploads/
```

---

# 🚀 Installation & Setup

## Prerequisites

Make sure the following are installed:

* Node.js `18+`
* npm
* MySQL `8+`
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd CivicTrack
```

---

## 2️⃣ Backend Setup

Navigate to the server:

```bash
cd civictrack-app/server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=civictrack

JWT_SECRET=your_dev_jwt_secret

UPLOAD_DIR=uploads
```

Create the MySQL database:

```sql
CREATE DATABASE civictrack;
```

Run the required migrations:

```bash
node src/scripts/migrate-bids.js
node src/scripts/migrate-payments.js
node src/scripts/migrate-persistent-strikes.js
node src/scripts/migrate-completion-flow.js
```

Start the backend:

```bash
npm start
```

Backend:

```text
http://localhost:3000
```

---

# 💻 Frontend Setup

Open a new terminal:

```bash
cd civictrack-app/client
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```env
VITE_API_BASE=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 📡 API Overview

Base URL:

```text
http://localhost:3000
```

## 🔐 Authentication

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| POST   | `/api/users/login`    | User/Vendor/Ministry login |
| POST   | `/api/users/register` | Register a new user/vendor |
| POST   | `/api/admin/login`    | Admin authentication       |

---

## 📝 Tasks & Complaints

| Method | Endpoint          | Description               |
| ------ | ----------------- | ------------------------- |
| POST   | `/api/tasks`      | Create a civic complaint  |
| GET    | `/api/tasks/open` | Retrieve open tasks       |
| PATCH  | `/api/tasks/...`  | Update task status        |
| GET    | `/api/tasks/...`  | Retrieve task information |

---

## 💰 Vendor Bidding

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| POST   | `/api/bids`              | Submit vendor bid        |
| GET    | `/api/bids/task/:taskId` | Retrieve bids for a task |
| PATCH  | `/api/bids/approve`      | Approve selected bid     |

---

## 🛡️ Administration

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | `/api/admin/warn`       | Issue vendor Strike 1 |
| DELETE | `/api/admin/vendor/:id` | Disable/ban vendor    |

---

## 💳 Payments

| Method | Endpoint                 | Description               |
| ------ | ------------------------ | ------------------------- |
| GET    | `/api/payments/pending`  | Retrieve pending payments |
| POST   | `/api/payments/disburse` | Execute fund disbursement |

---

# 🗃️ Data & Audit Model

CivicTrack maintains historical records to improve accountability.

Important data domains include:

```text
Users
 ├── Citizens
 ├── Vendors
 ├── Ministries
 └── Administrators

Tasks
 ├── Complaints
 ├── Status
 ├── Location
 └── Proof Images

Bids
 ├── Vendor
 ├── Cost
 ├── Timeline
 ├── Status
 └── History

Payments
 ├── Task
 ├── Vendor
 ├── Amount
 ├── Bank Details
 └── Disbursement Status

Audit
 ├── Activity Logs
 ├── Vendor Reports
 ├── Strike History
 └── Historical Records
```

---

# 📸 Screenshots / Demo

> Add screenshots or GIFs of the application here.

### 👤 Citizen Dashboard

```text
[ Add Screenshot ]
```

### 🗺️ Civic Issue Map

```text
[ Add Screenshot ]
```

### 🛠️ Vendor Dashboard

```text
[ Add Screenshot ]
```

### 🏛️ Ministry Dashboard

```text
[ Add Screenshot ]
```

### 🛡️ Admin Analytics

```text
[ Add Screenshot ]
```

### 💳 Payment Disbursement

```text
[ Add Screenshot ]
```

---

# 🎥 Project Demo

Add your project demonstration video here:

```text
[▶️ Watch CivicTrack Demo]
```

For GitHub, you can upload the demo video to GitHub Releases/Issues or add a YouTube/Loom link.

---

# 🧠 Design Principles

CivicTrack is designed around five core principles:

### 1. Transparency

Vendor bidding and task progression are digitally recorded.

### 2. Accountability

Vendor strikes and historical records provide traceability.

### 3. Verification

Completion requires evidence and multi-stage verification.

### 4. Separation of Duties

Operational verification and financial disbursement are handled through separate roles.

### 5. Citizen Participation

Citizens remain involved even after a task is assigned, including final resolution confirmation.

---

# 🔮 Future Enhancements

Potential improvements for future versions include:

* 🤖 AI-based fraud and anomaly detection
* 📊 Predictive civic issue analytics
* 🛰️ Satellite/geospatial analysis
* 📱 Dedicated Android/iOS application
* 🔔 Real-time notifications
* 💳 Integration with government payment gateways
* 🧠 AI-assisted vendor scoring
* 📈 Advanced ministry-level analytics
* 🗺️ Heatmaps for high-frequency civic issues
* 🔍 Duplicate complaint detection
* 🌐 Multi-language citizen interface
* 📜 Blockchain-backed audit trails for critical transactions

---

# 🏆 Smart India Hackathon

CivicTrack was designed as a **Smart India Hackathon (SIH)** solution focused on improving civic issue reporting, transparent task allocation, vendor accountability, and governance workflows.

The platform demonstrates how a single digital ecosystem can connect:

```text
Citizen
   ↕
Civic Issue
   ↕
Vendor Marketplace
   ↕
Ministry
   ↕
Central Administration
   ↕
Financial Disbursement
```

---

# 📊 Why CivicTrack?

| Traditional Approach          | CivicTrack                       |
| ----------------------------- | -------------------------------- |
| Complaint-focused             | Full lifecycle management        |
| Limited visibility            | End-to-end tracking              |
| Manual vendor selection       | Competitive bidding              |
| Weak completion verification  | Multi-stage verification         |
| Limited vendor accountability | Two-strike governance            |
| Scattered records             | Centralized audit history        |
| Separate financial process    | Integrated disbursement workflow |
| Citizen reports only          | Citizen report + confirmation    |

---

# 👨‍💻 Contributors

### CivicTrack Team

Built for **Smart India Hackathon**.

> Add your team members, roles, GitHub profiles, and LinkedIn profiles here.

| Member      | Role                      |
| ----------- | ------------------------- |
| Your Name   | Full Stack / Project Lead |
| Team Member | Backend                   |
| Team Member | Frontend                  |
| Team Member | Database / Analytics      |

---

# 📄 License

This project is developed for educational, hackathon, and demonstration purposes.

Add your preferred license here, for example:

```text
MIT License
```

---

# ⭐ Support the Project

If you find CivicTrack interesting:

⭐ Star the repository
🍴 Fork the project
🐛 Report issues
💡 Suggest improvements
🤝 Contribute to the project

---

<p align="center">
  <strong>🏛️ CivicTrack — Making Civic Governance More Transparent, Accountable & Citizen-Centric.</strong>
</p>

<p align="center">
  Built with ❤️ using React, Node.js, Express & MySQL
</p>
