import { Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';

export default function Settings({ paymentTypes }) {
    const { flash } = usePage().props;
    const [flashMessage, setFlashMessage] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            setFlashMessage({ type: 'success', text: flash.success });
            const timer = setTimeout(() => setFlashMessage(null), 3000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setFlashMessage({ type: 'error', text: flash.error });
            const timer = setTimeout(() => setFlashMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-72">
                {/* Top Header */}
                <header className="bg-white sticky top-0 z-30 px-8 py-4 shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    </div>
                </header>

                <main className="p-8">
                    {/* Flash Message */}
                    {flashMessage && (
                        <div className={`mb-6 px-4 py-3 rounded-lg ${
                            flashMessage.type === 'success'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {flashMessage.text}
                        </div>
                    )}

                    {/* Payment Types Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                        <div className="px-6 py-4 bg-violet-600">
                            <h2 className="text-lg font-semibold text-white">Payment Types</h2>
                            <p className="text-violet-200 text-sm">Manage fees for different services</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {paymentTypes.map((type) => (
                                <PaymentTypeRow
                                    key={type.id}
                                    type={type}
                                    isEditing={editingId === type.id}
                                    onEdit={() => setEditingId(type.id)}
                                    onCancel={() => setEditingId(null)}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function PaymentTypeRow({ type, isEditing, onEdit, onCancel }) {
    const { data, setData, post, processing, errors } = useForm({
        amount: type.amount,
    });

    const handleSave = () => {
        post(`/admin/settings/payment-types/${type.id}`, {
            onSuccess: () => onCancel(),
        });
    };

    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div>
                <h3 className="font-medium text-gray-900">{type.type_name}</h3>
                <p className="text-sm text-gray-500 capitalize">
                    {type.payment_type === 'pet_registration' ? 'Pet Registration Fee' : 'VHC Animal Fee'}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {!isEditing ? (
                    <>
                        <span className="text-xl font-bold text-violet-600">
                            ₱{parseFloat(type.amount).toFixed(2)}
                        </span>
                        <button
                            onClick={onEdit}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Edit
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                            <input
                                type="number"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="w-28 pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={processing}
                            className="p-1.5 text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </button>
                        <button
                            onClick={onCancel}
                            className="p-1.5 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
        </div>
    );
}
