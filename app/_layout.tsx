import { Stack } from 'expo-router';
import 'react-native-reanimated';

 

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise' }} />
        <Stack.Screen name="split/[id]" options={{ title: 'Edit split' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
      </Stack>
  );
}
