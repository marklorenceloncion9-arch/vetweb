import { Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';

export default function VhcView({ record, species = [] }) {
    const { flash } = usePage().props;
    const [flashMessage, setFlashMessage] = useState(null);

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [errors, setErrors] = useState({});

    // Form for creating new VHC record
    const newVhcForm = useForm({
        name: record.name || '',
        destination: '',
        purpose: '',
        origin: 'Cogon Public Market, El Salvador City',
        livestock: [],
    });

    const [livestockList, setLivestockList] = useState([]);
    
    const handleAddLivestock = () => {
        if (newVhcForm.data.species_id) {
            const newLivestock = {
                species_id: newVhcForm.data.species_id,
                male_count: newVhcForm.data.male_count,
                female_count: newVhcForm.data.female_count,
            };
            setLivestockList([...livestockList, newLivestock]);
            // Reset livestock fields
            newVhcForm.setData('species_id', '');
            newVhcForm.setData('male_count', '');
            newVhcForm.setData('female_count', '');
        }
    };
    
    const handleRemoveLivestock = (index) => {
        setLivestockList(livestockList.filter((_, i) => i !== index));
    };
    
    const handleNewVhcSubmit = (e) => {
        e.preventDefault();
        
        const vhcData = {
            name: newVhcForm.data.name,
            destination: newVhcForm.data.destination,
            purpose: newVhcForm.data.purpose,
            origin: newVhcForm.data.origin,
            livestock: livestockList,
        };
        
        router.post('/admin/vhc', vhcData, {
            onError: (err) => setErrors(err),
            onSuccess: () => {
                setShowAddModal(false);
                // Reset form
                newVhcForm.setData({
                    name: record.name || '',
                    destination: '',
                    purpose: '',
                    origin: 'Cogon Public Market, El Salvador City',
                });
                setLivestockList([]);
                setErrors({});
            },
        });
    };

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

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Link href="/admin/vhc" className="hover:text-gray-900 transition-colors">
                            VHC Records
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-900">View Certificate</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">VHC Record Details</h1>
                                <p className="text-gray-500 mt-1">Certificate ID: #{record.id}</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-lg shadow-green-500/25 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Livestock
                            </button>
                        </div>
                    </div>

                    {/* Certificate Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{record.name}</h2>
                                    <p className="text-sm text-gray-500">Issued on {formatDate(record.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-8">
                            {/* VHC Information */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-5 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                                    Certificate Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{record.name}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Purpose</p>
                                        <p className="text-sm font-medium text-gray-900">{record.purpose}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Origin</p>
                                        <p className="text-sm font-medium text-gray-900">{record.origin}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destination</p>
                                        <p className="text-sm font-medium text-gray-900">{record.destination}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Livestock Details */}
                            <section>
                                <div className="mb-5">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                        Livestock Details
                                    </h3>
                                </div>

                                {record.livestock?.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <p className="text-gray-500">No livestock entries yet</p>
                                        <p className="text-sm text-gray-400 mt-1">Click "Add" to add livestock</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Species</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Male</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Female</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {record.livestock?.map((livestock) => (
                                                    <tr key={livestock.id}>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                            {livestock.species?.species_name}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{livestock.male_count}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{livestock.female_count}</td>
                                                        <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                                                            {livestock.male_count + livestock.female_count}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {/* Total Count */}
                            {record.livestock?.length > 0 && (
                                <section className="bg-violet-50 rounded-xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-violet-600 font-medium">Total Livestock Count</p>
                                            <p className="text-xs text-violet-500 mt-0.5">Sum of all entries</p>
                                        </div>
                                        <p className="text-3xl font-bold text-violet-700">
                                            {record.livestock?.reduce((sum, l) => sum + l.male_count + l.female_count, 0) || 0}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <Link
                                href="/admin/vhc"
                                className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to List
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-5 py-2.5 text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 hover:border-violet-300 transition-all font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Certificate
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Livestock Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add VHC Record</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Create a new VHC certificate record</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleNewVhcSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="space-y-6">
                                {/* Certificate Information */}
                                <section>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                                        Certificate Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Name
                                            </label>
                                            <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm">
                                                {record.name}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Purpose <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newVhcForm.data.purpose}
                                                onChange={(e) => newVhcForm.setData('purpose', e.target.value)}
                                                placeholder="e.g., Slaughter, Breeding, Sale"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                            />
                                            {errors.purpose && (
                                                <p className="text-red-500 text-xs">{errors.purpose}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Origin</label>
                                            <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm">
                                                Cogon Public Market, El Salvador City
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Destination <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newVhcForm.data.destination}
                                                onChange={(e) => newVhcForm.setData('destination', e.target.value)}
                                                placeholder="Enter destination"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                            />
                                            {errors.destination && (
                                                <p className="text-red-500 text-xs">{errors.destination}</p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Livestock Details */}
                                <section>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                        Livestock Details
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3">Select one or more species and enter counts:</p>
                                    
                                    {/* Species Checkboxes */}
                                    <div className="space-y-3">
                                        {species.map((s) => {
                                            const isSelected = livestockList.some((l) => l.species_id === s.id);
                                            const livestockEntry = livestockList.find((l) => l.species_id === s.id);
                                            
                                            return (
                                                <div key={s.id} className={`border rounded-xl p-4 transition-all ${isSelected ? 'border-violet-300 bg-violet-50/30' : 'border-gray-200 bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`species-${s.id}`}
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) {
                                                                    handleRemoveLivestock(livestockList.findIndex(l => l.species_id === s.id));
                                                                } else {
                                                                    // Add empty livestock entry
                                                                    setLivestockList([...livestockList, { species_id: s.id, male_count: '', female_count: '' }]);
                                                                }
                                                            }}
                                                            className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                                        />
                                                        <label htmlFor={`species-${s.id}`} className="font-medium text-gray-900 cursor-pointer">
                                                            {s.species_name}
                                                        </label>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="grid grid-cols-2 gap-3 mt-3 pl-8">
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-600">Male Count</label>
                                                                <input
                                                                    type="number"
                                                                    value={livestockEntry?.male_count || ''}
                                                                    onChange={(e) => {
                                                                        const updatedList = livestockList.map(l => 
                                                                            l.species_id === s.id 
                                                                                ? { ...l, male_count: e.target.value }
                                                                                : l
                                                                        );
                                                                        setLivestockList(updatedList);
                                                                    }}
                                                                    placeholder="0"
                                                                    min="0"
                                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-600">Female Count</label>
                                                                <input
                                                                    type="number"
                                                                    value={livestockEntry?.female_count || ''}
                                                                    onChange={(e) => {
                                                                        const updatedList = livestockList.map(l => 
                                                                            l.species_id === s.id 
                                                                                ? { ...l, female_count: e.target.value }
                                                                                : l
                                                                        );
                                                                        setLivestockList(updatedList);
                                                                    }}
                                                                    placeholder="0"
                                                                    min="0"
                                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.livestock && (
                                        <p className="text-red-500 text-xs mt-2">{errors.livestock}</p>
                                    )}
                                </section>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={newVhcForm.processing}
                                onClick={handleNewVhcSubmit}
                                className="px-5 py-2.5 text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all font-medium shadow-lg shadow-violet-500/25 disabled:opacity-50"
                            >
                                {newVhcForm.processing ? 'Saving...' : 'Save VHC Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
