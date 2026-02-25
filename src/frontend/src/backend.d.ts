import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Exercise {
    id: string;
    name: string;
    category: string;
    muscleGroup: string;
}
export interface TemplateExercise {
    exerciseId: string;
    order: bigint;
    sets: bigint;
}
export interface BodyMeasurement {
    id: string;
    value: number;
    userId: string;
    unit: string;
    bodyPart: string;
    loggedAt: bigint;
}
export interface WorkoutSet {
    id: string;
    setNumber: bigint;
    weight?: number;
    isPR: boolean;
    reps?: bigint;
    completed: boolean;
}
export interface WorkoutSession {
    id: string;
    startedAt: bigint;
    totalVolume: number;
    templateId?: string;
    userId: string;
    name: string;
    exercises: Array<SessionExercise>;
    durationSeconds?: bigint;
    notes?: string;
    prCount: bigint;
    finishedAt?: bigint;
}
export interface SessionExerciseInput {
    exerciseId: string;
    order: bigint;
    sets: Array<WorkoutSetInput>;
}
export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
}
export interface BodyWeightEntry {
    id: string;
    weight: number;
    userId: string;
    unit: string;
    loggedAt: bigint;
}
export interface WorkoutSetInput {
    setNumber: bigint;
    weight?: number;
    isPR: boolean;
    reps?: bigint;
    completed: boolean;
}
export interface WorkoutTemplate {
    id: string;
    userId: string;
    name: string;
    createdAt: bigint;
    exercises: Array<TemplateExercise>;
}
export interface SessionExercise {
    id: string;
    exerciseId: string;
    order: bigint;
    sets: Array<WorkoutSet>;
}
export interface backendInterface {
    addBodyMeasurement(userId: string, bodyPart: string, value: number, unit: string, loggedAt: bigint): Promise<BodyMeasurement>;
    addBodyWeightEntry(userId: string, weight: number, unit: string, loggedAt: bigint): Promise<BodyWeightEntry>;
    addExerciseToSession(sessionId: string, exerciseId: string): Promise<WorkoutSession>;
    createTemplate(userId: string, name: string, exercises: Array<TemplateExercise>): Promise<WorkoutTemplate>;
    createWorkoutSession(userId: string, name: string, templateId: string | null): Promise<WorkoutSession>;
    deleteTemplate(id: string): Promise<boolean>;
    deleteWorkoutSession(id: string): Promise<boolean>;
    finishWorkoutSession(id: string, finishedAt: bigint): Promise<WorkoutSession>;
    getBodyMeasurements(userId: string, bodyPart: string | null): Promise<Array<BodyMeasurement>>;
    getBodyWeightEntries(userId: string): Promise<Array<BodyWeightEntry>>;
    getExerciseList(): Promise<Array<Exercise>>;
    getTemplate(id: string): Promise<WorkoutTemplate>;
    getTemplates(userId: string): Promise<Array<WorkoutTemplate>>;
    getUser(id: string): Promise<User>;
    getWorkoutSession(id: string): Promise<WorkoutSession>;
    getWorkoutSessions(userId: string): Promise<Array<WorkoutSession>>;
    searchExercises(searchQuery: string): Promise<Array<Exercise>>;
    seed(): Promise<void>;
    updateUser(id: string, name: string, username: string, email: string): Promise<User>;
    updateWorkoutSession(id: string, name: string, notes: string | null, exercisesInput: Array<SessionExerciseInput> | null): Promise<WorkoutSession>;
}
