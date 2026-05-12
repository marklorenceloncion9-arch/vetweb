import { Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';

export default function ClientDetails({ client, species = [], breeds = [], barangays = [] }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPetModal, setShowPetModal] = useState(false);
    const [showViewPetModal, setShowViewPetModal] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [modalPetStatus, setModalPetStatus] = useState(null);

    // Helper function to check if animal is livestock or poultry (exempt from registration)
    const isExemptFromRegistration = (pet) => {
        const typeName = pet.species?.animalType?.type_name;
        return typeName === 'Livestock' || typeName === 'Poultry';
    };
    const [isEditingPet, setIsEditingPet] = useState(false);
    const [editPetFormData, setEditPetFormData] = useState({
        pet_name: '',
        species_id: '',
        breed_id: '',
        sex: '',
        color: '',
        weight: '',
        birthdate: '',
        registration_status: '',
    });
    const [editPetAvailableBreeds, setEditPetAvailableBreeds] = useState([]);
    const [formData, setFormData] = useState({
        firstname: client.firstname || '',
        middlename: client.middlename || '',
        lastname: client.lastname || '',
        age: client.age || '',
        email: client.email || '',
        phone_number: client.phone_number || '',
        barangay_id: client.barangay_id || '',
        zone: client.zone || '',
        facebook: client.facebook || '',
    });
    const [petFormData, setPetFormData] = useState({
        pet_name: '',
        species_id: '',
        breed_id: '',
        sex: 'male',
        color: '',
        weight: '',
        birthdate: '',
        // Reproductive Status
        reproductive_status: '', // 'pregnant', 'nursing', 'not_pregnant'
        weeks_months: '',
        // Diet
        diet: '', // 'commercial_food', 'table_food', 'both', 'others'
        diet_other: '',
        // Deworming History
        dewormed: '',
        last_deworming_date: '',
        dewormer_name: '',
        // Vaccination History
        rabies_vaccine: '',
        rabies_last_vaccination: '',
        dhppl_vaccine: '',
        dhppl_last_vaccination: '',
        other_vaccine_name: '',
        other_vaccine_last_vaccination: '',
    });
    const [errors, setErrors] = useState({});
    const [petErrors, setPetErrors] = useState({});
    const [availableBreeds, setAvailableBreeds] = useState([]);
    const [flashMessage, setFlashMessage] = useState(null);
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [accountForm, setAccountForm] = useState({
        email: '',
        password: '',
        password_confirmation: ''
    });

    const openPetProfile = (pet, { edit = false } = {}) => {
        setSelectedPet(pet);
        setModalPetStatus(pet?.registration_status || 'unregistered');

        const nextSpeciesId = pet?.species_id ?? '';
        const breedsForSpecies = nextSpeciesId
            ? breeds.filter((b) => b.species_id === parseInt(nextSpeciesId))
            : [];

        setEditPetAvailableBreeds(breedsForSpecies);
        setEditPetFormData({
            pet_name: pet?.pet_name ?? '',
            species_id: nextSpeciesId,
            breed_id: pet?.breed_id ?? '',
            sex: pet?.sex ?? '',
            color: pet?.color ?? '',
            weight: pet?.weight ?? '',
            birthdate: pet?.birthdate ?? '',
            registration_status: pet?.registration_status ?? '',
        });

        setIsEditingPet(Boolean(edit));
        setShowViewPetModal(true);
    };

    // Handle flash messages from Inertia
    const { flash } = usePage().props;
    console.log('Flash data:', flash); // Debug
    useEffect(() => {
        console.log('Flash effect triggered:', flash); // Debug
        if (flash?.success) {
            console.log('Showing success message:', flash.success); // Debug
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

    const handleEditClient = () => {
        setShowEditModal(true);
        setErrors({});
        setShowCreateAccount(false);
    };

    const isPlaceholderEmail = (email) => {
        return email && email.endsWith('@vetcare.local');
    };

    const handleCreateAccount = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Validate
        const newErrors = {};
        if (!accountForm.email) newErrors.account_email = 'Email is required';
        if (!accountForm.password) newErrors.account_password = 'Password is required';
        if (accountForm.password !== accountForm.password_confirmation) {
            newErrors.account_password_confirmation = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        router.post(`/admin/clients/${client.id}/create-account`, {
            email: accountForm.email,
            password: accountForm.password,
            password_confirmation: accountForm.password_confirmation
        }, {
            onSuccess: () => {
                setShowCreateAccount(false);
                setAccountForm({ email: '', password: '', password_confirmation: '' });
                setErrors({});
                // Reload to get updated client data
                router.reload();
            },
            onError: (errors) => {
                setErrors(errors);
            }
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        router.put(`/admin/clients/${client.id}`, formData, {
            onSuccess: () => {
                setShowEditModal(false);
                setErrors({});
            },
            onError: (errors) => {
                setErrors(errors);
            },
            preserveState: true,
        });
    };

    const handlePetInputChange = (e) => {
        const { name, value } = e.target;
        
        setPetFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (petErrors[name]) {
            setPetErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Update available breeds when species changes
        if (name === 'species_id') {
            const selectedSpecies = species.find(s => s.id === parseInt(value));
            if (selectedSpecies) {
                // Filter breeds for this species
                const breedsForSpecies = breeds.filter(b => b.species_id === parseInt(value));
                setAvailableBreeds(breedsForSpecies);
            } else {
                setAvailableBreeds([]);
            }
            setPetFormData(prev => ({ ...prev, breed_id: '' }));
        }
    };

    const handlePetSubmit = (e) => {
        e.preventDefault();
        
        router.post(`/admin/clients/${client.id}/animals`, petFormData, {
            onSuccess: () => {
                setShowPetModal(false);
                setPetErrors({});
                setPetFormData({
                    pet_name: '',
                    species_id: '',
                    breed_id: '',
                    sex: 'male',
                    color: '',
                    weight: '',
                    birthdate: '',
                    reproductive_status: '',
                    weeks_months: '',
                    diet: '',
                    diet_other: '',
                    dewormed: '',
                    last_deworming_date: '',
                    dewormer_name: '',
                    rabies_vaccine: '',
                    rabies_last_vaccination: '',
                    dhppl_vaccine: '',
                    dhppl_last_vaccination: '',
                    other_vaccine_name: '',
                    other_vaccine_last_vaccination: '',
                });
                setAvailableBreeds([]);
            },
            onError: (errors) => {
                setPetErrors(errors);
            },
            preserveState: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex relative">
            {/* Flash Message Toast */}
            {flashMessage && (
                <div className="fixed top-4 right-4 z-[100] animate-fade-in">
                    <div className={`bg-white border-l-4 rounded-lg shadow-xl p-4 flex items-center gap-3 min-w-[300px] ${
                        flashMessage.type === 'error' ? 'border-red-500' : 'border-green-500'
                    }`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            flashMessage.type === 'error' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                            <svg className={`w-5 h-5 ${flashMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {flashMessage.type === 'error' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                )}
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{flashMessage.text}</p>
                        </div>
                        <button
                            onClick={() => setFlashMessage(null)}
                            className="flex-shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <Sidebar />

            <div className="flex-1 flex flex-col ml-72">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-4 mb-6">
                            <Link href="/admin/clients" className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-all">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                                Back to Clients
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Client Details</h1>
                                <p className="text-xs text-gray-400">View and manage client information</p>
                            </div>
                        </div>

                        {/* Client Profile Header */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                            <div className="bg-gradient-to-r from-gray-600 to-sky-600 px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="w-12 h-12 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">
                                                {client.firstname} {client.middlename} {client.lastname}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button onClick={handleEditClient} className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-lg text-white hover:bg-white hover:text-sky-600 transition-all duration-200">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                            Edit Client
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Personal Information Card */}
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                        </svg>
                                        Personal Information
                                    </h3>
                                </div>
                                <div className="px-6 py-4 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Full Name</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {client.firstname} {client.middlename} {client.lastname}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Age</span>
                                        <span className="text-sm font-semibold text-gray-900">{client.age}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Email</span>
                                        <span className="text-sm font-semibold text-gray-900">{client.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Phone</span>
                                        <span className="text-sm font-semibold text-gray-900">{client.phone_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-gray-500">Facebook</span>
                                        <span className="text-sm font-semibold text-gray-900">{client.facebook || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Location Information Card */}
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-sky-100 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        Location Information
                                    </h3>
                                </div>
                                <div className="px-6 py-4 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Barangay</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {client.barangay?.name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Zone</span>
                                        <span className="text-sm font-semibold text-gray-900">{client.zone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Animals Section */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-white flex items-center">
                                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                        </svg>
                                        Animals
                                    </h3>
                                    <button 
                                        onClick={() => setShowPetModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-lg text-white hover:bg-white hover:text-green-600 transition-all duration-200"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                        Add Animal
                                    </button>
                                </div>
                            </div>
                            <div className="px-8 py-6">
                                {client.animals && client.animals.length > 0 ? (
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                                            <div>Animal Name</div>
                                            <div>Species</div>
                                            <div>Breed</div>
                                            <div>Status</div>
                                            <div className="text-right">Action</div>
                                        </div>
                                            {/* Table Rows */}
                                        {client.animals.map((pet) => (
                                            <div key={pet.id} className="grid grid-cols-5 gap-4 px-6 py-4 bg-white border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center">
                                                <div className="font-medium text-gray-900">{pet.pet_name}</div>
                                                <div className="text-gray-600">{pet.species?.species_name || '-'}</div>
                                                <div className="text-gray-600">{pet.breed?.breed_name || '-'}</div>
                                                <div>
                                                    {pet.registration_status === 'exempt' ? (
                                                        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                            Exempt
                                                        </span>
                                                    ) : (
                                                        <div className="relative inline-flex items-center">
                                                            <select
                                                                value={pet.registration_status || 'unregistered'}
                                                                onChange={(e) => {
                                                                    const nextStatus = e.target.value;
                                                                    router.post(
                                                                        `/admin/clients/${client.id}/animals/${pet.id}/status`,
                                                                        { registration_status: nextStatus },
                                                                        {
                                                                            preserveState: true,
                                                                            preserveScroll: true,
                                                                            onSuccess: () => router.reload({ only: ['client'] }),
                                                                        }
                                                                    );
                                                                }}
                                                                className={`appearance-none pr-8 pl-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-200 cursor-pointer transition-colors ${
                                                                    pet.registration_status === 'registered'
                                                                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200/70'
                                                                        : pet.registration_status === 'declined'
                                                                          ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200/70'
                                                                          : 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200/70'
                                                                }`}
                                                                title="Change registration status"
                                                            >
                                                                <option value="registered">Registered</option>
                                                                <option value="unregistered">Pending</option>
                                                                <option value="declined">Declined</option>
                                                            </select>

                                                            <svg
                                                                className="pointer-events-none absolute right-2 h-4 w-4 text-gray-600/80"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/clients/${client.id}/animals/${pet.id}/history`}
                                                            className="inline-flex items-center p-2 text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                                                            title="View Animal (Info + History)"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No animals registered</h3>
                                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Get started by adding an animal for this client. You can manage their medical records, appointments, and more.</p>
                                        <button 
                                            onClick={() => setShowPetModal(true)}
                                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                            </svg>
                                            Add First Animal
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Animal Modal */}
            {showPetModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowPetModal(false)}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                    
                    {/* Modal Panel */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col transform transition-all" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                </svg>
                                Animal Profile
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPetModal(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handlePetSubmit} className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Animal Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Animal Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="pet_name"
                                            value={petFormData.pet_name}
                                            onChange={handlePetInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                                                petErrors.pet_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            placeholder="Enter animal name"
                                            required
                                        />
                                        {petErrors.pet_name && (
                                            <p className="mt-1.5 text-xs text-red-600">{petErrors.pet_name}</p>
                                        )}
                                    </div>

                                    {/* Species */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Species <span className="text-red-500">*</span></label>
                                        <select
                                            name="species_id"
                                            value={petFormData.species_id}
                                            onChange={handlePetInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                                                petErrors.species_id ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        >
                                            <option value="">Select Species</option>
                                            {species.map((s) => (
                                                <option key={s.id} value={s.id}>{s.species_name}</option>
                                            ))}
                                        </select>
                                        {petErrors.species_id && (
                                            <p className="mt-1.5 text-xs text-red-600">{petErrors.species_id}</p>
                                        )}
                                    </div>

                                    {/* Breed */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Breed <span className="text-red-500">*</span></label>
                                        <select
                                            name="breed_id"
                                            value={petFormData.breed_id}
                                            onChange={handlePetInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                                                petErrors.breed_id ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                            disabled={!petFormData.species_id}
                                        >
                                            <option value="">Select Breed</option>
                                            {availableBreeds.map((b) => (
                                                <option key={b.id} value={b.id}>{b.breed_name}</option>
                                            ))}
                                        </select>
                                        {petErrors.breed_id && (
                                            <p className="mt-1.5 text-xs text-red-600">{petErrors.breed_id}</p>
                                        )}
                                    </div>

                                    {/* Sex */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sex <span className="text-red-500">*</span></label>
                                        <select
                                            name="sex"
                                            value={petFormData.sex}
                                            onChange={handlePetInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:bg-white"
                                            required
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>

                                    {/* Birthdate */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Birthdate</label>
                                        <input
                                            type="date"
                                            name="birthdate"
                                            value={petFormData.birthdate}
                                            onChange={handlePetInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:bg-white"
                                        />
                                    </div>

                                    {/* Color */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                                        <input
                                            type="text"
                                            name="color"
                                            value={petFormData.color}
                                            onChange={handlePetInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:bg-white"
                                            placeholder="e.g. Brown, Black"
                                        />
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={petFormData.weight}
                                            onChange={handlePetInputChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:bg-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Reproductive Status */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Reproductive Status</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="reproductive_status"
                                                value="pregnant"
                                                checked={petFormData.reproductive_status === 'pregnant'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, reproductive_status: 'pregnant' }));
                                                    } else if (petFormData.reproductive_status === 'pregnant') {
                                                        setPetFormData(prev => ({ ...prev, reproductive_status: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Pregnant</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="reproductive_status"
                                                value="nursing"
                                                checked={petFormData.reproductive_status === 'nursing'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, reproductive_status: 'nursing' }));
                                                    } else if (petFormData.reproductive_status === 'nursing') {
                                                        setPetFormData(prev => ({ ...prev, reproductive_status: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Nursing</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="reproductive_status"
                                                value="not_pregnant"
                                                checked={petFormData.reproductive_status === 'not_pregnant'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, reproductive_status: 'not_pregnant' }));
                                                    } else if (petFormData.reproductive_status === 'not_pregnant') {
                                                        setPetFormData(prev => ({ ...prev, reproductive_status: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Not Pregnant</span>
                                        </label>
                                    </div>
                                    {(petFormData.reproductive_status === 'pregnant' || petFormData.reproductive_status === 'nursing') && (
                                        <input
                                            type="text"
                                            name="weeks_months"
                                            value={petFormData.weeks_months}
                                            onChange={handlePetInputChange}
                                            placeholder="Weeks/Months (e.g., 4 weeks)"
                                            className="mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-1/2"
                                        />
                                    )}
                                </div>

                                {/* Diet */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Diet</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="diet"
                                                value="commercial_food"
                                                checked={petFormData.diet === 'commercial_food'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, diet: 'commercial_food' }));
                                                    } else if (petFormData.diet === 'commercial_food') {
                                                        setPetFormData(prev => ({ ...prev, diet: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Commercial Food</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="diet"
                                                value="table_food"
                                                checked={petFormData.diet === 'table_food'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, diet: 'table_food' }));
                                                    } else if (petFormData.diet === 'table_food') {
                                                        setPetFormData(prev => ({ ...prev, diet: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Table Food</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="diet"
                                                value="both"
                                                checked={petFormData.diet === 'both'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, diet: 'both' }));
                                                    } else if (petFormData.diet === 'both') {
                                                        setPetFormData(prev => ({ ...prev, diet: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Both</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="diet"
                                                value="others"
                                                checked={petFormData.diet === 'others'}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setPetFormData(prev => ({ ...prev, diet: 'others' }));
                                                    } else if (petFormData.diet === 'others') {
                                                        setPetFormData(prev => ({ ...prev, diet: '' }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Others</span>
                                        </label>
                                    </div>
                                    {petFormData.diet === 'others' && (
                                        <input
                                            type="text"
                                            name="diet_other"
                                            value={petFormData.diet_other}
                                            onChange={handlePetInputChange}
                                            placeholder="Specify other diet"
                                            className="mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-1/2"
                                        />
                                    )}
                                </div>

                                {/* Deworming History */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Deworming History</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="dewormed"
                                                    value="yes"
                                                    checked={petFormData.dewormed === 'yes'}
                                                    onChange={handlePetInputChange}
                                                    className="w-4 h-4 text-green-600 border-gray-300"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Yes</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="dewormed"
                                                    value="no"
                                                    checked={petFormData.dewormed === 'no'}
                                                    onChange={handlePetInputChange}
                                                    className="w-4 h-4 text-green-600 border-gray-300"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">No</span>
                                            </label>
                                        </div>
                                        {petFormData.dewormed === 'yes' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="date"
                                                    name="last_deworming_date"
                                                    value={petFormData.last_deworming_date}
                                                    onChange={handlePetInputChange}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    name="dewormer_name"
                                                    value={petFormData.dewormer_name}
                                                    onChange={handlePetInputChange}
                                                    placeholder="Name of dewormer"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Vaccination History */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Vaccination History</h4>
                                    <div className="space-y-4">
                                        {/* Rabies Vaccine */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-700 w-32">Rabies Vaccine:</span>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="rabies_vaccine"
                                                        value="yes"
                                                        checked={petFormData.rabies_vaccine === 'yes'}
                                                        onChange={handlePetInputChange}
                                                        className="w-4 h-4 text-green-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="rabies_vaccine"
                                                        value="no"
                                                        checked={petFormData.rabies_vaccine === 'no'}
                                                        onChange={handlePetInputChange}
                                                        className="w-4 h-4 text-green-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">No</span>
                                                </label>
                                            </div>
                                            {petFormData.rabies_vaccine === 'yes' && (
                                                <input
                                                    type="date"
                                                    name="rabies_last_vaccination"
                                                    value={petFormData.rabies_last_vaccination}
                                                    onChange={handlePetInputChange}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-48"
                                                />
                                            )}
                                        </div>
                                        {/* DHPPL Vaccine */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-700 w-32">DHPPL Vaccine:</span>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="dhppl_vaccine"
                                                        value="yes"
                                                        checked={petFormData.dhppl_vaccine === 'yes'}
                                                        onChange={handlePetInputChange}
                                                        className="w-4 h-4 text-green-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="dhppl_vaccine"
                                                        value="no"
                                                        checked={petFormData.dhppl_vaccine === 'no'}
                                                        onChange={handlePetInputChange}
                                                        className="w-4 h-4 text-green-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">No</span>
                                                </label>
                                            </div>
                                            {petFormData.dhppl_vaccine === 'yes' && (
                                                <input
                                                    type="date"
                                                    name="dhppl_last_vaccination"
                                                    value={petFormData.dhppl_last_vaccination}
                                                    onChange={handlePetInputChange}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-48"
                                                />
                                            )}
                                        </div>
                                        {/* Other Vaccine */}
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm text-gray-700">Other Vaccine:</span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    name="other_vaccine_name"
                                                    value={petFormData.other_vaccine_name}
                                                    onChange={handlePetInputChange}
                                                    placeholder="Name of vaccine"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <input
                                                    type="date"
                                                    name="other_vaccine_last_vaccination"
                                                    value={petFormData.other_vaccine_last_vaccination}
                                                    onChange={handlePetInputChange}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPetModal(false)}
                                        className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm transition-all duration-200"
                                    >
                                        Add Animal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
            )}

            {/* Edit Client Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowEditModal(false)}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                    
                    {/* Modal Panel */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col transform transition-all" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Edit Client Information</h3>
                                    <p className="text-sm text-gray-500">Update client details below</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5">
                            {/* Personal Information */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    Personal Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="firstname"
                                            value={formData.firstname}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.firstname ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        />
                                        {errors.firstname && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.firstname}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Middle Name</label>
                                        <input
                                            type="text"
                                            name="middlename"
                                            value={formData.middlename}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 hover:bg-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="lastname"
                                            value={formData.lastname}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.lastname ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        />
                                        {errors.lastname && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.lastname}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Age <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="120"
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.age ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        />
                                        {errors.age && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.age}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        />
                                        {errors.email && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                            placeholder="09XXXXXXXXX"
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.phone_number ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                        />
                                        {errors.phone_number && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.phone_number}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook</label>
                                        <input
                                            type="text"
                                            name="facebook"
                                            value={formData.facebook}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 hover:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Create Account Section - Only show if placeholder email */}
                            {isPlaceholderEmail(formData.email) && (
                                <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                    {!showCreateAccount ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-1">
                                                    Account Status
                                                </h4>
                                                <p className="text-sm text-violet-600">
                                                    No login account created yet.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAccountForm({ email: '', password: '', password_confirmation: '' });
                                                    setShowCreateAccount(true);
                                                }}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                                </svg>
                                                Create Account
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-4 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                                </svg>
                                                Create Login Account
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="email"
                                                        value={accountForm.email}
                                                        onChange={(e) => {
                                                            setAccountForm(prev => ({ ...prev, email: e.target.value }));
                                                            if (errors.account_email) setErrors(prev => ({ ...prev, account_email: '' }));
                                                        }}
                                                        className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                                            errors.account_email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                        placeholder="client@example.com"
                                                    />
                                                    {errors.account_email && (
                                                        <p className="mt-1 text-xs text-red-600">{errors.account_email}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="password"
                                                        value={accountForm.password}
                                                        onChange={(e) => {
                                                            setAccountForm(prev => ({ ...prev, password: e.target.value }));
                                                            if (errors.account_password) setErrors(prev => ({ ...prev, account_password: '' }));
                                                        }}
                                                        className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                                            errors.account_password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                        placeholder="Enter password"
                                                    />
                                                    {errors.account_password && (
                                                        <p className="mt-1 text-xs text-red-600">{errors.account_password}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="password"
                                                        value={accountForm.password_confirmation}
                                                        onChange={(e) => {
                                                            setAccountForm(prev => ({ ...prev, password_confirmation: e.target.value }));
                                                            if (errors.account_password_confirmation) setErrors(prev => ({ ...prev, account_password_confirmation: '' }));
                                                        }}
                                                        className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                                            errors.account_password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                        placeholder="Confirm password"
                                                    />
                                                    {errors.account_password_confirmation && (
                                                        <p className="mt-1 text-xs text-red-600">{errors.account_password_confirmation}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCreateAccount(false)}
                                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateAccount}
                                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                                                    >
                                                        Create Account
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Location Information */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    Location Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Barangay <span className="text-red-500">*</span></label>
                                        <select
                                            name="barangay_id"
                                            value={formData.barangay_id}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.barangay_id ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        >
                                            <option value="">Select Barangay</option>
                                            {barangays.map(barangay => (
                                                <option key={barangay.id} value={barangay.id}>{barangay.name}</option>
                                            ))}
                                        </select>
                                        {errors.barangay_id && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.barangay_id}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="zone"
                                            value={formData.zone}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                                                errors.zone ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                                            }`}
                                            required
                                        />
                                        {errors.zone && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                {errors.zone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-sm transition-all duration-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View/Edit Animal Modal */}
            {showViewPetModal && selectedPet && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowViewPetModal(false)}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                    
                    {/* Modal Panel */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto transform transition-all" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                {isEditingPet ? 'Edit Pet' : 'Pet Details'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {/* Close Icon */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowViewPetModal(false);
                                        setIsEditingPet(false);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Animal Info / Edit Form */}
                        <div className="p-6 space-y-4">
                            {/* Animal Avatar */}
                            <div className="flex items-center justify-center mb-6">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg ${
                                    selectedPet.sex === 'male' 
                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                        : 'bg-gradient-to-br from-pink-500 to-pink-600'
                                }`}>
                                    {selectedPet.pet_name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {isEditingPet ? (
                                /* Edit Mode Form */
                                <div className="space-y-4">
                                    {/* Pet Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pet Name</label>
                                        <input
                                            type="text"
                                            value={editPetFormData.pet_name}
                                            onChange={(e) => setEditPetFormData({ ...editPetFormData, pet_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>

                                    {/* Species & Breed */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Species</label>
                                            <select
                                                value={editPetFormData.species_id}
                                                onChange={(e) => {
                                                    const newSpeciesId = e.target.value;
                                                    const breedsForSpecies = breeds.filter(b => b.species_id === parseInt(newSpeciesId));
                                                    setEditPetAvailableBreeds(breedsForSpecies);
                                                    setEditPetFormData({ ...editPetFormData, species_id: newSpeciesId, breed_id: '' });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                                            >
                                                <option value="">Select</option>
                                                {species.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.species_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Breed</label>
                                            <select
                                                value={editPetFormData.breed_id}
                                                onChange={(e) => setEditPetFormData({ ...editPetFormData, breed_id: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                                                disabled={!editPetFormData.species_id}
                                            >
                                                <option value="">Select</option>
                                                {editPetAvailableBreeds.map((b) => (
                                                    <option key={b.id} value={b.id}>{b.breed_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Sex & Status */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sex</label>
                                            <select
                                                value={editPetFormData.sex}
                                                onChange={(e) => setEditPetFormData({ ...editPetFormData, sex: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                                            >
                                                <option value="male">♂ Male</option>
                                                <option value="female">♀ Female</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</label>
                                            {selectedPet.registration_status === 'exempt' ? (
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-gray-100 text-gray-600">
                                                    Exempt (No registration required)
                                                </div>
                                            ) : (
                                                <select
                                                    value={editPetFormData.registration_status}
                                                    onChange={(e) => {
                                                        setEditPetFormData({ ...editPetFormData, registration_status: e.target.value });
                                                        setModalPetStatus(e.target.value);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                                                >
                                                    <option value="pending">⏳ Pending</option>
                                                    <option value="registered">✓ Registered</option>
                                                    <option value="declined">✗ Declined</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {/* Color & Weight */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Color</label>
                                            <input
                                                type="text"
                                                value={editPetFormData.color}
                                                onChange={(e) => setEditPetFormData({ ...editPetFormData, color: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                placeholder="e.g. Brown"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight (kg)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={editPetFormData.weight}
                                                onChange={(e) => setEditPetFormData({ ...editPetFormData, weight: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                placeholder="0.0"
                                            />
                                        </div>
                                    </div>

                                    {/* Birthdate */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Birthdate</label>
                                        <input
                                            type="date"
                                            value={editPetFormData.birthdate}
                                            onChange={(e) => setEditPetFormData({ ...editPetFormData, birthdate: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    {/* Animal Name */}
                                    <div className="text-center mb-6">
                                        <h4 className="text-2xl font-bold text-gray-900">{selectedPet.pet_name}</h4>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                                selectedPet.sex === 'male' 
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                                    : 'bg-pink-100 text-pink-700 border border-pink-200'
                                            }`}>
                                                {selectedPet.sex === 'male' ? '♂ Male' : '♀ Female'}
                                            </span>
                                            {selectedPet.registration_status === 'exempt' ? (
                                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                    Exempt
                                                </span>
                                            ) : (
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${
                                                    modalPetStatus === 'registered' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                    modalPetStatus === 'declined' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}>
                                                    {modalPetStatus === 'registered' ? 'Registered' : modalPetStatus}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Species</div>
                                            <div className="font-semibold text-gray-900">{selectedPet.species?.species_name || '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Breed</div>
                                            <div className="font-semibold text-gray-900">{selectedPet.breed?.breed_name || '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Color</div>
                                            <div className="font-semibold text-gray-900">{selectedPet.color || '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Weight</div>
                                            <div className="font-semibold text-gray-900">{selectedPet.weight ? `${selectedPet.weight} kg` : '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Birthdate</div>
                                            <div className="font-semibold text-gray-900">
                                                {selectedPet.birthdate 
                                                    ? new Date(selectedPet.birthdate).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Medical Profile Section */}
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Medical Profile</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Reproductive Status */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reproductive Status</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedPet.reproductive_status 
                                                        ? selectedPet.reproductive_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                        : '-'}
                                                </div>
                                                {selectedPet.weeks_months && (
                                                    <div className="text-sm text-gray-600 mt-1">{selectedPet.weeks_months}</div>
                                                )}
                                            </div>
                                            {/* Diet */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Diet</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedPet.diet 
                                                        ? selectedPet.diet.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                        : '-'}
                                                </div>
                                                {selectedPet.diet_other && (
                                                    <div className="text-sm text-gray-600 mt-1">{selectedPet.diet_other}</div>
                                                )}
                                            </div>
                                            {/* Deworming */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deworming</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedPet.dewormed === 'yes' ? 'Yes' : selectedPet.dewormed === 'no' ? 'No' : '-'}
                                                </div>
                                                {selectedPet.dewormed === 'yes' && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {selectedPet.dewormer_name || 'Unknown dewormer'}
                                                        {selectedPet.last_deworming_date && (
                                                            <span className="block text-xs text-gray-500">
                                                                {new Date(selectedPet.last_deworming_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Rabies Vaccine */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rabies Vaccine</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedPet.rabies_vaccine === 'yes' ? 'Yes' : selectedPet.rabies_vaccine === 'no' ? 'No' : '-'}
                                                </div>
                                                {selectedPet.rabies_vaccine === 'yes' && selectedPet.rabies_last_vaccination && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {new Date(selectedPet.rabies_last_vaccination).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                                                    </div>
                                                )}
                                            </div>
                                            {/* DHPPL Vaccine */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">DHPPL Vaccine</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedPet.dhppl_vaccine === 'yes' ? 'Yes' : selectedPet.dhppl_vaccine === 'no' ? 'No' : '-'}
                                                </div>
                                                {selectedPet.dhppl_vaccine === 'yes' && selectedPet.dhppl_last_vaccination && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {new Date(selectedPet.dhppl_last_vaccination).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Other Vaccine */}
                                            {(selectedPet.other_vaccine_name || selectedPet.other_vaccine_last_vaccination) && (
                                                <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Other Vaccine</div>
                                                    <div className="font-semibold text-gray-900">{selectedPet.other_vaccine_name}</div>
                                                    {selectedPet.other_vaccine_last_vaccination && (
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {new Date(selectedPet.other_vaccine_last_vaccination).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                            {isEditingPet ? (
                                /* Edit Mode Footer */
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPet(false)}
                                        className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            router.put(`/admin/clients/${client.id}/animals/${selectedPet.id}`, editPetFormData, {
                                                preserveState: true,
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setIsEditingPet(false);
                                                    router.reload({ only: ['client'] });
                                                },
                                            });
                                        }}
                                        className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                        </svg>
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                /* View Mode Footer */
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowViewPetModal(false)}
                                        className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Close
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {/* Approve/Decline buttons for unregistered animals */}
                                        {modalPetStatus === 'unregistered' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        router.post(`/admin/clients/${client.id}/animals/${selectedPet.id}/status`, {
                                                            registration_status: 'registered'
                                                        }, {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                setModalPetStatus('registered');
                                                                router.reload({ only: ['client'] });
                                                            },
                                                        });
                                                    }}
                                                    className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        router.post(`/admin/clients/${client.id}/animals/${selectedPet.id}/status`, {
                                                            registration_status: 'declined'
                                                        }, {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                setModalPetStatus('declined');
                                                                router.reload({ only: ['client'] });
                                                            },
                                                        });
                                                    }}
                                                    className="px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                                    </svg>
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPet(true)}
                                            className="p-2.5 border border-blue-300 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm"
                                            title="Edit Pet"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
