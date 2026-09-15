import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3867D6',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workout',
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
        }}
      />
      <Tabs.Screen name="splits" options={{ title: 'Splits' }} />
    </Tabs>
  );
}
