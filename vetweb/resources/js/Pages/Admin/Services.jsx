import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Admin/Sidebar';
import axios from 'axios';

// Configure axios with CSRF token
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

export default function Services() {
    const { props } = usePage();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedServiceId, setSelectedServiceId] = useState('all');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const openAddModal = () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        
        setFormData({
            client_id: '',
            pet_id: '',
            service_id: '',
            service_ids: [],
            appointment_date: today,
            appointment_time: time,
            administered_by: '',
            notes: '',
            is_bitten: false,
            bite_details: ''
        });
        setPets([]);
        setSelectedSymptoms([]);
        setAvailableTimeSlots([]);
        setShowAddModal(true);
        
        // Fetch time slots for today
        fetchAvailableTimeSlots(today);
    };
    const [clients, setClients] = useState([]);
    const [pets, setPets] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        pet_id: '',
        service_id: '',
        service_ids: [],
        appointment_date: '',
        appointment_time: '',
        administered_by: '',
        notes: '',
        is_bitten: false,
        bite_details: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const [symptoms, setSymptoms] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

    useEffect(() => {
        fetchServices();
        fetchClients();
        fetchAvailableServices();
        fetchSymptoms();
    }, []);

    useEffect(() => {
        fetchServices();
    }, [startDate, endDate]);

    const fetchAvailableTimeSlots = async (date) => {
        if (!date) {
            setAvailableTimeSlots([]);
            return;
        }
        
        setLoadingTimeSlots(true);
        try {
            const response = await fetch(`/api/mobile/available-time-slots?date=${date}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            
            console.log('=== TIME SLOTS API RESPONSE ===');
            console.log('Date requested:', date);
            console.log('Full response:', data);
            if (data.success && data.slots) {
                console.log('First few slots:', data.slots.slice(0, 5));
                console.log('Available slots:', data.slots.filter(s => s.available).slice(0, 5));
            }
            
            if (data.success) {
                setAvailableTimeSlots(data.slots || []);
            } else {
                console.error('Failed to fetch time slots:', data.error);
                setAvailableTimeSlots([]);
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setAvailableTimeSlots([]);
        } finally {
            setLoadingTimeSlots(false);
        }
    };

    const fetchSymptoms = async () => {
        try {
            const response = await fetch('/api/mobile/symptoms', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            if (data.success) {
                setSymptoms(data.symptoms || []);
            }
        } catch (error) {
            console.error('Error fetching symptoms:', error);
        }
    };

    const isTreatmentService = () => {
        if (!formData.service_ids || formData.service_ids.length === 0) {
            return false;
        }
        return formData.service_ids.some((id) => {
            const service = availableServices.find(s => s.id == id);
            return service?.type_name === 'Treatment';
        });
    };

    const toggleServiceSelection = (serviceId) => {
        setFormData((prev) => {
            const selectedIds = prev.service_ids.includes(serviceId)
                ? prev.service_ids.filter((id) => id !== serviceId)
                : [...prev.service_ids, serviceId];
            return {
                ...prev,
                service_ids: selectedIds,
                service_id: selectedIds.length > 0 ? selectedIds[0] : ''
            };
        });
    };

    const toggleSymptom = (symptom) => {
        setSelectedSymptoms(prev => {
            const exists = prev.find(s => s.id === symptom.id);
            if (exists) {
                return prev.filter(s => s.id !== symptom.id);
            }
            return [...prev, { ...symptom, days_count: '' }];
        });
    };

    const updateSymptomDetails = (symptomId, field, value) => {
        setSelectedSymptoms(prev => prev.map(s => 
            s.id === symptomId ? { ...s, [field]: value } : s
        ));
    };

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const response = await fetch('/api/clients', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const text = await response.text();
            console.log('Raw response:', text.substring(0, 200));
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', text);
                setClients([]);
                return;
            }
            
            console.log('Clients fetched:', data);
            if (data.success) {
                setClients(data.clients || []);
            } else {
                console.error('Failed to fetch clients:', data.error || data);
                alert('Error loading clients: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchClientPets = async (clientId) => {
        try {
            const response = await fetch(`/api/clients/${clientId}/animals`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            if (data.success) {
                setPets(data.animals);
            }
        } catch (error) {
            console.error('Error fetching pets:', error);
        }
    };

    const fetchAvailableServices = async () => {
        try {
            const response = await fetch('/api/services', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse services JSON:', text);
                return;
            }
            if (data.success) {
                setAvailableServices(data.services || []);
            } else {
                console.error('Failed to fetch services:', data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleClientChange = (clientId) => {
        setFormData(prev => ({ ...prev, client_id: clientId, pet_id: '' }));
        if (clientId) {
            fetchClientPets(clientId);
        } else {
            setPets([]);
        }
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, appointment_date: date, appointment_time: '' }));
        fetchAvailableTimeSlots(date);
    };

    const handleTimeSlotSelect = (time) => {
        setFormData(prev => ({ ...prev, appointment_time: time }));
    };

    const handleSubmitWalkIn = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        const payload = {
            client_id: formData.client_id,
            animal_id: formData.pet_id,
            status: 'ongoing',
            symptoms: isTreatmentService() ? selectedSymptoms.map(s => ({
                name: s.name,
                days_count: s.days_count ? parseInt(s.days_count) : null
            })) : [],
            service_ids: formData.service_ids,
            service_id: formData.service_id || (formData.service_ids.length > 0 ? formData.service_ids[0] : null),
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            administered_by: formData.administered_by || '',
            notes: formData.notes || '',
            is_bitten: formData.is_bitten || false,
            bite_details: formData.is_bitten ? formData.bite_details : null
        };
        
        console.log('Submitting payload:', payload);
        
        try {
            const response = await axios.post('/admin/walk-in-appointment', payload);
            
            if (response.data.success) {
                setShowAddModal(false);
                setFormData({
                    client_id: '',
                    pet_id: '',
                    service_id: '',
                    appointment_date: '',
                    appointment_time: '',
                    administered_by: '',
                    notes: '',
                    is_bitten: false,
                    bite_details: ''
                });
                setPets([]);
                setSelectedSymptoms([]);
                fetchServices();
                alert('Walk-in service recorded successfully!');
            } else {
                alert(response.data.error || 'Failed to add walk-in service');
            }
        } catch (error) {
            console.error('Error adding walk-in:', error);
            console.error('Error response:', error.response?.data);
            let errorMsg = 'Failed to add walk-in service';
            
            if (error.response?.status === 422) {
                // Validation errors
                const errors = error.response?.data?.errors;
                console.log('Validation errors:', errors);
                if (errors) {
                    errorMsg = Object.entries(errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n');
                } else {
                    errorMsg = error.response?.data?.message || 'Validation failed';
                }
            } else {
                errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || errorMsg;
            }
            
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const fetchServices = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const url = params.toString() 
                ? `/api/admin/services/completed-appointments?${params.toString()}`
                : '/api/admin/services/completed-appointments';
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('=== SERVICES API RESPONSE ===');
            console.log('Full data:', data);
            if (data.success && data.services && data.services.length > 0) {
                console.log('First service:', data.services[0]);
                if (data.services[0].ongoing_appointments && data.services[0].ongoing_appointments.length > 0) {
                    console.log('First appointment:', data.services[0].ongoing_appointments[0]);
                    console.log('Appointment is_bitten:', data.services[0].ongoing_appointments[0].is_bitten);
                    console.log('Appointment bite_details:', data.services[0].ongoing_appointments[0].bite_details);
                    console.log('Appointment time:', data.services[0].ongoing_appointments[0].appointment_time);
                }
            }
            
            if (data.success) {
                setServices(data.services);
            } else {
                console.error('Failed to fetch services:', data.error);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group appointments by user
    const groupedAppointments = () => {
        const grouped = {};
        completedAppointments.forEach(appointment => {
            const userId = appointment.user?.id;
            if (!grouped[userId]) {
                grouped[userId] = {
                    user: appointment.user,
                    animal: appointment.animal,
                    appointments: []
                };
            }
            grouped[userId].appointments.push(appointment);
        });
        return Object.values(grouped);
    };

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

    const getPetBreed = (appointment) => {
        const breed = appointment.animal?.breed;

        // Handle breed as string (new API format) or object (legacy format)
        if (typeof breed === 'string') {
            return breed || '-';
        }
        
        if (breed && typeof breed === 'object') {
            return breed.breed_name || '-';
        }
        
        return '-';
    };

    const getPetSpecies = (appointment) => {
        const species = appointment.animal?.species;
        if (typeof species === 'string') return species;
        if (species?.species_name) return species.species_name;
        return appointment.animal?.species_name || '-';
    };

    const getAppointmentBiteInfo = (appointment) => {
        return {
            isBitten: appointment.is_bitten ?? false,
            biteDetails: appointment.bite_details,
            symptoms: appointment.symptoms ?? []
        };
    };

    // Calculate total appointments (backend handles date filtering)
    const totalAppointments = services.reduce((sum, service) => 
        sum + (service.ongoing_appointments ? service.ongoing_appointments.length : 0) + 
              (service.completed_appointments ? service.completed_appointments.length : 0), 0);
    const filteredServices = selectedServiceId === 'all'
        ? services
        : services.filter((service) => service.id === selectedServiceId);
    
    // Get all appointments (both completed and ongoing) grouped by appointment ID
    const getAppointmentsByStatus = () => {
        const appointmentMap = {};
        
        filteredServices.forEach((service) => {
            // Process ongoing appointments
            const ongoingAppointments = service.ongoing_appointments || [];
            ongoingAppointments.forEach((appointment) => {
                const key = appointment.id;
                if (!appointmentMap[key]) {
                    appointmentMap[key] = {
                        ...appointment,
                        service_names: [],
                        status: 'ongoing'
                    };
                }
                appointmentMap[key].service_names.push(service.type_name);
            });
            
            // Process completed appointments
            const completedAppointments = service.completed_appointments || [];
            completedAppointments.forEach((appointment) => {
                const key = appointment.id;
                if (!appointmentMap[key]) {
                    appointmentMap[key] = {
                        ...appointment,
                        service_names: [],
                        status: 'completed'
                    };
                }
                appointmentMap[key].service_names.push(service.type_name);
            });
        });
        
        return Object.values(appointmentMap);
    };
    
    const allAppointments = getAppointmentsByStatus();

    const selectedAppointmentInfo = selectedAppointment ? getAppointmentBiteInfo(selectedAppointment) : {
        isBitten: false,
        biteDetails: null,
        symptoms: []
    };

    return (
        <>
            <Head title="Services" />
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                
                <main className="flex-1 ml-72 p-6 lg:p-8 overflow-auto min-w-0">
                    <div className="max-w-full">
                        {/* Header */}
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
                                <p className="text-gray-600">Manage all walk-in appointments (completed and ongoing)</p>
                            </div>
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                Add Walk-in
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 flex flex-wrap gap-4">
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Until Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
                                />
                            </div>
                            <div className="w-full md:w-auto flex items-end">
                                <button
                                    onClick={() => {
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        
                        {/* Service Header Cards */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8">
                            <button
                                onClick={() => setSelectedServiceId('all')}
                                className={`bg-white p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg hover:scale-102 ${
                                    selectedServiceId === 'all'
                                        ? 'border-violet-600 ring-2 ring-violet-200 shadow-lg'
                                        : 'border-gray-200 hover:border-violet-400'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-600 truncate mb-1">All Services</p>
                                        <p className="text-2xl font-bold text-gray-900 leading-tight">{totalAppointments}</p>
                                    </div>
                                </div>
                            </button>

                            {services.map((service) => {
                                // Calculate appointment count (backend handles date filtering)
                                const appointmentCount = (service.ongoing_appointments ? service.ongoing_appointments.length : 0) + 
                                                     (service.completed_appointments ? service.completed_appointments.length : 0);
                                const isActive = selectedServiceId === service.id;

                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => {
                                            setSelectedServiceId(service.id);
                                        }}
                                        className={`bg-white p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg hover:scale-102 ${
                                            isActive
                                                ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                                                : 'border-gray-200 hover:border-blue-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                                                </svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-gray-600 truncate mb-1">{service.type_name}</p>
                                                <p className="text-2xl font-bold text-gray-900 leading-tight">{appointmentCount}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>



                        {/* Appointments Table */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading services...</p>
                                </div>
                            ) : allAppointments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-gray-400 text-lg">No appointments found</div>
                                    <div className="text-gray-500 mt-2">
                                        New walk-in appointments will appear here
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="overflow-x-auto overflow-y-auto max-h-[65vh] [&::-webkit-scrollbar]:hidden"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Animal Name</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Breed</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Species</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bite Incident</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {allAppointments.map((appointment) => (
                                                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-900">
                                                            {appointment.user?.firstname} {appointment.user?.lastname}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-900">{appointment.animal?.pet_name || 'Unknown Pet'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {getPetBreed(appointment)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                                            {getPetSpecies(appointment)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{formatDate(appointment.appointment_date)}</p>
                                                            <p className="text-gray-500">{formatTime(appointment.appointment_time)}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {(() => {
                                                            const biteInfo = getAppointmentBiteInfo(appointment);
                                                            return biteInfo.isBitten ? (
                                                                <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                                                                    <p className="text-xs font-semibold text-red-700">Yes</p>
                                                                    {biteInfo.biteDetails && (
                                                                        <p className="text-xs text-red-600 mt-1">{biteInfo.biteDetails}</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">No</span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            appointment.status === 'completed' 
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {appointment.status === 'completed' ? 'Completed' : 'Ongoing'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedAppointment(appointment)}
                                                            className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Service Details</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{selectedAppointment.status === 'completed' ? 'Completed' : 'Ongoing'} appointment information</p>
                            </div>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${
                                selectedAppointment.status === 'completed'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-yellow-50 border-yellow-200'
                            }`}>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        selectedAppointment.status === 'completed'
                                            ? 'text-green-700'
                                            : 'text-yellow-700'
                                    }`}>Appointment Status</p>
                                    <p className={`text-base font-semibold ${
                                        selectedAppointment.status === 'completed'
                                            ? 'text-green-800'
                                            : 'text-yellow-800'
                                    }`}>{selectedAppointment.status === 'completed' ? 'Completed' : 'Ongoing'}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    selectedAppointment.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {selectedAppointment.service_names?.join(', ') || 'Unknown Service'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Owner</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedAppointment.user?.firstname} {selectedAppointment.user?.lastname}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pet Name</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedAppointment.animal?.pet_name || 'Unknown Pet'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Breed</p>
                                    <p className="text-sm font-semibold text-gray-900">{getPetBreed(selectedAppointment)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Species</p>
                                    <p className="text-sm font-semibold text-gray-900">{getPetSpecies(selectedAppointment)}</p>
                                </div>
                            </div>

                            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                                <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-2">Schedule</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-violet-700 border border-violet-200">
                                        {formatDate(selectedAppointment.appointment_date)}
                                    </span>
                                    <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-violet-700 border border-violet-200">
                                        {formatTime(selectedAppointment.appointment_time)}
                                    </span>
                                </div>
                            </div>

                            {selectedAppointmentInfo.symptoms.length > 0 && (
                                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-3">Symptoms</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAppointmentInfo.symptoms.map((symptom, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
                                                {symptom.name}{symptom.days_count ? ` (${symptom.days_count} days)` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={`mb-6 p-4 rounded-xl ${selectedAppointmentInfo.isBitten ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedAppointmentInfo.isBitten ? 'bg-red-100' : 'bg-gray-200'}`}>
                                        <svg className={`w-4 h-4 ${selectedAppointmentInfo.isBitten ? 'text-red-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${selectedAppointmentInfo.isBitten ? 'text-red-800' : 'text-gray-700'}`}>
                                            Bite Incident
                                        </p>
                                        <p className={`text-sm mt-1 ${selectedAppointmentInfo.isBitten ? 'text-red-600' : 'text-gray-500'}`}>
                                            {selectedAppointmentInfo.isBitten ? selectedAppointmentInfo.biteDetails || 'Bite incident reported' : 'No bite incident reported'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Administered By */}
                            {selectedAppointment.administered_by && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Administered By</p>
                                    <p className="text-sm font-semibold text-blue-900">
                                        {selectedAppointment.administered_by}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Walk-in Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add Walk-in Service</h2>
                                <p className="text-sm text-gray-500">Record a manual/walk-in appointment</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitWalkIn} className="p-6 space-y-5">
                            {/* Client Selection */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Client/Owner *</label>
                                    <button
                                        type="button"
                                        onClick={fetchClients}
                                        disabled={loadingClients}
                                        className="text-xs text-violet-600 hover:text-violet-700 disabled:text-gray-400"
                                    >
                                        {loadingClients ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.client_id}
                                        onChange={(e) => handleClientChange(e.target.value)}
                                        disabled={loadingClients}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-100"
                                    >
                                        <option value="" disabled hidden>Select client</option>
                                        {clients.map((client) => {
                                            const displayName = client.firstname 
                                                ? `${client.firstname} ${client.lastname || ''}` 
                                                : client.name || 'Unknown';
                                            return (
                                                <option key={client.id} value={client.id}>
                                                    {displayName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {loadingClients && (
                                        <div className="absolute right-8 top-2.5">
                                            <div className="animate-spin w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                {clients.length === 0 && !loadingClients && (
                                    <p className="text-xs text-red-500 mt-1">
                                        No clients found. Please add clients in the Clients section.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Pet Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pet *</label>
                                    <select
                                        required
                                        value={formData.pet_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pet_id: e.target.value }))}
                                        disabled={!formData.client_id || pets.length === 0}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-100"
                                    >
                                    <option value="" disabled hidden>Select</option>
                                        {pets.map((pet) => (
                                            <option key={pet.id} value={pet.id}>
                                                {pet.pet_name} ({pet.species?.species_name || 'Unknown species'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Service Selection */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Services *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {availableServices.map((service) => {
                                        const isSelected = formData.service_ids.includes(service.id);
                                        return (
                                            <label key={service.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                                                    : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleServiceSelection(service.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                />
                                                <span className="text-sm font-medium text-gray-900">{service.type_name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {formData.service_ids.length === 0 && (
                                    <p className="text-xs text-red-500 mt-3">Please select at least one service.</p>
                                )}
                            </div>

                            {/* Complaints/Symptoms - Only show for Treatment service */}
                            {isTreatmentService() && (
                                <div className="border border-violet-200 rounded-xl p-4 bg-violet-50">
                                    <label className="block text-sm font-medium text-violet-900 mb-3">
                                        Complaints/Symptoms (Treatment Only)
                                    </label>

                                    {symptoms.length === 0 ? (
                                        <p className="text-sm text-violet-600">Loading symptoms...</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {symptoms.map((symptom) => {
                                                const isSelected = selectedSymptoms.find(s => s.id === symptom.id);
                                                return (
                                                    <div key={symptom.id} className="bg-white rounded-lg p-3 border border-violet-100">
                                                        <label className="flex items-start gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!isSelected}
                                                                onChange={() => toggleSymptom(symptom)}
                                                                className="mt-1 w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                                                            />
                                                            <div className="flex-1">
                                                                <span className="font-medium text-gray-900 text-sm">{symptom.name}</span>
                                                                {isSelected && (
                                                                    <div className="mt-2">
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Days"
                                                                            value={isSelected.days_count || ''}
                                                                            onChange={(e) => updateSymptomDetails(symptom.id, 'days_count', e.target.value)}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-violet-500"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {selectedSymptoms.length > 0 && (
                                        <p className="text-xs text-violet-600 mt-3">
                                            {selectedSymptoms.length} symptom(s) selected
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.appointment_date}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                                    {!formData.appointment_date ? (
                                        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
                                            Select a date first
                                        </div>
                                    ) : loadingTimeSlots ? (
                                        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 flex items-center">
                                            <div className="animate-spin w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full mr-2"></div>
                                            Loading time slots...
                                        </div>
                                    ) : availableTimeSlots.length === 0 ? (
                                        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
                                            No available time slots
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={formData.appointment_time}
                                            onChange={(e) => handleTimeSlotSelect(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                        >
                                            <option value="" disabled hidden>Select time slot</option>
                                            {availableTimeSlots.map((slot) => (
                                                <option 
                                                    key={slot.time} 
                                                    value={slot.time}
                                                    disabled={!slot.available}
                                                    style={!slot.available ? { color: '#9CA3AF' } : {}}
                                                >
                                                    {slot.label} {!slot.available && '(Booked)'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-red-900">Bite History</label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_bitten}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                is_bitten: e.target.checked,
                                                bite_details: e.target.checked ? prev.bite_details : ''
                                            }))}
                                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        Bite incident
                                    </label>
                                </div>
                                {formData.is_bitten ? (
                                    <textarea
                                        value={formData.bite_details}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bite_details: e.target.value }))}
                                        placeholder="Describe the bite incident..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                ) : (
                                    <p className="text-sm text-red-700">Toggle this on if the walk-in appointment involves a bite incident.</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional notes..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="sticky bottom-0 bg-white/95 backdrop-blur pt-4 pb-1 border-t border-gray-100 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting || formData.service_ids.length === 0 || !formData.appointment_time}
                                    className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Walk-in Service'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
