import { useState, useEffect } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Admin/Sidebar';
import PetOwnersList from './PetOwnersList';
import BreedSpeciesModal from '../../Components/Admin/BreedSpeciesModal';

export default function Client({ clients, barangays }) {
    const { props, flash } = usePage();
    const [flashMessage, setFlashMessage] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBreedSpeciesModal, setShowBreedSpeciesModal] = useState(false);
    const [animalTypes, setAnimalTypes] = useState([]);

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
    
    // Initialize search term and barangay from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const [selectedBarangay, setSelectedBarangay] = useState(urlParams.get('barangay_id') || '');
    const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch animal types data when modal opens
    useEffect(() => {
        if (showBreedSpeciesModal) {
            fetch('/admin/animal-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token
                },
                credentials: 'same-origin'
            })
                .then(response => {
                    console.log('Response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Animal types data:', data);
                    setAnimalTypes(data);
                })
                .catch(error => {
                    console.error('Error fetching animal data:', error);
                    // Set some default data if fetch fails
                    setAnimalTypes([
                        { id: 1, type_name: 'Pet Animals', species: [] },
                        { id: 2, type_name: 'Livestock', species: [] },
                        { id: 3, type_name: 'Poultry', species: [] }
                    ]);
                });
        }
    }, [showBreedSpeciesModal, props.csrf_token]);

    const handleAddClient = () => {
        setShowAddForm(true);
    };

    const handleBarangayChange = (barangayId) => {
        setSelectedBarangay(barangayId);
        // Update URL with new filters
        const params = new URLSearchParams(window.location.search);
        if (barangayId) {
            params.set('barangay_id', barangayId);
        } else {
            params.delete('barangay_id');
        }
        params.delete('page'); // Reset to first page when filtering
        router.get(window.location.pathname + '?' + params.toString());
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        // Only search if user stops typing for 800ms
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            // Update URL with search term
            const params = new URLSearchParams(window.location.search);
            if (value) {
                params.set('search', value);
            } else {
                params.delete('search');
            }
            params.delete('page'); // Reset to first page when searching
            router.get(window.location.pathname + '?' + params.toString());
        }, 800);
    };


    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-72">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    {/* Page Header - Full Width Banner */}
                    <div className="bg-gradient-to-r from-gray-700 to-sky-700 px-8 py-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-white">Client Management</h2>
                                <p className="mt-2 text-sky-200">Manage your veterinary clinic Animal owners</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowBreedSpeciesModal(true)}
                                    className="inline-flex items-center px-5 py-3 border border-white/30 text-sm font-medium rounded-xl text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 transition-all duration-200"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                    </svg>
                                    Species & Breeds
                                </button>
                                <button
                                    onClick={handleAddClient}
                                    className="inline-flex items-center px-5 py-3 border border-white text-sm font-medium rounded-xl text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 transition-all duration-200"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                    </svg>
                                    Add Client
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Flash Message */}
                    {flashMessage && (
                        <div className={`mx-8 mt-4 px-4 py-3 rounded-lg ${
                            flashMessage.type === 'success'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {flashMessage.text}
                        </div>
                    )}

                    {/* Filters Bar (hidden - using barangay folder navigation instead) */}
                    <div className="hidden">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Barangay Dropdown */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Filter by Barangay</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full md:w-64 bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                                    >
                                        <span className="block truncate">
                                            {selectedBarangay ? barangays.find(b => b.id == selectedBarangay)?.name || 'Select Barangay' : 'All Barangays'}
                                        </span>
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute z-30 mt-1 w-full md:w-64 bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                            <div
                                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-sky-50 hover:text-sky-700"
                                                onClick={() => {
                                                    setSelectedBarangay('');
                                                    setIsDropdownOpen(false);
                                                    // Clear barangay filter but keep search term
                                                    const params = new URLSearchParams(window.location.search);
                                                    params.delete('barangay_id');
                                                    params.delete('page');
                                                    router.get(window.location.pathname + '?' + params.toString());
                                                }}
                                            >
                                                <span className="font-medium text-gray-900">All Barangays</span>
                                            </div>
                                            {barangays.map((barangay) => (
                                                <div
                                                    key={barangay.id}
                                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-sky-50 hover:text-sky-700"
                                                    onClick={() => {
                                                        setSelectedBarangay(barangay.id);
                                                        setIsDropdownOpen(false);
                                                        const params = new URLSearchParams(window.location.search);
                                                        params.set('barangay_id', barangay.id);
                                                        params.delete('page');
                                                        router.get(window.location.pathname + '?' + params.toString());
                                                    }}
                                                >
                                                    <span className="block truncate font-normal text-gray-900">{barangay.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Clients</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                                        placeholder="Search by name, email..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="px-8 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <aside className="lg:col-span-3">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900">Barangays</h3>
                                        <p className="text-xs text-gray-500 mt-1">Click to view clients</p>
                                    </div>

                                    <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleBarangayChange('')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                                                !selectedBarangay
                                                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                                                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                        >
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                                                </svg>
                                            </span>
                                            <span className="font-medium">All Barangays</span>
                                        </button>

                                        {barangays.map((barangay) => (
                                            <button
                                                key={barangay.id}
                                                type="button"
                                                onClick={() => handleBarangayChange(String(barangay.id))}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                                                    String(selectedBarangay) === String(barangay.id)
                                                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                                                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                                }`}
                                            >
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                                                    </svg>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium">{barangay.name}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </aside>

                            <div className="lg:col-span-9 space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Clients</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={handleSearch}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                                                    placeholder="Search by name, email..."
                                                />
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-500 sm:text-right">
                                            Showing {clients.length} client{clients.length === 1 ? '' : 's'}
                                            {selectedBarangay
                                                ? ` in ${barangays.find(b => String(b.id) === String(selectedBarangay))?.name || ''}`
                                                : ''}
                                        </div>
                                    </div>
                                </div>

                        {/* Add Client Modal */}
                        {showAddForm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
                                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-gray-900">Add New Client</h3>
                                            <button
                                                onClick={() => setShowAddForm(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4">
                                        <ClientRegistrationForm onClose={() => setShowAddForm(false)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Breed & Species Modal */}
                        <BreedSpeciesModal 
                            isOpen={showBreedSpeciesModal}
                            onClose={() => setShowBreedSpeciesModal(false)}
                            animalTypes={animalTypes}
                        />

                        {/* Clients Table */}
                        <PetOwnersList clients={clients} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// Multi-step Client Registration Form Component
function ClientRegistrationForm({ onClose }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        lastname: '',
        firstname: '',
        middlename: '',
        age: '',
        barangay_id: '',
        zone: '',
        facebook: '',
        phone_number: '',
        email: '',
        password: '',
        password_confirmation: '',
        skip_account_creation: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle checkbox inputs
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
            return;
        }

        // Special handling for phone number to enforce 09 prefix and 11 digits
        if (name === 'phone_number') {
            // Only allow numbers and limit to 11 characters
            let phoneValue = value.replace(/\D/g, '');

            // Ensure it starts with 09 if user starts typing
            if (phoneValue.length > 0 && !phoneValue.startsWith('09')) {
                phoneValue = '09' + phoneValue.replace(/^0+/, '');
            }

            // Limit to 11 characters
            phoneValue = phoneValue.substring(0, 11);

            setFormData(prev => ({
                ...prev,
                [name]: phoneValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleNext = () => {
        if (step === 1) {
            // Validate animal owner info
            const newErrors = {};
            if (!formData.lastname) newErrors.lastname = 'Last name is required';
            if (!formData.firstname) newErrors.firstname = 'First name is required';
            if (!formData.age) newErrors.age = 'Age is required';
            if (!formData.barangay_id) newErrors.barangay_id = 'Barangay is required';
            if (!formData.zone) newErrors.zone = 'Zone is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
            } else {
                setErrors({});
                // If skip account creation is checked, submit directly
                if (formData.skip_account_creation) {
                    submitForm();
                } else {
                    setStep(2);
                }
            }
        }
    };

    const submitForm = () => {
        setLoading(true);
        
        console.log('Submitting client form:', formData);

        // Submit form data
        router.post('/admin/clients', {
            ...formData,
            role: 'client'
        }, {
            onSuccess: (page) => {
                console.log('Client created successfully');
                setLoading(false);
                onClose();
                // Force reload to show updated client list
                router.reload();
            },
            onError: (errors) => {
                console.error('Client creation errors:', errors);
                setErrors(errors);
                setLoading(false);
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Only validate email and password if NOT skipping account creation
        if (!formData.skip_account_creation) {
            const newErrors = {};
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.password) newErrors.password = 'Password is required';
            if (formData.password !== formData.password_confirmation) {
                newErrors.password_confirmation = 'Passwords do not match';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
        }

        submitForm();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-gradient-to-r from-gray-600 to-sky-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        1
                    </div>
                    <span className="ml-2 text-sm font-medium">Animal Owner Info</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                    <div className={`h-full ${step >= 2 ? 'bg-gradient-to-r from-gray-600 to-sky-600' : ''}`}></div>
                </div>
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-gradient-to-r from-gray-600 to-sky-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        2
                    </div>
                    <span className="ml-2 text-sm font-medium">Account Setup</span>
                </div>
            </div>

            {/* Step 1: Animal Owner Information */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleInputChange}
                                className={`block w-full px-3 py-2 border ${errors.lastname ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                                placeholder="Enter last name"
                            />
                            {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleInputChange}
                                className={`block w-full px-3 py-2 border ${errors.firstname ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                                placeholder="Enter first name"
                            />
                            {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                            <input
                                type="text"
                                name="middlename"
                                value={formData.middlename}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                placeholder="Enter middle name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                className={`block w-full px-3 py-2 border ${errors.age ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                                placeholder="Enter age"
                            />
                            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                className={`block w-full px-3 py-2 border ${errors.phone_number ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                                placeholder="09XXXXXXXXX"
                                maxLength={11}
                            />
                            {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
                            <p className="mt-1 text-xs text-gray-500">Must start with 09 and be 11 digits</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                        <input
                            type="text"
                            name="facebook"
                            value={formData.facebook}
                            onChange={handleInputChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Facebook profile"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                            <select
                                name="barangay_id"
                                value={formData.barangay_id}
                                onChange={handleInputChange}
                                className={`block w-full px-3 py-2 border ${errors.barangay_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                            >
                                <option value="">Select Barangay</option>
                                <option value="1">Amoros</option>
                                <option value="2">Bolisong</option>
                                <option value="3">Cogon</option>
                                <option value="4">Himaya</option>
                                <option value="5">Hinigdaan</option>
                                <option value="6">Kalabaylabay</option>
                                <option value="7">Molugan</option>
                                <option value="8">Pedro S. Baculio (Bolo-Bolo)</option>
                                <option value="9">Poblacion (city center)</option>
                                <option value="10">Quibonbon</option>
                                <option value="11">Sambulawan</option>
                                <option value="12">San Francisco de Asis (Calongonan)</option>
                                <option value="13">Sinaloc</option>
                                <option value="14">Taytay</option>
                                <option value="15">Ulaliman</option>
                            </select>
                            {errors.barangay_id && <p className="mt-1 text-sm text-red-600">{errors.barangay_id}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zone *</label>
                            <select
                                name="zone"
                                value={formData.zone}
                                onChange={handleInputChange}
                                className={`block w-full px-3 py-2 border ${errors.zone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                            >
                                <option value="">Select Zone</option>
                                <option value="Zone 1">Zone 1</option>
                                <option value="Zone 2">Zone 2</option>
                                <option value="Zone 3">Zone 3</option>
                            </select>
                            {errors.zone && <p className="mt-1 text-sm text-red-600">{errors.zone}</p>}
                        </div>
                    </div>

                    {/* Skip Account Creation Option */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                            type="checkbox"
                            id="skip_account_creation"
                            name="skip_account_creation"
                            checked={formData.skip_account_creation}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                        />
                        <label htmlFor="skip_account_creation" className="text-sm text-gray-700 cursor-pointer">
                            <span className="font-medium">Skip account creation</span>
                            <span className="text-gray-500 block">Quick save for walk-ins. Account can be created later from the client view page.</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-gray-600 to-sky-600 hover:from-gray-700 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                            {formData.skip_account_creation ? 'Save Client' : 'Next Step'}
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Email and Password */}
            {step === 2 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                            placeholder="client@example.com"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                            placeholder="Enter password"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                        <input
                            type="password"
                            name="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleInputChange}
                            className={`block w-full px-3 py-2 border ${errors.password_confirmation ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
                            placeholder="Confirm password"
                        />
                        {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                            </svg>
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-gray-600 to-sky-600 hover:from-gray-700 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Client Account'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}
