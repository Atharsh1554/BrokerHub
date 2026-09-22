# 🛡️ BrokerHub Admin Dashboard Module Documentation

This directory contains the source code for all page views, controllers, and sub-systems within the **BrokerHub Admin Control Center**.

---

## 📁 Directory Structure & Component Map

| Component File | Route Path | Description |
|---|---|---|
| [`AdminLoginPage.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminLoginPage.tsx) | `/admin/login` | Secure administrator authentication portal with credential validation and session persistence. |
| [`AdminDashboard.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminDashboard.tsx) | `/admin/dashboard` | Main operational control center featuring 16 real-time KPI metrics, pending broker approval queue, recent orders stream, and DB sync. |
| [`AdminAnalytics.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminAnalytics.tsx) | `/admin/analytics` | Deep-dive analytics dashboard powered by Recharts (revenue trends, order distribution, category breakdowns, broker rankings). |
| [`AdminBrokers.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminBrokers.tsx) | `/admin/brokers` | Broker accreditation portal. Review credentials, portfolio sizes, commission rates, and toggle status (`Verified`, `Under Review`, `Rejected`, `Suspended`). |
| [`AdminCustomers.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminCustomers.tsx) | `/admin/customers` | Customer directory management. Inspect expenditure history, active broker links, and toggle account states (`Active`, `Inactive`, `Suspended`). |
| [`AdminProducts.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminProducts.tsx) | `/admin/products` | Marketplace product catalog moderation. Search listings, filter by category/broker, toggle visibility (`Active`/`Inactive`), and delete products. |
| [`AdminOrders.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminOrders.tsx) | `/admin/orders` | Multi-stage order fulfillment monitor. Update order statuses (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) and track delivery dates. |
| [`AdminPayments.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminPayments.tsx) | `/admin/payments` | Payment ledger monitoring Razorpay, UPI, and Card transactions. Execute one-click automated refund processing. |
| [`AdminConnections.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminConnections.tsx) | `/admin/connections` | Broker-Customer connection graph manager. Track relationship requests, acceptance dates, and active pairings. |
| [`AdminNotifications.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminNotifications.tsx) | `/admin/notifications` | Platform alert broadcasting engine. Compose and dispatch system announcements across user roles with priority flags. |
| [`AdminMeetings.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminMeetings.tsx) | `/admin/meetings` | Appointment & consultation scheduler oversight between brokers and customers. |
| [`AdminReviews.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminReviews.tsx) | `/admin/reviews` | Review moderation desk. Moderates customer feedback (`Published`, `Hidden`, `Reported`) and handles flagged comments. |
| [`AdminReports.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminReports.tsx) | `/admin/reports` | Custom CSV report generator with date range selector and metric domain export controls. |
| [`AdminActivityLogs.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminActivityLogs.tsx) | `/admin/activity-logs` | Comprehensive security audit log capturing admin actions, timestamps, target entities, IP addresses, and user agents. |
| [`AdminSearch.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminSearch.tsx) | `/admin/search` | Global cross-entity search index across all database tables. |
| [`AdminSettings.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminSettings.tsx) | `/admin/settings` | Platform fee controls, email notification toggles, system maintenance mode switches, and security parameters. |

---

## 🔒 Protected Route Integration

All admin pages within this directory are mounted under the `<AdminProtectedRoute>` component:

```tsx
// Location: src/App.tsx
<Route
  path="/admin"
  element={
    <AdminProtectedRoute>
      <AdminLayout />
    </AdminProtectedRoute>
  }
>
  <Route index element={<Navigate to="/admin/dashboard" replace />} />
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  {/* Additional routes... */}
</Route>
```

---

## 🔌 API Service Layer

All database operations, state mutations, and analytics fetching are routed through:
- [`src/lib/api/admin.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/lib/api/admin.ts)

Every state change automatically logs an administrative audit record via `logAdminActivity(action, target)`.
