import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';

export default function PetHistory({ client, pet, history, species = [], breeds = [] }) {
    // Helper function to check if animal is livestock or poultry (exempt from registration)
    const isExemptFromRegistration = (p) => {
        const typeName = p.species?.animalType?.type_name;
        return typeName === 'Livestock' || typeName === 'Poultry';
    };

    const [search, setSearch] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [availableBreeds, setAvailableBreeds] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [editForm, setEditForm] = useState({
        pet_name: pet?.pet_name ?? '',
        species_id: pet?.species_id ?? '',
        breed_id: pet?.breed_id ?? '',
        sex: pet?.sex ?? '',
        color: pet?.color ?? '',
        weight: pet?.weight ?? '',
        birthdate: pet?.birthdate ?? '',
        registration_status: pet?.registration_status ?? 'unregistered',
    });

    const formatDateTime = (value) => {
        if (!value) return '-';
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return String(value);

        return dt.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return String(value);
        return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const openEdit = () => {
        const nextSpeciesId = pet?.species_id ?? '';
        const breedsForSpecies = nextSpeciesId
            ? breeds.filter((b) => b.species_id === parseInt(nextSpeciesId))
            : [];

        setAvailableBreeds(breedsForSpecies);
        setEditForm({
            pet_name: pet?.pet_name ?? '',
            species_id: nextSpeciesId,
            breed_id: pet?.breed_id ?? '',
            sex: pet?.sex ?? '',
            color: pet?.color ?? '',
            weight: pet?.weight ?? '',
            birthdate: pet?.birthdate ?? '',
            registration_status: pet?.registration_status ?? 'unregistered',
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const saveEdit = () => {
        setFormErrors({});

        const nextStatus = editForm.registration_status || 'unregistered';
        const statusChanged = nextStatus !== (pet?.registration_status ?? 'unregistered');

        router.put(`/admin/clients/${client.id}/animals/${pet.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                if (!statusChanged) {
                    setShowEditModal(false);
                    router.reload({ only: ['pet', 'history'] });
                    return;
                }

                router.post(
                    `/admin/clients/${client.id}/animals/${pet.id}/status`,
                    { registration_status: nextStatus },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setShowEditModal(false);
                            router.reload({ only: ['pet', 'history'] });
                        },
                        onError: (errors) => {
                            setFormErrors(errors || {});
                        },
                    }
                );
            },
            onError: (errors) => {
                setFormErrors(errors || {});
            },
        });
    };

    const filteredHistory = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return history;

        return history.filter((row) => {
            const service = String(row.service_type || '').toLowerCase();
            const notes = String(row.notes || '').toLowerCase();
            const medicines = (row.medicines || []).map((m) => String(m.medicine_name || '').toLowerCase()).join(' ');

            return service.includes(q) || notes.includes(q) || medicines.includes(q);
        });
    }, [history, search]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 ml-72 p-6 lg:p-8 overflow-y-auto min-w-0">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/admin/clients/${client.id}`}
                                className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Client
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Animal Profile</h1>
                                <p className="text-sm text-gray-500">View and manage animal information</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={openEdit}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Edit Animal
                        </button>
                    </div>

                    {/* Main Animal Profile Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                        {/* Header Banner */}
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                                        pet.sex === 'male'
                                            ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                                            : 'bg-gradient-to-br from-rose-500 to-pink-600'
                                    }`}
                                >
                                    {String(pet.pet_name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-bold text-white truncate">{pet.pet_name}</h2>
                                        {pet.registration_status === 'exempt' ? (
                                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                                Exempt
                                            </span>
                                        ) : pet.registration_status && (
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                                                    pet.registration_status === 'registered'
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        : pet.registration_status === 'declined'
                                                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                                                          : 'bg-amber-100 text-amber-800 border-amber-200'
                                                }`}
                                            >
                                                {pet.registration_status === 'registered' ? 'Registered' : pet.registration_status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-emerald-100 text-sm mt-1">
                                        {pet.species?.species_name} • {pet.breed?.breed_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Sections */}
                        <div className="p-6">
                            {/* Basic Information */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Owner</div>
                                        <div className="font-semibold text-slate-900">
                                            {client.firstname} {client.lastname}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Species</div>
                                        <div className="font-semibold text-slate-900">{pet.species?.species_name || '-'}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Breed</div>
                                        <div className="font-semibold text-slate-900">{pet.breed?.breed_name || '-'}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sex</div>
                                        <div className="font-semibold text-slate-900 capitalize">{pet.sex || '-'}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Color</div>
                                        <div className="font-semibold text-slate-900">{pet.color || '-'}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Weight</div>
                                        <div className="font-semibold text-slate-900">{pet.weight ? `${pet.weight} kg` : '-'}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 sm:col-span-2">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Birthdate</div>
                                        <div className="font-semibold text-slate-900">{formatDate(pet.birthdate)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Profile Section */}
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900">Medical Profile</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Reproductive Status */}
                                    <div className="bg-rose-50 rounded-xl border border-rose-100 p-4">
                                        <div className="text-xs text-rose-600 uppercase tracking-wide mb-1 font-medium">Reproductive Status</div>
                                        <div className="font-semibold text-slate-900">
                                            {pet.reproductive_status 
                                                ? pet.reproductive_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                : '-'}
                                        </div>
                                        {pet.weeks_months && (
                                            <div className="text-sm text-rose-700 mt-1">{pet.weeks_months}</div>
                                        )}
                                    </div>
                                    {/* Diet */}
                                    <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
                                        <div className="text-xs text-orange-600 uppercase tracking-wide mb-1 font-medium">Diet</div>
                                        <div className="font-semibold text-slate-900">
                                            {pet.diet 
                                                ? pet.diet.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                : '-'}
                                        </div>
                                        {pet.diet_other && (
                                            <div className="text-sm text-orange-700 mt-1">{pet.diet_other}</div>
                                        )}
                                    </div>
                                    {/* Deworming */}
                                    <div className="bg-teal-50 rounded-xl border border-teal-100 p-4">
                                        <div className="text-xs text-teal-600 uppercase tracking-wide mb-1 font-medium">Deworming</div>
                                        <div className="font-semibold text-slate-900">
                                            {pet.dewormed === 'yes' ? 'Yes' : pet.dewormed === 'no' ? 'No' : '-'}
                                        </div>
                                        {pet.dewormed === 'yes' && (
                                            <div className="text-sm text-teal-700 mt-1">
                                                {pet.dewormer_name || 'Unknown dewormer'}
                                                {pet.last_deworming_date && (
                                                    <span className="block text-xs text-teal-600 mt-0.5">
                                                        {formatDate(pet.last_deworming_date)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Rabies Vaccine */}
                                    <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
                                        <div className="text-xs text-violet-600 uppercase tracking-wide mb-1 font-medium">Rabies Vaccine</div>
                                        <div className="font-semibold text-slate-900">
                                            {pet.rabies_vaccine === 'yes' ? 'Yes' : pet.rabies_vaccine === 'no' ? 'No' : '-'}
                                        </div>
                                        {pet.rabies_vaccine === 'yes' && pet.rabies_last_vaccination && (
                                            <div className="text-sm text-violet-700 mt-1">
                                                {formatDate(pet.rabies_last_vaccination)}
                                            </div>
                                        )}
                                    </div>
                                    {/* DHPPL Vaccine */}
                                    <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
                                        <div className="text-xs text-indigo-600 uppercase tracking-wide mb-1 font-medium">DHPPL Vaccine</div>
                                        <div className="font-semibold text-slate-900">
                                            {pet.dhppl_vaccine === 'yes' ? 'Yes' : pet.dhppl_vaccine === 'no' ? 'No' : '-'}
                                        </div>
                                        {pet.dhppl_vaccine === 'yes' && pet.dhppl_last_vaccination && (
                                            <div className="text-sm text-indigo-700 mt-1">
                                                {formatDate(pet.dhppl_last_vaccination)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Other Vaccine */}
                                    {(pet.other_vaccine_name || pet.other_vaccine_last_vaccination) && (
                                        <div className="bg-cyan-50 rounded-xl border border-cyan-100 p-4 sm:col-span-2">
                                            <div className="text-xs text-cyan-600 uppercase tracking-wide mb-1 font-medium">Other Vaccine</div>
                                            <div className="font-semibold text-slate-900">{pet.other_vaccine_name}</div>
                                            {pet.other_vaccine_last_vaccination && (
                                                <div className="text-sm text-cyan-700 mt-1">
                                                    {formatDate(pet.other_vaccine_last_vaccination)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">History Timeline</div>
                                <div className="text-xs text-gray-500">Vaccines, treatments, vitamins, and related medicine requirements</div>
                            </div>

                            <div className="w-full sm:w-72">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by service or medicine..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                />
                            </div>
                        </div>

                        <div className="p-6">
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    No history records found.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHistory.map((row) => (
                                        <div key={row.id} className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                                                            {row.service_type}
                                                        </span>
                                                        {row.administered_by && (
                                                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                                By: {row.administered_by}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 text-sm text-gray-600">
                                                        <span className="font-medium text-gray-900">Used:</span>{' '}
                                                        {formatDateTime(row.created_at) !== '-' ? formatDateTime(row.created_at) : (row.treatment_date || '-')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-5 py-4">
                                                {row.medicines && row.medicines.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                                    <th className="py-2">Medicine</th>
                                                                    <th className="py-2">Qty</th>
                                                                    <th className="py-2">Unit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {row.medicines.map((m) => {
                                                                    const isLiquid = m.unit?.toLowerCase().includes('ml') || m.unit?.toLowerCase() === 'vials';
                                                                    const qty = isLiquid 
                                                                        ? `${parseFloat(m.quantity).toFixed(2)} ml`
                                                                        : `${parseInt(m.quantity)} ${m.unit || 'items'}`;
                                                                    return (
                                                                        <tr key={m.id} className="border-t border-gray-100">
                                                                            <td className="py-2 text-gray-900">{m.medicine_name}</td>
                                                                            <td className="py-2 text-gray-700">{m.quantity ? qty : '-'}</td>
                                                                            <td className="py-2 text-gray-700">{m.unit ?? '-'}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500">No medicines configured for this service.</div>
                                                )}

                                                {row.notes && (
                                                    <div className="mt-4 text-sm text-gray-700">
                                                        <span className="font-medium text-gray-900">Notes:</span> {row.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Animal Modal */}
                    {showEditModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setShowEditModal(false)}>
                            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />

                            <div
                                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 flex items-center justify-between rounded-t-2xl">
                                    <h3 className="text-lg font-semibold text-white">Edit Animal Info</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Pet Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.pet_name}
                                            onChange={(e) => setEditForm((p) => ({ ...p, pet_name: e.target.value }))}
                                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                formErrors.pet_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                        />
                                        {formErrors.pet_name && <p className="mt-1 text-xs text-red-600">{formErrors.pet_name}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                Species <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={editForm.species_id}
                                                onChange={(e) => {
                                                    const nextSpeciesId = e.target.value;
                                                    const breedsForSpecies = nextSpeciesId
                                                        ? breeds.filter((b) => b.species_id === parseInt(nextSpeciesId))
                                                        : [];
                                                    setAvailableBreeds(breedsForSpecies);
                                                    setEditForm((p) => ({ ...p, species_id: nextSpeciesId, breed_id: '' }));
                                                }}
                                                className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                    formErrors.species_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select</option>
                                                {species.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.species_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.species_id && <p className="mt-1 text-xs text-red-600">{formErrors.species_id}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                Breed <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={editForm.breed_id}
                                                onChange={(e) => setEditForm((p) => ({ ...p, breed_id: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                    formErrors.breed_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select</option>
                                                {(availableBreeds.length ? availableBreeds : breeds).map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.breed_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.breed_id && <p className="mt-1 text-xs text-red-600">{formErrors.breed_id}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                Sex <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={editForm.sex}
                                                onChange={(e) => setEditForm((p) => ({ ...p, sex: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                    formErrors.sex ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            {formErrors.sex && <p className="mt-1 text-xs text-red-600">{formErrors.sex}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Birthdate</label>
                                            <input
                                                type="date"
                                                value={editForm.birthdate || ''}
                                                onChange={(e) => setEditForm((p) => ({ ...p, birthdate: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                    formErrors.birthdate ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                            />
                                            {formErrors.birthdate && <p className="mt-1 text-xs text-red-600">{formErrors.birthdate}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                Registration Status
                                            </label>
                                            {pet.registration_status === 'exempt' ? (
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-gray-100 text-gray-600">
                                                    Exempt (No registration required)
                                                </div>
                                            ) : (
                                                <>
                                                    <select
                                                        value={editForm.registration_status}
                                                        onChange={(e) => setEditForm((p) => ({ ...p, registration_status: e.target.value }))}
                                                        className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                            formErrors.registration_status ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="unregistered">Pending</option>
                                                        <option value="registered">Registered</option>
                                                        <option value="declined">Declined</option>
                                                    </select>
                                                    {formErrors.registration_status && (
                                                        <p className="mt-1 text-xs text-red-600">{formErrors.registration_status}</p>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Color</label>
                                            <input
                                                type="text"
                                                value={editForm.color}
                                                onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                    formErrors.color ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                            />
                                            {formErrors.color && <p className="mt-1 text-xs text-red-600">{formErrors.color}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight (kg)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.weight}
                                                onChange={(e) => setEditForm((p) => ({ ...p, weight: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                                    formErrors.weight ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                            />
                                            {formErrors.weight && <p className="mt-1 text-xs text-red-600">{formErrors.weight}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveEdit}
                                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

