import { View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Linking } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { showToast } from '@/components/Toast';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useRouter } from 'expo-router';

const MENU_ITEMS = [
  { icon: 'person', label: 'Edit Profile', color: '#3b82f6', action: 'edit' },
  { icon: 'pets', label: 'My Animals', color: '#f59e0b', action: 'animals' },
  { icon: 'history', label: 'Visit History', color: '#8b5cf6', action: 'history' },
  { icon: 'payment', label: 'Payment Methods', color: '#10b981', action: 'payment' },
];

const SUPPORT_ITEMS = [
  { icon: 'chat', label: 'Contact Us', color: '#64748b', action: 'contact' },
];

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [upcomingVisits, setUpcomingVisits] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editBarangay, setEditBarangay] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [barangaysLoading, setBarangaysLoading] = useState(false);
  const [fullProfileData, setFullProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch barangays
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        setBarangaysLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/mobile/barangays`);
        if (response.data.success) {
          setBarangays(response.data.barangays || []);
        }
      } catch (error) {
        console.error('Failed to fetch barangays:', error);
      } finally {
        setBarangaysLoading(false);
      }
    };
    fetchBarangays();
  }, []);

  // Fetch user statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user || !token) return;
      
      try {
        const [animalsRes, appointmentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/mobile/animals`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/mobile/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Set animal count
        if (animalsRes.data.success) {
          setTotalAnimals(animalsRes.data.pets?.length || 0);
        } else {
          console.log('Animals API response:', animalsRes.data);
          showToast({
            type: 'error',
            message: 'Failed to load animals data'
          });
        }

        // Set visit statistics
        if (appointmentsRes.data.success) {
          const appointments = appointmentsRes.data.appointments || [];
          setTotalVisits(appointments.length);
          
          // Count upcoming appointments (approved or pending)
          const upcomingCount = appointments.filter((apt: any) => 
            apt.status === 'approved' || apt.status === 'pending'
          ).length;
          setUpcomingVisits(upcomingCount);
        } else {
          console.log('Appointments API response:', appointmentsRes.data);
          showToast({
            type: 'error',
            message: 'Failed to load appointments data'
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch statistics:', error);
        // Handle 401 Unauthorized error
        if (error.response?.status === 401) {
          showToast({
            type: 'error',
            message: 'Session expired. Please log in again.'
          });
          // Optional: Clear invalid token and redirect to login
          setTimeout(() => {
            logout();
          }, 2000);
        }
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistics();
  }, [user?.id, token]);

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'animals':
        router.push('/animals');
        break;
      case 'edit':
        fetchFullProfile();
        break;
      case 'history':
        router.push('/servicesmob');
        break;
      case 'payment':
        setShowPaymentModal(true);
        break;
      case 'contact':
        setShowContactModal(true);
        break;
      default:
        break;
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showToast({ type: 'error', message: 'Name is required' });
      return;
    }

    setEditLoading(true);
    try {
      const updateData: any = {
        name: editName.trim(),
        firstname: editFirstName.trim(),
        lastname: editLastName.trim(),
        middlename: editMiddleName.trim(),
        phone_number: editPhone.trim(),
        facebook: editFacebook.trim(),
        zone: editZone,
      };

      if (editAge) {
        updateData.age = parseInt(editAge);
      }
      if (editBarangay) {
        updateData.barangay_id = editBarangay;
      }

      const response = await axios.put(`${API_BASE_URL}/api/mobile/user`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast({ type: 'success', message: 'Profile updated successfully' });
        setShowEditModal(false);
      } else {
        showToast({ type: 'error', message: response.data.error || 'Failed to update profile' });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      showToast({ type: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setEditLoading(false);
    }
  };

  const fetchFullProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mobile/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFullProfileData(response.data.user);
        setShowProfileDetail(true);
      } else {
        showToast({ type: 'error', message: 'Failed to load profile data' });
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      showToast({ type: 'error', message: 'Failed to load profile data' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenFacebook = () => {
    const facebookUrl = 'https://www.facebook.com/mark.lorence.loncion.2024';
    Linking.openURL(facebookUrl).catch((err) => {
      console.error('Failed to open Facebook:', err);
      showToast({ type: 'error', message: 'Unable to open Facebook' });
    });
    setShowContactModal(false);
  };

  const handleOpenInstagram = () => {
    const instagramUrl = 'https://www.instagram.com/shan.onlyme/?hl=en';
    Linking.openURL(instagramUrl).catch((err) => {
      console.error('Failed to open Instagram:', err);
      showToast({ type: 'error', message: 'Unable to open Instagram' });
    });
    setShowContactModal(false);
  };

  const handleOpenEditModal = () => {
    setEditName(fullProfileData?.name || '');
    setEditFirstName(fullProfileData?.firstname || '');
    setEditLastName(fullProfileData?.lastname || '');
    setEditMiddleName(fullProfileData?.middlename || '');
    setEditAge(fullProfileData?.age?.toString() || '');
    setEditPhone(fullProfileData?.phone_number || '');
    setEditFacebook(fullProfileData?.facebook || '');
    setEditBarangay(fullProfileData?.barangay_id || '');
    setEditZone(fullProfileData?.zone || '');
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              showToast({ type: 'success', message: 'Logged out successfully' });
            } catch (error) {
              showToast({ type: 'error', message: 'Failed to logout. Please try again.' });
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity 
      className="flex-row items-center px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-700/50"
      onPress={onPress}
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: color + '20' }}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <ThemedText className="flex-1 ml-3 text-slate-700 dark:text-slate-300 font-medium">
        {label}
      </ThemedText>
      <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <ThemedText className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-4">
      {title}
    </ThemedText>
  );

  return (
    <ThemedView className="flex-1 bg-slate-100 dark:bg-slate-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View className="bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl">
          <View className="items-center">
            <View className="w-28 h-28 bg-white rounded-full items-center justify-center mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
              <MaterialIcons name="person" size={56} color="#2563eb" />
            </View>
            <ThemedText className="text-2xl font-bold text-white">
              {user?.name || 'User'}
            </ThemedText>
            <ThemedText className="text-blue-100 mt-1">
              {user?.email || 'user@example.com'}
            </ThemedText>
            
            {/* Stats Row */}
            <View className="flex-row mt-4 gap-6">
              <View className="items-center">
                <ThemedText className="text-white text-xl font-bold">{statsLoading ? '...' : totalAnimals}</ThemedText>
                <ThemedText className="text-blue-200 text-xs">Animals</ThemedText>
              </View>
              <View className="items-center">
                <ThemedText className="text-white text-xl font-bold">{statsLoading ? '...' : totalVisits}</ThemedText>
                <ThemedText className="text-blue-200 text-xs">Total Visits</ThemedText>
              </View>
              <View className="items-center">
                <ThemedText className="text-white text-xl font-bold">{statsLoading ? '...' : upcomingVisits}</ThemedText>
                <ThemedText className="text-blue-200 text-xs">Upcoming</ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 pb-8">
          {/* Quick Actions */}
          <SectionHeader title="Account" />
          <View className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            {MENU_ITEMS.map((item, index) => (
              <View key={item.action}>
                <MenuItem {...item} onPress={() => handleMenuPress(item.action)} />
                {index < MENU_ITEMS.length - 1 && (
                  <View className="h-px bg-slate-100 dark:bg-slate-700 ml-14" />
                )}
              </View>
            ))}
          </View>

          {/* Support */}
          <SectionHeader title="Support" />
          <View className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            {SUPPORT_ITEMS.map((item, index) => (
              <View key={item.label}>
                <MenuItem {...item} onPress={() => handleMenuPress(item.action)} />
                {index < SUPPORT_ITEMS.length - 1 && (
                  <View className="h-px bg-slate-100 dark:bg-slate-700 ml-14" />
                )}
              </View>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-4 flex-row items-center justify-center"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <ThemedText className="text-red-500 font-semibold ml-2">
              Sign Out
            </ThemedText>
          </TouchableOpacity>

          {/* App Info */}
          <View className="items-center mt-8">
            <ThemedText className="text-slate-400 text-sm">
              VetMob v1.0.0
            </ThemedText>
            <ThemedText className="text-slate-300 text-xs mt-1">
              Made with ❤️ for pet lovers
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4 max-w-sm w-full">
            <View className="items-center mb-4">
              <MaterialIcons name="payment" size={48} color="#10b981" />
            </View>
            <ThemedText className="text-lg font-semibold text-center mb-3 text-slate-800 dark:text-slate-200">
              Payment Information
            </ThemedText>
            <ThemedText className="text-center text-slate-600 dark:text-slate-400 mb-6 leading-6">
              You pay with cash for animal registration when you visit the vet clinic. This makes things simple and safe. Our team can focus on taking good care of your pets.
            </ThemedText>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              className="bg-blue-600 rounded-xl py-3 px-6"
            >
              <ThemedText className="text-white font-semibold text-center">
                OK
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Detail Modal */}
      <Modal
        visible={showProfileDetail}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileDetail(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <ScrollView 
            className="flex-1 w-full"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
          >
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4">
              <View className="items-center mb-6">
                <MaterialIcons name="person" size={56} color="#3b82f6" />
              </View>
              <ThemedText className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-200">
                My Profile
              </ThemedText>

              {profileLoading ? (
                <View className="items-center py-8">
                  <ThemedText className="text-slate-600 dark:text-slate-400">
                    Loading profile data...
                  </ThemedText>
                </View>
              ) : (
                <View className="space-y-4">
                {/* Name */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Name
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.name || '-'}
                  </ThemedText>
                </View>

                {/* First Name */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    First Name
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.firstname || '-'}
                  </ThemedText>
                </View>

                {/* Last Name */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Last Name
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.lastname || '-'}
                  </ThemedText>
                </View>

                {/* Middle Name */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Middle Name
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.middlename || '-'}
                  </ThemedText>
                </View>

                {/* Email */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Email
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.email || '-'}
                  </ThemedText>
                </View>

                {/* Age */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Age
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.age || '-'}
                  </ThemedText>
                </View>

                {/* Phone Number */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Phone Number
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.phone_number || '-'}
                  </ThemedText>
                </View>

                {/* Facebook */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Facebook
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.facebook || '-'}
                  </ThemedText>
                </View>

                {/* Barangay */}
                <View className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Barangay
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.barangay_id || '-'}
                  </ThemedText>
                </View>

                {/* Zone */}
                <View className="mb-6">
                  <ThemedText className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Zone
                  </ThemedText>
                  <ThemedText className="text-base text-slate-800 dark:text-slate-200">
                    {fullProfileData?.zone || '-'}
                  </ThemedText>
                </View>
              </View>
              )}

              <View className="flex-row mt-6">
                <TouchableOpacity
                  onPress={() => setShowProfileDetail(false)}
                  className="flex-1 bg-slate-300 dark:bg-slate-600 rounded-xl py-3 px-6 mr-3"
                >
                  <ThemedText className="text-slate-700 dark:text-slate-300 font-semibold text-center">
                    Close
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowProfileDetail(false);
                    handleOpenEditModal();
                  }}
                  className="flex-1 bg-blue-600 rounded-xl py-3 px-6"
                >
                  <ThemedText className="text-white font-semibold text-center">
                    Edit
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <ScrollView 
            className="flex-1 w-full"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
          >
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4">
              <View className="items-center mb-4">
                <MaterialIcons name="person" size={48} color="#3b82f6" />
              </View>
              <ThemedText className="text-lg font-semibold text-center mb-4 text-slate-800 dark:text-slate-200">
                Edit Profile
              </ThemedText>

              <View>
                {/* Name */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Name
                  </ThemedText>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter your name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* First Name */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    First Name
                  </ThemedText>
                  <TextInput
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter first name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Last Name */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Last Name
                  </ThemedText>
                  <TextInput
                    value={editLastName}
                    onChangeText={setEditLastName}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter last name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Middle Name */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Middle Name
                  </ThemedText>
                  <TextInput
                    value={editMiddleName}
                    onChangeText={setEditMiddleName}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter middle name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Age */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Age
                  </ThemedText>
                  <TextInput
                    value={editAge}
                    onChangeText={setEditAge}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter age"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>

                {/* Phone Number */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Phone Number
                  </ThemedText>
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter phone number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Facebook */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Facebook
                  </ThemedText>
                  <TextInput
                    value={editFacebook}
                    onChangeText={setEditFacebook}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700"
                    placeholder="Enter Facebook name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Barangay Dropdown */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Barangay
                  </ThemedText>
                  <View className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 overflow-hidden">
                    <Picker
                      selectedValue={editBarangay}
                      onValueChange={(itemValue: string) => setEditBarangay(itemValue)}
                      style={{
                        color: '#1e293b',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <Picker.Item label="Select Barangay" value="" />
                      {barangays.map((barangay) => (
                        <Picker.Item key={barangay.id} label={barangay.name} value={barangay.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Zone Dropdown */}
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Zone
                  </ThemedText>
                  <View className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 overflow-hidden">
                    <Picker
                      selectedValue={editZone}
                      onValueChange={(itemValue: string) => setEditZone(itemValue)}
                      style={{
                        color: '#1e293b',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <Picker.Item label="Select Zone" value="" />
                      <Picker.Item label="Zone 1" value="Zone 1" />
                      <Picker.Item label="Zone 2" value="Zone 2" />
                      <Picker.Item label="Zone 3" value="Zone 3" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View className="flex-row mt-6">
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-300 dark:bg-slate-600 rounded-xl py-3 px-6 mr-3"
                  disabled={editLoading}
                >
                  <ThemedText className="text-slate-700 dark:text-slate-300 font-semibold text-center">
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  className="flex-1 bg-blue-600 rounded-xl py-3 px-6"
                  disabled={editLoading}
                >
                  <ThemedText className="text-white font-semibold text-center">
                    {editLoading ? 'Saving...' : 'Save'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4 max-w-sm w-full">
            <View className="items-center mb-6">
              <MaterialIcons name="contact-mail" size={48} color="#3b82f6" />
            </View>
            <ThemedText className="text-lg font-semibold text-center mb-4 text-slate-800 dark:text-slate-200">
              Contact Us
            </ThemedText>
            <ThemedText className="text-center text-slate-600 dark:text-slate-400 mb-6 leading-6">
              Please login to our social media accounts first to get the latest updates and connect with us!
            </ThemedText>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleOpenFacebook}
                className="flex-row items-center bg-blue-600 rounded-xl py-3 px-4"
              >
                <MaterialIcons name="facebook" size={24} color="#ffffff" />
                <ThemedText className="text-white font-semibold ml-3 flex-1">
                  Facebook
                </ThemedText>
                <MaterialIcons name="open-in-new" size={20} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenInstagram}
                className="flex-row items-center bg-pink-600 rounded-xl py-3 px-4"
              >
                <MaterialIcons name="photo-camera" size={24} color="#ffffff" />
                <ThemedText className="text-white font-semibold ml-3 flex-1">
                  Instagram
                </ThemedText>
                <MaterialIcons name="open-in-new" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowContactModal(false)}
              className="mt-6 bg-slate-300 dark:bg-slate-600 rounded-xl py-3 px-6"
            >
              <ThemedText className="text-slate-700 dark:text-slate-300 font-semibold text-center">
                Close
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
