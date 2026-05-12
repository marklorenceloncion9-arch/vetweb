import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function VhcModal({ isOpen, onClose, species = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        purpose: '',
        origin: 'Cogon Public Market, El Salvador City',
        destination: '',
        livestock: [], // Array of {species_id, male_count, female_count}
    });
    const [errors, setErrors] = useState({});

    // Toggle species selection
    const handleSpeciesToggle = (speciesId) => {
        setFormData((prev) => {
            const exists = prev.livestock.find((l) => l.species_id === speciesId);
            if (exists) {
                // Remove species
                return {
                    ...prev,
                    livestock: prev.livestock.filter((l) => l.species_id !== speciesId),
                };
            } else {
                // Add species
                return {
                    ...prev,
                    livestock: [
                        ...prev.livestock,
                        { species_id: speciesId, male_count: '', female_count: '' },
                    ],
                };
            }
        });
    };

    // Update count for a species
    const handleLivestockChange = (speciesId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            livestock: prev.livestock.map((l) =>
                l.species_id === speciesId ? { ...l, [field]: value } : l
            ),
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post('/admin/vhc', formData, {
            onError: (err) => setErrors(err),
            onSuccess: () => {
                onClose();
                setFormData({
                    name: '',
                    purpose: '',
                    origin: 'Cogon Public Market, El Salvador City',
                    destination: '',
                    livestock: [],
                });
                setErrors({});
            },
        });
    };

    const handleClose = () => {
        onClose();
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add VHC Record</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Create a new VHC certificate record</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter certificate name"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs">{errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">
                                        Purpose <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleChange}
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
                                        name="destination"
                                        value={formData.destination}
                                        onChange={handleChange}
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
                                    const isSelected = formData.livestock.some((l) => l.species_id === s.id);
                                    const livestockEntry = formData.livestock.find((l) => l.species_id === s.id);
                                    
                                    return (
                                        <div key={s.id} className={`border rounded-xl p-4 transition-all ${isSelected ? 'border-violet-300 bg-violet-50/30' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <input
                                                    type="checkbox"
                                                    id={`species-${s.id}`}
                                                    checked={isSelected}
                                                    onChange={() => handleSpeciesToggle(s.id)}
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
                                                            onChange={(e) => handleLivestockChange(s.id, 'male_count', e.target.value)}
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
                                                            onChange={(e) => handleLivestockChange(s.id, 'female_count', e.target.value)}
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
                        onClick={handleClose}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2.5 text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all font-medium shadow-lg shadow-violet-500/25"
                    >
                        Save VHC Record
                    </button>
                </div>
            </div>
        </div>
    );
}
