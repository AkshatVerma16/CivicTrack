# 🏛️ CivicTrack - Crowdsourced Civic Issue Reporting & Governance Ecosystem

**CivicTrack** is an end-to-end, multi-role civic management and fund-disbursement ecosystem built for Smart India Hackathon (SIH). It empowers citizens to report civic problems using GPS-tagged photos, enables registered contractors/vendors to bid transparently on tasks, and provides government ministries and central administrators with monitoring, fraud prevention, and financial disbursement workflows.

---

## 📂 Project Directory Structure

```text
CivicTrack/
├── .gitignore
├── README.md
└── civictrack-app/
    ├── package.json
    ├── client/                  # React + Vite Frontend
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
    └── server/                  # Express.js REST API Backend
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
        └── uploads/             # Server-side stored image assets

🌟 Core System Roles & Workflows
👤 1. Citizen Portal
GPS-Tagged Reporting: Citizens log civic complaints with live photo uploads and auto-filled location coordinates.

Interactive Google Maps: View complaints geographically mapped via Google Maps API.

Multi-Stage Task Verification: Complaints transition through states (Open → In Progress → Completed → User Confirmed → Archived). Citizens verify completed work with proof-of-work photos before task closure.

🛠️ 2. Vendor Marketplace
Bidding System: Registered vendors browse open tasks and submit bids specifying estimated budgets and timelines.

Progress Tracking: Vendors upload progress updates and proof-of-work photos upon task execution.

Re-Bidding Logic: Vendors receiving a "First Strike" warning can view feedback in their permanent history and submit a corrected bid tagged with a "Repeat Bidder" badge.

🏛️ 3. Ministry Panel
Smart Bid Selection Engine: Review and accept vendor bids based on cost and timeframe efficiency.

Task Progression: Monitor physical progress updates submitted by assigned vendors.

Fraud Escalation: Escalate suspicious or unrealistically low bids directly to the Central Admin.

🛡️ 4. Admin Governance & Financial Treasury
Two-Strike Rule Moderation:

Strike 1 (Warn): Increments vendor warning count, archives the reported bid to an immutable history table, and re-opens the complaint for corrected bidding.

Strike 2 (Ban): Automatically disables the 'Warn' action and enforces account termination for repeat offenders.

Soft Delete Audit Preservation: Disassociates deleted vendor IDs from completed tasks while retaining historical government records.

Segregation of Duties (SoD) Financial Disbursement: Enforces a secure bank-to-bank fund release mechanism where the Admin disburses funds to the vendor's bank account (Account No, IFSC) only after Ministry verification.

🛠️ Tech Stack & Integrations
Frontend: React.js, Tailwind CSS, Vite, Axios, React Router DOM

Backend: Node.js, Express.js (Modular Router Architecture)

Database: MySQL (mysql2 connection pool with async/await)

Security & Media: JWT Authentication, Role-Based Access Control (RBAC), Multer File Handling, Google Maps API

🚀 Installation & Local Setup
Prerequisites
Node.js (v18+ recommended)

MySQL Server (Running locally or on cloud instance)

1. Backend Setup (server)

cd civictrack-app/server
npm install

Configure your environment variables by creating a .env file in civictrack-app/server/:

PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=civictrack
JWT_SECRET=your_dev_jwt_secret
UPLOAD_DIR=uploads

Execute SQL database scripts and migration runners:

# Initialize DB tables
node src/scripts/migrate-bids.js
node src/scripts/migrate-payments.js
node src/scripts/migrate-persistent-strikes.js
node src/scripts/migrate-completion-flow.js

# Start backend server
npm start

The server will run on http://localhost:3000.

2. Frontend Setup (client)

cd civictrack-app/client
npm install

Configure client/.env:

VITE_API_BASE=http://localhost:3000

Start Vite development server:
npm run dev

The client app will launch at http://localhost:5173.

📡 API Reference Overview
Base URL: http://localhost:3000

🔓 Authentication & Users
POST /api/users/login - User/Vendor/Ministry authentication.

POST /api/users/register - New user/vendor registration.

POST /api/admin/login - Admin authentication token generation.

📝 Complaints & Bidding
POST /api/tasks - Submit new complaint (Multipart form-data with photo, GPS, and description).

GET /api/tasks/open - Retrieve all open tasks for vendor bidding.

POST /api/bids - Submit a new vendor bid on an open task.

GET /api/bids/task/:taskId - Retrieve all vendor bids for a specific task.

PATCH /api/bids/approve - Ministry bid acceptance route.

🛡️ Moderation & Governance
POST /api/admin/warn - Execute Strike 1 warning on reported vendor bid.

DELETE /api/admin/vendor/:id - Execute Strike 2 account ban with soft-delete history preservation.

💳 Financial Disbursements
GET /api/payments/pending - Fetch completed tasks awaiting Ministry payment forwarding.

POST /api/payments/disburse - Single-click Admin bank-to-bank transaction execution.

🔄 Lifecycle & State Machine Sketch

[ Citizen Reports Issue (Open) ]
                │
                ▼
  [ Vendors Submit Competitive Bids ]
                │
                ▼
  [ Ministry Selects Optimal Bid ]
                │
                ├──────────────────────────────────────┐
                ▼                                      ▼
  [ Task In Progress (Vendor Uploads Proof) ]  [ Suspected Fraud Reported ]
                │                                      │
                ▼                                      ▼
  [ Ministry Verifies Completion ]            [ Admin Two-Strike Engine ]
                │                                ├─────────────┴────────────┐
                ▼                                ▼                          ▼
  [ Citizen Confirms Resolution ]       [ Strike 1: Warning ]     [ Strike 2: Ban ]
                │                       (Re-bid / History Log)   (Account Removal)
                ▼
  [ Admin Finance Disburses Funds ]
                │
                ▼
  [ Archived in Read-Only History ]
