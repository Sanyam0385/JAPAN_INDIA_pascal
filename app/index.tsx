// Root index — redirect based on auth state
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  switch (user.role) {
    case 'household':
      return <Redirect href="/(household)/dashboard" />;
    case 'formal_collector':
      return <Redirect href="/(collector)/today" />;
    case 'informal_picker':
      return <Redirect href="/(picker)/opportunities" />;
    case 'municipal_admin':
      return <Redirect href="/(admin)/overview" />;
    default:
      return <Redirect href="/(auth)/welcome" />;
  }
}
