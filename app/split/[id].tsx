import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, styles } from '@/constants/WorkoutStyles';
import { listExercises } from '@/lib/repos/exercises';
import {
  addExerciseToDay,
  createSplitDay,
  getSplit,
  moveExercise,
  removeExerciseFromDay,
} from '@/lib/repos/splits';
import type { Exercise } from '@/lib/db/schema';
import type { SplitWithDays } from '@/lib/types';

export default function SplitEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const splitId = Number(id);
  const [split, setSplit] = useState<SplitWithDays>();
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [exerciseDayId, setExerciseDayId] = useState<number>();
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [dayName, setDayName] = useState('');

  const refresh = useCallback(() => {
    setSplit(getSplit(splitId));
    setAvailableExercises(listExercises());
  }, [splitId]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  function addDay() {
    try {
      createSplitDay(splitId, dayName);
      setDayName('');
      setDayModalVisible(false);
      refresh();
    } catch (error) {
      Alert.alert('Could not add day', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function addExercise(exerciseId: number) {
    if (!exerciseDayId) return;
    addExerciseToDay(exerciseDayId, exerciseId);
    setExerciseModalVisible(false);
    refresh();
  }

  if (!split) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}><Text style={styles.emptyText}>Split not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={split.days}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>{split.name}</Text>
            <Text style={styles.subtitle}>Build each training day and arrange its exercises.</Text>
            <Pressable style={[styles.button, { marginTop: 20 }]} onPress={() => setDayModalVisible(true)}>
              <Text style={styles.buttonText}>Add training day</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Add a training day, then choose exercises for it.</Text>
          </View>
        }
        renderItem={({ item: day }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{day.name}</Text>
            {day.exercises.length === 0 && (
              <Text style={[styles.muted, { marginTop: 8 }]}>No exercises yet.</Text>
            )}
            {day.exercises.map((exercise, index) => (
              <View key={exercise.splitDayExerciseId} style={[styles.row, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontWeight: '700' }}>{index + 1}. {exercise.name}</Text>
                </View>
                <Pressable
                  accessibilityLabel={`Move ${exercise.name} up`}
                  disabled={index === 0}
                  onPress={() => { moveExercise(day.id, exercise.splitDayExerciseId, -1); refresh(); }}
                >
                  <Text style={{ color: index === 0 ? colors.line : colors.primary, fontSize: 20 }}>↑</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${exercise.name} down`}
                  disabled={index === day.exercises.length - 1}
                  onPress={() => { moveExercise(day.id, exercise.splitDayExerciseId, 1); refresh(); }}
                >
                  <Text style={{ color: index === day.exercises.length - 1 ? colors.line : colors.primary, fontSize: 20 }}>↓</Text>
                </Pressable>
                <Pressable onPress={() => { removeExerciseFromDay(exercise.splitDayExerciseId); refresh(); }}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Remove</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              style={[styles.buttonSecondary, { alignSelf: 'flex-start', marginTop: 16 }]}
              onPress={() => { setExerciseDayId(day.id); setExerciseModalVisible(true); }}
            >
              <Text style={styles.buttonSecondaryText}>Add exercise</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal animationType="slide" transparent visible={dayModalVisible} onRequestClose={() => setDayModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>New training day</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              autoFocus
              placeholder="e.g. Push"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
              value={dayName}
              onChangeText={setDayName}
            />
            <View style={[styles.row, { marginTop: 20 }]}>
              <Pressable style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setDayModalVisible(false)}>
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.button, { flex: 1 }]} onPress={addDay}>
                <Text style={styles.buttonText}>Add day</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={exerciseModalVisible} onRequestClose={() => setExerciseModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.title}>Choose exercise</Text>
            <FlatList
              data={availableExercises}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={<Text style={[styles.muted, { marginTop: 16 }]}>Create exercises first in the Exercises tab.</Text>}
              renderItem={({ item }) => (
                <Pressable style={[styles.card, { marginTop: 12 }]} onPress={() => addExercise(item.id)}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable style={[styles.buttonSecondary, { marginTop: 10 }]} onPress={() => setExerciseModalVisible(false)}>
              <Text style={styles.buttonSecondaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
