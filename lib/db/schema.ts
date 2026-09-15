import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const splits = sqliteTable('splits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const splitDays = sqliteTable('split_days', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  splitId: integer('split_id').notNull().references(() => splits.id),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const splitDayExercises = sqliteTable('split_day_exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  splitDayId: integer('split_day_id').notNull().references(() => splitDays.id),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
  sortOrder: integer('sort_order').notNull(),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  splitDayId: integer('split_day_id').notNull().references(() => splitDays.id),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
});

export const workoutSets = sqliteTable('workout_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id').notNull().references(() => workouts.id),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
  setIndex: integer('set_index').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  createdAt: text('created_at').notNull(),
});

export const personalRecords = sqliteTable('personal_records', {
  exerciseId: integer('exercise_id').primaryKey().references(() => exercises.id),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  workoutSetId: integer('workout_set_id').notNull().references(() => workoutSets.id),
  achievedAt: text('achieved_at').notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type Split = typeof splits.$inferSelect;
export type SplitDay = typeof splitDays.$inferSelect;
export type SplitDayExercise = typeof splitDayExercises.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
