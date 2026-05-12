import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/Components/Admin/Sidebar';
import axios from 'axios';
import Holidays from 'date-holidays';

export default function Dashboard({ stats, registrationFee: initialFee }) {
    const { flash } = usePage().props;
    const [flashMessage, setFlashMessage] = useState(null);
    const [isEditingFee, setIsEditingFee] = useState(false);

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
    const { data, setData, post, processing, errors } = useForm({
        amount: initialFee || '',
    });

    // Vet Availability Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        reason: '',
        type: 'full_day',
    });

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const closedDays = [0, 5, 6]; // Sunday, Friday, Saturday

    // Initialize Philippine holidays (auto-updates yearly)
    const hd = new Holidays('PH');

    const isHoliday = (dateStr) => {
        return hd.isHoliday(dateStr);
    };

    useEffect(() => {
        fetchUnavailableDates();
    }, [currentMonth]);

    const fetchUnavailableDates = async () => {
        setLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const response = await axios.get(`/api/admin/vet-unavailable-dates?year=${year}&month=${month}`);
            if (response.data.success) {
                setUnavailableDates(response.data.unavailable_dates);
            }
        } catch (error) {
            console.error('Failed to fetch unavailable dates:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const dayOfWeek = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
            const isClosedDay = closedDays.includes(dayOfWeek);
            const isHolidayDate = isHoliday(dateStr);
            
            // Check if date is in unavailable_dates array
            const unavailable = unavailableDates.find(d => d.date === dateStr);
            
            days.push({
                day: i,
                date: dateStr,
                isToday,
                isClosedDay,
                isHoliday: isHolidayDate,
                unavailable,
            });
        }

        return days;
    };

    const handleDateClick = (date) => {
        if (date.isClosedDay || date.isHoliday) {
            // Closed days and holidays are always unavailable, can't be changed
            return;
        }
        
        if (date.unavailable) {
            // Remove unavailability
            if (confirm(`Make ${date.date} available again?`)) {
                removeUnavailableDate(date.date);
            }
        } else {
            // Add unavailability
            setSelectedDate(date.date);
            setModalData({ reason: '', type: 'full_day' });
            setShowModal(true);
        }
    };

    const handleAddUnavailable = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/vet-unavailable-dates', {
                unavailable_date: selectedDate,
                reason: modalData.reason,
                type: modalData.type,
            });
            setShowModal(false);
            setSelectedDate(null);
            fetchUnavailableDates();
        } catch (error) {
            console.error('Failed to add unavailable date:', error);
            alert('Failed to mark date as unavailable');
        }
    };

    const removeUnavailableDate = async (dateStr) => {
        try {
            await axios.delete(`/api/admin/vet-unavailable-dates/${dateStr}`);
            fetchUnavailableDates();
        } catch (error) {
            console.error('Failed to remove unavailable date:', error);
            alert('Failed to remove unavailable date');
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-72">
                {/* Top Header */}
                <header className="bg-white sticky top-0 z-30 px-8 py-4 shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {/* Search */}
                        <div className="flex items-center flex-1 max-w-md">
                            <div className="relative w-full">
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <button className="relative p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                                </svg>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <img
                                    src="https://ui-avatars.com/api/?name=Admin+User&background=8b5cf6&color=fff"
                                    alt="Admin"
                                    className="w-9 h-9 rounded-full"
                                />
                                <div className="text-sm">
                                    <p className="font-semibold text-gray-900">Admin User</p>
                                    <p className="text-gray-400 text-xs">Data Manager</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="p-8">
                    {/* Flash Message */}
                    {flashMessage && (
                        <div className={`mb-6 px-4 py-3 rounded-lg ${
                            flashMessage.type === 'success'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {flashMessage.text}
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats?.totalClients?.toLocaleString() || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Clients</p>
                                </div>
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats?.totalPets?.toLocaleString() || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Pets</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats?.registeredPets || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Registered Pets</p>
                                </div>
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">₱{stats?.totalRevenue?.toLocaleString() || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
                                </div>
                                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vet Availability Calendar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Calendar Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Vet Availability</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                                        </svg>
                                    </button>
                                    <span className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </span>
                                    <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Week Day Headers */}
                            <div className="grid grid-cols-7 mb-2">
                                {weekDays.map((day, index) => (
                                    <div key={day} className={`text-center py-2 ${closedDays.includes(index) ? 'text-red-500' : ''}`}>
                                        <span className="text-sm font-medium">{day}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {generateCalendarDays().map((date, index) => (
                                    <div key={index} className="aspect-square">
                                        {date ? (
                                            <button
                                                onClick={() => handleDateClick(date)}
                                                disabled={loading || date.isClosedDay || date.isHoliday}
                                                className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all ${
                                                    date.isClosedDay
                                                        ? 'bg-red-100 text-red-700 cursor-not-allowed'
                                                        : date.isHoliday
                                                        ? 'bg-rose-100 text-rose-700 cursor-not-allowed'
                                                        : date.unavailable
                                                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-2 border-amber-300'
                                                        : date.isToday
                                                        ? 'bg-violet-100 hover:bg-violet-200 text-violet-700 border-2 border-violet-300'
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {date.day}
                                                {date.isClosedDay && <span className="text-[10px] mt-0.5">Closed</span>}
                                                {date.isHoliday && <span className="text-[10px] mt-0.5">Holiday</span>}
                                                {date.unavailable && <span className="text-[10px] mt-0.5">Off</span>}
                                            </button>
                                        ) : (
                                            <div className="w-full h-full" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                                    <span className="text-gray-600">Fri, Sat, Sun (Closed)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
                                    <span className="text-gray-600">Holiday</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                                    <span className="text-gray-600">Unavailable</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-violet-100 border border-violet-300" />
                                    <span className="text-gray-600">Today</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
                                    <span className="text-gray-600">Available</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-3">
                                Click on any date (except closed days & holidays) to mark as unavailable. Click again to make available.
                            </p>
                        </div>

                        {/* Unavailable Dates List */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Unavailable Dates</h3>
                            {unavailableDates.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <p className="text-gray-500">No unavailable dates set.</p>
                                    <p className="text-sm text-gray-400 mt-1">Fri, Sat, Sun and holidays are automatically closed.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {unavailableDates.map((date) => (
                                        <div key={date.date} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-gray-900">{date.date}</p>
                                                <p className="text-sm text-gray-500">
                                                    {date.type === 'full_day' ? 'Full Day' : 
                                                     date.type === 'morning' ? 'Morning' : 'Afternoon'}
                                                    {date.reason && ` • ${date.reason}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeUnavailableDate(date.date)}
                                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                title="Make available"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Unavailable Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Mark as Unavailable</h3>
                                <p className="text-sm text-gray-500 mb-4">{selectedDate}</p>

                                <form onSubmit={handleAddUnavailable} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={modalData.type}
                                            onChange={(e) => setModalData({ ...modalData, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            <option value="full_day">Full Day</option>
                                            <option value="morning">Morning Only</option>
                                            <option value="afternoon">Afternoon Only</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                                        <input
                                            type="text"
                                            value={modalData.reason}
                                            onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                                            placeholder="e.g., Vacation, Training"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : 'Confirm'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
