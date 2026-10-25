// Root index — redirect based on auth state with zero blank white flash
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/welcome');
      return;
    }

    switch (user.role) {
      case 'household':
        router.replace('/(household)/dashboard');
        break;
      case 'formal_collector':
        router.replace('/(collector)/today');
        break;
      case 'informal_picker':
        router.replace('/(picker)/opportunities');
        break;
      case 'municipal_admin':
        router.replace('/(admin)/overview');
        break;
      case 'recycler':
        router.replace('/(recycler)/incoming' as any);
        break;
      default:
        router.replace('/(auth)/welcome');
        break;
    }
  }, [isReady, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

