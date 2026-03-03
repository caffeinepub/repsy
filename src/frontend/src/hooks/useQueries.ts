import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BodyMeasurement,
  BodyWeightEntry,
  Exercise,
  SessionExerciseInput,
  User,
  WorkoutSession,
  WorkoutTemplate,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Exercises ───────────────────────────────────────────────────────────────

export function useExerciseList() {
  const { actor, isFetching } = useActor();
  return useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExerciseList();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useSearchExercises(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Exercise[]>({
    queryKey: ["exercises", "search", query],
    queryFn: async () => {
      if (!actor) return [];
      if (!query.trim()) return actor.getExerciseList();
      return actor.searchExercises(query);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    gcTime: 0,
  });
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function useTemplates() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutTemplate[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTemplates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      exercises,
    }: {
      name: string;
      exercises: Array<{ exerciseId: string; sets: number; order: number }>;
    }) => {
      if (!actor) throw new Error("No actor");
      const templateExercises = exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: BigInt(e.sets),
        order: BigInt(e.order),
      }));
      return actor.createTemplate(name, templateExercises);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTemplate(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// ─── Workout Sessions ─────────────────────────────────────────────────────────

export function useWorkoutSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkoutSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWorkoutSession(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession>({
    queryKey: ["session", id],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getWorkoutSession(id);
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 0,
  });
}

export function useCreateWorkoutSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      templateId,
    }: {
      name: string;
      templateId: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createWorkoutSession(name, templateId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateWorkoutSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      notes,
      exercises,
    }: {
      id: string;
      name: string;
      notes: string | null;
      exercises: SessionExerciseInput[] | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateWorkoutSession(id, name, notes, exercises);
    },
    onSuccess: (data) => {
      qc.setQueryData(["session", data.id], data);
    },
  });
}

export function useFinishWorkoutSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.finishWorkoutSession(id, BigInt(Date.now()));
    },
    onSuccess: (data) => {
      qc.setQueryData(["session", data.id], data);
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useDeleteWorkoutSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteWorkoutSession(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// Alias for cancelling an in-progress session
export const useCancelWorkoutSession = useDeleteWorkoutSession;

export function useAddExerciseToSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseId,
    }: {
      sessionId: string;
      exerciseId: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addExerciseToSession(sessionId, exerciseId);
    },
    onSuccess: (data) => {
      qc.setQueryData(["session", data.id], data);
    },
  });
}

// ─── Body Weight ──────────────────────────────────────────────────────────────

export function useBodyWeightEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<BodyWeightEntry[]>({
    queryKey: ["bodyweight"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBodyWeightEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBodyWeightEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      weight,
      unit,
    }: {
      weight: number;
      unit: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addBodyWeightEntry(weight, unit, BigInt(Date.now()));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bodyweight"] });
    },
  });
}

// ─── Body Measurements ────────────────────────────────────────────────────────

export function useBodyMeasurements(bodyPart: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<BodyMeasurement[]>({
    queryKey: ["measurements", bodyPart],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBodyMeasurements(bodyPart);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBodyMeasurement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bodyPart,
      value,
      unit,
    }: {
      bodyPart: string;
      value: number;
      unit: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addBodyMeasurement(
        bodyPart,
        value,
        unit,
        BigInt(Date.now()),
      );
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["measurements", data.bodyPart] });
      qc.invalidateQueries({ queryKey: ["measurements", null] });
    },
  });
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function useUser() {
  const { actor, isFetching } = useActor();
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getUser();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      username,
      email,
    }: {
      name: string;
      username: string;
      email: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateUser(name, username, email);
    },
    onSuccess: (data) => {
      qc.setQueryData(["user"], data);
    },
  });
}

// ─── Custom Exercise ──────────────────────────────────────────────────────────

export function useCreateCustomExercise() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      muscleGroup,
      category,
    }: {
      name: string;
      muscleGroup: string;
      category: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createCustomExercise(name, muscleGroup, category);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

// ─── Register ────────────────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      username,
      email,
    }: {
      name: string;
      username: string;
      email: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.register(name, username, email);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export function useSeed() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.seed();
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
