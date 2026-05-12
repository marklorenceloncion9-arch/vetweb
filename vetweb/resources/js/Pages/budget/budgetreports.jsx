import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import Sidebar from '@/Components/Budget/BudgetSidebar';

export default function BudgetReports() {
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({
        total_transactions: 0,
        total_items_used: 0,
        unique_medicines: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchReport = async (from = fromDate, to = toDate) => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);

            const response = await fetch(`/api/budget/reports/usage?${params.toString()}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch usage report');
            }

            setRows(data.report || []);
            setSummary(
                data.summary || {
                    total_transactions: 0,
                    total_items_used: 0,
                    unique_medicines: 0,
                }
            );
        } catch (err) {
            setError(err.message || 'Failed to fetch usage report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const canApplyFilter = useMemo(() => fromDate || toDate, [fromDate, toDate]);
    const formatDateTimeUsed = (row) => {
        if (row.created_at) {
            const dt = new Date(row.created_at);
            if (!Number.isNaN(dt.getTime())) {
                return dt.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
        }

        if (row.date || row.time) {
            return `${row.date || ''} ${row.time || ''}`.trim();
        }

        return '-';
    };
    const unitBreakdown = useMemo(() => {
        return rows.reduce(
            (acc, row) => {
                const unit = String(row.unit || '').toLowerCase();

                if (unit.includes('vial')) {
                    acc.vials += Number(row.used_qty ?? 0);
                } else if (unit.includes('box')) {
                    acc.boxes += Number(row.used_qty ?? 0);
                } else if (unit.includes('tablet')) {
                    acc.tablets += Number(row.used_qty ?? 0);
                } else {
                    acc.otherUnits += Number(row.used_qty ?? 0);
                }

                return acc;
            },
            { vials: 0, boxes: 0, tablets: 0, otherUnits: 0 }
        );
    }, [rows]);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/40">
            <Sidebar />

            <main className="flex-1 ml-72 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/budget/dashboard" className="hover:text-violet-600">Dashboard</Link>
                            <span>/</span>
                            <span className="text-gray-900">Reports</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Usage Report</h1>
                        <p className="text-gray-500 mt-2">Track medicines used from completed treatments</p>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-100 text-red-800 border border-red-200 shadow-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Total Transactions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_transactions}</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Vials Used</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{Number(unitBreakdown.vials).toFixed(2)}</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Boxes Used</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{Number(unitBreakdown.boxes).toFixed(2)}</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Tablets Used</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{Number(unitBreakdown.tablets).toFixed(2)}</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Other Units</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{Number(unitBreakdown.otherUnits).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-gray-200 bg-gray-50/70 flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">From</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">To</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                                />
                            </div>
                            <button
                                onClick={fetchReport}
                                className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => {
                                    setFromDate('');
                                    setToDate('');
                                    fetchReport('', '');
                                }}
                                disabled={!canApplyFilter}
                                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                                Clear
                            </button>
                            <div className="ml-auto text-xs text-gray-500">
                                Unique medicines: <span className="font-semibold text-gray-700">{summary.unique_medicines}</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading usage report...</p>
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                No usage records found for the selected period.
                            </div>
                        ) : (
                            <div
                                className="overflow-x-auto overflow-y-auto max-h-[65vh] [&::-webkit-scrollbar]:hidden"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Used Qty</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time Used</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{row.medicine_name}</td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        {row.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 font-semibold">
                                                    {String(row.unit || '').toLowerCase().includes('vial') && row.used_ml != null
                                                        ? `${Number(row.used_ml || 0).toFixed(2)} ml`
                                                        : `${Number(row.used_qty || 0).toFixed(2)} ${row.unit}`}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                                        {row.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{formatDateTimeUsed(row)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
