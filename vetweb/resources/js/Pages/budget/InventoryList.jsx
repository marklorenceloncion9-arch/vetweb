import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Sidebar from '@/Components/Budget/BudgetSidebar';

export default function InventoryList() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchInventory();
        fetchCategories();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/budget/inventory');
            const data = await response.json();
            if (data.success) {
                setInventory(data.inventory);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/budget/categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    // Filter inventory
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.medicine?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.medicine?.category_id === parseInt(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    // Calculate totals
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const isVial = Boolean(item?.is_vial) || String(item?.unit?.name || '').toLowerCase().includes('vial');
        return sum + (isVial ? Math.ceil(quantity) : quantity);
    }, 0);
    const formatQuantity = (value) =>
        Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    const formatVialDisplay = (item) => {
        const quantity = Number(item.quantity || 0);
        const volumePerVial = Number(item.volume_ml || 0);
        const displayVials = Math.ceil(quantity);
        const totalMlRemaining = quantity * volumePerVial;

        return {
            displayVials,
            totalMlRemaining,
        };
    };
    const isVialItem = (item) => Boolean(item?.is_vial) || String(item?.unit?.name || '').toLowerCase().includes('vial');
    const getInputStockLabel = (item) => {
        if (isVialItem(item)) {
            const volumePerVial = Number(item.volume_ml || 0);
            return volumePerVial > 0
                ? `${volumePerVial.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ml each`
                : '-';
        }

        if (item.is_box) {
            return item.items_per_box
                ? `${formatQuantity(item.items_per_box)} items each`
                : '-';
        }

        const unitName = item.unit?.name || 'unit';
        return `${formatQuantity(item.quantity)} ${unitName}`;
    };
    const expiringSoon = inventory.filter(item => {
        const expiryDate = new Date(item.expiration_date);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return expiryDate <= threeMonthsFromNow;
    }).length;

    const getStatusColor = (expirationDate) => {
        const expiry = new Date(expirationDate);
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        
        if (expiry <= threeMonths) {
            return 'text-amber-600 bg-amber-100';
        }
        return 'text-green-600 bg-green-100';
    };

    const getStatusText = (expirationDate) => {
        const expiry = new Date(expirationDate);
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        
        if (expiry <= threeMonths) {
            return 'Expiring Soon';
        }
        return 'Good';
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/budget/dashboard" className="hover:text-violet-600">Dashboard</Link>
                            <span>/</span>
                            <span className="text-gray-900">Inventory List</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Medicine Inventory</h1>
                                <p className="text-gray-500 mt-1">View and manage all medicine stock</p>
                            </div>
                            <Link
                                href="/budget/inventory/add"
                                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-lg shadow-violet-500/25 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                Add Inventory
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Items</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{expiringSoon}</p>
                                    <p className="text-sm text-gray-500 mt-1">Expiring Soon</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {Math.round(totalStock).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Total Stock</p>
                                </div>
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search medicines..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                                <p className="mt-2 text-gray-500">Loading inventory...</p>
                            </div>
                        ) : filteredInventory.length === 0 ? (
                            <div className="p-8 text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                                </svg>
                                <p className="text-gray-500">No medicines found</p>
                                <Link
                                    href="/budget/inventory/add"
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                    Add First Medicine
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredInventory.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.medicine?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                        {item.medicine?.category?.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {isVialItem(item) ? (
                                                            <>
                                                                {formatVialDisplay(item).displayVials} {item.unit?.name}
                                                            </>
                                                        ) : item.is_box ? (
                                                            <>
                                                                {formatQuantity(Math.ceil(Number(item.quantity)))} {item.unit?.name} ({formatQuantity(Math.ceil(Number(item.quantity)) * Number(item.items_per_box))} items)
                                                            </>
                                                        ) : (
                                                            <>
                                                                {formatQuantity(Math.ceil(Number(item.quantity)))} {item.unit?.name}
                                                            </>
                                                        )}
                                                    </div>
                                                    {!isVialItem(item) && item.volume_ml ? (
                                                        <div className="text-xs text-blue-600">
                                                            {item.volume_ml} ml each
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{getInputStockLabel(item)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(item.expiration_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.expiration_date)}`}>
                                                        {getStatusText(item.expiration_date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={`/budget/inventory/${item.id}`}
                                                        className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
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
