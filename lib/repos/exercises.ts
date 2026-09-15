import { and, asc, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { exercises, splitDayExercises, workoutSets } from '../db/schema';

export function listExercises() {
  return db.select().from(exercises).orderBy(asc(exercises.name)).all();
}

export function getExercise(id: number) {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export function createExercise(name: string, notes?: string) {
  const value = name.trim();
  if (!value) throw new Error('Exercise name is required.');
  return db
    .insert(exercises)
    .values({
      name: value,
      notes: notes?.trim() || null,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

export function updateExercise(id: number, name: string, notes?: string) {
  const value = name.trim();
  if (!value) throw new Error('Exercise name is required.');
  return db
    .update(exercises)
    .set({ name: value, notes: notes?.trim() || null })
    .where(eq(exercises.id, id))
    .returning()
    .get();
}

export function deleteExercise(id: number) {
  const splitUsage = db
    .select()
    .from(splitDayExercises)
    .where(eq(splitDayExercises.exerciseId, id))
    .all();
  const history = db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.exerciseId, id))
    .all();
  if (splitUsage.length || history.length) {
    throw new Error('This exercise is used in a split or workout history.');
  }
  db.delete(exercises).where(and(eq(exercises.id, id))).run();
}
