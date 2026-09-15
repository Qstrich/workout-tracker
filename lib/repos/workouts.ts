import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import { db } from '../db/client';
import {
  exercises,
  personalRecords,
  splitDayExercises,
  splitDays,
  workoutSets,
  workouts,
} from '../db/schema';
import type { WorkoutView } from '../types';

export function startWorkout(splitDayId: number) {
  const active = getActiveWorkout();
  if (active) return active;
  return db
    .insert(workouts)
    .values({ splitDayId, startedAt: new Date().toISOString() })
    .returning()
    .get();
}

export function getActiveWorkout() {
  return db
    .select()
    .from(workouts)
    .where(isNull(workouts.completedAt))
    .orderBy(desc(workouts.startedAt))
    .get();
}

export function getWorkoutView(id: number): WorkoutView | undefined {
  const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!workout) return undefined;

  const day = db
    .select()
    .from(splitDays)
    .where(eq(splitDays.id, workout.splitDayId))
    .get();
  if (!day) return undefined;

  const configuredExercises = db
    .select({
      id: exercises.id,
      name: exercises.name,
      notes: exercises.notes,
      createdAt: exercises.createdAt,
    })
    .from(splitDayExercises)
    .innerJoin(exercises, eq(splitDayExercises.exerciseId, exercises.id))
    .where(eq(splitDayExercises.splitDayId, day.id))
    .orderBy(asc(splitDayExercises.sortOrder))
    .all();

  return {
    workout,
    dayName: day.name,
    exercises: configuredExercises.map((exercise) => ({
      exercise,
      sets: db
        .select()
        .from(workoutSets)
        .where(
          and(
            eq(workoutSets.workoutId, id),
            eq(workoutSets.exerciseId, exercise.id),
          ),
        )
        .orderBy(asc(workoutSets.setIndex))
        .all(),
      personalRecord: db
        .select()
        .from(personalRecords)
        .where(eq(personalRecords.exerciseId, exercise.id))
        .get(),
    })),
  };
}

export function addSet(
  workoutId: number,
  exerciseId: number,
  weight: number,
  reps: number,
) {
  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error('Enter a valid weight.');
  }
  if (!Number.isInteger(reps) || reps < 1) {
    throw new Error('Reps must be a whole number greater than zero.');
  }

  const previousSets = db
    .select()
    .from(workoutSets)
    .where(
      and(
        eq(workoutSets.workoutId, workoutId),
        eq(workoutSets.exerciseId, exerciseId),
      ),
    )
    .all();
  const timestamp = new Date().toISOString();

  return db.transaction((tx) => {
    const set = tx
      .insert(workoutSets)
      .values({
        workoutId,
        exerciseId,
        setIndex: previousSets.length,
        weight,
        reps,
        createdAt: timestamp,
      })
      .returning()
      .get();
    const currentRecord = tx
      .select()
      .from(personalRecords)
      .where(eq(personalRecords.exerciseId, exerciseId))
      .get();
    const isNewPR = !currentRecord || weight > currentRecord.weight;

    if (isNewPR) {
      tx.insert(personalRecords)
        .values({
          exerciseId,
          weight,
          reps,
          workoutSetId: set.id,
          achievedAt: timestamp,
        })
        .onConflictDoUpdate({
          target: personalRecords.exerciseId,
          set: {
            weight,
            reps,
            workoutSetId: set.id,
            achievedAt: timestamp,
          },
        })
        .run();
    }

    return { set, isNewPR, personalRecord: isNewPR ? { weight, reps } : currentRecord };
  });
}

export function completeWorkout(id: number) {
  return db
    .update(workouts)
    .set({ completedAt: new Date().toISOString() })
    .where(eq(workouts.id, id))
    .returning()
    .get();
}

export function getExercisePR(exerciseId: number) {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .get();
}

export function getRecentSets(exerciseId: number) {
  return db
    .select({
      set: workoutSets,
      workout: workouts,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .where(eq(workoutSets.exerciseId, exerciseId))
    .orderBy(desc(workoutSets.createdAt))
    .all()
    .slice(0, 30);
}
