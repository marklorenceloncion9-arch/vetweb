import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const QUICK_ACTIONS = [
  { icon: 'calendar-today', label: 'Book Visit', color: 'bg-blue-500', route: '/(tabs)/servicesmob' },
  { icon: 'pets', label: 'My Animals', color: 'bg-amber-500', route: '/(tabs)/animals' },
  { icon: 'medical-services', label: 'Services', color: 'bg-emerald-500', route: '/(tabs)/servicesmob' },
  { icon: 'phone', label: 'Contact', color: 'bg-purple-500', route: '' },
];

const UPCOMING_APPOINTMENTS = [];

interface Appointment {
  id: number;
  petName: string;
  service: string;
  services: string[];
  date: string;
  date_formatted: string;
  time: string;
  status: string;
  notes?: string;
}

interface Service {
  id: number;
  type_name: string;
  description: string;
}

const SERVICES: Service[] = [];

export default function HomeScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Animal care tips array
  const animalCareTips = [
    {
      title: "Hydration is Key",
      message: "Always provide fresh, clean water for your animals. Proper hydration helps maintain healthy organ function and overall wellbeing."
    },
    {
      title: "Regular Exercise",
      message: "Daily physical activity keeps animals physically fit and mentally stimulated. Adjust exercise intensity based on your animal's age and breed."
    },
    {
      title: "Balanced Nutrition",
      message: "Feed your animals high-quality food appropriate for their age, size, and health condition. Consult your vet for dietary recommendations."
    },
    {
      title: "Dental Health",
      message: "Brush your animal's teeth regularly and provide dental treats. Good oral health prevents serious medical issues later in life."
    },
    {
      title: "Mental Stimulation",
      message: "Provide toys and activities that challenge your animal's mind. Mental exercise prevents boredom and destructive behaviors."
    },
    {
      title: "Regular Check-ups",
      message: "Schedule routine veterinary visits even when your animal seems healthy. Prevention is always better than treatment."
    },
    {
      title: "Socialization Matters",
      message: "Proper socialization helps animals develop confidence and reduces anxiety. Introduce your animals to new experiences gradually and positively for better behavior."
    },
    {
      title: "Safe Environment",
      message: "Create a animal-safe space at home. Remove hazards and provide comfortable resting areas for your furry friends."
    }
  ];

  // Get random tip on mount/refresh
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * animalCareTips.length);
    setCurrentTipIndex(randomIndex);
  }, []);

  // Get service description
  const getServiceDescription = (serviceName: string | undefined) => {
    if (!serviceName) return 'Professional veterinary service provided by our experienced team of veterinarians.';
    
    switch (serviceName.toLowerCase()) {
      case 'deworming':
        return 'Regular deworming helps keep your animals healthy, active, and free from harmful parasites. Protect your pets and livestock by giving them proper deworming on time.';
      case 'treatment':
        return 'Early treatment helps animals recover faster and live healthier lives. Bring your animals for proper veterinary care whenever they are sick or injured.';
      case 'vaccination':
        return 'Vaccination protects animals from dangerous diseases and helps keep your family and community safe. Keep your pets and livestock vaccinated regularly.';
      case 'vitamin supplement':
        return 'Vitamin supplements help animals grow strong, stay energetic, and maintain good health. Give your animals the nutrients they need for a happier and healthier life.';
      case 'spay':
        return 'Spaying helps prevent unwanted pregnancies and reduces health risks in female animals. Our veterinarians provide safe and professional spaying services.';
      case 'castration':
        return 'Castration helps control behavior and prevents unwanted breeding in male animals. Our experienced veterinarians ensure safe and humane procedures.';
      default:
        return 'Compassionate care for your beloved pets. Our experienced veterinarians are dedicated to keeping your furry friends healthy and happy with personalized attention and advanced medical treatments.';
    }
  };

  // Get service icon
  const getServiceIcon = (serviceName: string | undefined) => {
    if (!serviceName) return 'medical-services';
    
    switch (serviceName.toLowerCase()) {
      case 'deworming':
        return 'pets';
      case 'treatment':
        return 'healing';
      case 'vaccination':
        return 'vaccines';
      case 'vitamin supplement':
        return 'medication';
      case 'spay':
        return 'medical-services';
      case 'castration':
        return 'medical-services';
      default:
        return 'medical-services';
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/services`);
      if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/mobile/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Filter only approved appointments for home display
          const approvedAppointments = response.data.appointments.filter(
            (apt: Appointment) => apt.status === 'approved'
          );
          setAppointments(approvedAppointments);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [token]);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    
    // Change to a new random tip
    const newTipIndex = Math.floor(Math.random() * animalCareTips.length);
    setCurrentTipIndex(newTipIndex);
    
    const fetchAppointments = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/mobile/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const approvedAppointments = response.data.appointments.filter(
            (apt: Appointment) => apt.status === 'approved'
          );
          setAppointments(approvedAppointments);
        }
      } catch (error) {
        console.error('Failed to refresh appointments:', error);
      } finally {
        setRefreshing(false);
      }
    };
    
    await fetchAppointments();
  };

  return (
    <ThemedView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <View>
            <ThemedText className="text-blue-100 text-sm">Welcome back,</ThemedText>
            <ThemedText className="text-white text-2xl font-bold">
              {user?.name?.split(' ')[0] || 'User'}
            </ThemedText>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile')}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <MaterialIcons name="person" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mt-4 flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <MaterialIcons name="search" size={20} color="#ffffff" />
          <TextInput
            className="flex-1 ml-3 text-base text-white"
            placeholder="Search services, vets..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Quick Actions */}
        <View className="px-4 pt-4">
          <View className="flex-row gap-3">
            {QUICK_ACTIONS.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => action.route && router.push(action.route as any)}
                className="flex-1 items-center"
              >
                <View className={`w-14 h-14 ${action.color} rounded-2xl items-center justify-center mb-2`} style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                  <MaterialIcons name={action.icon as any} size={24} color="#ffffff" />
                </View>
                <ThemedText className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  {action.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <ThemedText className="text-lg font-bold text-slate-800 dark:text-white">
              Upcoming Visits
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/servicesmob')}>
              <ThemedText className="text-blue-600 text-sm">See All</ThemedText>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#2563eb" />
              <ThemedText className="text-slate-400 mt-4">Loading appointments...</ThemedText>
            </View>
          ) : appointments.length === 0 ? (
            <View className="items-center justify-center py-12">
              <MaterialIcons name="event" size={72} color="#cbd5e1" />
              <ThemedText className="text-slate-500 mt-4">No upcoming appointments</ThemedText>
            </View>
          ) : (
            appointments.map((apt) => (
              <TouchableOpacity
                key={apt.id}
                onPress={() => router.push({ pathname: '/(tabs)/servicesmob', params: { appointmentId: apt.id.toString() } })}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
              >
                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                  <MaterialIcons name="event" size={24} color="#2563eb" />
                </View>
                <View className="flex-1 ml-3">
                  <ThemedText className="font-bold text-slate-800 dark:text-white">
                    {apt.petName}
                  </ThemedText>
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="schedule" size={14} color="#64748b" />
                    <ThemedText className="text-slate-500 text-sm ml-1">
                      {apt.date}, {apt.time}
                    </ThemedText>
                  </View>
                  {/* Display services if multiple */}
                  {apt.services && apt.services.length > 0 && (
                    <View className="flex-row flex-wrap mt-1">
                      {apt.services.map((service, index) => (
                        <View key={index} className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded mr-1 mb-1">
                          <ThemedText className="text-xs text-blue-600 dark:text-blue-400">
                            {service}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Services */}
        <View className="px-4 mt-6">
          <ThemedText className="text-lg font-bold text-slate-800 dark:text-white mb-3">
            Our Services
          </ThemedText>
          {servicesLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#2563eb" />
              <ThemedText className="text-slate-400 mt-4">Loading services...</ThemedText>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {services.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    console.log('Service clicked:', service.type_name, service.description);
                    setSelectedService(service);
                    setModalVisible(true);
                  }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex-1 min-w-[45%]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
                >
                  <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                    <MaterialIcons name={getServiceIcon(service.type_name) as any} size={20} color="#2563eb" />
                  </View>
                  <ThemedText className="font-bold text-slate-800 dark:text-white text-center">
                    {service.type_name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Service Details Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 items-center justify-center bg-black/50">
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4 max-w-sm w-full">
              <View className="flex-row items-center justify-between mb-4">
                <ThemedText className="text-xl font-bold text-slate-800 dark:text-white">
                  {selectedService?.type_name}
                </ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View className="w-16 h-16 bg-blue-50 rounded-xl items-center justify-center mb-4 mx-auto" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                <MaterialIcons name={getServiceIcon(selectedService?.type_name) as any} size={32} color="#2563eb" />
              </View>
              <ThemedText className="text-slate-600 dark:text-slate-300 text-center leading-6">
                {(() => {
                  console.log('Modal showing service:', selectedService?.type_name, selectedService?.description);
                  const specificDesc = getServiceDescription(selectedService?.type_name);
                  console.log('Specific description:', specificDesc);
                  // Use specific description if it's not the default, otherwise use API description
                  if (specificDesc && !specificDesc.includes('Compassionate care')) {
                    return specificDesc;
                  }
                  return selectedService?.description || specificDesc;
                })()}
              </ThemedText>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/servicesmob')}
                className="bg-blue-600 rounded-xl py-3 mt-6"
              >
                <ThemedText className="text-white font-semibold text-center">
                  Book This Service
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Tips Card */}
        <View className="px-4 mt-6 mb-8">
          <View className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <MaterialIcons name="lightbulb" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <ThemedText className="text-white font-bold text-lg mb-1">
                  Animal Care Tip
                </ThemedText>
                <ThemedText className="text-sm leading-5" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {animalCareTips[currentTipIndex]?.message || 'Regular check-ups help prevent serious health issues. Book your animal\'s next visit today!'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
