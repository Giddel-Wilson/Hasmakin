<!-- Admin Payments Management -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientAuth } from '$lib/auth';

  let payments: any[] = [];
  let filteredPayments: any[] = [];
  let loading = true;
  let error = '';
  let success = '';

  // Filters
  let searchQuery = '';
  let statusFilter = 'ALL';
  let dateRangeStart = '';
  let dateRangeEnd = '';

  // Modal state
  let showRejectModal = false;
  let rejectPaymentId = '';
  let rejectReason = '';
  let rejectingPayment = false;

  // Proof viewer modal
  let showProofModal = false;
  let currentProofUrl = '';
  let currentProofFileName = '';
  let currentProofType = 'image'; // 'image' or 'pdf'

  // Confirm payment modal
  let showConfirmModal = false;
  let confirmPaymentId = '';
  let confirmingPayment = false;

  // Refund modal
  let showRefundModal = false;
  let refundPaymentId = '';
  let refundReason = '';
  let refundingPayment = false;
  
  // Financial report modal
  let showFinancialReportModal = false;
  let reportData: any = null;
  let reportPeriodFilter = 'all'; // 'today', 'week', 'month', 'all'

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalPages = 1;

  // Stats
  let stats = {
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    pendingAmount: 0,
    confirmedPayments: 0,
    confirmedAmount: 0,
    failedPayments: 0,
    failedAmount: 0
  };

  // Payment methods and fees
  const paymentMethods = [
    { id: 'bank_transfer', name: 'Bank Transfer', fee: 0 },
    { id: 'card', name: 'Debit/Credit Card', fee: 50 },
    { id: 'ussd', name: 'USSD', fee: 20 },
    { id: 'bank_branch', name: 'Bank Branch', fee: 0 },
    { id: 'mobile_money', name: 'Mobile Money', fee: 25 }
  ];

  const hostelFees = {
    'Male Hall A': 45000,
    'Male Hall B': 50000,
    'Female Hall A': 48000,
    'Female Hall B': 52000
  };

  onMount(async () => {
    await loadPayments();
  });

  async function loadPayments() {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/payments');
      if (response.ok) {
        payments = await response.json();
      } else {
        console.error('Failed to load payments:', response.status);
        error = 'Failed to load payments. Please try again.';
        payments = [];
      }

      updateStats();
      applyFilters();
    } catch (err) {
      console.error('Failed to load payments:', err);
      error = 'Failed to load payments. Please check your connection.';
      payments = [];
      updateStats();
      applyFilters();
    } finally {
      loading = false;
    }
  }



  function updateStats() {
    stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      pendingAmount: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      confirmedPayments: payments.filter(p => p.status === 'COMPLETED').length,
      confirmedAmount: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
      failedPayments: payments.filter(p => p.status === 'FAILED').length,
      failedAmount: payments.filter(p => p.status === 'FAILED').reduce((sum, p) => sum + p.amount, 0)
    };
  }

  function applyFilters() {
    let filtered = [...payments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.user.name.toLowerCase().includes(query) ||
        payment.user.matricNo.toLowerCase().includes(query) ||
        payment.reference.toLowerCase().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Date range filter
    if (dateRangeStart) {
      const startDate = new Date(dateRangeStart);
      startDate.setHours(0, 0, 0, 0); // Start of day
      filtered = filtered.filter(payment => new Date(payment.createdAt) >= startDate);
    }

    if (dateRangeEnd) {
      const endDate = new Date(dateRangeEnd);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(payment => new Date(payment.createdAt) <= endDate);
    }

    filteredPayments = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages || 1);
  }

  function getPaginatedPayments() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPayments.slice(start, end);
  }
  
  // Make paginated payments reactive to filteredPayments and currentPage changes
  $: paginatedPayments = (() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPayments.slice(start, end);
  })();

  async function confirmPayment(paymentId: string) {
    confirmPaymentId = paymentId;
    showConfirmModal = true;
  }

  async function executeConfirmPayment() {
    if (!confirmPaymentId) return;

    confirmingPayment = true;

    try {
      const response = await ClientAuth.fetch(`/api/admin/payments/${confirmPaymentId}/confirm`, {
        method: 'POST'
      });

      if (response.ok) {
        // Reload all payments to get fresh data with updated relationships
        await loadPayments();
        success = 'Payment confirmed successfully';
        setTimeout(() => success = '', 3000);
        closeConfirmModal();
      } else {
        error = 'Failed to confirm payment';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to confirm payment';
      setTimeout(() => error = '', 3000);
    } finally {
      confirmingPayment = false;
    }
  }

  function closeConfirmModal() {
    showConfirmModal = false;
    confirmPaymentId = '';
    confirmingPayment = false;
  }

  async function rejectPayment(paymentId: string) {
    rejectPaymentId = paymentId;
    rejectReason = '';
    showRejectModal = true;
  }

  async function confirmRejectPayment() {
    if (!rejectReason || rejectReason.trim().length === 0) {
      error = 'Please provide a reason for rejection';
      setTimeout(() => error = '', 3000);
      return;
    }

    rejectingPayment = true;

    try {
      const response = await ClientAuth.fetch(`/api/admin/payments/${rejectPaymentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason.trim() })
      });

      if (response.ok) {
        // Reload all payments to get fresh data
        await loadPayments();
        success = 'Payment rejected successfully';
        setTimeout(() => success = '', 3000);
        closeRejectModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        error = errorData.error || 'Failed to reject payment';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to reject payment';
      setTimeout(() => error = '', 3000);
    } finally {
      rejectingPayment = false;
    }
  }

  function closeRejectModal() {
    showRejectModal = false;
    rejectPaymentId = '';
    rejectReason = '';
    rejectingPayment = false;
  }

  function viewProof(proofUrl: string, fileName: string = '') {
    currentProofUrl = proofUrl;
    currentProofFileName = fileName;
    
    // Detect if it's a PDF
    if (fileName.toLowerCase().endsWith('.pdf') || proofUrl.includes('application/pdf')) {
      currentProofType = 'pdf';
    } else {
      currentProofType = 'image';
    }
    
    showProofModal = true;
  }

  function closeProofModal() {
    showProofModal = false;
    currentProofUrl = '';
    currentProofFileName = '';
    currentProofType = 'image';
  }

  async function refundPayment(paymentId: string) {
    refundPaymentId = paymentId;
    refundReason = '';
    showRefundModal = true;
  }

  async function executeRefundPayment() {
    if (!refundReason || refundReason.trim().length < 10) {
      error = 'Please provide a detailed reason (at least 10 characters)';
      setTimeout(() => error = '', 3000);
      return;
    }

    refundingPayment = true;

    try {
      const response = await ClientAuth.fetch(`/api/admin/payments/${refundPaymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason.trim() })
      });

      if (response.ok) {
        // Reload all payments to get fresh data
        await loadPayments();
        success = 'Payment refunded successfully';
        setTimeout(() => success = '', 3000);
        closeRefundModal();
      } else {
        error = 'Failed to refund payment';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to refund payment';
      setTimeout(() => error = '', 3000);
    } finally {
      refundingPayment = false;
    }
  }

  function closeRefundModal() {
    showRefundModal = false;
    refundPaymentId = '';
    refundReason = '';
    refundingPayment = false;
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getPaymentMethodName(methodId: string) {
    return paymentMethods.find(m => m.id === methodId)?.name || methodId;
  }

  function exportPayments() {
    const csvContent = [
      ['Reference', 'Student Name', 'Matric No', 'Hostel', 'Amount', 'Status', 'Method', 'Transaction ID', 'Created', 'Paid'].join(','),
      ...filteredPayments.map(payment => [
        payment.reference,
        payment.user.name,
        payment.user.matricNo,
        payment.application?.allocations?.[0]?.room.hostel.name || 'N/A',
        payment.amount,
        payment.status,
        getPaymentMethodName(payment.paymentMethod),
        payment.transactionId || 'N/A',
        formatDate(payment.createdAt),
        payment.paidAt ? formatDate(payment.paidAt) : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function getFilteredPaymentsByPeriod() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (reportPeriodFilter) {
      case 'today':
        return payments.filter(p => {
          const pDate = new Date(p.createdAt);
          return pDate >= today;
        });
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return payments.filter(p => new Date(p.createdAt) >= weekAgo);
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return payments.filter(p => new Date(p.createdAt) >= monthAgo);
      default:
        return payments;
    }
  }

  function generateFinancialReport() {
    const filteredByPeriod = getFilteredPaymentsByPeriod();
    
    // Calculate stats for filtered period
    const periodStats = {
      totalPayments: filteredByPeriod.length,
      totalAmount: filteredByPeriod.reduce((sum, p) => sum + p.amount, 0),
      confirmedPayments: filteredByPeriod.filter(p => p.status === 'COMPLETED').length,
      confirmedAmount: filteredByPeriod.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: filteredByPeriod.filter(p => p.status === 'PENDING').length,
      pendingAmount: filteredByPeriod.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      failedPayments: filteredByPeriod.filter(p => p.status === 'FAILED').length,
      failedAmount: filteredByPeriod.filter(p => p.status === 'FAILED').reduce((sum, p) => sum + p.amount, 0)
    };
    
    // Get unique payment methods actually used in filtered payments
    const usedMethods = [...new Set(filteredByPeriod.map(p => p.paymentMethod))];
    
    const periodLabel = {
      'today': 'Today',
      'week': 'Last 7 Days',
      'month': 'Last 30 Days',
      'all': 'All Time'
    }[reportPeriodFilter];
    
    reportData = {
      period: periodLabel,
      periodFilter: reportPeriodFilter,
      summary: periodStats,
      byMethod: usedMethods.map(methodId => {
        const methodInfo = paymentMethods.find(m => m.id.toLowerCase() === methodId.toLowerCase());
        const count = filteredByPeriod.filter(p => p.paymentMethod === methodId).length;
        const amount = filteredByPeriod.filter(p => p.paymentMethod === methodId).reduce((sum, p) => sum + p.amount, 0);
        return {
          method: methodInfo?.name || methodId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          count: count,
          amount: amount
        };
      }).filter(item => item.count > 0), // Only show methods with payments
      byHostel: Object.keys(hostelFees).map(hostel => ({
        hostel,
        count: filteredByPeriod.filter(p => p.application?.allocations?.[0]?.room?.hostel?.name === hostel).length,
        amount: filteredByPeriod.filter(p => p.application?.allocations?.[0]?.room?.hostel?.name === hostel).reduce((sum, p) => sum + p.amount, 0)
      })).filter(item => item.count > 0), // Only show hostels with payments
      allTransactions: [...filteredByPeriod]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
    
    showFinancialReportModal = true;
  }
  
  function closeFinancialReportModal() {
    showFinancialReportModal = false;
  }
  
  async function downloadReport() {
    if (!reportData) return;
    
    try {
      // Create an invisible iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        error = 'Failed to create print document';
        setTimeout(() => error = '', 5000);
        return;
      }
      
      // Build the HTML content using string concatenation to avoid nested template literal issues
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Financial Report - ${reportData.period}</title>
  <style>
    @media print {
      @page { 
        margin: 1cm; 
        size: A4;
      }
      body { margin: 0; }
      .print-instructions { display: none !important; }
    }
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
    .header h1 { color: #4F46E5; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { padding: 15px; border-radius: 8px; border: 2px solid; }
    .summary-card.total { background: #EFF6FF; border-color: #3B82F6; }
    .summary-card.confirmed { background: #F0FDF4; border-color: #22C55E; }
    .summary-card.pending { background: #FEFCE8; border-color: #EAB308; }
    .summary-card.failed { background: #FEF2F2; border-color: #EF4444; }
    .summary-card h3 { margin: 0; font-size: 14px; color: #666; }
    .summary-card .number { font-size: 24px; font-weight: bold; margin: 5px 0; }
    .summary-card .amount { font-size: 16px; color: #666; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section h2 { color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #F3F4F6; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; border: 1px solid #E5E7EB; }
    td { padding: 10px; border: 1px solid #E5E7EB; font-size: 13px; }
    tr:nth-child(even) { background: #F9FAFB; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .badge.completed { background: #D1FAE5; color: #065F46; }
    .badge.pending { background: #FEF3C7; color: #92400E; }
    .badge.failed { background: #FEE2E2; color: #991B1B; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #666; font-size: 12px; }
    .print-instructions { display: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 FINANCIAL REPORT</h1>
    <p><strong>University of Port Harcourt - Hostel Allocation System</strong></p>
    <p>Period: ${reportData.period} | Generated: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="summary">
    <div class="summary-card total">
      <h3>Total Payments</h3>
      <div class="number">${reportData.summary.totalPayments}</div>
      <div class="amount">${formatAmount(reportData.summary.totalAmount)}</div>
    </div>
    <div class="summary-card confirmed">
      <h3>Confirmed</h3>
      <div class="number">${reportData.summary.confirmedPayments}</div>
      <div class="amount">${formatAmount(reportData.summary.confirmedAmount)}</div>
    </div>
    <div class="summary-card pending">
      <h3>Pending</h3>
      <div class="number">${reportData.summary.pendingPayments}</div>
      <div class="amount">${formatAmount(reportData.summary.pendingAmount)}</div>
    </div>
    <div class="summary-card failed">
      <h3>Failed</h3>
      <div class="number">${reportData.summary.failedPayments}</div>
      <div class="amount">${formatAmount(reportData.summary.failedAmount)}</div>
    </div>
  </div>
`;

      if (reportData.byMethod.length > 0) {
        htmlContent += `
  <div class="section">
    <h2>💳 By Payment Method</h2>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th class="text-right">Count</th>
          <th class="text-right">Amount</th>
          <th class="text-right">Percentage</th>
        </tr>
      </thead>
      <tbody>
        `;
      
      // Add method rows
      reportData.byMethod.forEach((item: any) => {
        const percentage = reportData.summary.totalAmount > 0 ? ((item.amount / reportData.summary.totalAmount) * 100).toFixed(1) : 0;
        htmlContent += `
        <tr>
          <td><strong>${item.method}</strong></td>
          <td class="text-right">${item.count}</td>
          <td class="text-right"><strong>${formatAmount(item.amount)}</strong></td>
          <td class="text-right">${percentage}%</td>
        </tr>`;
      });
      
      htmlContent += `
      </tbody>
    </table>
  </div>
  `;
      }

      // By Hostel section
      if (reportData.byHostel.length > 0) {
        htmlContent += `
  <div class="section">
    <h2>🏨 By Hostel</h2>
    <table>
      <thead>
        <tr>
          <th>Hostel</th>
          <th class="text-right">Count</th>
          <th class="text-right">Amount</th>
          <th class="text-right">Percentage</th>
        </tr>
      </thead>
      <tbody>
        `;
        
        reportData.byHostel.forEach((item: any) => {
          const percentage = reportData.summary.totalAmount > 0 ? ((item.amount / reportData.summary.totalAmount) * 100).toFixed(1) : 0;
          htmlContent += `
        <tr>
          <td><strong>${item.hostel}</strong></td>
          <td class="text-right">${item.count}</td>
          <td class="text-right"><strong>${formatAmount(item.amount)}</strong></td>
          <td class="text-right">${percentage}%</td>
        </tr>`;
        });
        
        htmlContent += `
      </tbody>
    </table>
  </div>
  `;
      }

      // All Transactions section
      htmlContent += `
  <div class="section">
    <h2>📋 All Transactions (${reportData.allTransactions.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Student</th>
          <th>Reference</th>
          <th class="text-right">Amount</th>
          <th class="text-center">Method</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
      `;
      
      reportData.allTransactions.forEach((t: any) => {
        const date = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusClass = t.status.toLowerCase();
        htmlContent += `
        <tr>
          <td>${date}</td>
          <td>
            <strong>${t.user.name}</strong><br>
            <span style="color: #666; font-size: 11px;">${t.user.matricNo}</span>
          </td>
          <td style="font-family: monospace; font-size: 11px;">${t.reference}</td>
          <td class="text-right"><strong>${formatAmount(t.amount)}</strong></td>
          <td class="text-center">${getPaymentMethodName(t.paymentMethod)}</td>
          <td class="text-center"><span class="badge ${statusClass}">${t.status}</span></td>
        </tr>`;
      });
      
      htmlContent += `
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p><strong>University of Port Harcourt</strong> | Hostel Allocation System</p>
    <p>This is an official financial report generated from the system.</p>
  </div>
</body>
</html>
      `;
      
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // Clean up iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
          
          success = '📄 Print dialog opened! Choose "Save as PDF" as the destination';
          setTimeout(() => success = '', 5000);
        } catch (printErr) {
          console.error('Print error:', printErr);
          document.body.removeChild(iframe);
          error = 'Print failed. Please try again.';
          setTimeout(() => error = '', 5000);
        }
      }, 500);
      
    } catch (err) {
      console.error('Error generating report:', err);
      error = 'Failed to generate report. Please try again.';
      setTimeout(() => error = '', 5000);
    }
  }

  // Reactive filters - automatically re-run when any of these values change
  $: {
    // Apply filters whenever filter values or payments change
    searchQuery;
    statusFilter;
    dateRangeStart;
    dateRangeEnd;
    payments;
    applyFilters();
  }
</script>

<svelte:head>
  <title>Payments Management - UNIPORT HAS Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-8 flex justify-between items-center">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Payments Management</h1>
    <p class="text-gray-600">Monitor, confirm, and manage hostel fee payments</p>
  </div>
  <div class="flex space-x-3">
    <button
      on:click={generateFinancialReport}
      class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
    >
      Financial Report
    </button>
  </div>
</div>

<!-- Success/Error Messages -->
{#if success}
  <div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
    {success}
  </div>
{/if}

{#if error}
  <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    {error}
  </div>
{/if}

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-gray-900">{stats.totalPayments}</div>
    <div class="text-sm text-gray-600">Total Payments</div>
    <div class="text-lg font-semibold text-blue-600">{formatAmount(stats.totalAmount)}</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
    <div class="text-sm text-gray-600">Pending</div>
    <div class="text-lg font-semibold text-yellow-600">{formatAmount(stats.pendingAmount)}</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-green-600">{stats.confirmedPayments}</div>
    <div class="text-sm text-gray-600">Confirmed</div>
    <div class="text-lg font-semibold text-green-600">{formatAmount(stats.confirmedAmount)}</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
    <div class="text-sm text-gray-600">Failed</div>
    <div class="text-lg font-semibold text-red-600">{formatAmount(stats.failedAmount)}</div>
  </div>
</div>

<!-- Filters -->
<div class="bg-white p-6 rounded-lg shadow mb-6">
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Search -->
    <div class="md:col-span-2">
      <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
      <input
        type="text"
        id="search"
        bind:value={searchQuery}
        placeholder="Name, matric no, reference..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Status Filter -->
    <div class="md:col-span-2">
      <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        id="status"
        bind:value={statusFilter}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="COMPLETED">Confirmed</option>
        <option value="FAILED">Failed</option>
      </select>
    </div>

    <!-- Date Range -->
    <div class="md:col-span-2">
      <label for="dateStart" class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
      <input
        type="date"
        id="dateStart"
        bind:value={dateRangeStart}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="md:col-span-2">
      <label for="dateEnd" class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
      <input
        type="date"
        id="dateEnd"
        bind:value={dateRangeEnd}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
  
  <!-- Clear Filters Button -->
  {#if searchQuery || statusFilter !== 'ALL' || dateRangeStart || dateRangeEnd}
    <div class="mt-4 flex justify-end">
      <button
        on:click={() => {
          searchQuery = '';
          statusFilter = 'ALL';
          dateRangeStart = '';
          dateRangeEnd = '';
        }}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Clear Filters
      </button>
    </div>
  {/if}
</div>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  </div>
{:else}
  <!-- Filter Results Count -->
  {#if searchQuery || statusFilter !== 'ALL' || dateRangeStart || dateRangeEnd}
    <div class="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-sm text-blue-800">
        <strong>Showing {filteredPayments.length}</strong> of <strong>{payments.length}</strong> payments
        {#if searchQuery}
          · Searching for: "<strong>{searchQuery}</strong>"
        {/if}
        {#if statusFilter !== 'ALL'}
          · Status: <strong>{statusFilter}</strong>
        {/if}
        {#if dateRangeStart && dateRangeEnd}
          · From <strong>{new Date(dateRangeStart).toLocaleDateString()}</strong> to <strong>{new Date(dateRangeEnd).toLocaleDateString()}</strong>
        {:else if dateRangeStart}
          · From <strong>{new Date(dateRangeStart).toLocaleDateString()}</strong>
        {:else if dateRangeEnd}
          · Until <strong>{new Date(dateRangeEnd).toLocaleDateString()}</strong>
        {/if}
      </p>
    </div>
  {/if}

  <!-- Payments Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Details
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Allocation
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Proof
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each paginatedPayments as payment}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{payment.reference}</div>
                  {#if payment.transactionId}
                    <div class="text-sm text-gray-500">{payment.transactionId}</div>
                  {/if}
                  {#if payment.paymentProvider}
                    <div class="text-xs text-blue-600 capitalize">{payment.paymentProvider}</div>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{payment.user.name}</div>
                  <div class="text-sm text-gray-500">{payment.user.matricNo}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  {#if payment.application?.allocations?.[0]}
                    <div class="text-sm text-gray-900">{payment.application.allocations[0].room.hostel.name}</div>
                    <div class="text-sm text-gray-500">Room {payment.application.allocations[0].room.roomNumber}, Bed {payment.application.allocations[0].bedNumber}</div>
                  {:else}
                    <div class="text-sm text-gray-500">No allocation</div>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{formatAmount(payment.amount)}</div>
                  {#if payment.platformFee > 0}
                    <div class="text-xs text-gray-500">Fee: {formatAmount(payment.platformFee)}</div>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {getStatusBadgeClass(payment.status)}">
                  {payment.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {getPaymentMethodName(payment.paymentMethod)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {#if payment.paystackData?.proofOfPayment}
                  <button
                    on:click={() => viewProof(payment.paystackData.proofOfPayment, payment.paystackData.proofFileName)}
                    class="text-blue-600 hover:text-blue-900 font-medium text-sm flex items-center gap-1"
                    title="View payment proof"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Proof
                  </button>
                  {#if payment.paystackData.proofFileName}
                    <div class="text-xs text-gray-500 mt-1 truncate max-w-[120px]" title={payment.paystackData.proofFileName}>
                      {payment.paystackData.proofFileName}
                    </div>
                  {/if}
                {:else}
                  <span class="text-gray-400 text-sm">No proof</span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm text-gray-900">{formatDate(payment.createdAt)}</div>
                  {#if payment.paidAt && payment.paidAt !== payment.createdAt}
                    <div class="text-xs text-gray-500">Paid: {formatDate(payment.paidAt)}</div>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {#if payment.status === 'PENDING'}
                  <div class="flex space-x-3">
                    <button
                      on:click={() => confirmPayment(payment.id)}
                      class="text-green-600 hover:text-green-900 font-medium"
                      title="Confirm this payment"
                    >
                      Confirm
                    </button>
                    <button
                      on:click={() => rejectPayment(payment.id)}
                      class="text-red-600 hover:text-red-900 font-medium"
                      title="Reject this payment"
                    >
                      Reject
                    </button>
                  </div>
                {:else if payment.status === 'COMPLETED'}
                  <button
                    on:click={() => refundPayment(payment.id)}
                    class="text-red-600 hover:text-red-900 font-medium"
                    title="Refund this payment"
                  >
                    Refund
                  </button>
                {:else if payment.status === 'FAILED'}
                  <div class="flex flex-col">
                    <span class="text-gray-400 text-xs">Rejected</span>
                    {#if payment.failureReason}
                      <span class="text-xs text-gray-500" title={payment.failureReason}>
                        {payment.failureReason.length > 20 ? payment.failureReason.substring(0, 20) + '...' : payment.failureReason}
                      </span>
                    {/if}
                  </div>
                {:else}
                  <span class="text-gray-400">No actions</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between items-center">
          <div class="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} results
          </div>
          <div class="flex space-x-2">
            <button
              on:click={() => currentPage = Math.max(1, currentPage - 1)}
              disabled={currentPage === 1}
              class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span class="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
              disabled={currentPage === totalPages}
              class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- Reject Payment Modal -->
{#if showRejectModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeRejectModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Reject Payment
        </h3>
        <button
          on:click={closeRejectModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <div class="mb-4">
          <p class="text-sm text-gray-700 mb-4">
            Please enter the reason for rejecting this payment. This action cannot be undone.
          </p>
          <label for="rejectReason" class="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason <span class="text-red-500">*</span>
          </label>
          <textarea
            id="rejectReason"
            bind:value={rejectReason}
            rows="4"
            placeholder="e.g., Invalid payment proof, Duplicate payment, Wrong amount, etc."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={rejectingPayment}
          ></textarea>
          <p class="mt-2 text-xs text-gray-500">
            This reason will be visible in the payment records and activity logs.
          </p>
        </div>

        {#if rejectReason && rejectReason.trim().length < 10}
          <div class="mb-4 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
            ⚠️ Please provide a more detailed reason (at least 10 characters)
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeRejectModal}
          disabled={rejectingPayment}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={confirmRejectPayment}
          disabled={rejectingPayment || !rejectReason || rejectReason.trim().length < 10}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if rejectingPayment}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Rejecting...
          {:else}
            Reject Payment
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Proof Viewer Modal -->
{#if showProofModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4" on:click={closeProofModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            Payment Proof {#if currentProofType === 'pdf'}(PDF){:else}(Image){/if}
          </h3>
          {#if currentProofFileName}
            <p class="text-sm text-gray-600 mt-1">{currentProofFileName}</p>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          {#if currentProofType === 'pdf'}
            <a
              href={currentProofUrl}
              download={currentProofFileName || 'payment-proof.pdf'}
              class="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 border border-green-300 rounded-md hover:bg-green-50 flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          {/if}
          <a
            href={currentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </a>
          <button
            on:click={closeProofModal}
            class="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close proof viewer"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Body - Image/PDF Viewer -->
      <div class="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center min-h-[400px]">
        {#if currentProofType === 'pdf'}
          <!-- PDF Viewer using iframe -->
          <iframe
            src={currentProofUrl}
            title="Payment Proof PDF"
            class="w-full h-full min-h-[500px] rounded shadow-lg bg-white"
            frameborder="0"
          ></iframe>
        {:else}
          <!-- Image Viewer -->
          <img
            src={currentProofUrl}
            alt="Payment Proof"
            class="max-w-full max-h-full object-contain rounded shadow-lg"
            on:error={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%236b7280" font-size="16"%3EImage failed to load%3C/text%3E%3C/svg%3E';
            }}
          />
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <p class="text-sm text-gray-600">
          Click outside or press ESC to close
        </p>
        <button
          on:click={closeProofModal}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Confirm Payment Modal -->
{#if showConfirmModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeConfirmModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Confirm Payment
        </h3>
        <button
          on:click={closeConfirmModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <p class="text-gray-700 mb-4">
          Are you sure you want to confirm this payment? This will mark it as verified and complete.
        </p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            ℹ️ Once confirmed, the payment will be recorded as successful and the student will be notified.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeConfirmModal}
          disabled={confirmingPayment}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={executeConfirmPayment}
          disabled={confirmingPayment}
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if confirmingPayment}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Confirming...
          {:else}
            Confirm Payment
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Refund Payment Modal -->
{#if showRefundModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeRefundModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Refund Payment
        </h3>
        <button
          on:click={closeRefundModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <div class="mb-4">
          <p class="text-sm text-gray-700 mb-4">
            Please enter the reason for refunding this payment. This action cannot be undone.
          </p>
          <label for="refundReason" class="block text-sm font-medium text-gray-700 mb-2">
            Refund Reason <span class="text-red-500">*</span>
          </label>
          <textarea
            id="refundReason"
            bind:value={refundReason}
            rows="4"
            placeholder="e.g., Student withdrew application, Payment error, Double payment, etc."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={refundingPayment}
          ></textarea>
          <p class="mt-2 text-xs text-gray-500">
            This reason will be visible in the payment records and activity logs.
          </p>
        </div>

        {#if refundReason && refundReason.trim().length < 10}
          <div class="mb-4 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
            ⚠️ Please provide a more detailed reason (at least 10 characters)
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeRefundModal}
          disabled={refundingPayment}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={executeRefundPayment}
          disabled={refundingPayment || !refundReason || refundReason.trim().length < 10}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if refundingPayment}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refunding...
          {:else}
            Refund Payment
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Financial Report Modal -->
{#if showFinancialReportModal && reportData}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeFinancialReportModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div class="flex items-center justify-between p-6">
          <div>
            <h3 class="text-2xl font-bold text-gray-900">
              📊 Financial Report
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              Period: {reportData.period}
            </p>
          </div>
          <button
            on:click={closeFinancialReportModal}
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Period Filter Buttons -->
        <div class="px-6 pb-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">Filter by:</span>
            <div class="flex gap-2">
              <button
                on:click={() => { reportPeriodFilter = 'today'; generateFinancialReport(); }}
                class="px-4 py-2 text-sm font-medium rounded-md transition-all {reportPeriodFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
              >
                Today
              </button>
              <button
                on:click={() => { reportPeriodFilter = 'week'; generateFinancialReport(); }}
                class="px-4 py-2 text-sm font-medium rounded-md transition-all {reportPeriodFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
              >
                Last 7 Days
              </button>
              <button
                on:click={() => { reportPeriodFilter = 'month'; generateFinancialReport(); }}
                class="px-4 py-2 text-sm font-medium rounded-md transition-all {reportPeriodFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
              >
                Last 30 Days
              </button>
              <button
                on:click={() => { reportPeriodFilter = 'all'; generateFinancialReport(); }}
                class="px-4 py-2 text-sm font-medium rounded-md transition-all {reportPeriodFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
              >
                All Time
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <!-- Summary Section -->
        <div class="mb-8">
          <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Summary
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="text-sm font-medium text-blue-800">Total Payments</div>
              <div class="text-2xl font-bold text-blue-900 mt-1">{stats.totalPayments}</div>
              <div class="text-lg text-blue-700 mt-1">{formatAmount(stats.totalAmount)}</div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="text-sm font-medium text-green-800">Confirmed</div>
              <div class="text-2xl font-bold text-green-900 mt-1">{stats.confirmedPayments}</div>
              <div class="text-lg text-green-700 mt-1">{formatAmount(stats.confirmedAmount)}</div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="text-sm font-medium text-yellow-800">Pending</div>
              <div class="text-2xl font-bold text-yellow-900 mt-1">{stats.pendingPayments}</div>
              <div class="text-lg text-yellow-700 mt-1">{formatAmount(stats.pendingAmount)}</div>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="text-sm font-medium text-red-800">Failed</div>
              <div class="text-2xl font-bold text-red-900 mt-1">{stats.failedPayments}</div>
              <div class="text-lg text-red-700 mt-1">{formatAmount(stats.failedAmount)}</div>
            </div>
          </div>
        </div>

        <!-- By Payment Method Section -->
        <div class="mb-8">
          <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            By Payment Method
          </h4>
          <div class="bg-gray-50 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each reportData.byMethod as item}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.method}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.count}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">{formatAmount(item.amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      {stats.totalAmount > 0 ? ((item.amount / stats.totalAmount) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- By Hostel Section -->
        {#if reportData.byHostel.length > 0}
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              By Hostel
            </h4>
            <div class="bg-gray-50 rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each reportData.byHostel as item}
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.hostel || 'Unallocated'}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.count}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">{formatAmount(item.amount)}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        {stats.totalAmount > 0 ? ((item.amount / stats.totalAmount) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- All Transactions Section -->
        {#if reportData.allTransactions && reportData.allTransactions.length > 0}
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                All Transactions
              </span>
              <span class="text-sm font-normal text-gray-600">
                Showing {reportData.allTransactions.length} transaction{reportData.allTransactions.length !== 1 ? 's' : ''}
              </span>
            </h4>
            <div class="bg-gray-50 rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each reportData.allTransactions as transaction}
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-900">
                        <div class="font-medium">{transaction.user.name}</div>
                        <div class="text-xs text-gray-500">{transaction.user.matricNo}</div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {transaction.reference}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatAmount(transaction.amount)}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getPaymentMethodName(transaction.paymentMethod)}
                        </span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getStatusBadgeClass(transaction.status)}">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- Report Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p class="text-sm text-blue-800">
            <strong>📅 Report Generated:</strong> {new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          <p class="text-sm text-blue-800 mt-1">
            <strong>📊 Data Source:</strong> {filteredPayments.length} filtered payment{filteredPayments.length !== 1 ? 's' : ''} from {payments.length} total
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="sticky bottom-0 bg-gray-50 flex items-center justify-between p-6 border-t border-gray-200">
        <button
          on:click={downloadReport}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download as PDF
        </button>
        <button
          on:click={closeFinancialReportModal}
          class="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

