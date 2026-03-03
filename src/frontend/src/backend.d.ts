import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SessionExercise {
    id: string;
    exerciseId: string;
    order: bigint;
    sets: Array<WorkoutSet>;
}
export interface TemplateExercise {
    exerciseId: string;
    order: bigint;
    sets: bigint;
}
export interface Exercise {
    id: string;
    name: string;
    isCustom: boolean;
    category: string;
    muscleGroup: string;
}
export interface WorkoutSet {
    id: string;
    setNumber: bigint;
    weight?: number;
    isPR: boolean;
    reps?: bigint;
    completed: boolean;
}
export interface BodyMeasurement {
    id: string;
    value: number;
    userId: string;
    unit: string;
    bodyPart: string;
    loggedAt: bigint;
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
export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
}
export interface SessionExerciseInput {
    exerciseId: string;
    order: bigint;
    sets: Array<WorkoutSetInput>;
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
export interface UserProfile {
    username: string;
    name: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBodyMeasurement(bodyPart: string, value: number, unit: string, loggedAt: bigint): Promise<BodyMeasurement>;
    addBodyWeightEntry(weight: number, unit: string, loggedAt: bigint): Promise<BodyWeightEntry>;
    addExerciseToSession(sessionId: string, exerciseId: string): Promise<WorkoutSession>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomExercise(name: string, muscleGroup: string, category: string): Promise<Exercise>;
    createTemplate(name: string, exercises: Array<TemplateExercise>): Promise<WorkoutTemplate>;
    createWorkoutSession(name: string, templateId: string | null): Promise<WorkoutSession>;
    deleteTemplate(id: string): Promise<boolean>;
    deleteWorkoutSession(id: string): Promise<boolean>;
    finishWorkoutSession(id: string, finishedAt: bigint): Promise<WorkoutSession>;
    getBodyMeasurements(bodyPart: string | null): Promise<Array<BodyMeasurement>>;
    getBodyWeightEntries(): Promise<Array<BodyWeightEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExerciseList(): Promise<Array<Exercise>>;
    getExercisesByMuscleGroup(muscleGroup: string): Promise<Array<Exercise>>;
    getTemplate(id: string): Promise<WorkoutTemplate>;
    getTemplates(): Promise<Array<WorkoutTemplate>>;
    getUser(): Promise<User>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkoutSession(id: string): Promise<WorkoutSession>;
    getWorkoutSessions(): Promise<Array<WorkoutSession>>;
    isCallerAdmin(): Promise<boolean>;
    register(name: string, username: string, email: string): Promise<User>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchExercises(searchQuery: string): Promise<Array<Exercise>>;
    seed(): Promise<void>;
    updateUser(name: string, username: string, email: string): Promise<User>;
    updateWorkoutSession(id: string, name: string, notes: string | null, exercisesInput: Array<SessionExerciseInput> | null): Promise<WorkoutSession>;
}
