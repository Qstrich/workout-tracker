import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import { colors, styles } from '@/constants/WorkoutStyles';
import { getExercise } from '@/lib/repos/exercises';
import { getExercisePR, getRecentSets } from '@/lib/repos/workouts';
import type { Exercise, PersonalRecord, WorkoutSet, Workout } from '@/lib/db/schema';

type HistoryItem = { set: WorkoutSet; workout: Workout };

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const [exercise, setExercise] = useState<Exercise>();
  const [pr, setPr] = useState<PersonalRecord>();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refresh = useCallback(() => {
    setExercise(getExercise(exerciseId));
    setPr(getExercisePR(exerciseId));
    setHistory(getRecentSets(exerciseId));
  }, [exerciseId]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  if (!exercise) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}><Text style={styles.emptyText}>Exercise not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{exercise.name}</Text>
        {!!exercise.notes && <Text style={styles.subtitle}>{exercise.notes}</Text>}

        <Text style={styles.sectionTitle}>Personal record</Text>
        <View style={styles.card}>
          {pr ? (
            <>
              <Text style={{ color: colors.ink, fontSize: 26, fontWeight: '800' }}>{pr.weight} kg</Text>
              <Text style={[styles.muted, { marginTop: 5 }]}>for {pr.reps} reps</Text>
              <Text style={[styles.muted, { marginTop: 10 }]}>
                Achieved {new Date(pr.achievedAt).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>Log a set to establish your first PR.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent sets</Text>
        <View style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.muted}>No workout history yet.</Text>
          ) : (
            history.map(({ set, workout }) => (
              <View key={set.id} style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                <View>
                  <Text style={{ color: colors.ink, fontWeight: '700' }}>{set.weight} kg × {set.reps}</Text>
                  <Text style={[styles.muted, { marginTop: 3 }]}>
                    {new Date(workout.startedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.muted}>Set {set.setIndex + 1}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
