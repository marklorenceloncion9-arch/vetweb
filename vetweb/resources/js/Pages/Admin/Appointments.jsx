import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';
import axios from 'axios';

// Configure axios with CSRF token
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [flashMessage, setFlashMessage] = useState(null);

    const monthOptions = [
        { value: 'all', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    // Show flash message helper
    const showFlash = (type, text) => {
        setFlashMessage({ type, text });
        setTimeout(() => setFlashMessage(null), 3000);
    };

    useEffect(() => {
        fetchAppointments();
        fetchAllServices();
    }, [filter]);

    const fetchAllServices = async () => {
        try {
            const response = await axios.get('/api/admin/services-list');
            if (response.data.success) {
                setAllServices(response.data.services);
            }
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Always fetch all appointments, filter client-side
            const response = await axios.get('/api/admin/all-appointments');
            if (response.data.success) {
                setAppointments(response.data.appointments);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            showFlash('error', 'Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    // Filter appointments based on selected filter, service, and month
    const filteredAppointments = appointments.filter(a => {
        const statusMatch = filter === 'all' || a.status === filter;
        const serviceMatch = serviceFilter === 'all' || 
            (a.services && a.services.includes(serviceFilter)) ||
            a.service === serviceFilter;
        const appointmentMonth = a.date ? parseInt(a.date.split('-')[1], 10) : null;
        const monthMatch = monthFilter === 'all' || appointmentMonth === parseInt(monthFilter, 10);
        return statusMatch && serviceMatch && monthMatch;
    });

    const handleApprove = async (id) => {
        setProcessing(true);
        try {
            const response = await axios.put(`/api/admin/appointments/${id}/status`, {
                status: 'approved',
                admin_notes: adminNotes,
            });
            if (response.data.success) {
                // Update the appointment status in state instead of removing it
                setAppointments(appointments.map(a => 
                    a.id === id ? { ...a, status: 'approved' } : a
                ));
                // Update selected appointment if it's the same one
                if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: 'approved' });
                }
                showFlash('success', 'Appointment approved successfully!');
                closeModal();
            }
        } catch (error) {
            console.error('Failed to approve appointment:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to approve appointment';
            showFlash('error', errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        setProcessing(true);
        try {
            const response = await axios.patch(`/api/admin/appointments/${id}/cancel`);
            if (response.data.success) {
                // Update the appointment status in state
                setAppointments(appointments.map(a => 
                    a.id === id ? { ...a, status: 'cancelled' } : a
                ));
                // Update selected appointment if it's the same one
                if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: 'cancelled' });
                }
                showFlash('success', 'Appointment cancelled successfully!');
                closeModal();
            } else {
                showFlash('error', response.data.error || 'Failed to cancel appointment');
            }
        } catch (error) {
            console.error('Cancel appointment error:', error);
            showFlash('error', 'Failed to cancel appointment');
        } finally {
            setProcessing(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        setProcessing(true);
        try {
            const response = await axios.put(`/api/admin/appointments/${id}/status`, {
                status: newStatus
            });
            if (response.data.success) {
                // Update the appointment status in state
                setAppointments(appointments.map(a => 
                    a.id === id ? { ...a, status: newStatus } : a
                ));
                // Update selected appointment if it's the same one
                if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: newStatus });
                }
                showFlash('success', `Appointment status updated to ${newStatus}!`);
                
                // If changed to processing, show special message
                if (newStatus === 'processing') {
                    showFlash('info', 'Appointment is now in processing and will appear in Budget Officer treatments.');
                }
            } else {
                showFlash('error', response.data.error || 'Failed to update appointment status');
            }
        } catch (error) {
            console.error('Status update error:', error);
            showFlash('error', 'Failed to update appointment status');
        } finally {
            setProcessing(false);
        }
    };

    
    const openModal = (appointment) => {
        setSelectedAppointment(appointment);
        setAdminNotes('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAppointment(null);
        setAdminNotes('');
    };

    const formatDate = (dateStr) => {
        // Parse date components to avoid timezone issues
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-gray-500 mt-1">Review and manage client appointments</p>
                    </div>

                    {/* Service + Month Filters */}
                    <div className="mb-6 flex flex-wrap items-end gap-4">
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Service</label>
                            <select
                                value={serviceFilter}
                                onChange={(e) => setServiceFilter(e.target.value)}
                                style={serviceFilter === 'all' ? { color: '#9CA3AF' } : { color: '#111827' }}
                                className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
                            >
                                <option value="all">All Services</option>
                                {allServices.map((service) => (
                                    <option key={service} value={service}>
                                        {service}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
                            <select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                style={monthFilter === 'all' ? { color: '#9CA3AF' } : { color: '#111827' }}
                                className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
                            >
                                {monthOptions.map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {flashMessage && (
                        <div className={`mb-6 px-4 py-3 rounded-lg ${
                            flashMessage.type === 'success'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {flashMessage.text}
                        </div>
                    )}

                    {/* Stats - Click to filter */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <button
                            onClick={() => setFilter('all')}
                            className={`bg-white p-6 rounded-2xl border-2 text-left transition-all ${
                                filter === 'all' 
                                    ? 'border-violet-600 ring-2 ring-violet-200' 
                                    : 'border-gray-200 hover:border-violet-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">All</p>
                                    <p className="text-xl font-bold text-gray-900">{filteredAppointments.length}</p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`bg-white p-6 rounded-2xl border-2 text-left transition-all ${
                                filter === 'pending' 
                                    ? 'border-yellow-500 ring-2 ring-yellow-200' 
                                    : 'border-gray-200 hover:border-yellow-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pending</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {filteredAppointments.filter(a => a.status === 'pending').length}
                                    </p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`bg-white p-6 rounded-2xl border-2 text-left transition-all ${
                                filter === 'approved' 
                                    ? 'border-green-500 ring-2 ring-green-200' 
                                    : 'border-gray-200 hover:border-green-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Approved</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {filteredAppointments.filter(a => a.status === 'approved').length}
                                    </p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`bg-white p-6 rounded-2xl border-2 text-left transition-all ${
                                filter === 'completed' 
                                    ? 'border-indigo-500 ring-2 ring-indigo-200' 
                                    : 'border-gray-200 hover:border-indigo-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Completed</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {filteredAppointments.filter(a => a.status === 'completed').length}
                                    </p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter('cancelled')}
                            className={`bg-white p-6 rounded-2xl border-2 text-left transition-all ${
                                filter === 'cancelled' 
                                    ? 'border-gray-500 ring-2 ring-gray-200' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Cancelled</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {filteredAppointments.filter(a => a.status === 'cancelled').length}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Appointments List */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading appointments...</p>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <p className="text-gray-900 font-medium mb-1">No {filter} appointments found</p>
                                <p className="text-gray-500">
                                    {filter === 'pending' ? 'No pending appointments to review' : `No ${filter} appointments in the system`}
                                </p>
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
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Administered By</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredAppointments.map((appointment) => (
                                            <tr 
                                                key={appointment.id} 
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center mr-3">
                                                            <span className="text-violet-600 font-medium text-sm">
                                                                {appointment.user?.name?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{appointment.user?.name}</p>
                                                            <p className="text-sm text-gray-500">{appointment.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{appointment.pet?.name}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-600">{appointment.pet?.breed || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                                        {appointment.pet?.species}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-700">{appointment.administered_by || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-900">{formatDate(appointment.date)}</p>
                                                        <p className="text-gray-500">{formatTime(appointment.time)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {appointment.status === 'approved' ? (
                                                        <select
                                                            value={appointment.status || ''}
                                                            onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                                                            className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                                                        >
                                                            <option value="approved">Approved</option>
                                                            <option value="ongoing">Ongoing</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            appointment.status === 'pending' 
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : appointment.status === 'cancelled'
                                                                    ? 'bg-gray-100 text-gray-700'
                                                                    : appointment.status === 'ongoing'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : appointment.status === 'completed'
                                                                            ? 'bg-indigo-100 text-indigo-700'
                                                                            : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {appointment.status === 'pending' ? 'Pending' : 
                                                             appointment.status === 'cancelled' ? 'Cancelled' :
                                                             appointment.status === 'ongoing' ? 'Ongoing' :
                                                             appointment.status === 'completed' ? 'Completed' :
                                                             appointment.status === 'approved' ? 'Approved' : appointment.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => openModal(appointment)}
                                                        className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                        </svg>
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

            {/* View Details Modal */}
            {showModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Sticky Header */}
                        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="px-6 pb-6">
                            
                            {/* Status Banner */}
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                                selectedAppointment.status === 'pending' 
                                    ? 'bg-yellow-50 border border-yellow-200' 
                                    : selectedAppointment.status === 'approved'
                                        ? 'bg-green-50 border border-green-200'
                                        : selectedAppointment.status === 'cancelled'
                                            ? 'bg-gray-50 border border-gray-200'
                                            : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    selectedAppointment.status === 'pending' 
                                        ? 'bg-yellow-100' 
                                        : selectedAppointment.status === 'approved'
                                            ? 'bg-green-100'
                                            : selectedAppointment.status === 'cancelled'
                                                ? 'bg-gray-100'
                                                : 'bg-yellow-100'
                                }`}>
                                    <svg className={`w-5 h-5 ${
                                        selectedAppointment.status === 'pending' 
                                            ? 'text-yellow-600' 
                                            : selectedAppointment.status === 'approved'
                                                ? 'text-green-600'
                                                : selectedAppointment.status === 'cancelled'
                                                    ? 'text-gray-600'
                                                    : 'text-yellow-600'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {selectedAppointment.status === 'pending' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>}
                                        {selectedAppointment.status === 'approved' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
                                        {selectedAppointment.status === 'cancelled' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>}
                                        {(!selectedAppointment.status || selectedAppointment.status === 'pending') && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>}
                                    </svg>
                                </div>
                                <div>
                                    <p className={`font-semibold ${
                                        selectedAppointment.status === 'pending' 
                                            ? 'text-yellow-800' 
                                            : selectedAppointment.status === 'approved'
                                                ? 'text-green-800'
                                                : selectedAppointment.status === 'cancelled'
                                                    ? 'text-gray-800'
                                                    : 'text-yellow-800'
                                    }`}>
                                        {(selectedAppointment.status || 'pending').charAt(0).toUpperCase() + (selectedAppointment.status || 'pending').slice(1)}
                                    </p>
                                </div>
                            </div>

                            {/* Client & Pet Info - Side by Side */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">{selectedAppointment.user?.name}</p>
                                    <p className="text-sm text-gray-500">{selectedAppointment.user?.email}</p>
                                </div>
                                
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">{selectedAppointment.pet?.name}</p>
                                    <p className="text-sm text-gray-500">{selectedAppointment.pet?.breed} • {selectedAppointment.pet?.species}</p>
                                </div>
                            </div>

                            {/* Services */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                                        </svg>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Services</p>
                                </div>
                                {selectedAppointment.services && selectedAppointment.services.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAppointment.services.map((service, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                        {selectedAppointment.service}
                                    </span>
                                )}
                            </div>

                            {/* Date & Time */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-green-50 rounded-lg px-4 py-2">
                                        <p className="text-sm text-green-700 font-medium">{formatDate(selectedAppointment.date)}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg px-4 py-2">
                                        <p className="text-sm text-green-700 font-medium">{formatTime(selectedAppointment.time)}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedAppointment.administered_by && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Administered By</p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-lg px-4 py-3">
                                        <p className="text-sm font-semibold text-indigo-800">{selectedAppointment.administered_by}</p>
                                    </div>
                                </div>
                            )}

                            {/* Symptoms */}
                            {selectedAppointment.complaint?.symptoms?.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAppointment.complaint.symptoms.map((symptom, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium"
                                            >
                                                {symptom.name} <span className="text-violet-500">({symptom.days_count} days)</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bite Case Alert */}
                            <div className={`mb-6 p-4 rounded-xl ${selectedAppointment.complaint?.is_bitten ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedAppointment.complaint?.is_bitten ? 'bg-red-100' : 'bg-gray-200'}`}>
                                        <svg className={`w-4 h-4 ${selectedAppointment.complaint?.is_bitten ? 'text-red-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${selectedAppointment.complaint?.is_bitten ? 'text-red-800' : 'text-gray-700'}`}>
                                            Bite Incident
                                        </p>
                                        <p className={`text-sm mt-1 ${selectedAppointment.complaint?.is_bitten ? 'text-red-600' : 'text-gray-500'}`}>
                                            {selectedAppointment.complaint?.is_bitten ? selectedAppointment.complaint.bite_details : 'No bite incident reported'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Notes - Only for pending */}
                            {selectedAppointment.status === 'pending' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Notes <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                                        rows="3"
                                        placeholder="Add notes about this appointment..."
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedAppointment.status === 'pending' && (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleApprove(selectedAppointment.id)}
                                        disabled={processing}
                                        className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                        </svg>
                                        {processing ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleCancel(selectedAppointment.id)}
                                        disabled={processing}
                                        className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                        {processing ? 'Processing...' : 'Cancel Appointment'}
                                    </button>
                                </div>
                            )}
                            
                            {selectedAppointment.status === 'approved' && (
                                <div className="space-y-3">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Update Status
                                        </label>
                                        <select
                                            value={selectedAppointment.status}
                                            onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                        >
                                            <option value="approved">Approved</option>
                                            <option value="processing">Processing</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                            
                            {selectedAppointment.status !== 'pending' && selectedAppointment.status !== 'approved' && (
                                <button
                                    onClick={closeModal}
                                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
