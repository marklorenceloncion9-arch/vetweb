// Simple API Configuration
// Edit this to match your setup

import { Platform } from 'react-native';

// Your computer's IP address (for mobile simulators/devices)
const COMPUTER_IP = '10.149.15.230';

// For web development, use localhost
const WEB_IP = 'localhost';

// XAMPP port (usually 80, or 8080 if you changed it)
const PORT = '';

// Project path - change if your Laravel is in a different folder
// Use '' if Laravel is at root, or '/Project/vetweb/public' if in subdirectory
const PROJECT_PATH = '/Project/vetweb/public';

// API base URL - automatically chooses based on platform
const BASE_IP = Platform.OS === 'web' ? WEB_IP : COMPUTER_IP;
export const API_BASE_URL = `http://${BASE_IP}${PORT ? ':' + PORT : ''}${PROJECT_PATH}`;

// Example: http://192.168.0.102/api/mobile/register
export const API_URLS = {
  barangays: `${API_BASE_URL}/api/mobile/barangays`,
  login: `${API_BASE_URL}/api/mobile/login`,
  register: `${API_BASE_URL}/api/mobile/register`,
  logout: `${API_BASE_URL}/api/mobile/logout`,
  user: `${API_BASE_URL}/api/mobile/user`,
};
