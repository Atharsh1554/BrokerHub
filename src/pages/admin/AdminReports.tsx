import React, { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';
import {
  exportReportToCSV,
  getAdminCustomers,
  getAdminBrokers,
  getAdminProducts,
  getAdminOrders,
  getAdminPayments,
  getAdminActivityLogs,
} from '../../lib/api/admin';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminReports: React.FC = () => {
  const [reportType, setReportType] = useState<
    'users' | 'brokers' | 'products' | 'orders' | 'revenue' | 'payments' | 'activity'
  >('orders');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-09-21');
  const [isExporting, setIsExporting] = useState(false);
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const reportTypes = [
    { id: 'orders', label: 'Order Report', desc: 'Complete breakdown of all sales, line items, and fulfillment statuses' },
    { id: 'users', label: 'User Report', desc: 'Registered customer profiles, onboarding dates, and lifetime spend' },
    { id: 'brokers', label: 'Broker Accreditation Report', desc: 'Broker verification records, sales figures, and performance ratings' },
    { id: 'products', label: 'Product Inventory Report', desc: 'Listings catalog, stock status, category shares, and active flags' },
    { id: 'revenue', label: 'Revenue & Financial Report', desc: 'Gross platform volume, completed payments, and refund records' },
    { id: 'payments', label: 'Payment Gateway Report', desc: 'Razorpay transaction logs, payment methods, and transaction IDs' },
    { id: 'activity', label: 'Admin Activity Log Report', desc: 'System audit logs, administrative actions, and IP metadata' },
  ];

  const handleGenerateAndExport = async () => {
    setIsExporting(true);
    try {
      if (reportType === 'users') {
        const users = await getAdminCustomers();
        const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Joined Date', 'Status', 'Total Orders', 'Total Spent'];
        const rows = users.map((u) => [
          u.id,
          u.fullName,
          u.email,
          u.phone,
          u.joinedDate || '',
          u.status || 'active',
          u.totalOrders || 0,
          u.totalSpent || 0,
        ]);
        exportReportToCSV('Customer_User_Report', headers, rows);
      } else if (reportType === 'brokers') {
        const brokers = await getAdminBrokers();
        const headers = ['Broker ID', 'Name', 'Company', 'Specialty', 'Status', 'Rating', 'Total Sales', 'Total Orders'];
        const rows = brokers.map((b) => [
          b.id,
          b.name,
          b.company,
          b.specialty,
          b.status,
          b.rating,
          b.totalSales || 0,
          b.totalOrders || 0,
        ]);
        exportReportToCSV('Broker_Accreditation_Report', headers, rows);
      } else if (reportType === 'products') {
        const products = await getAdminProducts();
        const headers = ['Product ID', 'Name', 'Category', 'Broker', 'Price', 'Stock', 'Status', 'Is Active'];
        const rows = products.map((p) => [
          p.id,
          p.name,
          p.category,
          p.brokerName || '',
          p.price,
          p.stock,
          p.status,
          p.isActive !== false ? 'Active' : 'Inactive',
        ]);
        exportReportToCSV('Product_Catalog_Report', headers, rows);
      } else if (reportType === 'orders' || reportType === 'revenue') {
        const orders = await getAdminOrders();
        const headers = ['Order ID', 'Customer Name', 'Broker Name', 'Total Amount', 'Payment Status', 'Fulfillment Status', 'Date'];
        const rows = orders.map((o) => [
          o.id,
          o.customerName,
          o.brokerName || 'Marcus Chen',
          o.amount || o.totalAmount || 0,
          o.paymentStatus || 'Successful',
          o.status,
          o.date,
        ]);
        exportReportToCSV(`${reportType.toUpperCase()}_Report`, headers, rows);
      } else if (reportType === 'payments') {
        const payments = await getAdminPayments();
        const headers = ['Transaction ID', 'Order ID', 'Customer Name', 'Broker Name', 'Amount', 'Payment Method', 'Status', 'Date'];
        const rows = payments.map((p) => [
          p.transactionId,
          p.orderId,
          p.customerName,
          p.brokerName,
          p.amount,
          p.paymentMethod,
          p.status,
          p.createdAt,
        ]);
        exportReportToCSV('Razorpay_Payment_Report', headers, rows);
      } else if (reportType === 'activity') {
        const logs = await getAdminActivityLogs();
        const headers = ['Log ID', 'Admin Name', 'Admin Email', 'Action', 'Target', 'Timestamp', 'IP Address', 'Device'];
        const rows = logs.map((l) => [
          l.id,
          l.adminName,
          l.adminEmail,
          l.action,
          l.target,
          l.timestamp,
          l.ipAddress || '',
          l.device || '',
        ]);
        exportReportToCSV('Admin_Activity_Audit_Report', headers, rows);
      }
    } catch (err) {
      console.error('Error generating report CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Administrative Report Generator & Export</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Generate custom data extractions and export spreadsheet reports across all platform domains.
          </p>
        </div>
      </div>

      {/* Main Form & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Selection Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>1. Select Report Domain</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reportTypes.map((item) => (
              <div
                key={item.id}
                onClick={() => setReportType(item.id as any)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  reportType === item.id
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-500 shadow-md text-slate-900'
                      : 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10 text-white'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.label}</span>
                  {reportType === item.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Configurations Sidebar */}
        <div className={`p-6 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>2. Configure Date Range & Export</h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-xl p-2.5 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full rounded-xl p-2.5 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Export Format</label>
              <div className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}>
                <span>CSV Spreadsheet (.csv)</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Supported</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateAndExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate & Download CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
