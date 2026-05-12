import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Sidebar from '@/Components/Budget/BudgetSidebar';
import axios from 'axios';

// Configure axios with CSRF token
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

export default function Treatments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [petWeight, setPetWeight] = useState('');
    const [processing, setProcessing] = useState(false);
    const [calculatedDosages, setCalculatedDosages] = useState({});
    const [administeredBy, setAdministeredBy] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            let timeToFormat;
            
            // Handle ISO datetime format (e.g., "2026-05-12T05:00:00.000000Z")
            if (timeString.includes('T') && timeString.includes('Z')) {
                timeToFormat = new Date(timeString);
            } 
            // Handle time only format (e.g., "14:30:00" or "14:30")
            else {
                const timeOnly = timeString.split(':').slice(0, 2).join(':');
                timeToFormat = new Date(`2000-01-01T${timeOnly}`);
            }
            
            if (isNaN(timeToFormat.getTime())) return 'N/A';
            
            return timeToFormat.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    useEffect(() => {
        fetchProcessingAppointments();
    }, []);

    const fetchProcessingAppointments = async () => {
        try {
            const response = await fetch('/api/budget/treatments/processing');
            const data = await response.json();
            
            if (data.success) {
                setAppointments(data.appointments);
            } else {
                setMessage({ type: 'error', text: 'Failed to fetch processing appointments' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to fetch processing appointments. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/budget/inventory');
            const data = await response.json();
            
            if (data.success) {
                setInventory(data.inventory);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        }
    };

    const openDetails = (appointment) => {
        setSelectedAppointment(appointment);
        setPetWeight(String(appointment.animal?.weight || ''));
        setSelectedItems([]);
        fetchInventory();
        setShowDetails(true);
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedAppointment(null);
        setSelectedItems([]);
        setPetWeight('');
        setAdministeredBy('');
    };

    const toggleItemSelection = (item) => {
        updateItemSelection(item);
    };

    const updatePetWeight = async () => {
        if (!selectedAppointment?.animal?.id || !petWeight) return;
        
        try {
            await axios.put(`/api/animals/${selectedAppointment.animal.id}`, {
                weight: parseFloat(petWeight)
            });
            
            setMessage({ type: 'success', text: 'Pet weight updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update pet weight' });
        }
    };

    const calculateVialDosage = (weight) => {
        if (!weight || weight === '') return 0;
        // 1kg = 0.10ml formula
        return parseFloat(String(weight)) * 0.10;
    };

    const updateItemSelection = (item) => {
        setSelectedItems(prev => {
            const isSelected = prev.find(i => i.id === item.id);
            
            if (isSelected) {
                // Remove item and its dosage calculation
                const newItems = prev.filter(i => i.id !== item.id);
                const newDosages = { ...calculatedDosages };
                delete newDosages[item.id];
                setCalculatedDosages(newDosages);
                return newItems;
            } else {
                // Add item with quantity 1
                const newItem = { ...item, quantity: 1 };
                
                // Calculate dosage if it's a vial and pet weight is available
                if (item.is_vial && petWeight) {
                    const dosage = calculateVialDosage(petWeight);
                    setCalculatedDosages(prev => ({
                        ...prev,
                        [item.id]: dosage
                    }));
                }
                
                return [...prev, newItem];
            }
        });
    };

    const updateItemQuantity = (itemId, quantity) => {
        setSelectedItems(prev => 
            prev.map(item => 
                item.id === itemId ? { ...item, quantity: parseInt(quantity) || 1 } : item
            )
        );
    };

    const completeTreatment = async () => {
        if (!selectedAppointment) return;
        const hasVialItem = selectedItems.some(item => item.is_vial);
        if (hasVialItem && (!petWeight || Number(petWeight) <= 0)) {
            setMessage({ type: 'error', text: 'Pet weight is required for vial dosage calculation.' });
            return;
        }
        
        setProcessing(true);
        try {
            const payload = {
                pet_weight: petWeight ? parseFloat(petWeight) : null,
                administered_by: administeredBy,
                selected_items: selectedItems.map((item) => ({
                    inventory_id: item.id,
                    quantity: item.is_vial
                        ? Number(calculateVialDosage(petWeight).toFixed(2))
                        : Number(item.quantity || 1),
                })),
            };

            await axios.post(`/api/budget/treatments/${selectedAppointment.id}/complete`, payload);
            
            setMessage({ type: 'success', text: 'Treatment completed successfully!' });
            closeDetails();
            fetchProcessingAppointments(); // Refresh the list
            fetchInventory();
        } catch (error) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.error || 'Failed to complete treatment',
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ongoing':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'completed':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            default:
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ongoing':
                return 'Ongoing';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    };

    const updateAppointmentStatus = async (appointmentId, newStatus) => {
        try {
            const response = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: 'Appointment status updated successfully!' });
                fetchProcessingAppointments(); // Refresh the list
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update appointment status' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update appointment status. Please try again.' });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 ml-72 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-gray-500">Loading treatments...</div>
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
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/budget/dashboard" className="hover:text-violet-600">Dashboard</Link>
                            <span>/</span>
                            <span className="text-gray-900">Treatments</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Active Treatments</h1>
                        <p className="text-gray-500 mt-1">View and manage appointments currently in progress</p>
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

                    {/* Treatments List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {appointments.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Treatments</h3>
                                <p className="text-gray-500 mb-6">There are no appointments currently in processing status.</p>
                                <Link
                                    href="/budget/dashboard"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Dashboard
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {appointments.map((appointment) => (
                                            <tr key={appointment.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {appointment.animal?.pet_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {appointment.animal?.breed?.breed_name || 'Unknown breed'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {appointment.user?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {appointment.user?.email || 'No email'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {appointment.treatment_type?.type_name || 'General Check-up'}
                                                    </div>
                                                    {appointment.treatment_types && appointment.treatment_types.length > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            {appointment.treatment_types.map(type => type.type_name).join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(appointment.appointment_date)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatTime(appointment.appointment_time)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                        {getStatusText(appointment.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => openDetails(appointment)}
                                                            className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                            View
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            
            {/* Treatment Details Modal */}
            {showDetails && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Treatment Details</h2>
                                <button
                                    onClick={closeDetails}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Pet Information */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pet Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium text-gray-900">{selectedAppointment.animal?.pet_name || 'Unknown'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500">Breed</p>
                                        <p className="font-medium text-gray-900">{selectedAppointment.animal?.breed?.breed_name || 'Unknown'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500">Species</p>
                                        <p className="font-medium text-gray-900">{selectedAppointment.animal?.species?.species_name || 'Unknown'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500">Weight (kg)</p>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={petWeight}
                                            onChange={(e) => {
                                                setPetWeight(e.target.value);
                                                // Recalculate dosages for vial items when weight changes
                                                const newWeight = e.target.value;
                                                const newDosages = {};
                                                selectedItems.forEach(item => {
                                                    if (item.is_vial && newWeight) {
                                                        newDosages[item.id] = calculateVialDosage(newWeight);
                                                    }
                                                });
                                                setCalculatedDosages(newDosages);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                            placeholder="Enter weight"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Administered By */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Administered By</h3>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-2">Veterinarian / Staff Name</p>
                                    <input
                                        type="text"
                                        value={administeredBy}
                                        onChange={(e) => setAdministeredBy(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                        placeholder="Enter name of person who administered treatment"
                                    />
                                </div>
                            </div>

                            {/* Complaint Information */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    {selectedAppointment.complaint?.symptoms?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-amber-800 mb-2">Symptoms:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAppointment.complaint.symptoms.map((symptom, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
                                                        {symptom.name} ({symptom.days_count} days)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedAppointment.complaint?.is_bitten && (
                                        <div className="text-amber-800">
                                            <p className="font-medium">Bite Incident:</p>
                                            <p className="text-sm">{selectedAppointment.complaint.bite_details}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Service Information */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Type</h3>
                                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                                    <p className="font-medium text-violet-900">
                                        {selectedAppointment.treatment_type?.type_name || 'General Check-up'}
                                    </p>
                                    {selectedAppointment.treatment_types && selectedAppointment.treatment_types.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-violet-700">Additional services: {selectedAppointment.treatment_types.map(type => type.type_name).join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Item Selection */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Items to Use</h3>
                                
                                {/* Vial Dosage Calculator */}
                                {selectedItems.some(item => item.is_vial) && petWeight && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-3">Vial Dosage Calculator</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-blue-900">Pet Weight (kg)</label>
                                                <div className="px-3 py-2 bg-white border border-blue-300 rounded-lg">
                                                    {petWeight} kg
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-blue-900">Dosage Formula</label>
                                                <div className="px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                                                    1kg = 0.10ml
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-blue-900">Total Dosage (ml)</label>
                                                <div className="px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                                                    {calculateVialDosage(petWeight).toFixed(2)} ml
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                                    {inventory.map((item) => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(selectedItems.find(i => i.id === item.id))}
                                                        onChange={() => toggleItemSelection(item)}
                                                        className="mr-2 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-900">{item.medicine?.name}</span>
                                                </label>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.is_box ? (
                                                    <div>
                                                        <p className="font-medium">{item.quantity} boxes ({item.items_per_box} items each)</p>
                                                        <p>Total: {item.total_items} items available</p>
                                                    </div>
                                                ) : (
                                                    <p>Stock: {item.quantity} {item.unit?.name}</p>
                                                )}
                                                {item.is_vial && <p className="text-blue-600">Vial - Dosage calculated</p>}
                                            </div>
                                            {selectedItems.find(i => i.id === item.id) && (
                                                <div className="mt-2">
                                                    {item.is_vial && petWeight ? (
                                                        <div className="bg-blue-100 border border-blue-300 rounded p-2">
                                                            <p className="text-xs font-medium text-blue-800">
                                                                Calculated Dosage: {calculatedDosages[item.id]?.toFixed(2) || '0.00'} ml
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <label className="text-xs text-gray-600">
                                                                Quantity ({item.is_box ? 'items' : item.unit?.name}):
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.is_box ? item.total_items : item.quantity}
                                                                value={selectedItems.find(i => i.id === item.id)?.quantity || 1}
                                                                onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500"
                                                            />
                                                            {item.is_box && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Max: {item.total_items} items
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Items Summary */}
                            {selectedItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Items</h3>
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        {selectedItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-green-100 last:border-0">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900">{item.medicine?.name}</span>
                                                    {item.is_vial && calculatedDosages[item.id] && (
                                                        <p className="text-xs text-blue-600">
                                                            Dosage: {calculatedDosages[item.id].toFixed(2)} ml
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {item.is_vial && calculatedDosages[item.id] 
                                                        ? `${calculatedDosages[item.id].toFixed(2)} ml`
                                                        : `${item.quantity} ${item.unit?.name}`
                                                    }
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={completeTreatment}
                                    disabled={processing}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Complete Treatment'}
                                </button>
                                <button
                                    onClick={closeDetails}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
    );
}
