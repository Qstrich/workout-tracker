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

import { colors, styles } from '@/constants/WorkoutStyles';
import type { SplitWithDays } from '@/lib/types';
import { createSplit, deleteSplit, listSplits } from '@/lib/repos/splits';

export default function SplitsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SplitWithDays[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');

  const refresh = useCallback(() => setItems(listSplits()), []);
  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  function save() {
    try {
      const split = createSplit(name);
      setName('');
      setModalVisible(false);
      refresh();
      router.push(`/split/${split.id}`);
    } catch (error) {
      Alert.alert('Could not create split', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function remove(item: SplitWithDays) {
    Alert.alert('Delete split?', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            deleteSplit(item.id);
            refresh();
          } catch (error) {
            Alert.alert('Cannot delete split', error instanceof Error ? error.message : 'Try again.');
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
            <Text style={styles.title}>Splits</Text>
            <Text style={styles.subtitle}>Organize exercises into repeatable training days.</Text>
            <Pressable style={[styles.button, { marginTop: 20 }]} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>Create split</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>Your plans</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Create a split such as Push / Pull / Legs to start training.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => router.push(`/split/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={[styles.muted, { marginTop: 6 }]}>
                {item.days.length} {item.days.length === 1 ? 'day' : 'days'}
              </Text>
              {item.days.slice(0, 3).map((day) => (
                <Text key={day.id} style={[styles.muted, { marginTop: 5 }]}>
                  {day.name} · {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}
                </Text>
              ))}
            </Pressable>
            <Pressable style={[styles.buttonSecondary, { alignSelf: 'flex-start', marginTop: 14 }]} onPress={() => remove(item)}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>New split</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              autoFocus
              placeholder="e.g. Push / Pull / Legs"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
              value={name}
              onChangeText={setName}
            />
            <View style={[styles.row, { marginTop: 20 }]}>
              <Pressable style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.button, { flex: 1 }]} onPress={save}>
                <Text style={styles.buttonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
