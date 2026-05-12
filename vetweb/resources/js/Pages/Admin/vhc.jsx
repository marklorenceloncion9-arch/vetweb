import { usePage, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';
import VhcModal from '@/Components/Admin/VhcModal';

export default function Vhc({ vhcRecords = [], species = [] }) {
    const { flash } = usePage().props;
    const [flashMessage, setFlashMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter records based on search query
    const filteredRecords = vhcRecords.filter((record) => {
        const query = searchQuery.toLowerCase();
        return (
            record.name?.toLowerCase().includes(query) ||
            record.purpose?.toLowerCase().includes(query) ||
            record.destination?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Flash Message */}
                    {flashMessage && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${
                            flashMessage.type === 'success'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {flashMessage.text}
                        </div>
                    )}

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <span>VHC Records</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">VHC Records</h1>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-medium shadow-lg shadow-violet-500/25 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add VHC Record
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, purpose, or destination..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {searchQuery ? (
                                <>
                                    {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found
                                    <span className="text-gray-400"> matching "{searchQuery}"</span>
                                </>
                            ) : (
                                <>Total {vhcRecords.length} VHC {vhcRecords.length === 1 ? 'Record' : 'Records'}</>
                            )}
                        </p>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Purpose
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Destination
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center text-gray-400">
                                                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-sm">
                                                    {searchQuery ? 'No matching VHC records found' : 'No VHC records found'}
                                                </p>
                                                <p className="text-xs mt-1">
                                                    {searchQuery ? 'Try a different search term' : 'Click "Add VHC Record" to create one'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {record.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {record.purpose}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {record.destination}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <Link
                                                    href={`/admin/vhc/${record.id}`}
                                                    className="inline-flex p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                    title="View details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Add VHC Record Modal */}
            <VhcModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                species={species}
            />
        </div>
    );
}
