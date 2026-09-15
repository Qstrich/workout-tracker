import { asc, eq } from 'drizzle-orm';

import { db } from '../db/client';
import {
  exercises,
  splitDayExercises,
  splitDays,
  splits,
} from '../db/schema';
import type { SplitWithDays } from '../types';

export function listSplits(): SplitWithDays[] {
  return db
    .select()
    .from(splits)
    .orderBy(asc(splits.name))
    .all()
    .map((split) => getSplit(split.id))
    .filter((split): split is SplitWithDays => Boolean(split));
}

export function getSplit(id: number): SplitWithDays | undefined {
  const split = db.select().from(splits).where(eq(splits.id, id)).get();
  if (!split) return undefined;

  const days = db
    .select()
    .from(splitDays)
    .where(eq(splitDays.splitId, id))
    .orderBy(asc(splitDays.sortOrder))
    .all()
    .map((day) => ({
      ...day,
      exercises: db
        .select({
          id: exercises.id,
          name: exercises.name,
          notes: exercises.notes,
          createdAt: exercises.createdAt,
          splitDayExerciseId: splitDayExercises.id,
        })
        .from(splitDayExercises)
        .innerJoin(exercises, eq(splitDayExercises.exerciseId, exercises.id))
        .where(eq(splitDayExercises.splitDayId, day.id))
        .orderBy(asc(splitDayExercises.sortOrder))
        .all(),
    }));

  return { ...split, days };
}

export function createSplit(name: string) {
  const value = name.trim();
  if (!value) throw new Error('Split name is required.');
  return db
    .insert(splits)
    .values({ name: value, createdAt: new Date().toISOString() })
    .returning()
    .get();
}

export function deleteSplit(id: number) {
  db.delete(splits).where(eq(splits.id, id)).run();
}

export function createSplitDay(splitId: number, name: string) {
  const value = name.trim();
  if (!value) throw new Error('Day name is required.');
  const existing = db
    .select()
    .from(splitDays)
    .where(eq(splitDays.splitId, splitId))
    .all();
  return db
    .insert(splitDays)
    .values({ splitId, name: value, sortOrder: existing.length })
    .returning()
    .get();
}

export function addExerciseToDay(splitDayId: number, exerciseId: number) {
  const existing = db
    .select()
    .from(splitDayExercises)
    .where(eq(splitDayExercises.splitDayId, splitDayId))
    .all();
  if (existing.some((item) => item.exerciseId === exerciseId)) return;
  db.insert(splitDayExercises)
    .values({ splitDayId, exerciseId, sortOrder: existing.length })
    .run();
}

export function removeExerciseFromDay(splitDayExerciseId: number) {
  db.delete(splitDayExercises)
    .where(eq(splitDayExercises.id, splitDayExerciseId))
    .run();
}

export function moveExercise(
  splitDayId: number,
  splitDayExerciseId: number,
  direction: -1 | 1,
) {
  const items = db
    .select()
    .from(splitDayExercises)
    .where(eq(splitDayExercises.splitDayId, splitDayId))
    .orderBy(asc(splitDayExercises.sortOrder))
    .all();
  const index = items.findIndex((item) => item.id === splitDayExerciseId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return;

  const current = items[index];
  const neighbor = items[target];
  db.transaction((tx) => {
    tx.update(splitDayExercises)
      .set({ sortOrder: neighbor.sortOrder })
      .where(eq(splitDayExercises.id, current.id))
      .run();
    tx.update(splitDayExercises)
      .set({ sortOrder: current.sortOrder })
      .where(eq(splitDayExercises.id, neighbor.id))
      .run();
  });
}
