import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Sidebar from '@/Components/Budget/BudgetSidebar';

export default function AddInventory() {
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        medicine_name: '',
        category_id: '',
        quantity: '',
        unit_id: '',
        expiration_date: '',
        volume_ml: '',
        items_per_box: ''
    });
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch categories and units
    useEffect(() => {
        fetchCategories();
        fetchUnits();
    }, []);

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

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/budget/units');
            const data = await response.json();
            if (data.success) {
                setUnits(data.units);
            }
        } catch (error) {
            console.error('Failed to fetch units:', error);
        }
    };

    const handleUnitChange = (e) => {
        const unitId = e.target.value;
        const unit = units.find(u => u.id === parseInt(unitId));
        setSelectedUnit(unit);
        setFormData(prev => ({
            ...prev,
            unit_id: unitId,
            volume_ml: '',
            items_per_box: ''
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/budget/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: 'Medicine added to inventory successfully!' });
                // Reset form
                setFormData({
                    medicine_name: '',
                    category_id: '',
                    quantity: '',
                    unit_id: '',
                    expiration_date: '',
                    volume_ml: '',
                    items_per_box: ''
                });
                setSelectedUnit(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to add medicine' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to add medicine. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    // Check if selected unit is vial (liquid)
    const isVial = selectedUnit?.is_liquid && selectedUnit?.name?.toLowerCase() === 'vials';
    // Check if selected unit is boxes
    const isBox = selectedUnit?.name?.toLowerCase() === 'boxes';
    const boxTotalItems = isBox && Number(formData.quantity) > 0 && Number(formData.items_per_box) > 0
        ? Number(formData.quantity) * Number(formData.items_per_box)
        : null;

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
                            <span className="text-gray-900">Add Inventory</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Inventory</h1>
                        <p className="text-gray-500 mt-1">Add new stock to the inventory system</p>
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

                    {/* Form Card */}
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
                                    <h2 className="text-lg font-semibold text-gray-900">Inventory Details</h2>
                                    <p className="text-sm text-gray-500">Enter the inventory information below</p>
                                </div>
                            </div>
                        </div>

                        <form id="inventory-form" onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-6">
                                {/* Section: Basic Information */}
                                <section>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Item Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="medicine_name"
                                                value={formData.medicine_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter item name"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="category_id"
                                                value={formData.category_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                                required
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Section: Stock Information */}
                                <section>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                        Stock Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={formData.quantity}
                                                onChange={handleInputChange}
                                                placeholder="Enter quantity"
                                                min="1"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Unit <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="unit_id"
                                                value={formData.unit_id}
                                                onChange={handleUnitChange}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                                required
                                            >
                                                <option value="">Select unit</option>
                                                {units.map(unit => (
                                                    <option key={unit.id} value={unit.id}>
                                                        {unit.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Conditional Fields */}
                                    {isVial && (
                                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-blue-900">
                                                    Volume per Vial (ml) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="volume_ml"
                                                    value={formData.volume_ml}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 10"
                                                    min="0.1"
                                                    step="0.1"
                                                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                    required={isVial}
                                                />
                                                <p className="text-xs text-blue-600">
                                                    Enter the volume in milliliters for each vial
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isBox && (
                                        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-green-900">
                                                    Items per Box <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="items_per_box"
                                                    value={formData.items_per_box}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 30"
                                                    min="1"
                                                    className="w-full px-3.5 py-2.5 bg-white border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                                                    required={isBox}
                                                />
                                                <p className="text-xs text-green-600">
                                                    Enter how many items are in each box
                                                </p>
                                                {boxTotalItems !== null && (
                                                    <p className="text-sm text-green-900 font-medium mt-2">
                                                        Total items: {boxTotalItems.toLocaleString()} items ({formData.quantity} boxes × {formData.items_per_box} items)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Section: Expiry Information */}
                                <section>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                                        Expiry Information
                                    </h3>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">
                                            Expiration Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="expiration_date"
                                            value={formData.expiration_date}
                                            onChange={handleInputChange}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none md:w-1/2"
                                            required
                                        />
                                    </div>
                                </section>
                            </div>
                        </form>

                        {/* Card Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <Link
                                href="/budget/dashboard"
                                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                form="inventory-form"
                                disabled={loading}
                                className="px-5 py-2.5 text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all font-medium shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                {loading ? 'Adding...' : 'Add to Inventory'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
