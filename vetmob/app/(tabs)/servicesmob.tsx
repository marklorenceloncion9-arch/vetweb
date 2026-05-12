import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/auth-context';
import { showToast } from '@/components/Toast';
import Holidays from 'date-holidays';

interface Appointment {
  id: number;
  petName: string;
  service: string;
  services: string[];
  date: string;
  time: string;
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled' | 'declined';
  notes?: string;
  symptoms?: { name: string; days_count?: number; notes?: string }[];
  isBitten?: boolean;
  biteDetails?: string;
  created_at?: string;
}

interface TreatmentType {
  id: number;
  type_name: string;
  description: string | null;
}

interface Animal {
  id: number;
  pet_name: string;
  species_name?: string;
  breed_name?: string;
  registration_status?: string;
}

interface Symptom {
  id: number;
  name: string;
}

interface SelectedSymptom {
  symptom_id: number | string;
  days_count?: number;
  notes?: string;
}

interface TimeSlot {
  time: string;
  label: string;
  period: 'morning' | 'afternoon';
  available: boolean;
}

export default function ServicesScreen() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Pet/Date/Time, Step 2: Treatment, Step 3: Service
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    petId: 0,
    petName: '',
    service: '',
    serviceType: '', // 'treatment' or 'preventive'
    date: '',
    time: '',
    notes: '',
    isBitten: false,
    biteDetails: '',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [hasTreatmentFromStep2, setHasTreatmentFromStep2] = useState(false);

  // Service options for Step 3
  const serviceOptions = [
    { id: 'deworming', name: 'Deworming', icon: 'pets' },
    { id: 'vaccination', name: 'Vaccination', icon: 'vaccines' },
    { id: 'vitamin', name: 'Vitamin Supplements', icon: 'medication' },
    { id: 'spay', name: 'Spay', icon: 'medical-services' },
    { id: 'castration', name: 'Castration', icon: 'medical-services' },
  ];

  // Helper to get first treatment type name
  const getFirstTreatmentType = () => {
    return treatmentTypes.length > 0 ? treatmentTypes[0].type_name : '';
  };
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Format as YYYY-MM-DD in local timezone
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Fetch symptoms for complaint
  const fetchSymptoms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/symptoms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSymptoms(response.data.symptoms);
      }
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
    }
  };

  // Fetch appointments, treatment types, and animals from API
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      
      try {
        // Load all data in parallel for better performance
        await Promise.all([
          fetchAppointments(),
          fetchTreatmentTypes(),
          fetchAnimals(),
          fetchSymptoms()
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [token]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (newAppointment.date) {
      fetchAvailableTimeSlots(newAppointment.date);
    }
  }, [newAppointment.date]);

  const fetchAnimals = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/animals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter only registered or exempt animals for booking
        const allAnimals = response.data.animals || response.data.pets || [];
        const eligibleAnimals = allAnimals.filter((animal: Animal) => 
          animal.registration_status === 'registered' || animal.registration_status === 'exempt'
        );
        setAnimals(eligibleAnimals);
        // Set first eligible animal as default if available
        if (eligibleAnimals.length > 0) {
          const firstAnimal = eligibleAnimals[0];
          setNewAppointment(prev => ({
            ...prev,
            petId: firstAnimal.id,
            petName: firstAnimal.pet_name
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error);
    }
  };

  const fetchTreatmentTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTreatmentTypes(response.data.services);
        // Set default service to first service if available
        if (response.data.services.length > 0) {
          setNewAppointment(prev => ({
            ...prev,
            service: response.data.services[0].type_name
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('Fetched appointments:', response.data.appointments);
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-purple-100 text-purple-700';
      case 'upcoming': return 'bg-amber-100 text-amber-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'declined': return 'bg-gray-100 text-gray-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'hourglass-empty';
      case 'upcoming': return 'schedule';
      case 'completed': return 'check-circle';
      case 'cancelled': return 'cancel';
      case 'declined': return 'block';
      default: return 'help';
    }
  };

  // Convert 12-hour time ("09:00 AM") to 24-hour format ("09:00") for API
  const convertTo24Hour = (time12h: string): string => {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const fetchAvailableTimeSlots = async (date: string) => {
    setLoadingTimeSlots(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await axios.get(`${API_BASE_URL}/api/mobile/available-time-slots`, {
        params: { date, _t: timestamp },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Time slots response:', response.data);
      if (response.data.success) {
        setAvailableTimeSlots(response.data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const bookAppointment = async (serviceName?: string) => {
    if (!token) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    if (!newAppointment.petId || !newAppointment.date) {
      Alert.alert('Error', 'Please select a pet and date');
      return;
    }
    
    if (!newAppointment.time || newAppointment.time.trim() === '') {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    // Check if this is a Treatment booking (from Step 2) or Preventive booking (from Step 3)
    const isTreatmentBooking = serviceName === 'Treatment';
    
    // Map preventive service IDs to treatment type names
    const preventiveServiceMap: { [key: string]: string } = {
      'deworming': 'Deworming',
      'vaccination': 'Vaccination',
      'vitamin': 'Vitamin Supplements',
      'spay': 'Spay',
      'castration': 'Castration'
    };

    // Convert selected preventive service IDs to treatment type IDs
    const selectedTreatmentTypeIds: number[] = [];
    selectedServices.forEach(serviceId => {
      const serviceName = preventiveServiceMap[serviceId as string];
      if (serviceName) {
        const treatmentType = treatmentTypes.find(t => t.type_name === serviceName);
        if (treatmentType) {
          selectedTreatmentTypeIds.push(treatmentType.id);
        }
      }
    });

    // Use the first selected service as primary service
    let serviceToBook = '';
    let primaryTreatmentTypeId: number | null = null;
    
    if (isTreatmentBooking) {
      // Booking from Step 2 - use 'Treatment' service
      const treatmentService = treatmentTypes.find(t => t.type_name === 'Treatment');
      if (treatmentService) {
        serviceToBook = 'Treatment';
        primaryTreatmentTypeId = treatmentService.id;
        // Add primary treatment ID to the list if not already there
        if (!selectedTreatmentTypeIds.includes(treatmentService.id)) {
          selectedTreatmentTypeIds.unshift(treatmentService.id);
        }
      }
    } else if (hasTreatmentFromStep2) {
      // User came from Step 2 (Treatment) and went to Step 3 - include Treatment
      const treatmentService = treatmentTypes.find(t => t.type_name === 'Treatment');
      if (treatmentService) {
        serviceToBook = 'Treatment';
        primaryTreatmentTypeId = treatmentService.id;
        // Add Treatment ID to the list first if not already there
        if (!selectedTreatmentTypeIds.includes(treatmentService.id)) {
          selectedTreatmentTypeIds.unshift(treatmentService.id);
        }
      }
    } else if (selectedTreatmentTypeIds.length > 0) {
      // Booking from Step 3 - use preventive service
      primaryTreatmentTypeId = selectedTreatmentTypeIds[0];
      const primaryService = treatmentTypes.find(t => t.id === primaryTreatmentTypeId);
      if (primaryService) {
        serviceToBook = primaryService.type_name;
      }
    }

    // If no service to book, return error
    if (!serviceToBook || !primaryTreatmentTypeId) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }

    try {
      // Find treatment_type_id from service name
      const treatmentType = treatmentTypes.find(t => t.type_name === serviceToBook);
      if (!treatmentType) {
        Alert.alert('Error', 'Please select a valid service');
        return;
      }

      // Convert time to 24-hour format for API
      const time24h = convertTo24Hour(newAppointment.time);

      // Transform symptoms to use 'name' instead of 'symptom_id'
      const formattedSymptoms = selectedSymptoms.map(s => ({
        name: s.symptom_id,
        days_count: s.days_count
      }));

      // Prepare treatment type IDs (all selected preventive services)
      const treatmentTypeIds = [...selectedTreatmentTypeIds];

      // Debug: Log what's being sent
      console.log('=== BOOKING DEBUG ===');
      console.log('hasTreatmentFromStep2:', hasTreatmentFromStep2);
      console.log('isTreatmentBooking:', isTreatmentBooking);
      console.log('serviceName param:', serviceName);
      console.log('serviceToBook:', serviceToBook);
      console.log('primaryTreatmentTypeId:', primaryTreatmentTypeId);
      console.log('selectedServices:', selectedServices);
      console.log('selectedTreatmentTypeIds:', selectedTreatmentTypeIds);
      console.log('treatmentTypeIds (final):', treatmentTypeIds);
      console.log('treatmentType found:', treatmentType);
      console.log('Sending symptoms:', formattedSymptoms);
      console.log('Sending bite info:', { is_bitten: newAppointment.isBitten, bite_details: newAppointment.biteDetails });

      const response = await axios.post(
        `${API_BASE_URL}/api/mobile/appointments`,
        {
          pet_id: newAppointment.petId,
          treatment_type_id: treatmentType.id,
          treatment_type_ids: treatmentTypeIds,
          appointment_date: newAppointment.date,
          appointment_time: time24h,
          notes: newAppointment.notes,
          symptoms: formattedSymptoms,
          is_bitten: newAppointment.isBitten || false,
          bite_details: newAppointment.isBitten ? newAppointment.biteDetails : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Refresh appointments list
        fetchAppointments();
        
        // Reset form
        const firstAnimal = animals.length > 0 ? animals[0] : null;
        setNewAppointment({
          petId: firstAnimal ? firstAnimal.id : 0,
          petName: firstAnimal ? firstAnimal.pet_name : '',
          service: getFirstTreatmentType(),
          date: '',
          time: '',
          notes: '',
          serviceType: '',
          isBitten: false,
          biteDetails: '',
        });
        setSelectedSymptoms([]);
        setSelectedServices([]);
        setHasTreatmentFromStep2(false);
        setModalVisible(false);
        showToast({ type: 'success', message: 'Appointment submitted for review! You will be notified once approved.' });
      }
    } catch (error: any) {
      console.log('Full error:', error);
      console.log('Response:', error.response?.data);
      
      let message = 'Failed to book appointment';
      
      // Handle Laravel validation errors (422)
      if (error.response?.data) {
        const data = error.response.data;
        
        if (data.errors) {
          // Laravel validation errors format
          const errorMessages = Object.values(data.errors).flat().join('\n');
          message = errorMessages || 'Validation failed';
        } else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = data.error;
        } else if (typeof data === 'string') {
          message = data;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      showToast({ type: 'error', message });
    }
  };

  const cancelAppointment = async (id: number) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const response = await axios.patch(
                `${API_BASE_URL}/api/mobile/appointments/${id}/cancel`,
                {},
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                // Update local state to reflect the cancellation
                setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
                showToast({ type: 'success', message: 'Appointment cancelled successfully' });
              } else {
                showToast({ type: 'error', message: response.data.message || 'Failed to cancel appointment' });
              }
            } catch (error: any) {
              console.error('Cancel appointment error:', error);
              let message = 'Failed to cancel appointment';
              
              if (error.response?.data) {
                const data = error.response.data;
                if (data.message) {
                  message = data.message;
                } else if (data.error) {
                  message = data.error;
                }
              } else if (error.message) {
                message = error.message;
              }
              
              showToast({ type: 'error', message });
            }
          }
        }
      ]
    );
  };

  // Calendar helpers
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const closedDays = [0, 5, 6]; // Sunday, Friday, Saturday

  // Initialize Philippine holidays (auto-updates yearly)
  const hd = new Holidays('PH');

  const isHoliday = (dateStr: string): boolean => {
    return !!hd.isHoliday(dateStr);
  };

  // Fetch unavailable dates when month changes
  useEffect(() => {
    fetchUnavailableDates();
  }, [currentMonth]);

  const fetchUnavailableDates = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // 1-based month
      const response = await axios.get(`${API_BASE_URL}/api/mobile/vet-unavailable-dates`, {
        params: { year, month },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnavailableDates(response.data.unavailable_dates.map((d: {date: string}) => d.date));
      }
    } catch (error) {
      console.error('Failed to fetch unavailable dates:', error);
    }
  };

  const isDateUnavailable = (dateStr: string): boolean => {
    return unavailableDates.includes(dateStr);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
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
      const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const isToday = todayStr === dateStr;
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      const dayOfWeek = date.getDay();
      const isClosedDay = closedDays.includes(dayOfWeek);
      const isHolidayDate = isHoliday(dateStr);
      
      days.push({
        day: i,
        date: dateStr,
        isToday,
        isPast,
        isClosedDay,
        isHoliday: isHolidayDate,
      });
    }

    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const openBookingModal = () => {
    setNewAppointment({
      petId: 0,
      petName: '',
      service: '',
      serviceType: '',
      date: '',
      time: '',
      notes: '',
      isBitten: false,
      biteDetails: '',
    });
    setSelectedSymptoms([]);
    setSelectedServices([]);
    setHasTreatmentFromStep2(false);
    const today = new Date();
      setSelectedDate(today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'));
    setCurrentStep(1);
    setModalVisible(true);
  };

  return (
    <ThemedView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-4">
          <ThemedText className="text-2xl font-bold text-white">Services</ThemedText>
          <TouchableOpacity 
            onPress={openBookingModal}
            className="flex-row items-center px-3 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <MaterialIcons name="add" size={20} color="#ffffff" />
            <ThemedText className="text-white text-sm font-medium ml-1">Book Services</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <ThemedText className="text-2xl font-bold text-white">{upcomingCount}</ThemedText>
            <ThemedText className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Upcoming</ThemedText>
          </View>
          <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <ThemedText className="text-2xl font-bold text-white">{completedCount}</ThemedText>
            <ThemedText className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Completed</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-4" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#2563eb" />
            <ThemedText className="text-slate-400 mt-4">Loading appointments...</ThemedText>
          </View>
        ) : appointments.length === 0 ? (
          <View className="items-center justify-center py-12">
            <MaterialIcons name="calendar-today" size={64} color="#cbd5e1" />
            <ThemedText className="text-slate-400 mt-4 text-center">
              No appointments yet.{'\n'}Book your first visit!
            </ThemedText>
          </View>
        ) : (
          appointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment.id}
              onPress={() => {
                setSelectedAppointment(appointment);
                setDetailModalVisible(true);
              }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
            >
              <View className="flex-row items-start">
                {/* Date Box */}
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 items-center min-w-[60px]">
                  <ThemedText className="text-blue-600 dark:text-blue-400 text-xs font-medium uppercase">
                    {(() => {
                      const [y, m, d] = appointment.date.split('-').map(Number);
                      const date = new Date(y, m - 1, d);
                      return date.toLocaleDateString('en-US', { month: 'short' });
                    })()}
                  </ThemedText>
                  <ThemedText className="text-blue-700 dark:text-blue-300 text-xl font-bold">
                    {(() => {
                      const [y, m, d] = appointment.date.split('-').map(Number);
                      const date = new Date(y, m - 1, d);
                      return date.getDate();
                    })()}
                  </ThemedText>
                </View>

                {/* Appointment Info */}
                <View className="flex-1 ml-4">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="text-lg font-bold text-slate-800 dark:text-white">
                      {appointment.petName}
                    </ThemedText>
                    <View className={`px-2 py-1 rounded-full flex-row items-center ${getStatusColor(appointment.status).split(' ')[0]}`}>
                      <MaterialIcons name={getStatusIcon(appointment.status)} size={12} color={getStatusColor(appointment.status).includes('amber') ? '#b45309' : getStatusColor(appointment.status).includes('green') ? '#15803d' : '#dc2626'} />
                      <ThemedText className={`text-xs ml-1 capitalize ${getStatusColor(appointment.status).split(' ')[1]}`}>
                        {appointment.status}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View>
                    {appointment.services && appointment.services.length > 0 ? (
                      <View className="flex-row flex-wrap">
                        {appointment.services.map((service, index) => (
                          <View key={index} className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg mr-2 mb-2">
                            <ThemedText className="text-sm text-blue-700 dark:text-blue-300">
                              {service}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <ThemedText className="text-slate-500 text-sm">
                        {appointment.service}
                      </ThemedText>
                    )}
                  </View>
                  
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="access-time" size={14} color="#64748b" />
                    <ThemedText className="text-slate-400 text-sm ml-1">{appointment.time}</ThemedText>
                  </View>
                </View>

                {/* Cancel Button */}
                {appointment.status === 'upcoming' && (
                  <TouchableOpacity 
                    onPress={() => cancelAppointment(appointment.id)}
                    className="p-2 ml-2"
                  >
                    <MaterialIcons name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        
        <View className="h-6" />
      </ScrollView>

      {/* Book Appointment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <ThemedText className="text-xl font-bold">
                  {currentStep === 1 && 'Book - Step 1'}
                  {currentStep === 2 && 'Treatment - Step 2'}
                  {currentStep === 3 && 'Services - Step 3'}
                </ThemedText>
                <ThemedText className="text-xs text-slate-500 mt-1">
                  {currentStep === 1 && 'Select pet, date & time'}
                  {currentStep === 2 && 'Add symptoms & complaints'}
                  {currentStep === 3 && 'Choose services'}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View className="flex-row items-center justify-center mb-6">
              {[1, 2, 3].map((step) => (
                <View key={step} className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    currentStep >= step ? 'bg-blue-500' : 'bg-slate-200'
                  }`}>
                    <ThemedText className={`text-sm font-bold ${
                      currentStep >= step ? 'text-white' : 'text-slate-500'
                    }`}>
                      {step}
                    </ThemedText>
                  </View>
                  {step < 3 && (
                    <View className={`w-8 h-0.5 ${
                      currentStep > step ? 'bg-blue-500' : 'bg-slate-200'
                    }`} />
                  )}
                </View>
              ))}
            </View>

            {currentStep === 1 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Animal Selection Dropdown */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Animal *</ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowAnimalDropdown(!showAnimalDropdown)}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
                  >
                    <MaterialIcons name="pets" size={20} color="#64748b" />
                    <ThemedText className="flex-1 ml-3 text-base text-slate-800 dark:text-white">
                      {newAppointment.petName || 'Select an animal'}
                    </ThemedText>
                    <MaterialIcons name={showAnimalDropdown ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color="#64748b" />
                  </TouchableOpacity>

                  {/* Animal Dropdown List */}
                  {showAnimalDropdown && (
                    <View className="mt-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                      {animals.length === 0 ? (
                        <View className="px-4 py-3">
                          <ThemedText className="text-slate-500 dark:text-slate-400">No eligible animals found. Animals must be registered or exempt to book services.</ThemedText>
                        </View>
                      ) : (
                        animals.map((animal: Animal) => (
                          <TouchableOpacity
                            key={animal.id}
                            onPress={() => {
                              setNewAppointment({ ...newAppointment, petId: animal.id, petName: animal.pet_name });
                              setShowAnimalDropdown(false);
                            }}
                            className={`px-4 py-3 border-b border-slate-100 dark:border-slate-600 last:border-b-0 ${
                              newAppointment.petId === animal.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <View className="flex-row items-center flex-1">
                              <MaterialIcons
                                name={newAppointment.petId === animal.id ? 'check-circle' : 'pets'}
                                size={20}
                                color={newAppointment.petId === animal.id ? '#2563eb' : '#64748b'}
                              />
                              <View className="ml-3 flex-1">
                                <View className="flex-row items-center justify-between">
                                  <ThemedText className={`font-medium ${
                                    newAppointment.petId === animal.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'
                                  }`}>
                                    {animal.pet_name}
                                  </ThemedText>
                                  <View className={`px-2 py-0.5 rounded-full ${
                                    animal.registration_status === 'registered' ? 'bg-green-100' : 'bg-blue-100'
                                  }`}>
                                    <ThemedText className={`text-xs capitalize ${
                                      animal.registration_status === 'registered' ? 'text-green-700' : 'text-blue-700'
                                    }`}>
                                      {animal.registration_status === 'exempt' ? 'Exempt' : animal.registration_status}
                                    </ThemedText>
                                  </View>
                                </View>
                                {animal.species_name && (
                                  <ThemedText className="text-xs text-slate-500 dark:text-slate-400">
                                    {animal.species_name}{animal.breed_name ? ` - ${animal.breed_name}` : ''}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}

                  {/* Registration requirement info */}
                  <ThemedText className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Only registered or exempt animals can book services
                  </ThemedText>
                </View>

                {/* Date Selection - Calendar */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Date *</ThemedText>

                  {/* Calendar Container */}
                  <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    {/* Month Navigation */}
                    <View className="flex-row items-center justify-between mb-4">
                      <TouchableOpacity
                        onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-2"
                      >
                        <MaterialIcons name="chevron-left" size={24} color="#64748b" />
                      </TouchableOpacity>
                      <ThemedText className="text-base font-semibold text-slate-800 dark:text-white">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-2"
                      >
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                      </TouchableOpacity>
                    </View>

                    {/* Week Day Headers */}
                    <View className="flex-row mb-2">
                      {weekDays.map((day) => (
                        <View key={day} className="flex-1 items-center py-2">
                          <ThemedText className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {day}
                          </ThemedText>
                        </View>
                      ))}
                    </View>

                    {/* Calendar Grid */}
                    <View className="flex-row flex-wrap">
                      {generateCalendarDays().map((date, index) => {
                        if (!date) return <View key={index} className="w-[14.28%] aspect-square p-1" />;
                        
                        const isUnavailable = isDateUnavailable(date.date);
                        const isClosedOrHoliday = date.isClosedDay || date.isHoliday; // Fri, Sat, Sun, Holidays
                        const isDisabled = date.isPast || isUnavailable || isClosedOrHoliday;
                        
                        return (
                          <View key={index} className="w-[14.28%] aspect-square p-1">
                            <TouchableOpacity
                              onPress={() => {
                                if (!isDisabled) {
                                  setSelectedDate(date.date);
                                  setNewAppointment({ ...newAppointment, date: date.date });
                                }
                              }}
                              disabled={isDisabled}
                              className={`flex-1 items-center justify-center rounded-lg ${
                                newAppointment.date === date.date
                                  ? 'bg-blue-500'
                                  : date.isHoliday
                                  ? 'bg-rose-200 dark:bg-rose-900/40'
                                  : date.isClosedDay
                                  ? 'bg-red-200 dark:bg-red-900/40'
                                  : isUnavailable
                                  ? 'bg-red-100 dark:bg-red-900/30'
                                  : date.isToday
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : date.isPast
                                  ? 'bg-slate-100 dark:bg-slate-800'
                                  : 'bg-slate-50 dark:bg-slate-700'
                              }`}
                            >
                              <ThemedText
                                className={`text-sm font-medium ${
                                  newAppointment.date === date.date
                                    ? 'text-white'
                                    : date.isHoliday
                                    ? 'text-rose-700 dark:text-rose-300'
                                    : date.isClosedDay
                                    ? 'text-red-700 dark:text-red-300'
                                    : isUnavailable
                                    ? 'text-red-600 dark:text-red-400'
                                    : date.isToday
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : date.isPast
                                    ? 'text-slate-400 dark:text-slate-600'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {date.day}
                              </ThemedText>
                              {(date.isClosedDay || date.isHoliday || isUnavailable) && (
                                <View className={`absolute bottom-1 w-1 h-1 rounded-full ${date.isHoliday ? 'bg-rose-600' : 'bg-red-600'}`} />
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>

                    {/* Calendar Legend */}
                    <View className="flex-row flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-blue-500 mr-1" />
                        <ThemedText className="text-xs text-slate-600 dark:text-slate-400">Selected</ThemedText>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 mr-1" />
                        <ThemedText className="text-xs text-slate-600 dark:text-slate-400">Today</ThemedText>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/40 mr-1" />
                        <ThemedText className="text-xs text-slate-600 dark:text-slate-400">Fri, Sat, Sun (Closed)</ThemedText>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-rose-200 dark:bg-rose-900/40 mr-1" />
                        <ThemedText className="text-xs text-slate-600 dark:text-slate-400">Holiday</ThemedText>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 mr-1" />
                        <ThemedText className="text-xs text-slate-600 dark:text-slate-400">Unavailable</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Time Selection */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Time (20-min slots)</ThemedText>
                  
                  {loadingTimeSlots ? (
                    <View className="items-center py-4">
                      <ActivityIndicator size="small" color="#2563eb" />
                    </View>
                  ) : availableTimeSlots.length === 0 ? (
                    <ThemedText className="text-slate-400 text-sm italic">Select a date to see available times</ThemedText>
                  ) : (
                    <View>
                      {/* Morning Slots */}
                      <ThemedText className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 mt-2">Morning (8:00 AM - 12:00 PM)</ThemedText>
                      <View className="flex-row flex-wrap gap-2">
                        {availableTimeSlots
                          .filter(slot => slot.period === 'morning')
                          .map((slot) => (
                            <TouchableOpacity
                              key={slot.time}
                              onPress={() => {
                                if (slot.available) {
                                  setNewAppointment({ ...newAppointment, time: slot.label });
                                }
                              }}
                              disabled={!slot.available}
                              className={`px-3 py-2 rounded-xl ${
                                newAppointment.time === slot.label
                                  ? 'bg-blue-500'
                                  : slot.available
                                  ? 'bg-slate-100 dark:bg-slate-700'
                                  : 'bg-slate-200 dark:bg-slate-800 opacity-50'
                              }`}
                            >
                              <ThemedText className={`text-sm ${
                                newAppointment.time === slot.label
                                  ? 'text-white'
                                  : slot.available
                                  ? 'text-slate-600 dark:text-slate-300'
                                  : 'text-slate-400 line-through'
                              }`}>
                                {slot.label}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                      </View>
                      
                      {/* Afternoon Slots */}
                      <ThemedText className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 mt-3">Afternoon (1:00 PM - 5:00 PM)</ThemedText>
                      <View className="flex-row flex-wrap gap-2">
                        {availableTimeSlots
                          .filter(slot => slot.period === 'afternoon')
                          .map((slot) => (
                            <TouchableOpacity
                              key={slot.time}
                              onPress={() => {
                                if (slot.available) {
                                  setNewAppointment({ ...newAppointment, time: slot.label });
                                }
                              }}
                              disabled={!slot.available}
                              className={`px-3 py-2 rounded-xl ${
                                newAppointment.time === slot.label
                                  ? 'bg-blue-500'
                                  : slot.available
                                  ? 'bg-slate-100 dark:bg-slate-700'
                                  : 'bg-slate-200 dark:bg-slate-800 opacity-50'
                              }`}
                            >
                              <ThemedText className={`text-sm ${
                                newAppointment.time === slot.label
                                  ? 'text-white'
                                  : slot.available
                                  ? 'text-slate-600 dark:text-slate-300'
                                  : 'text-slate-400 line-through'
                              }`}>
                                {slot.label}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                      </View>
                      
                      {/* Legend */}
                      <View className="flex-row gap-4 mt-3 flex-wrap">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-700 mr-1" />
                          <ThemedText className="text-xs text-slate-500">Available</ThemedText>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 opacity-50 mr-1" />
                          <ThemedText className="text-xs text-slate-500">Booked</ThemedText>
                        </View>
                        {(() => {
                        const today = new Date();
                        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                        return newAppointment.date === todayStr;
                      })() && (
                          <View className="flex-row items-center">
                            <View className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600 mr-1" />
                            <ThemedText className="text-xs text-slate-500">Past</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentStep(2)}
                  className="bg-blue-600 py-4 rounded-xl items-center"
                >
                  <ThemedText className="text-white font-semibold text-base">Next</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            )}

            {currentStep === 2 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Add Complaint */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add Complaint</ThemedText>
                  
                  <View className="gap-2">
                    {[
                      { id: 'not_eating', label: 'Not eating / Loss of appetite' },
                      { id: 'vomiting', label: 'Vomiting' },
                      { id: 'diarrhea', label: 'Diarrhea' },
                      { id: 'lethargy', label: 'Lethargy / Weakness' },
                      { id: 'coughing', label: 'Coughing / Sneezing' },
                      { id: 'itching', label: 'Itching / Scratching' },
                      { id: 'lameness', label: 'Lameness / Difficulty walking' },
                      { id: 'eye_discharge', label: 'Eye discharge / Redness' },
                      { id: 'ear_problem', label: 'Ear problem / Head shaking' },
                      { id: 'weight_loss', label: 'Weight loss' },
                      { id: 'excessive_thirst', label: 'Excessive thirst / Urination' },
                      { id: 'behavior_change', label: 'Behavior change / Aggression' },
                    ].map((complaint) => {
                      const selectedComplaint = selectedSymptoms.find(s => s.symptom_id === complaint.id);
                      const isSelected = !!selectedComplaint;
                      const daysCount = selectedComplaint?.days_count || 1;
                      
                      return (
                        <View key={complaint.id} className={`rounded-xl border ${
                          isSelected 
                            ? 'bg-violet-50 border-violet-500 dark:bg-violet-900/20' 
                            : 'bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                        }`}>
                          <TouchableOpacity
                            onPress={() => {
                              if (isSelected) {
                                setSelectedSymptoms(selectedSymptoms.filter(s => s.symptom_id !== complaint.id));
                              } else {
                                setSelectedSymptoms([...selectedSymptoms, { symptom_id: complaint.id, days_count: 1 }]);
                              }
                            }}
                            className="flex-row items-center p-3"
                          >
                            <View className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                              isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-300'
                            }`}>
                              {isSelected && <MaterialIcons name="check" size={14} color="white" />}
                            </View>
                            <ThemedText className={`flex-1 ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {complaint.label}
                            </ThemedText>
                          </TouchableOpacity>
                          
                          {isSelected && (
                            <View className="flex-row items-center px-3 pb-3">
                              <ThemedText className="text-xs text-slate-500 mr-2">Days:</ThemedText>
                              <View className="flex-row items-center bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500">
                                <TouchableOpacity
                                  onPress={() => {
                                    if (daysCount > 1) {
                                      setSelectedSymptoms(selectedSymptoms.map(s => 
                                        s.symptom_id === complaint.id 
                                          ? { ...s, days_count: daysCount - 1 }
                                          : s
                                      ));
                                    }
                                  }}
                                  className="px-3 py-1"
                                >
                                  <MaterialIcons name="remove" size={16} color="#64748b" />
                                </TouchableOpacity>
                                
                                <ThemedText className="text-sm font-medium text-slate-800 dark:text-white px-2 min-w-[24px] text-center">
                                  {daysCount}
                                </ThemedText>
                                
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedSymptoms(selectedSymptoms.map(s => 
                                      s.symptom_id === complaint.id 
                                        ? { ...s, days_count: daysCount + 1 }
                                        : s
                                    ));
                                  }}
                                  className="px-3 py-1"
                                >
                                  <MaterialIcons name="add" size={16} color="#64748b" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Bite Incident */}
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <TouchableOpacity 
                      onPress={() => setNewAppointment({ ...newAppointment, isBitten: !newAppointment.isBitten, biteDetails: newAppointment.biteDetails })}
                      className="flex-row items-center"
                    >
                      <View className={`w-5 h-5 rounded border-2 mr-2 flex items-center justify-center ${newAppointment.isBitten ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                        {newAppointment.isBitten && <MaterialIcons name="check" size={14} color="white" />}
                      </View>
                      <ThemedText className="text-slate-700 dark:text-slate-300">Has the pet bitten anyone?</ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  {newAppointment.isBitten && (
                    <View className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 mt-2">
                      <TextInput
                        className="text-base text-slate-800 dark:text-white"
                        placeholder="Please provide details about the bite incident..."
                        placeholderTextColor="#94a3b8"
                        value={newAppointment.biteDetails}
                        onChangeText={(text) => setNewAppointment({ ...newAppointment, biteDetails: text, isBitten: true })}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      // Treatment is always 'Treatment' service when booking with complaints
                      const serviceToUse = 'Treatment';
                      
                      // Update state for tracking
                      setNewAppointment({ 
                        ...newAppointment, 
                        serviceType: 'treatment',
                        service: serviceToUse
                      });
                      
                      // Book with the service directly (don't wait for state)
                      bookAppointment(serviceToUse);
                    }}
                    className="bg-violet-600 py-4 rounded-xl items-center"
                  >
                    <ThemedText className="text-white font-semibold text-base">Book Treatment</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      setHasTreatmentFromStep2(true);
                      setCurrentStep(3);
                    }}
                    className="bg-slate-200 py-4 rounded-xl items-center"
                  >
                    <ThemedText className="text-slate-700 font-semibold text-base">Skip to Preventive Service →</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setCurrentStep(1)}
                    className="py-3 rounded-xl items-center border border-slate-300"
                  >
                    <ThemedText className="text-slate-500 font-medium text-sm">← Back to Step 1</ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {currentStep === 3 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Preventive Service Selection */}
                <View className="mb-6">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Select Preventive Services (Choose Multiple)</ThemedText>
                  
                  <View className="gap-3">
                    {serviceOptions.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      
                      return (
                        <View key={service.id} className={`rounded-xl border-2 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-slate-200 dark:border-slate-600'
                        }`}>
                          <TouchableOpacity
                            onPress={() => {
                              if (isSelected) {
                                setSelectedServices(selectedServices.filter(id => id !== service.id));
                              } else {
                                setSelectedServices([...selectedServices, service.id]);
                              }
                            }}
                            className="flex-row items-center p-4"
                          >
                            <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                              isSelected ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'
                            }`}>
                              <MaterialIcons 
                                name={service.icon as any} 
                                size={24} 
                                color={isSelected ? '#fff' : '#64748b'} 
                              />
                            </View>
                            <View className="ml-4 flex-1">
                              <ThemedText className={`font-semibold text-base ${
                                isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-white'
                              }`}>
                                {service.name}
                              </ThemedText>
                              <ThemedText className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {service.id === 'deworming' && 'Regular parasite prevention for your pet'}
                                {service.id === 'vaccination' && 'Keep your pet protected from diseases'}
                                {service.id === 'vitamin' && 'Essential supplements for pet health'}
                                {service.id === 'spay' && 'Surgical procedure for female animals'}
                                {service.id === 'castration' && 'Surgical procedure for male animals'}
                              </ThemedText>
                            </View>
                            <View className={`w-6 h-6 rounded border-2 mr-3 flex items-center justify-center ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                            }`}>
                              {isSelected && <MaterialIcons name="check" size={14} color="white" />}
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Notes */}
                <View className="mb-6">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</ThemedText>
                  <View className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                    <TextInput
                      className="text-base text-slate-800 dark:text-white"
                      placeholder="Any special requests or concerns..."
                      placeholderTextColor="#94a3b8"
                      value={newAppointment.notes}
                      onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => bookAppointment()}
                  disabled={selectedServices.length === 0}
                  className={`py-4 rounded-xl items-center mb-3 ${
                    selectedServices.length > 0 ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <ThemedText className="text-white font-semibold text-base">
                    {selectedServices.length > 0 ? 'Book Services' : 'Select Services First'}
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setCurrentStep(2)}
                  className="py-3 rounded-xl items-center border border-slate-300"
                >
                  <ThemedText className="text-slate-500 font-medium text-sm">← Back to Treatment</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Symptom Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSymptomModal}
        onRequestClose={() => setShowSymptomModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 max-h-[70%]">
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-xl font-bold">Select Symptoms</ThemedText>
              <TouchableOpacity onPress={() => setShowSymptomModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="max-h-[300px]">
              {symptoms.map((symptom) => {
                const selectedSymptom = selectedSymptoms.find(s => s.symptom_id === symptom.id);
                const isSelected = !!selectedSymptom;
                return (
                  <View
                    key={symptom.id}
                    className={`border-b border-slate-100 dark:border-slate-700 ${isSelected ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSymptoms(selectedSymptoms.filter(s => s.symptom_id !== symptom.id));
                        } else {
                          setSelectedSymptoms([...selectedSymptoms, { symptom_id: symptom.id, days_count: 1 }]);
                        }
                      }}
                      className="flex-row items-center justify-between p-4"
                    >
                      <ThemedText className={`text-base ${isSelected ? 'text-violet-700 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                        {symptom.name}
                      </ThemedText>
                      {isSelected && <MaterialIcons name="check" size={20} color="#7c3aed" />}
                    </TouchableOpacity>
                    
                    {isSelected && (
                      <View className="px-4 pb-4">
                        <View className="flex-row items-center">
                          <ThemedText className="text-sm text-slate-600 dark:text-slate-400 mr-3">How many days?</ThemedText>
                          <View className="flex-row items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                            <TouchableOpacity
                              onPress={() => {
                                const currentDays = selectedSymptom?.days_count || 1;
                                if (currentDays > 1) {
                                  setSelectedSymptoms(selectedSymptoms.map(s => 
                                    s.symptom_id === symptom.id 
                                      ? { ...s, days_count: currentDays - 1 }
                                      : s
                                  ));
                                }
                              }}
                              className="px-3 py-2"
                            >
                              <MaterialIcons name="remove" size={16} color="#64748b" />
                            </TouchableOpacity>
                            
                            <ThemedText className="text-base font-medium text-slate-800 dark:text-white px-2 min-w-[30px] text-center">
                              {selectedSymptom?.days_count || 1}
                            </ThemedText>
                            
                            <TouchableOpacity
                              onPress={() => {
                                const currentDays = selectedSymptom?.days_count || 1;
                                setSelectedSymptoms(selectedSymptoms.map(s => 
                                  s.symptom_id === symptom.id 
                                    ? { ...s, days_count: currentDays + 1 }
                                    : s
                                ));
                              }}
                              className="px-3 py-2"
                            >
                              <MaterialIcons name="add" size={16} color="#64748b" />
                            </TouchableOpacity>
                          </View>
                          <ThemedText className="text-sm text-slate-500 ml-2">day(s)</ThemedText>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setShowSymptomModal(false)}
              className="bg-violet-600 py-4 rounded-xl items-center mt-4"
            >
              <ThemedText className="text-white font-semibold text-base">Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-6">
              <ThemedText className="text-xl font-bold">Appointment Details</ThemedText>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {selectedAppointment && (
              <ScrollView>
                {/* Status */}
                <View className="flex-row items-center justify-end mb-4">
                  <View className={`px-3 py-1 rounded-full flex-row items-center ${getStatusColor(selectedAppointment.status).split(' ')[0]}`}>
                    <MaterialIcons name={getStatusIcon(selectedAppointment.status)} size={14} color="#fff" />
                    <ThemedText className="text-white text-sm ml-1 capitalize">{selectedAppointment.status}</ThemedText>
                  </View>
                </View>

                {/* Services/Treatments - Show First */}
                <View className="mb-4">
                  <ThemedText className="text-sm text-slate-500 mb-1">Treatments & Services</ThemedText>
                  <View className="flex-row flex-wrap">
                    {selectedAppointment.services && selectedAppointment.services.length > 0 ? (
                      selectedAppointment.services.map((service, index) => (
                        <View key={index} className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg mr-2 mb-2">
                          <ThemedText className="text-sm text-blue-700 dark:text-blue-300">
                            {service}
                          </ThemedText>
                        </View>
                      ))
                    ) : (
                      <ThemedText className="text-base text-slate-700 dark:text-slate-300">{selectedAppointment.service}</ThemedText>
                    )}
                  </View>
                </View>

                {/* Pet */}
                <View className="mb-4">
                  <ThemedText className="text-sm text-slate-500 mb-1">Pet</ThemedText>
                  <ThemedText className="text-lg font-bold text-slate-800 dark:text-white">{selectedAppointment.petName}</ThemedText>
                </View>

                {/* Date & Time */}
                <View className="flex-row mb-4">
                  <View className="flex-1">
                    <ThemedText className="text-sm text-slate-500 mb-1">Date</ThemedText>
                    <ThemedText className="text-base text-slate-700 dark:text-slate-300">
                      {(() => {
                        const [y, m, d] = selectedAppointment.date.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                      })()}
                    </ThemedText>
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-sm text-slate-500 mb-1">Time</ThemedText>
                    <ThemedText className="text-base text-slate-700 dark:text-slate-300">{selectedAppointment.time}</ThemedText>
                  </View>
                </View>

                {/* Symptoms */}
                {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
                  <View className="mb-4">
                    <ThemedText className="text-sm text-slate-500 mb-2">Symptoms</ThemedText>
                    <View className="flex-row flex-wrap">
                      {selectedAppointment.symptoms.map((symptom, idx) => (
                        <View key={idx} className="bg-violet-100 px-3 py-2 rounded-xl mr-2 mb-2">
                          <ThemedText className="text-violet-800">
                            {symptom.name}
                            {symptom.days_count && <ThemedText className="text-violet-600 text-sm"> ({symptom.days_count} {symptom.days_count === 1 ? 'day' : 'days'})</ThemedText>}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Bite Incident */}
                <View className={`mb-4 p-3 rounded-xl ${selectedAppointment.isBitten ? 'bg-red-50' : 'bg-slate-50 dark:bg-slate-700'}`}>
                  <ThemedText className={`text-sm ${selectedAppointment.isBitten ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                    Bite incident: {selectedAppointment.isBitten ? 'yes' : 'no'}
                  </ThemedText>
                  {selectedAppointment.isBitten && selectedAppointment.biteDetails ? (
                    <ThemedText className="text-red-500 text-sm mt-1">
                      report: {selectedAppointment.biteDetails}
                    </ThemedText>
                  ) : (
                    <ThemedText className="text-slate-400 text-sm mt-1">
                      report: none
                    </ThemedText>
                  )}
                </View>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <View className="mb-4">
                    <ThemedText className="text-sm text-slate-500 mb-1">Additional Notes</ThemedText>
                    <ThemedText className="text-base text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-xl">{selectedAppointment.notes}</ThemedText>
                  </View>
                )}

                {/* Booking Date */}
                {selectedAppointment.created_at && (
                  <View className="mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <ThemedText className="text-sm text-slate-400">
                      Booked on {(() => {
                        // Parse ISO date string properly
                        const createdDate = new Date(selectedAppointment.created_at);
                        return createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      })()}
                    </ThemedText>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setDetailModalVisible(false)}
                  className="bg-blue-600 py-4 rounded-xl items-center mt-4"
                >
                  <ThemedText className="text-white font-semibold text-base">Close</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
