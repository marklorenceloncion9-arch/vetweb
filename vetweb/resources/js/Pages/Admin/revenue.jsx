import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';

export default function Revenue() {
    const [revenueData, setRevenueData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedPaymentType, setSelectedPaymentType] = useState(1);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [newFee, setNewFee] = useState('');
    const [feeReason, setFeeReason] = useState('');
    const [history, setHistory] = useState([]);

    // CSRF token helper
    const getCSRFToken = () => {
        const token = document.head.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute('content') : '';
    };

    // Fetch revenue data
    const fetchRevenueData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/revenue?year=${selectedYear}&payment_type_id=${selectedPaymentType}`, {
                headers: {
                    'X-CSRF-TOKEN': getCSRFToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setRevenueData(data);
                setPaymentTypes(data.payment_types || []);
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenueData();
    }, [selectedYear, selectedPaymentType]);

    // Auto-refresh data every 5 minutes to keep "This Month" current
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRevenueData();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [selectedYear, selectedPaymentType]);

    // Handle month click to edit fee
    const handleMonthClick = (monthData) => {
        setSelectedMonth(monthData);
        setNewFee(monthData.fee_per_registration.toString());
        setShowEditModal(true);
    };

    // Handle fee update
    const handleUpdateFee = async (e) => {
        e.preventDefault();
        
        if (!newFee || isNaN(newFee) || parseFloat(newFee) < 0) {
            alert('Please enter a valid fee amount');
            return;
        }

        try {
            // Calculate effective date (first day of selected month)
            const effectiveDate = `${selectedYear}-${String(selectedMonth.month).padStart(2, '0')}-01`;
            
            const response = await fetch('/api/revenue/update-fee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCSRFToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    payment_type_id: selectedPaymentType,
                    new_amount: parseFloat(newFee),
                    effective_date: effectiveDate,
                    reason: feeReason || 'Fee adjustment'
                })
            });

            const data = await response.json();
            if (data.success) {
                setShowEditModal(false);
                setNewFee('');
                setFeeReason('');
                // Refresh data
                fetchRevenueData();
                alert('Registration fee updated successfully!');
            } else {
                alert(data.message || 'Failed to update fee');
            }
        } catch (error) {
            console.error('Failed to update fee:', error);
            alert('Failed to update fee');
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Total Revenue</h1>
                        <p className="text-gray-500 mt-1">View and manage registration fees with historical tracking</p>
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                >
                                    {[2024, 2025, 2026, 2027].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                                <select
                                    value={selectedPaymentType}
                                    onChange={(e) => setSelectedPaymentType(parseInt(e.target.value))}
                                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                >
                                    {paymentTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.type_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ml-auto">
                                <div className="bg-violet-50 px-6 py-3 rounded-xl">
                                    <p className="text-sm text-gray-600">
                                        {revenueData && selectedYear === new Date().getFullYear() 
                                            ? 'This Month Fee' 
                                            : `Fee for ${selectedYear}`}
                                    </p>
                                    <p className="text-xl font-bold text-violet-700">
                                        {revenueData 
                                            ? (() => {
                                                const currentMonth = new Date().getMonth() + 1;
                                                const currentYear = new Date().getFullYear();
                                                if (selectedYear === currentYear) {
                                                    const thisMonth = revenueData.monthly_revenue.find(m => m.month === currentMonth);
                                                    return thisMonth ? formatCurrency(thisMonth.fee_per_registration) : formatCurrency(revenueData.current_fee);
                                                }
                                                return formatCurrency(revenueData.current_fee);
                                            })()
                                            : 'Loading...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Total Revenue This Month */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm">
                                        {selectedYear === new Date().getFullYear() ? "This Month's Revenue" : `Revenue for ${new Date(selectedYear, new Date().getMonth()).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
                                    </p>
                                    <p className="text-3xl font-bold">
                                        {revenueData ? (() => {
                                            const currentMonth = new Date().getMonth() + 1;
                                            const currentYear = new Date().getFullYear();
                                            const targetMonth = selectedYear === currentYear ? currentMonth : 1;
                                            const monthData = revenueData.monthly_revenue.find(m => m.month === targetMonth);
                                            return monthData ? formatCurrency(monthData.total_revenue) : formatCurrency(0);
                                        })() : 'Loading...'}
                                    </p>
                                </div>
                                <div className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue This Year */}
                        <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-violet-100 text-sm">Total Revenue {selectedYear}</p>
                                    <p className="text-3xl font-bold">
                                        {revenueData ? formatCurrency(revenueData.total_revenue) : 'Loading...'}
                                    </p>
                                </div>
                                <div className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Revenue Grid */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
                            <p className="text-sm text-gray-500">Click on any month to edit the registration fee</p>
                        </div>
                        
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                                <p className="mt-2 text-gray-500">Loading revenue data...</p>
                            </div>
                        ) : revenueData && revenueData.monthly_revenue ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                                {revenueData.monthly_revenue.map((month) => (
                                    <div
                                        key={month.month}
                                        onClick={() => handleMonthClick(month)}
                                        className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-violet-50 hover:border-violet-200 border border-transparent transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-medium text-gray-600">{month.month_name}</span>
                                            <span className="text-xs text-gray-400">{month.count} regs</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                            {formatCurrency(month.total_revenue)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Fee: {formatCurrency(month.fee_per_registration)}
                                        </div>
                                        <div className="mt-2 text-xs text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to edit fee
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No revenue data available
                            </div>
                        )}
                    </div>

                    {/* Fee History */}
                    {history.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Fee Change History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Fee</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Fee</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {history.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {new Date(entry.effective_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {formatCurrency(entry.old_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-violet-600">
                                                    {formatCurrency(entry.new_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {entry.reason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Fee Modal */}
                {showEditModal && selectedMonth && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-[9999]">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-300">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Update Fee - {selectedMonth.month_name} {selectedYear}
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Changes will apply from {selectedMonth.month_name} 1, {selectedYear} onwards
                            </p>
                            
                            <form onSubmit={handleUpdateFee} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Fee: {formatCurrency(selectedMonth.fee_per_registration)}
                                    </label>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Registration Fee *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newFee}
                                        onChange={(e) => setNewFee(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Change
                                    </label>
                                    <textarea
                                        value={feeReason}
                                        onChange={(e) => setFeeReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                        placeholder="Optional: Explain why the fee is being changed"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setNewFee('');
                                            setFeeReason('');
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                                    >
                                        Update Fee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
