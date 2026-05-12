import { useState, useEffect, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

let toastInstance: {
  show: (options: ToastOptions) => void;
  hide: () => void;
} | null = null;

export const showToast = (options: ToastOptions) => {
  toastInstance?.show(options);
};

export const hideToast = () => {
  toastInstance?.hide();
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  const show = useCallback((options: ToastOptions) => {
    setMessage(options.message);
    setType(options.type);
    setVisible(true);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    setTimeout(() => {
      hide();
    }, options.duration || 3000);
  }, []);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, []);

  useEffect(() => {
    toastInstance = { show, hide };
    return () => {
      toastInstance = null;
    };
  }, [show, hide]);

  const getIconName = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'error';
      case 'info': return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#16a34a';
      case 'error': return '#dc2626';
      case 'info': return '#2563eb';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#dcfce7';
      case 'error': return '#fee2e2';
      case 'info': return '#dbeafe';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success': return '#166534';
      case 'error': return '#991b1b';
      case 'info': return '#1e40af';
    }
  };

  if (!visible) return <>{children}</>;

  return (
    <>
      {children}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            opacity,
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        <View style={styles.content}>
          <MaterialIcons name={getIconName()} size={24} color={getIconColor()} />
          <Text style={[styles.message, { color: getTextColor() }]}>{message}</Text>
          <TouchableOpacity onPress={hide} style={styles.closeButton}>
            <MaterialIcons name="close" size={18} color={getTextColor()} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    marginTop: 50,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
});
