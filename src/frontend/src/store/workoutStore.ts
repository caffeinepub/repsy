import { create } from "zustand";
import type { WorkoutSession, Exercise } from "../backend.d";

export interface LiveSet {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
  isPR: boolean;
}

export interface LiveExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  order: number;
  sets: LiveSet[];
  previousBest?: string;
}

interface RestTimer {
  exerciseIdx: number;
  setIdx: number;
  secondsLeft: number;
}

interface LiveWorkoutStore {
  sessionId: string | null;
  name: string;
  startedAt: number;
  exercises: LiveExercise[];
  restTimer: RestTimer | null;
  isDirty: boolean;

  setSession: (session: WorkoutSession, exercises: Exercise[]) => void;
  updateSetField: (
    exIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    value: string
  ) => void;
  completeSet: (exIdx: number, setIdx: number) => void;
  addSet: (exIdx: number) => void;
  addExercise: (exercise: Exercise) => void;
  updateName: (name: string) => void;
  tickRestTimer: () => void;
  dismissRestTimer: () => void;
  markClean: () => void;
  reset: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const initialState = {
  sessionId: null,
  name: "",
  startedAt: 0,
  exercises: [] as LiveExercise[],
  restTimer: null,
  isDirty: false,
};

export const useWorkoutStore = create<LiveWorkoutStore>((set) => ({
  ...initialState,

  setSession: (session, exercises) => {
    const exerciseMap = new Map<string, Exercise>(
      exercises.map((e) => [e.id, e])
    );

    const liveExercises: LiveExercise[] = session.exercises.map((se) => {
      const exerciseInfo = exerciseMap.get(se.exerciseId);
      return {
        id: se.id,
        exerciseId: se.exerciseId,
        exerciseName: exerciseInfo?.name ?? "Unknown Exercise",
        muscleGroup: exerciseInfo?.muscleGroup ?? "",
        order: Number(se.order),
        sets: se.sets.map((ws) => ({
          id: ws.id,
          setNumber: Number(ws.setNumber),
          weight: ws.weight !== undefined ? String(ws.weight) : "",
          reps: ws.reps !== undefined ? String(Number(ws.reps)) : "",
          completed: ws.completed,
          isPR: ws.isPR,
        })),
      };
    });

    set((state) => ({
      sessionId: session.id,
      name: state.sessionId === session.id ? state.name : session.name,
      // startedAt is nanoseconds on ICP; convert to ms for Date.now() comparison
      startedAt: Number(session.startedAt / 1_000_000n),
      // Only overwrite exercises from backend if the store is clean (not dirty with user input)
      exercises: state.isDirty ? state.exercises : liveExercises,
      restTimer: state.restTimer,
      isDirty: state.isDirty,
    }));
  },

  updateSetField: (exIdx, setIdx, field, value) =>
    set((state) => {
      const exercises = state.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) =>
            j === setIdx ? { ...s, [field]: value } : s
          ),
        };
      });
      return { exercises, isDirty: true };
    }),

  completeSet: (exIdx, setIdx) =>
    set((state) => {
      const exercises = state.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) =>
            j === setIdx ? { ...s, completed: !s.completed } : s
          ),
        };
      });
      const wasCompleted = state.exercises[exIdx]?.sets[setIdx]?.completed;
      const restTimer =
        !wasCompleted
          ? { exerciseIdx: exIdx, setIdx, secondsLeft: 90 }
          : state.restTimer;
      return { exercises, restTimer, isDirty: true };
    }),

  addSet: (exIdx) =>
    set((state) => {
      const exercises = state.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: LiveSet = {
          id: generateId(),
          setNumber: ex.sets.length + 1,
          weight: lastSet?.weight ?? "",
          reps: lastSet?.reps ?? "",
          completed: false,
          isPR: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { exercises, isDirty: true };
    }),

  addExercise: (exercise) =>
    set((state) => {
      const newExercise: LiveExercise = {
        id: generateId(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        order: state.exercises.length,
        sets: [
          {
            id: generateId(),
            setNumber: 1,
            weight: "",
            reps: "",
            completed: false,
            isPR: false,
          },
        ],
      };
      return { exercises: [...state.exercises, newExercise], isDirty: true };
    }),

  updateName: (name) => set({ name, isDirty: true }),

  tickRestTimer: () =>
    set((state) => {
      if (!state.restTimer) return {};
      const secondsLeft = state.restTimer.secondsLeft - 1;
      if (secondsLeft <= 0) return { restTimer: null };
      return { restTimer: { ...state.restTimer, secondsLeft } };
    }),

  dismissRestTimer: () => set({ restTimer: null }),

  markClean: () => set({ isDirty: false }),

  reset: () => set(initialState),
}));
