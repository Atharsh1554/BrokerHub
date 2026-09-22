# 🏢 BrokerHub — Enterprise Admin Dashboard & Platform

![BrokerHub Banner](https://img.shields.io/badge/BrokerHub-MYSTRIO%20Product-emerald?style=for-the-badge&logo=shield)
![React 19](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript)
![Vite 8](https://img.shields.io/badge/Vite-8.2.2-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38BDF8?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Supported-3ECF8E?style=for-the-badge&logo=supabase)

**BrokerHub Admin Control Center** is an enterprise-grade administrative management platform engineered for multi-portal marketplace operations. It provides real-time telemetry, broker accreditation workflows, customer management, inventory moderation, financial transaction tracking, interactive analytics, and audit logging.

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
- [Key Features & Modules](#-key-features--modules)
- [Admin Dashboard Modules Architecture](#-admin-dashboard-modules-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Project Architecture](#-project-architecture)
- [Data Layer & Hybrid Persistence](#-data-layer--hybrid-persistence)
- [Security & Authentication](#-security--authentication)
- [CSV Report Generation](#-csv-report-generation)
- [Scripts](#-scripts)

---

## 🚀 Executive Overview

BrokerHub connects **Customers**, **Brokers**, and **System Administrators** into a unified digital ecosystem. The **Admin Dashboard** serves as the mission control room for platform operators to maintain marketplace integrity, verify credentials, monitor high-volume transactions, inspect analytics, and audit administrative actions.

---

## ✨ Key Features & Modules

### 1. 📊 Live Real-Time Control Center (`/admin/dashboard`)
- **16 Real-Time Metric Cards**: Monitors total revenue (in ₹), total & active customers, brokers, active products, pending & completed orders, payments, meetings, and system notifications.
- **One-Click Live Sync**: Instant re-fetching of database telemetry.
- **Broker Accreditation Queue**: Quick-approval widgets for incoming broker requests.
- **Recent Order Stream**: Real-time snapshot of the latest transactions.

### 2. 📈 Interactive Analytics Engine (`/admin/analytics`)
- **Revenue & Order Growth Charts**: Time-series charts built with Recharts.
- **Category & Broker Leaderboards**: Performance breakdowns across product categories and broker networks.
- **Filtering**: Live date-range and domain-based metric filtering.

### 3. 👔 Broker Accreditation & Verification (`/admin/brokers`)
- **Verification Workflow**: Review applicant details, portfolio sizes, sales stats, and toggle verification status (`Verified`, `Under Review`, `Rejected`, `Suspended`).
- **Commission & Performance Tracking**: Track product offerings and aggregate sales per broker.

### 4. 👥 Customer Management (`/admin/customers`)
- **Customer Profiles**: Full customer list with location, total spent, order history, and active broker connections.
- **Account Control**: Instantly activate, deactivate, or suspend customer accounts.

### 5. 📦 Product & Catalog Moderation (`/admin/products`)
- **Visibility Control**: Toggle product active/inactive state across the marketplace.
- **Inventory Monitoring**: Real-time stock levels, pricing verification, and broker origin tracking.
- **Moderation Actions**: Delete infringing or out-of-compliance listings.

### 6. 🛒 Order Lifecycle Tracking (`/admin/orders`)
- **End-to-End Status Pipeline**: Manage order stages (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- **Payment & Shipping Correlation**: View associated customer details, broker origin, and line-item breakdowns.

### 7. 💳 Financial & Payment Operations (`/admin/payments`)
- **Transaction Registry**: Comprehensive logs of Razorpay, UPI, and Card transactions.
- **Instant Refund Processing**: Automated single-click refund state updates.
- **Status Badges**: Distinct tracking for `Successful`, `Pending`, and `Refunded` payments.

### 8. 🤝 Connection & Network Management (`/admin/connections`)
- **Relationship Matrix**: Monitor broker-customer pairings, request dates, and approval statuses.

### 9. 💬 Review & Content Moderation (`/admin/reviews`)
- **Content Shield**: Moderation queue for customer product reviews (`Published`, `Hidden`, `Reported`).
- **Rating Inspection**: Star rating breakdown and flag resolution.

### 10. 🔔 System Broadcasts & Notifications (`/admin/notifications`)
- **Platform-Wide Announcements**: Send targeted notifications to brokers or customers with urgency levels (`Info`, `Warning`, `Critical`).

### 11. 📅 Meetings & Appointments Oversight (`/admin/meetings`)
- **Consultation Scheduler**: Calendar & table view of customer-broker video consultations and status tracking.

### 12. 📄 Custom CSV Report Generator (`/admin/reports`)
- **Export Engine**: Export custom financial, user, broker, and order reports directly into CSV format.

### 13. 🛡️ Audit Logs & Compliance (`/admin/activity-logs`)
- **Audit Trail**: Real-time recording of all admin logins, status overrides, and system changes with IP address and device details.

### 14. 🔍 Global Platform Search (`/admin/search`)
- **Unified Index**: Instant search across customers, brokers, products, orders, and payments from a single input bar.

### 15. ⚙️ System Settings (`/admin/settings`)
- **Platform Configuration**: Commission percentages, security parameters, system maintenance flags, and notification toggles.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 (`react`, `react-dom`) |
| **Language** | TypeScript 6.0 (`typescript`) |
| **Build Tool & HMR** | Vite 8 (`vite`) |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`) |
| **Icons** | Lucide React (`lucide-react`) |
| **Data Visualization** | Recharts (`recharts`) |
| **Routing** | React Router v7 (`react-router-dom`) |
| **Database & Auth** | Supabase JS (`@supabase/supabase-js`) |
| **Linter** | Oxlint (`oxlint`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Atharsh1554/BrokerHub.git
   cd Brokerhub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173/admin/login` to access the Admin Control Center.

---

## 🔑 Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
# Supabase Backend Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note**: BrokerHub features a hybrid data architecture. If Supabase keys are not provided or the backend is unreachable, the Admin Dashboard automatically falls back to local storage and mock telemetry for an uninterrupted offline development experience.

---

## 📂 Project Architecture

```
Brokerhub/
├── public/                 # Static assets & branding logos
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components & protected route guards
│   │   │   └── AdminProtectedRoute.tsx
│   │   └── layout/         # Layout shells, headers, and sidebars
│   │       ├── AdminLayout.tsx
│   │       ├── AdminSidebar.tsx
│   │       ├── TopHeader.tsx
│   │       └── Navbar.tsx
│   ├── data/
│   │   └── mockData.ts     # Initial seed data for offline fallback
│   ├── lib/
│   │   ├── api/
│   │   │   └── admin.ts    # Comprehensive Admin API service layer
│   │   └── supabase.ts     # Supabase client initialization
│   ├── pages/
│   │   └── admin/          # Admin Dashboard Page Controllers
│   │       ├── AdminLoginPage.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminAnalytics.tsx
│   │       ├── AdminBrokers.tsx
│   │       ├── AdminCustomers.tsx
│   │       ├── AdminProducts.tsx
│   │       ├── AdminOrders.tsx
│   │       ├── AdminPayments.tsx
│   │       ├── AdminConnections.tsx
│   │       ├── AdminNotifications.tsx
│   │       ├── AdminMeetings.tsx
│   │       ├── AdminReviews.tsx
│   │       ├── AdminReports.tsx
│   │       ├── AdminActivityLogs.tsx
│   │       ├── AdminSearch.tsx
│   │       └── AdminSettings.tsx
│   ├── types/
│   │   └── index.ts        # TypeScript Interfaces & Types
│   ├── App.tsx             # Master App Router & Portal Navigation
│   └── main.tsx            # Entry Point
├── package.json            # Project Dependencies & Scripts
├── vite.config.ts          # Vite Configuration
├── vercel.json             # Vercel Deployment Rewrites
└── README.md               # Project Documentation
```

---

## 💾 Data Layer & Hybrid Persistence

The Admin Dashboard API layer (`src/lib/api/admin.ts`) implements a robust data-fetching fallback pattern:

```typescript
// Example: Data fetch pattern with database attempt & offline fallback
export const getAdminBrokers = async (): Promise<Broker[]> => {
  try {
    const { data } = await supabase.from('brokers').select('*, users(*)');
    if (data && data.length > 0) return formatBrokers(data);
  } catch {
    // Gracefully fallback to localStorage overrides or mock data
  }
  return getLocalBrokersWithOverrides();
};
```

All administrative state mutations (broker approval, status change, refund processing, product toggling) trigger automatic compliance logs via `logAdminActivity()`.

---

## 🔒 Security & Authentication

- **Route Guarding**: Access to `/admin/*` routes is wrapped in `<AdminProtectedRoute>`, verifying admin session tokens stored in `localStorage` (`brokerhub_admin_authenticated`).
- **Session Timeout**: Unauthenticated or expired attempts to access admin panels automatically redirect to `/admin/login`.
- **Audit Logging**: Every state modification generates an entry in `AdminActivityLogs` with IP address and timestamp.

---

## 📊 CSV Report Generation

The built-in CSV export engine ([`admin.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/lib/api/admin.ts#L603-L618)) enables administrators to download reports:

```typescript
import { exportReportToCSV } from '../../lib/api/admin';

// Trigger download
exportReportToCSV('revenue_report', ['Order ID', 'Customer', 'Amount', 'Date'], [
  ['ORD-7841', 'Alice Johnson', 24900, '2026-01-15'],
]);
```

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches Vite local development server with HMR |
| `npm run build` | Compiles TypeScript and builds production bundle |
| `npm run preview` | Serves local production build preview |
| `npm run lint` | Runs Oxlint linter for rapid code analysis |

---

## 👨‍💻 Author & Credits

- **Product**: BROKER HUB
- **Parent Organization**: MYSTRIO Initiatives
- **Copyright**: © 2026 MYSTRIO. All rights reserved.
