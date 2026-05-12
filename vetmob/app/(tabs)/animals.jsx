import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import { API_BASE_URL } from '@/config/api';
import { showToast } from '@/components/Toast';
const DateTimePicker = Platform.OS !== 'web' ? require('@react-native-community/datetimepicker').default : null;

export default function AnimalsScreen() {
  const { token, user, logout } = useAuth();
  const [activeAnimals, setActiveAnimals] = useState([]);
  const [archivedAnimals, setArchivedAnimals] = useState([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const animals = showArchived ? archivedAnimals : activeAnimals;
  const loading = showArchived ? archivedLoading : activeLoading;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDewormingDatePicker, setShowDewormingDatePicker] = useState(false);
  const [showRabiesDatePicker, setShowRabiesDatePicker] = useState(false);
  const [showDhpplDatePicker, setShowDhpplDatePicker] = useState(false);
  const [showOtherVaccineDatePicker, setShowOtherVaccineDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isWeb = Platform.OS === 'web';

  const promptDate = (field) => {
    if (isWeb && typeof prompt === 'function') {
      const value = prompt('Enter date in YYYY-MM-DD format', newAnimal[field] || '');
      if (value) {
        setNewAnimal({ ...newAnimal, [field]: value });
      }
    }
  };
  
  // Form state - matching admin fields
  const [newAnimal, setNewAnimal] = useState({
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
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch animals on mount and when archive toggle changes (if not already cached)
  useEffect(() => {
    if (showArchived && archivedAnimals.length === 0 && archivedLoading) {
      fetchAnimals(true);
    } else if (!showArchived && activeAnimals.length === 0 && activeLoading) {
      fetchAnimals(false);
    }
    fetchSpecies();
  }, [showArchived]);

  // Pull to refresh - force refetch current tab
  const onRefresh = async () => {
    setRefreshing(true);
    if (showArchived) {
      setArchivedLoading(true);
      await fetchAnimals(true);
    } else {
      setActiveLoading(true);
      await fetchAnimals(false);
    }
    setRefreshing(false);
  };

  // Fetch breeds when species changes
  useEffect(() => {
    if (newAnimal.species_id) {
      fetchBreeds(newAnimal.species_id);
    } else {
      setBreeds([]);
    }
  }, [newAnimal.species_id]);

  const fetchAnimals = async (archived) => {
    try {
      // Check if token exists before making request
      if (!token) {
        console.log('No authentication token available');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/mobile/animals?archived=${archived}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        if (archived) {
          setArchivedAnimals(response.data.animals || response.data.pets || []);
        } else {
          setActiveAnimals(response.data.animals || response.data.pets || []);
        }
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      
      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        console.log('Authentication failed - token may be expired');
        // Trigger logout to force re-authentication
        logout();
      }
    } finally {
      if (archived) {
        setArchivedLoading(false);
      } else {
        setActiveLoading(false);
      }
    }
  };

  const archiveAnimal = async (id, name) => {
    Alert.alert(
      'Archive Animal',
      `Archive ${name}? (You can restore it later)`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          style: 'default', 
          onPress: async () => {
            try {
              await axios.post(`${API_BASE_URL}/api/mobile/animals/${id}/archive`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              // Move animal from active to archived locally
              const movedAnimal = activeAnimals.find(a => a.id === id);
              if (movedAnimal) {
                setActiveAnimals(activeAnimals.filter(a => a.id !== id));
                setArchivedAnimals([{ ...movedAnimal, registration_status: 'archived' }, ...archivedAnimals]);
              }
              showToast({ type: 'success', message: 'Animal archived successfully' });
            } catch (error) {
              console.error('Archive error:', error.response?.data || error.message);
              showToast({ type: 'error', message: error.response?.data?.error || error.response?.data?.message || 'Failed to archive animal' });
            }
          }
        }
      ]
    );
  };

  const unarchiveAnimal = async (id, name) => {
    Alert.alert(
      'Restore Animal',
      `Restore ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          style: 'default', 
          onPress: async () => {
            try {
              await axios.post(`${API_BASE_URL}/api/mobile/animals/${id}/unarchive`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              // Move animal from archived to active locally
              const movedAnimal = archivedAnimals.find(a => a.id === id);
              if (movedAnimal) {
                setArchivedAnimals(archivedAnimals.filter(a => a.id !== id));
                setActiveAnimals([{ ...movedAnimal, registration_status: 'pending' }, ...activeAnimals]);
              }
              showToast({ type: 'success', message: 'Animal restored successfully' });
            } catch (error) {
              console.error('Unarchive error:', error.response?.data || error.message);
              showToast({ type: 'error', message: error.response?.data?.error || error.response?.data?.message || 'Failed to restore animal' });
            }
          }
        }
      ]
    );
  };

  const onDateChange = (field) => (event, date) => {
    // Close all date pickers
    setShowDatePicker(false);
    setShowDewormingDatePicker(false);
    setShowRabiesDatePicker(false);
    setShowDhpplDatePicker(false);
    setShowOtherVaccineDatePicker(false);
    
    if (date) {
      setSelectedDate(date);
      const formatted = date.toISOString().split('T')[0];
      setNewAnimal({ ...newAnimal, [field]: formatted });
    }
  };

  const fetchSpecies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/species`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSpecies(response.data.species);
      }
    } catch (error) {
      console.error('Error fetching species:', error);
    }
  };

  const fetchBreeds = async (speciesId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/species/${speciesId}/breeds`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBreeds(response.data.breeds);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  const addAnimal = async () => {
    if (!newAnimal.pet_name || !newAnimal.species_id || !newAnimal.breed_id) {
      Alert.alert('Error', 'Please fill in animal name, species, and breed');
      return;
    }

    setAdding(true);
    try {
      let response;

      if (isEditMode && selectedAnimal?.id) {
        response = await axios.put(`${API_BASE_URL}/api/mobile/animals/${selectedAnimal.id}`, newAnimal, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/api/mobile/animals`, newAnimal, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        const savedAnimal = response.data.animal || response.data.pet || response.data.updated_animal || response.data.data || response.data;

        if (isEditMode) {
          updateLocalAnimal(savedAnimal);
          setSelectedAnimal(savedAnimal);
          showToast({ type: 'success', message: 'Animal updated successfully!' });
        } else {
          setActiveAnimals([savedAnimal, ...activeAnimals]);
          showToast({ type: 'success', message: 'Animal added successfully!' });
        }

        setNewAnimal({
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
        setModalVisible(false);
        setIsEditMode(false);
        setSelectedAnimal(null);
      }
    } catch (error) {
      showToast({ type: 'error', message: error.response?.data?.error || 'Failed to save animal' });
    } finally {
      setAdding(false);
    }
  };

  const updateLocalAnimal = (updatedAnimal) => {
    setActiveAnimals((prev) => prev.map((animal) => animal.id === updatedAnimal.id ? updatedAnimal : animal));
    setArchivedAnimals((prev) => prev.map((animal) => animal.id === updatedAnimal.id ? updatedAnimal : animal));
  };

  const openAnimalDetail = (animal) => {
    setSelectedAnimal(animal);
    setShowDetailModal(true);
  };

  const handleEditAnimal = () => {
    if (!selectedAnimal) return;

    setNewAnimal({
      pet_name: selectedAnimal.pet_name || '',
      species_id: String(selectedAnimal.species_id || selectedAnimal.species?.id || ''),
      breed_id: String(selectedAnimal.breed_id || selectedAnimal.breed?.id || ''),
      sex: selectedAnimal.sex || 'male',
      color: selectedAnimal.color || '',
      weight: selectedAnimal.weight || '',
      birthdate: selectedAnimal.birthdate || '',
      reproductive_status: selectedAnimal.reproductive_status || '',
      weeks_months: selectedAnimal.weeks_months || '',
      diet: selectedAnimal.diet || '',
      diet_other: selectedAnimal.diet_other || '',
      dewormed: selectedAnimal.dewormed || '',
      last_deworming_date: selectedAnimal.last_deworming_date || '',
      dewormer_name: selectedAnimal.dewormer_name || '',
      rabies_vaccine: selectedAnimal.rabies_vaccine || '',
      rabies_last_vaccination: selectedAnimal.rabies_last_vaccination || '',
      dhppl_vaccine: selectedAnimal.dhppl_vaccine || '',
      dhppl_last_vaccination: selectedAnimal.dhppl_last_vaccination || '',
      other_vaccine_name: selectedAnimal.other_vaccine_name || '',
      other_vaccine_last_vaccination: selectedAnimal.other_vaccine_last_vaccination || '',
    });
    setIsEditMode(true);
    setShowDetailModal(false);
    setModalVisible(true);
  };

  const filteredAnimals = animals.filter(animal => 
    animal.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    animal.species?.species_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    animal.breed?.breed_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered': return 'bg-green-100 text-green-600';
      case 'declined': return 'bg-red-100 text-red-600';
      case 'exempt': return 'bg-blue-100 text-blue-600';
      default: return 'bg-yellow-100 text-yellow-600';
    }
  };

  return (
    <ThemedView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-4">
          <ThemedText className="text-2xl font-bold text-white">My Animals</ThemedText>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="p-2 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <MaterialIcons name="search" size={20} color="#ffffff" />
          <TextInput
            className="flex-1 ml-3 text-base text-white"
            placeholder="Search animals..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="mx-4 mt-4">
        <View className="flex-row bg-white rounded-xl border border-slate-200 p-1" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
          {/* My Animals Tab */}
          <TouchableOpacity
            onPress={() => setShowArchived(false)}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${!showArchived ? 'bg-blue-600' : 'bg-transparent'}`}
          >
            <MaterialIcons 
              name="pets" 
              size={18} 
              color={!showArchived ? '#ffffff' : '#64748b'} 
            />
            <ThemedText className={`ml-2 text-sm font-semibold ${!showArchived ? 'text-white' : 'text-slate-800'}`}>
              My Animals
            </ThemedText>
            <View className={`ml-2 px-2 py-0.5 rounded-full ${!showArchived && animals.length > 0 ? '' : 'opacity-0'}`} style={!showArchived && animals.length > 0 ? { backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}>
              <ThemedText className="text-xs font-bold text-white">{animals.length || 0}</ThemedText>
            </View>
          </TouchableOpacity>

          {/* Archived Tab */}
          <TouchableOpacity
            onPress={() => setShowArchived(true)}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${showArchived ? 'bg-blue-600' : 'bg-transparent'}`}
          >
            <MaterialIcons 
              name="archive" 
              size={18} 
              color={showArchived ? '#ffffff' : '#64748b'} 
            />
            <ThemedText className={`ml-2 text-sm font-semibold ${showArchived ? 'text-white' : 'text-slate-800'}`}>
              Archived
            </ThemedText>
            <View className="ml-2 px-2 py-0.5 rounded-full opacity-0">
              <ThemedText className="text-xs font-bold text-white">0</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-3" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor="#2563eb" />}
      >
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#2563eb" />
            <ThemedText className="text-slate-400 mt-4">Loading animals...</ThemedText>
          </View>
        ) : filteredAnimals.length === 0 ? (
          <View className="items-center justify-center py-16">
            <MaterialIcons 
              name={showArchived ? 'inventory' : 'pets'} 
              size={72} 
              color={showArchived ? '#fbbf24' : '#cbd5e1'} 
            />
            <ThemedText className={`mt-6 text-center font-medium ${showArchived ? 'text-amber-700' : 'text-slate-500'}`}>
              {showArchived ? 'No Archived Animals' : 'No animals found'}
            </ThemedText>
            <ThemedText className="text-slate-400 mt-2 text-center text-sm">
              {showArchived 
                ? 'Archived animals will appear here' 
                : "Add your first animal by tapping the '+' button"}
            </ThemedText>
          </View>
        ) : (
          filteredAnimals.map((animal) => (
            <TouchableOpacity
              key={animal.id}
              onPress={() => openAnimalDetail(animal)}
              activeOpacity={0.85}
              className={`rounded-2xl p-4 mb-3 ${showArchived ? 'bg-slate-50 border border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800'}`}
              style={{ 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}
            >
              {/* Archived Badge */}
              {showArchived && (
                <View className="absolute top-3 right-3 flex-row items-center bg-amber-100 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-700" style={{ backgroundColor: showArchived ? undefined : 'rgba(217, 119, 6, 0.5)' }}>
                  <MaterialIcons name="archive" size={12} color="#d97706" />
                  <ThemedText className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-400">ARCHIVED</ThemedText>
                </View>
              )}
              
              <View className="flex-row items-center">
                {/* Animal Avatar */}
                <View className={`w-16 h-16 rounded-2xl items-center justify-center ${showArchived ? 'bg-slate-200 dark:bg-slate-700' : getStatusColor(animal.registration_status).split(' ')[0]}`}>
                  <MaterialIcons 
                    name="pets" 
                    size={32} 
                    color={showArchived ? '#94a3b8' : animal.registration_status === 'registered' ? '#16a34a' : animal.registration_status === 'exempt' ? '#2563eb' : animal.registration_status === 'declined' ? '#dc2626' : '#ca8a04'} 
                  />
                </View>

                {/* Animal Info */}
                <View className="flex-1 ml-4">
                  <View className="flex-row items-center flex-wrap">
                    <ThemedText className={`text-lg font-bold ${showArchived ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                      {animal.pet_name}
                    </ThemedText>
                    {!showArchived && (
                      <View className={`ml-2 px-2 py-0.5 rounded-full ${getStatusColor(animal.registration_status)}`}>
                        <ThemedText className="text-xs capitalize">{animal.registration_status === 'exempt' ? 'Exempt' : animal.registration_status}</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText className={`text-sm ${showArchived ? 'text-slate-400' : 'text-slate-500'}`}>
                    {animal.species?.species_name} • {animal.breed?.breed_name}
                  </ThemedText>
                  <View className="flex-row items-center mt-1">
                    {animal.weight && (
                      <>
                        <MaterialIcons name="scale" size={12} color={showArchived ? '#cbd5e1' : '#94a3b8'} />
                        <ThemedText className={`text-xs ml-1 ${showArchived ? 'text-slate-400' : 'text-slate-400'}`}>{animal.weight} kg</ThemedText>
                        <View className={`w-1 h-1 rounded-full mx-2 ${showArchived ? 'bg-slate-300' : 'bg-slate-300'}`} />
                      </>
                    )}
                    <MaterialIcons name={animal.sex === 'male' ? 'male' : 'female'} size={12} color={showArchived ? '#cbd5e1' : '#94a3b8'} />
                    <ThemedText className={`text-xs ml-1 capitalize ${showArchived ? 'text-slate-400' : 'text-slate-400'}`}>{animal.sex}</ThemedText>
                  </View>
                </View>

                {/* Actions */}
                {showArchived ? (
                  <TouchableOpacity 
                    onPress={() => unarchiveAnimal(animal.id, animal.pet_name)}
                    className="flex-row items-center bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700"
                  >
                    <MaterialIcons name="restore" size={16} color="#2563eb" />
                    <ThemedText className="ml-1.5 text-sm font-medium text-blue-700 dark:text-blue-400">Restore</ThemedText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={() => archiveAnimal(animal.id, animal.pet_name)}
                    className="p-2"
                  >
                    <MaterialIcons name="archive" size={20} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        
        <View className="h-6" />
      </ScrollView>

      {/* Add Animal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDetailModal}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <ThemedText className="text-xl font-bold text-slate-800 dark:text-white">Animal Info</ThemedText>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedAnimal ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.pet_name}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Species</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.species?.species_name || '-'}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Breed</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.breed?.breed_name || '-'}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white capitalize">{selectedAnimal.sex || '-'}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.color || '-'}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.weight ? `${selectedAnimal.weight} kg` : '-'}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Birthdate</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.birthdate || '-'}</ThemedText>
                </View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reproductive Status</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white capitalize">{selectedAnimal.reproductive_status || '-'}</ThemedText>
                </View>
                {selectedAnimal.weeks_months ? (
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weeks/Months</ThemedText>
                    <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.weeks_months}</ThemedText>
                  </View>
                ) : null}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diet</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white capitalize">{selectedAnimal.diet || '-'}</ThemedText>
                </View>
                {selectedAnimal.diet === 'others' && (
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diet Details</ThemedText>
                    <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.diet_other || '-'}</ThemedText>
                  </View>
                )}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dewormed</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white capitalize">{selectedAnimal.dewormed || '-'}</ThemedText>
                </View>
                {selectedAnimal.dewormed === 'yes' && (
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Deworming</ThemedText>
                    <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.last_deworming_date || '-'}</ThemedText>
                  </View>
                )}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rabies Vaccine</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white capitalize">{selectedAnimal.rabies_vaccine || '-'}</ThemedText>
                </View>
                {selectedAnimal.rabies_vaccine === 'yes' && (
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rabies Last Vaccination</ThemedText>
                    <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.rabies_last_vaccination || '-'}</ThemedText>
                  </View>
                )}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DHPPL Vaccine</ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-white capitalize">{selectedAnimal.dhppl_vaccine || '-'}</ThemedText>
                </View>
                {selectedAnimal.dhppl_vaccine === 'yes' && (
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DHPPL Last Vaccination</ThemedText>
                    <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.dhppl_last_vaccination || '-'}</ThemedText>
                  </View>
                )}
                {selectedAnimal.other_vaccine_name && (
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Other Vaccine</ThemedText>
                    <ThemedText className="text-base text-slate-800 dark:text-white">{selectedAnimal.other_vaccine_name}</ThemedText>
                    <ThemedText className="text-sm text-slate-500 dark:text-slate-400">{selectedAnimal.other_vaccine_last_vaccination || '-'}</ThemedText>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleEditAnimal}
                  className="bg-blue-600 rounded-xl py-3 px-4 mt-4"
                >
                  <ThemedText className="text-white text-center font-semibold">Edit Animal</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <ThemedText className="text-xl font-bold text-slate-800 dark:text-white">{isEditMode ? 'Edit Animal' : 'Add New Animal'}</ThemedText>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setIsEditMode(false);
                setSelectedAnimal(null);
              }}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Animal Name */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Animal Name *</ThemedText>
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                  <MaterialIcons name="pets" size={20} color="#64748b" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                    placeholder="Enter animal name"
                    placeholderTextColor="#94a3b8"
                    value={newAnimal.pet_name}
                    onChangeText={(text) => setNewAnimal({ ...newAnimal, pet_name: text })}
                  />
                </View>
              </View>

              {/* Species Dropdown */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Species *</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <View className="flex-row gap-2">
                    {species.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => setNewAnimal({ ...newAnimal, species_id: String(s.id), breed_id: '' })}
                        className={`px-4 py-2 rounded-xl ${newAnimal.species_id === String(s.id) ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                      >
                        <ThemedText className={`${newAnimal.species_id === String(s.id) ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {s.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Breed Dropdown */}
              {newAnimal.species_id && breeds.length > 0 && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Breed *</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <View className="flex-row gap-2">
                      {breeds.map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => setNewAnimal({ ...newAnimal, breed_id: String(b.id) })}
                          className={`px-4 py-2 rounded-xl ${newAnimal.breed_id === String(b.id) ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                        >
                          <ThemedText className={`${newAnimal.breed_id === String(b.id) ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {b.name}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Sex */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sex *</ThemedText>
                <View className="flex-row gap-2">
                  {['male', 'female'].map((sex) => (
                    <TouchableOpacity
                      key={sex}
                      onPress={() => setNewAnimal({ ...newAnimal, sex })}
                      className={`px-4 py-2 rounded-xl ${newAnimal.sex === sex ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      <ThemedText className={`capitalize ${newAnimal.sex === sex ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {sex}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color & Weight Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</ThemedText>
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                    <MaterialIcons name="palette" size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="e.g. Brown"
                      placeholderTextColor="#94a3b8"
                      value={newAnimal.color}
                      onChangeText={(text) => setNewAnimal({ ...newAnimal, color: text })}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</ThemedText>
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                    <MaterialIcons name="scale" size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="e.g. 5"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={newAnimal.weight}
                      onChangeText={(text) => setNewAnimal({ ...newAnimal, weight: text })}
                    />
                  </View>
                </View>
              </View>

              {/* Birthdate with Calendar Picker */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Birthdate</ThemedText>
                <TouchableOpacity
                  onPress={() => isWeb ? promptDate('birthdate') : setShowDatePicker(true)}
                  className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
                >
                  <MaterialIcons name="calendar-today" size={20} color="#64748b" />
                  <ThemedText className={`flex-1 ml-3 text-base ${newAnimal.birthdate ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                    {newAnimal.birthdate || 'Select date'}
                  </ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                </TouchableOpacity>
                
                {!isWeb && showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange('birthdate')}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Reproductive Status */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reproductive Status</ThemedText>
                <View className="flex-row gap-2 flex-wrap">
                  {[
                    { key: 'pregnant', label: 'Pregnant' },
                    { key: 'nursing', label: 'Nursing' },
                    { key: 'not_pregnant', label: 'Not Pregnant' },
                  ].map((status) => (
                    <TouchableOpacity
                      key={status.key}
                      onPress={() => setNewAnimal({ ...newAnimal, reproductive_status: status.key })}
                      className={`px-4 py-2 rounded-xl ${newAnimal.reproductive_status === status.key ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      <ThemedText className={`${newAnimal.reproductive_status === status.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {status.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Weeks/Months */}
              {newAnimal.reproductive_status && newAnimal.reproductive_status !== 'not_pregnant' && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weeks/Months</ThemedText>
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                    <MaterialIcons name="schedule" size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="e.g. 8 weeks, 2 months"
                      placeholderTextColor="#94a3b8"
                      value={newAnimal.weeks_months}
                      onChangeText={(text) => setNewAnimal({ ...newAnimal, weeks_months: text })}
                    />
                  </View>
                </View>
              )}

              {/* Diet */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Diet</ThemedText>
                <View className="flex-row gap-2 flex-wrap">
                  {[
                    { key: 'commercial_food', label: 'Commercial Food' },
                    { key: 'table_food', label: 'Table Food' },
                    { key: 'both', label: 'Both' },
                    { key: 'others', label: 'Others' },
                  ].map((diet) => (
                    <TouchableOpacity
                      key={diet.key}
                      onPress={() => setNewAnimal({ ...newAnimal, diet: diet.key })}
                      className={`px-4 py-2 rounded-xl ${newAnimal.diet === diet.key ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      <ThemedText className={`${newAnimal.diet === diet.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {diet.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Diet Other (if others selected) */}
              {newAnimal.diet === 'others' && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Specify Diet</ThemedText>
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                    <MaterialIcons name="restaurant" size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="e.g. Raw diet, Homemade food"
                      placeholderTextColor="#94a3b8"
                      value={newAnimal.diet_other}
                      onChangeText={(text) => setNewAnimal({ ...newAnimal, diet_other: text })}
                    />
                  </View>
                </View>
              )}

              {/* Dewormed? */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dewormed?</ThemedText>
                <View className="flex-row gap-2">
                  {[
                    { key: 'yes', label: 'Yes' },
                    { key: 'no', label: 'No' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setNewAnimal({ ...newAnimal, dewormed: option.key })}
                      className={`px-4 py-2 rounded-xl ${newAnimal.dewormed === option.key ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      <ThemedText className={`${newAnimal.dewormed === option.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Last Deworming Date */}
              {newAnimal.dewormed === 'yes' && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Deworming Date</ThemedText>
                  <TouchableOpacity
                    onPress={() => isWeb ? promptDate('last_deworming_date') : setShowDewormingDatePicker(true)}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
                  >
                    <MaterialIcons name="event" size={20} color="#64748b" />
                    <ThemedText className={`flex-1 ml-3 text-base ${newAnimal.last_deworming_date ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                      {newAnimal.last_deworming_date || 'Select date'}
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                  </TouchableOpacity>
                  
                  {!isWeb && showDewormingDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange('last_deworming_date')}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              )}

              {/* Dewormer Name */}
              {newAnimal.dewormed === 'yes' && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dewormer Name</ThemedText>
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                    <MaterialIcons name="medication" size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="e.g. Drontal, Panacur"
                      placeholderTextColor="#94a3b8"
                      value={newAnimal.dewormer_name}
                      onChangeText={(text) => setNewAnimal({ ...newAnimal, dewormer_name: text })}
                    />
                  </View>
                </View>
              )}

              {/* Rabies Vaccine */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rabies Vaccine</ThemedText>
                <View className="flex-row gap-2">
                  {[
                    { key: 'yes', label: 'Yes' },
                    { key: 'no', label: 'No' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setNewAnimal({ ...newAnimal, rabies_vaccine: option.key })}
                      className={`px-4 py-2 rounded-xl ${newAnimal.rabies_vaccine === option.key ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      <ThemedText className={`${newAnimal.rabies_vaccine === option.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rabies Last Vaccination */}
              {newAnimal.rabies_vaccine === 'yes' && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rabies Last Vaccination Date</ThemedText>
                  <TouchableOpacity
                    onPress={() => isWeb ? promptDate('rabies_last_vaccination') : setShowRabiesDatePicker(true)}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
                  >
                    <MaterialIcons name="event" size={20} color="#64748b" />
                    <ThemedText className={`flex-1 ml-3 text-base ${newAnimal.rabies_last_vaccination ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                      {newAnimal.rabies_last_vaccination || 'Select date'}
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                  </TouchableOpacity>
                  
                  {!isWeb && showRabiesDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange('rabies_last_vaccination')}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              )}

              {/* DHPPL Vaccine */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">DHPPL Vaccine</ThemedText>
                <View className="flex-row gap-2">
                  {[
                    { key: 'yes', label: 'Yes' },
                    { key: 'no', label: 'No' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setNewAnimal({ ...newAnimal, dhppl_vaccine: option.key })}
                      className={`px-4 py-2 rounded-xl ${newAnimal.dhppl_vaccine === option.key ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      <ThemedText className={`${newAnimal.dhppl_vaccine === option.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* DHPPL Last Vaccination */}
              {newAnimal.dhppl_vaccine === 'yes' && (
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">DHPPL Last Vaccination Date</ThemedText>
                  <TouchableOpacity
                    onPress={() => isWeb ? promptDate('dhppl_last_vaccination') : setShowDhpplDatePicker(true)}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
                  >
                    <MaterialIcons name="event" size={20} color="#64748b" />
                    <ThemedText className={`flex-1 ml-3 text-base ${newAnimal.dhppl_last_vaccination ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                      {newAnimal.dhppl_last_vaccination || 'Select date'}
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                  </TouchableOpacity>
                  
                  {!isWeb && showDhpplDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange('dhppl_last_vaccination')}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              )}

              {/* Other Vaccine */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Other Vaccine Name</ThemedText>
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                  <MaterialIcons name="vaccines" size={20} color="#64748b" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                    placeholder="e.g. Bordetella, Leptospirosis"
                    placeholderTextColor="#94a3b8"
                    value={newAnimal.other_vaccine_name}
                    onChangeText={(text) => setNewAnimal({ ...newAnimal, other_vaccine_name: text })}
                  />
                </View>
              </View>

              {/* Other Vaccine Last Vaccination */}
              {newAnimal.other_vaccine_name && (
                <View className="mb-6">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Other Vaccine Last Date</ThemedText>
                  <TouchableOpacity
                    onPress={() => isWeb ? promptDate('other_vaccine_last_vaccination') : setShowOtherVaccineDatePicker(true)}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
                  >
                    <MaterialIcons name="event" size={20} color="#64748b" />
                    <ThemedText className={`flex-1 ml-3 text-base ${newAnimal.other_vaccine_last_vaccination ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                      {newAnimal.other_vaccine_last_vaccination || 'Select date'}
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                  </TouchableOpacity>
                  
                  {!isWeb && showOtherVaccineDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange('other_vaccine_last_vaccination')}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              )}

              {/* Add Button */}
              <TouchableOpacity
                onPress={addAnimal}
                disabled={adding}
                className="bg-blue-600 py-4 rounded-xl items-center"
              >
                {adding ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText className="text-white font-semibold text-base">{isEditMode ? 'Update Animal' : 'Add Animal'}</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
