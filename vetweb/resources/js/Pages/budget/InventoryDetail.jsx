import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Sidebar from '@/Components/Budget/BudgetSidebar';

export default function InventoryDetail({ id }) {
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchInventory();
    }, [id]);

    const fetchInventory = async () => {
        try {
            const response = await fetch(`/api/budget/inventory/${id}`);
            const data = await response.json();
            
            if (data.success) {
                setInventory(data.inventory);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to fetch inventory item' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to fetch inventory item. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (expirationDate) => {
        const today = new Date();
        const expiry = new Date(expirationDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 30) return 'bg-red-100 text-red-800';
        if (daysUntilExpiry < 90) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getStatusText = (expirationDate) => {
        const today = new Date();
        const expiry = new Date(expirationDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) return 'Expired';
        if (daysUntilExpiry < 30) return 'Expiring Soon';
        if (daysUntilExpiry < 90) return 'Expiring';
        return 'Good';
    };

    const formatQuantity = (value) =>
        Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 });

    const formatVialDisplay = (item) => {
        const quantity = Number(item?.quantity || 0);
        const volumePerVial = Number(item?.volume_ml || 0);
        const displayVials = Math.ceil(quantity);
        const totalMlRemaining = quantity * volumePerVial;

        return {
            displayVials,
            totalMlRemaining,
        };
    };
    const isVialItem = (item) => Boolean(item?.is_vial) || String(item?.unit?.name || '').toLowerCase().includes('vial');

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 ml-72 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-gray-500">Loading...</div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!inventory) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 ml-72 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="text-red-600 mb-4">Inventory item not found</div>
                            <Link
                                href="/budget/inventory"
                                className="text-violet-600 hover:text-violet-800"
                            >
                                Back to Inventory
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/budget/dashboard" className="hover:text-violet-600">Dashboard</Link>
                            <span>/</span>
                            <Link href="/budget/inventory" className="hover:text-violet-600">Inventory</Link>
                            <span>/</span>
                            <span className="text-gray-900">Inventory Details</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Details</h1>
                        <p className="text-gray-500 mt-1">View detailed information about this inventory item</p>
                    </div>

                    {/* Message */}
                    {message.text && (
                        <div className={`mb-6 px-4 py-3 rounded-xl ${
                            message.type === 'success' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Inventory Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">{inventory.medicine.name}</h2>
                                    <p className="text-sm text-gray-500">{inventory.medicine.category.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                                        Basic Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Medicine Name</p>
                                            <p className="font-medium text-gray-900">{inventory.medicine.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Category</p>
                                            <p className="font-medium text-gray-900">{inventory.medicine.category.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Unit</p>
                                            <p className="font-medium text-gray-900">{inventory.unit.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Information */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                        Stock Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Quantity</p>
                                            <p className="font-medium text-gray-900">
                                                {isVialItem(inventory)
                                                    ? `${formatVialDisplay(inventory).displayVials} ${inventory.unit.name}`
                                                    : `${formatQuantity(Math.ceil(Number(inventory.quantity)))} ${inventory.unit.name}`}
                                            </p>
                                            {isVialItem(inventory) && inventory.volume_ml && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    {formatVialDisplay(inventory).totalMlRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ml remaining
                                                </p>
                                            )}
                                        </div>
                                        {inventory.volume_ml && (
                                            <div>
                                                <p className="text-sm text-gray-500">Volume per Unit</p>
                                                <p className="font-medium text-gray-900">{inventory.volume_ml} ml</p>
                                            </div>
                                        )}
                                        {inventory.items_per_box && (
                                            <div>
                                                <p className="text-sm text-gray-500">Items per Box</p>
                                                <p className="font-medium text-gray-900">{inventory.items_per_box} items</p>
                                            </div>
                                        )}
                                        {inventory.items_per_box && inventory.quantity && (
                                            <div>
                                                <p className="text-sm text-gray-500">Total Items</p>
                                                <p className="font-medium text-gray-900 text-lg text-violet-600">
                                                    {formatQuantity(Number(inventory.quantity) * Number(inventory.items_per_box))} items
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inventory.expiration_date)}`}>
                                                {getStatusText(inventory.expiration_date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry Information */}
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                                        Expiry Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Expiration Date</p>
                                            <p className="font-medium text-gray-900">
                                                {new Date(inventory.expiration_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <Link
                                href="/budget/inventory"
                                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                            >
                                Back to Inventory
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
