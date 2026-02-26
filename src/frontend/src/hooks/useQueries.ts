import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type {
  WorkoutTemplate,
  WorkoutSession,
  Exercise,
  BodyWeightEntry,
  BodyMeasurement,
  User,
  SessionExerciseInput,
} from "../backend.d";

export const DEMO_USER_ID = "demo-user-1";

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
    queryKey: ["templates", DEMO_USER_ID],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTemplates(DEMO_USER_ID);
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
      return actor.createTemplate(DEMO_USER_ID, name, templateExercises);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates", DEMO_USER_ID] });
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
      qc.invalidateQueries({ queryKey: ["templates", DEMO_USER_ID] });
    },
  });
}

// ─── Workout Sessions ─────────────────────────────────────────────────────────

export function useWorkoutSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession[]>({
    queryKey: ["sessions", DEMO_USER_ID],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkoutSessions(DEMO_USER_ID);
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
      return actor.createWorkoutSession(DEMO_USER_ID, name, templateId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", DEMO_USER_ID] });
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
      qc.invalidateQueries({ queryKey: ["sessions", DEMO_USER_ID] });
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
      qc.invalidateQueries({ queryKey: ["sessions", DEMO_USER_ID] });
    },
  });
}

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
    queryKey: ["bodyweight", DEMO_USER_ID],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBodyWeightEntries(DEMO_USER_ID);
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
      return actor.addBodyWeightEntry(
        DEMO_USER_ID,
        weight,
        unit,
        BigInt(Date.now())
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bodyweight", DEMO_USER_ID] });
    },
  });
}

// ─── Body Measurements ────────────────────────────────────────────────────────

export function useBodyMeasurements(bodyPart: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<BodyMeasurement[]>({
    queryKey: ["measurements", DEMO_USER_ID, bodyPart],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBodyMeasurements(DEMO_USER_ID, bodyPart);
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
        DEMO_USER_ID,
        bodyPart,
        value,
        unit,
        BigInt(Date.now())
      );
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ["measurements", DEMO_USER_ID, data.bodyPart],
      });
      qc.invalidateQueries({ queryKey: ["measurements", DEMO_USER_ID, null] });
    },
  });
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function useUser() {
  const { actor, isFetching } = useActor();
  return useQuery<User>({
    queryKey: ["user", DEMO_USER_ID],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getUser(DEMO_USER_ID);
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
      return actor.updateUser(DEMO_USER_ID, name, username, email);
    },
    onSuccess: (data) => {
      qc.setQueryData(["user", DEMO_USER_ID], data);
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
      return actor.createCustomExercise(DEMO_USER_ID, name, muscleGroup, category);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
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
