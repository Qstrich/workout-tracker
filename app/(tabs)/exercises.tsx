import { useFocusEffect, useRouter } from 'expo-router';
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

import {
  createExercise,
  deleteExercise,
  listExercises,
  updateExercise,
} from '@/lib/repos/exercises';
import type { Exercise } from '@/lib/db/schema';
import { colors, styles } from '@/constants/WorkoutStyles';

export default function ExercisesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Exercise>();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const refresh = useCallback(() => setItems(listExercises()), []);
  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  function openForm(exercise?: Exercise) {
    setEditing(exercise);
    setName(exercise?.name ?? '');
    setNotes(exercise?.notes ?? '');
    setModalVisible(true);
  }

  function save() {
    try {
      if (editing) updateExercise(editing.id, name, notes);
      else createExercise(name, notes);
      setModalVisible(false);
      refresh();
    } catch (error) {
      Alert.alert('Could not save exercise', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function remove(item: Exercise) {
    Alert.alert('Delete exercise?', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            deleteExercise(item.id);
            refresh();
          } catch (error) {
            Alert.alert('Cannot delete exercise', error instanceof Error ? error.message : 'It is in use.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Exercises</Text>
            <Text style={styles.subtitle}>
              Your exercise library and current best lifts.
            </Text>
            <Pressable style={[styles.button, { marginTop: 20 }]} onPress={() => openForm()}>
              <Text style={styles.buttonText}>Add exercise</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>Library</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Add your first exercise, then use it to build a split.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => router.push(`/exercise/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {!!item.notes && <Text style={[styles.muted, { marginTop: 5 }]}>{item.notes}</Text>}
            </Pressable>
            <View style={[styles.row, { marginTop: 14 }]}>
              <Pressable style={styles.buttonSecondary} onPress={() => openForm(item)}>
                <Text style={styles.buttonSecondaryText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.buttonSecondary} onPress={() => remove(item)}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>{editing ? 'Edit exercise' : 'New exercise'}</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              autoFocus
              placeholder="e.g. Back squat"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              placeholder="Technique cues, equipment, etc."
              placeholderTextColor={colors.muted}
              style={[styles.textInput, { minHeight: 80, paddingTop: 12 }]}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            <View style={[styles.row, { marginTop: 20 }]}>
              <Pressable style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.button, { flex: 1 }]} onPress={save}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
