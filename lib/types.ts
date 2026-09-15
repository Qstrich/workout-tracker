import type {
  Exercise,
  PersonalRecord,
  Split,
  SplitDay,
  Workout,
  WorkoutSet,
} from './db/schema';

export type SplitDayWithExercises = SplitDay & {
  exercises: Array<Exercise & { splitDayExerciseId: number }>;
};

export type SplitWithDays = Split & {
  days: SplitDayWithExercises[];
};

export type WorkoutExercise = {
  exercise: Exercise;
  sets: WorkoutSet[];
  personalRecord?: PersonalRecord;
};

export type WorkoutView = {
  workout: Workout;
  dayName: string;
  exercises: WorkoutExercise[];
};
