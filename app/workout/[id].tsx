import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, styles } from '@/constants/WorkoutStyles';
import { addSet, completeWorkout, getWorkoutView } from '@/lib/repos/workouts';
import type { WorkoutView } from '@/lib/types';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const [view, setView] = useState<WorkoutView>();
  const [exerciseId, setExerciseId] = useState<number>();
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const refresh = useCallback(() => setView(getWorkoutView(workoutId)), [workoutId]);
  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  function openSetForm(exercise: WorkoutView['exercises'][number]) {
    setExerciseId(exercise.exercise.id);
    setExerciseName(exercise.exercise.name);
    const previousSet = exercise.sets[exercise.sets.length - 1];
    setWeight(previousSet?.weight.toString() ?? '');
    setReps(previousSet?.reps.toString() ?? '');
    setModalVisible(true);
  }

  function saveSet() {
    if (!exerciseId) return;
    try {
      const result = addSet(workoutId, exerciseId, Number(weight), Number(reps));
      setModalVisible(false);
      refresh();
      if (result.isNewPR) {
        Alert.alert('New PR', `${exerciseName}: ${result.personalRecord?.weight} kg`);
      }
    } catch (error) {
      Alert.alert('Could not save set', error instanceof Error ? error.message : 'Check your values.');
    }
  }

  function finish() {
    completeWorkout(workoutId);
    router.back();
  }

  if (!view) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}><Text style={styles.emptyText}>Workout not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{view.dayName}</Text>
        <Text style={styles.subtitle}>Log each completed set. Your heaviest set becomes your PR.</Text>
        {view.exercises.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>This day has no exercises. Add some in the split editor.</Text>
          </View>
        )}
        {view.exercises.map((item) => (
          <View style={[styles.card, { marginTop: 18 }]} key={item.exercise.id}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.cardTitle}>{item.exercise.name}</Text>
              {item.personalRecord && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>PR {item.personalRecord.weight} kg</Text>
                </View>
              )}
            </View>
            {item.sets.length === 0 ? (
              <Text style={[styles.muted, { marginTop: 12 }]}>No sets logged yet.</Text>
            ) : (
              item.sets.map((set, index) => (
                <View key={set.id} style={[styles.row, { justifyContent: 'space-between', marginTop: 10 }]}>
                  <Text style={styles.muted}>Set {index + 1}</Text>
                  <Text style={{ color: colors.ink, fontWeight: '700' }}>{set.weight} kg × {set.reps}</Text>
                </View>
              ))
            )}
            <Pressable style={[styles.buttonSecondary, { alignSelf: 'flex-start', marginTop: 14 }]} onPress={() => openSetForm(item)}>
              <Text style={styles.buttonSecondaryText}>Add set</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={[styles.button, { marginTop: 8 }]} onPress={finish}>
          <Text style={styles.buttonText}>Finish workout</Text>
        </Pressable>
      </ScrollView>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Add set</Text>
            <Text style={styles.subtitle}>{exerciseName}</Text>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              autoFocus
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
            />
            <Text style={styles.label}>Reps</Text>
            <TextInput
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
              value={reps}
              onChangeText={setReps}
            />
            <View style={[styles.row, { marginTop: 20 }]}>
              <Pressable style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.button, { flex: 1 }]} onPress={saveSet}>
                <Text style={styles.buttonText}>Save set</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
