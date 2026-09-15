import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';

import { colors, styles } from '@/constants/WorkoutStyles';
import { listSplits } from '@/lib/repos/splits';
import { getActiveWorkout, getWorkoutView, startWorkout } from '@/lib/repos/workouts';
import type { SplitWithDays, WorkoutView } from '@/lib/types';

export default function TabOneScreen() {
  const router = useRouter();
  const [splits, setSplits] = useState<SplitWithDays[]>([]);
  const [active, setActive] = useState<WorkoutView>();

  const refresh = useCallback(() => {
    setSplits(listSplits());
    const workout = getActiveWorkout();
    setActive(workout ? getWorkoutView(workout.id) : undefined);
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  function begin(dayId: number) {
    const workout = startWorkout(dayId);
    router.push(`/workout/${workout.id}`);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={splits}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Train today</Text>
            <Text style={styles.subtitle}>Choose a split day and make your next set count.</Text>
            {active && (
              <View style={[styles.card, { borderColor: colors.primary, marginTop: 20 }]}>
                <Text style={styles.cardTitle}>Active session</Text>
                <Text style={[styles.muted, { marginTop: 5 }]}>{active.dayName}</Text>
                <Pressable style={[styles.button, { marginTop: 14 }]} onPress={() => router.push(`/workout/${active.workout.id}`)}>
                  <Text style={styles.buttonText}>Resume workout</Text>
                </Pressable>
              </View>
            )}
            <Text style={styles.sectionTitle}>Start a workout</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Create a split and add exercises before starting a workout.</Text>
            <Pressable style={[styles.buttonSecondary, { marginTop: 14 }]} onPress={() => router.push('/splits')}>
              <Text style={styles.buttonSecondaryText}>Go to splits</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.days.length === 0 ? (
              <Text style={[styles.muted, { marginTop: 6 }]}>Add days in the split editor.</Text>
            ) : (
              item.days.map((day) => (
                <View key={day.id} style={[styles.row, { justifyContent: 'space-between', marginTop: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.ink, fontWeight: '700' }}>{day.name}</Text>
                    <Text style={[styles.muted, { marginTop: 3 }]}>{day.exercises.length} exercises</Text>
                  </View>
                  <Pressable style={styles.buttonSecondary} onPress={() => begin(day.id)}>
                    <Text style={styles.buttonSecondaryText}>Start</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
