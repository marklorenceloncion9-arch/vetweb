import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function BreedSpeciesModal({ isOpen, onClose, animalTypes }) {
    const { props } = usePage();
    const [activeTab, setActiveTab] = useState('species');
    const [speciesForm, setSpeciesForm] = useState({
        species_name: '',
        type_id: ''
    });
    const [breedForm, setBreedForm] = useState({
        breed_name: '',
        species_id: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    console.log('BreedSpeciesModal render - animalTypes:', animalTypes);

    // Handle success messages from Inertia
    useEffect(() => {
        if (props.flash?.success) {
            setSuccessMessage(props.flash.success);
            setShowSuccess(true);
            
            // Auto-hide success message after 3 seconds but keep modal open
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [props.flash?.success]);

    const handleSpeciesSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        router.post('/admin/species', speciesForm, {
            onSuccess: () => {
                setSpeciesForm({ species_name: '', type_id: '' });
                setLoading(false);
                // Success will be handled by the flash message effect
                // Modal stays open
            },
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
            preserveState: true,
        });
    };

    const handleBreedSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        router.post('/admin/breeds', breedForm, {
            onSuccess: () => {
                setBreedForm({ breed_name: '', species_id: '' });
                setLoading(false);
                // Success will be handled by the flash message effect
                // Modal stays open
            },
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
            preserveState: true,
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 pointer-events-auto animate-pulse">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="font-medium">{successMessage}</span>
                        <button
                            onClick={() => {
                                setShowSuccess(false);
                            }}
                            className="ml-4 text-white hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Manage Species & Breeds</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('species')}
                                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                                    activeTab === 'species'
                                        ? 'border-sky-500 text-sky-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Add Species
                            </button>
                            <button
                                onClick={() => setActiveTab('breeds')}
                                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                                    activeTab === 'breeds'
                                        ? 'border-sky-500 text-sky-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Add Breed
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="px-6 py-4">
                        {activeTab === 'species' && (
                            <form onSubmit={handleSpeciesSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
                                    {animalTypes.length === 0 ? (
                                        <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                            Loading animal types...
                                        </div>
                                    ) : (
                                        <select
                                            value={speciesForm.type_id}
                                            onChange={(e) => setSpeciesForm({ ...speciesForm, type_id: e.target.value })}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                            required
                                        >
                                            <option value="">Select Animal Type</option>
                                            {animalTypes.map((type) => (
                                                <option key={type.id} value={type.id}>{type.type_name}</option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.type_id && <p className="mt-1 text-sm text-red-600">{errors.type_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Species Name</label>
                                    <input
                                        type="text"
                                        value={speciesForm.species_name}
                                        onChange={(e) => setSpeciesForm({ ...speciesForm, species_name: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        placeholder="e.g., Dog, Cat, Chicken"
                                        required
                                    />
                                    {errors.species_name && <p className="mt-1 text-sm text-red-600">{errors.species_name}</p>}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add Species'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'breeds' && (
                            <form onSubmit={handleBreedSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                                    {animalTypes.length === 0 ? (
                                        <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                            Loading species...
                                        </div>
                                    ) : (
                                        <select
                                            value={breedForm.species_id}
                                            onChange={(e) => setBreedForm({ ...breedForm, species_id: e.target.value })}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                            required
                                        >
                                            <option value="">Select Species</option>
                                            {animalTypes.map((type) => (
                                                <optgroup key={type.id} label={type.type_name}>
                                                    {type.species.map((species) => (
                                                        <option key={species.id} value={species.id}>{species.species_name}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    )}
                                    {errors.species_id && <p className="mt-1 text-sm text-red-600">{errors.species_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Breed Name</label>
                                    <input
                                        type="text"
                                        value={breedForm.breed_name}
                                        onChange={(e) => setBreedForm({ ...breedForm, breed_name: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        placeholder="e.g., Labrador Retriever, Persian, Siamese"
                                        required
                                    />
                                    {errors.breed_name && <p className="mt-1 text-sm text-red-600">{errors.breed_name}</p>}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add Breed'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
