import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Plus,
  X,
  Trophy,
  Clock,
  Dumbbell,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkoutStore } from "../store/workoutStore";
import { AddExerciseModal } from "../components/workout/AddExerciseModal";
import { RestTimer } from "../components/workout/RestTimer";
import {
  useWorkoutSession,
  useExerciseList,
  useUpdateWorkoutSession,
  useFinishWorkoutSession,
  useAddExerciseToSession,
} from "../hooks/useQueries";
import type { SessionExerciseInput, WorkoutSetInput, Exercise } from "../backend.d";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${vol.toFixed(0)} kg`;
}

// ─── Elapsed Timer Hook ───────────────────────────────────────────────────────

function useElapsedTimer(startedAt: number) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

// ─── Finish Modal ─────────────────────────────────────────────────────────────

interface FinishModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  duration: number;
  totalVolume: number;
  exerciseCount: number;
  prCount: number;
  isPending: boolean;
}

function FinishModal({
  open,
  onConfirm,
  onCancel,
  duration,
  totalVolume,
  exerciseCount,
  prCount,
  isPending,
}: FinishModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="text-zinc-50 text-center text-lg">
            Finish Workout?
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <Clock size={16} className="text-zinc-500 mx-auto mb-1" />
            <div className="font-mono-repsy text-lg text-zinc-50 font-semibold">
              {formatElapsed(duration)}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
              Duration
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <Dumbbell size={16} className="text-zinc-500 mx-auto mb-1" />
            <div className="font-mono-repsy text-lg text-zinc-50 font-semibold">
              {formatVolume(totalVolume)}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
              Volume
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <Dumbbell size={16} className="text-zinc-500 mx-auto mb-1" />
            <div className="font-mono-repsy text-lg text-zinc-50 font-semibold">
              {exerciseCount}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
              Exercises
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <Trophy size={16} className="text-yellow-500 mx-auto mb-1" />
            <div className="font-mono-repsy text-lg text-yellow-500 font-semibold">
              {prCount}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
              PRs
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 
                       rounded-md text-sm font-medium transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-11 bg-green-500 hover:bg-green-400 text-zinc-950 
                       rounded-md text-sm font-semibold transition-colors
                       disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Finish
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Set Row ──────────────────────────────────────────────────────────────────

interface SetRowProps {
  exIdx: number;
  setIdx: number;
  setNum: number;
  weight: string;
  reps: string;
  completed: boolean;
  isPR: boolean;
}

function SetRow({
  exIdx,
  setIdx,
  setNum,
  weight,
  reps,
  completed,
  isPR,
}: SetRowProps) {
  const updateSetField = useWorkoutStore((s) => s.updateSetField);
  const completeSet = useWorkoutStore((s) => s.completeSet);

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200
        ${
          completed
            ? "bg-green-500/[0.08] border border-green-500/20"
            : "bg-zinc-800/40 border border-transparent"
        }
      `}
    >
      {/* Set number / PR badge */}
      <div className="w-8 text-center shrink-0">
        {isPR ? (
          <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded-full">
            PR
          </span>
        ) : (
          <span className={`font-mono-repsy text-xs font-semibold ${completed ? "text-green-500/70" : "text-zinc-600"}`}>
            {setNum}
          </span>
        )}
      </div>

      {/* Weight input */}
      <div className="flex-1 relative">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => updateSetField(exIdx, setIdx, "weight", e.target.value)}
          placeholder="—"
          className={`
            w-full bg-transparent text-center rounded-md text-sm outline-none
            border transition-colors font-mono-repsy font-medium
            min-h-[44px] px-1
            placeholder:text-zinc-700
            ${
              completed
                ? "text-green-400 border-green-500/20 focus:border-green-500/50"
                : "text-zinc-100 border-zinc-700/60 focus:border-green-500/60 focus:bg-zinc-800/60"
            }
          `}
        />
      </div>

      {/* Reps input */}
      <div className="flex-1 relative">
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => updateSetField(exIdx, setIdx, "reps", e.target.value)}
          placeholder="—"
          className={`
            w-full bg-transparent text-center rounded-md text-sm outline-none
            border transition-colors font-mono-repsy font-medium
            min-h-[44px] px-1
            placeholder:text-zinc-700
            ${
              completed
                ? "text-green-400 border-green-500/20 focus:border-green-500/50"
                : "text-zinc-100 border-zinc-700/60 focus:border-green-500/60 focus:bg-zinc-800/60"
            }
          `}
        />
      </div>

      {/* Complete toggle — larger hit area, clearer states */}
      <button
        type="button"
        onClick={() => completeSet(exIdx, setIdx)}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0
          ${
            completed
              ? "bg-green-500 text-zinc-950 shadow-[0_0_16px_rgba(34,197,94,0.5)] scale-100"
              : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 active:scale-95"
          }
        `}
      >
        <Check size={15} strokeWidth={completed ? 2.5 : 2} />
      </button>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exIdx: number;
}

function ExerciseCard({ exIdx }: ExerciseCardProps) {
  const exercise = useWorkoutStore((s) => s.exercises[exIdx]);
  const addSet = useWorkoutStore((s) => s.addSet);

  if (!exercise) return null;

  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;
  const allDone = completedCount === totalSets && totalSets > 0;

  return (
    <div className={`
      bg-zinc-900 border rounded-xl overflow-hidden animate-fade-in transition-all duration-300
      ${allDone ? "border-green-500/30" : "border-zinc-800"}
    `}>
      {/* Exercise header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-zinc-50 font-bold text-base leading-tight tracking-tight truncate">
              {exercise.exerciseName}
            </h3>
            {exercise.previousBest && (
              <p className="text-xs text-zinc-600 mt-0.5 font-mono-repsy">
                prev {exercise.previousBest}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Progress pip */}
            <span className="text-xs font-mono-repsy text-zinc-600">
              {completedCount}/{totalSets}
            </span>
            <span className={`
              text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide
              ${allDone
                ? "bg-green-500/20 text-green-400"
                : "bg-zinc-800 text-zinc-500"
              }
            `}>
              {exercise.muscleGroup}
            </span>
          </div>
        </div>
      </div>

      {/* Sets table header */}
      <div className="flex items-center gap-2 px-3 pb-1.5 border-t border-zinc-800/60 pt-2">
        <div className="w-8 text-center">
          <span className="text-[9px] text-zinc-700 uppercase tracking-widest font-semibold">
            Set
          </span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-[9px] text-zinc-700 uppercase tracking-widest font-semibold">
            Weight (kg)
          </span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-[9px] text-zinc-700 uppercase tracking-widest font-semibold">
            Reps
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sets */}
      <div className="space-y-1 px-2 pb-2">
        {exercise.sets.map((s, setIdx) => (
          <SetRow
            key={s.id}
            exIdx={exIdx}
            setIdx={setIdx}
            setNum={s.setNumber}
            weight={s.weight}
            reps={s.reps}
            completed={s.completed}
            isPR={s.isPR}
          />
        ))}
      </div>

      {/* Add set */}
      <div className="px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => addSet(exIdx)}
          className="w-full flex items-center justify-center gap-1.5 h-9
                     text-zinc-600 hover:text-zinc-300 text-xs font-medium
                     border border-dashed border-zinc-800 hover:border-zinc-600
                     rounded-lg transition-all hover:bg-zinc-800/30"
        >
          <Plus size={12} />
          Add Set
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function WorkoutPage() {
  const { id } = useParams({ from: "/workout/$id" });
  const navigate = useNavigate();
  const [showFinish, setShowFinish] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const store = useWorkoutStore();
  const setSession = useWorkoutStore((s) => s.setSession);
  const elapsed = useElapsedTimer(store.startedAt);

  const { data: session, isLoading } = useWorkoutSession(id);
  const { data: exercises = [] } = useExerciseList();
  const updateSession = useUpdateWorkoutSession();
  const finishSession = useFinishWorkoutSession();
  const addExToSession = useAddExerciseToSession();

  // Load session into store whenever session or exercises change
  useEffect(() => {
    if (session && exercises.length > 0) {
      setSession(session, exercises);
    }
  }, [session, exercises, setSession]);

  // Build SessionExerciseInput for auto-save
  const buildSavePayload = useCallback((): SessionExerciseInput[] => {
    return store.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      order: BigInt(ex.order),
      sets: ex.sets.map(
        (s): WorkoutSetInput => ({
          setNumber: BigInt(s.setNumber),
          weight: s.weight ? parseFloat(s.weight) : undefined,
          reps: s.reps ? BigInt(parseInt(s.reps)) : undefined,
          completed: s.completed,
          isPR: s.isPR,
        })
      ),
    }));
  }, [store.exercises]);

  // Auto-save every 30s when dirty
  useEffect(() => {
    if (!store.isDirty || !store.sessionId) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      try {
        await updateSession.mutateAsync({
          id: store.sessionId!,
          name: store.name,
          notes: null,
          exercises: buildSavePayload(),
        });
        store.markClean();
      } catch {
        // Silent fail for auto-save
      }
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [store.isDirty, store.sessionId, store.name, buildSavePayload, updateSession, store]);

  const handleAddExercise = async (exercise: Exercise) => {
    if (!store.sessionId) return;
    try {
      const updated = await addExToSession.mutateAsync({
        sessionId: store.sessionId,
        exerciseId: exercise.id,
      });
      store.setSession(updated, exercises);
    } catch {
      toast.error("Failed to add exercise");
    }
  };

  const handleFinish = async () => {
    if (!store.sessionId) return;
    try {
      // Save current state first
      await updateSession.mutateAsync({
        id: store.sessionId,
        name: store.name,
        notes: null,
        exercises: buildSavePayload(),
      });
      await finishSession.mutateAsync(store.sessionId);
      store.reset();
      void navigate({ to: "/history" });
    } catch {
      toast.error("Failed to finish workout");
    }
  };

  // Calculate volume from store
  const currentVolume = store.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, s) => {
      const w = parseFloat(s.weight) || 0;
      const r = parseInt(s.reps) || 0;
      return setTotal + (s.completed ? w * r : 0);
    }, 0);
  }, 0);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-green-500 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Loading workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sticky top bar — single unified bar with all context */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center gap-2 px-3 h-14">
          <button
            type="button"
            onClick={() => void navigate({ to: "/history" })}
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-800 shrink-0"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Editable name */}
          <input
            type="text"
            value={store.name}
            onChange={(e) => store.updateName(e.target.value)}
            className="flex-1 bg-transparent text-zinc-50 font-bold text-base
                       outline-none truncate min-w-0 py-1 tracking-tight"
          />

          {/* Inline stats — volume */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 shrink-0">
            <Dumbbell size={11} className="text-zinc-600" />
            <span className="font-mono-repsy">{formatVolume(currentVolume)}</span>
          </div>

          {/* Elapsed timer — the hero metric */}
          <div className="font-mono-repsy text-green-500 text-base font-bold shrink-0 tabular-nums">
            {formatElapsed(elapsed)}
          </div>

          {/* Finish button */}
          <button
            type="button"
            onClick={() => setShowFinish(true)}
            className="shrink-0 bg-green-500 hover:bg-green-400 active:scale-95 text-zinc-950 font-bold
                       text-xs px-4 h-9 rounded-lg transition-all ml-1
                       shadow-[0_2px_12px_rgba(34,197,94,0.3)]"
          >
            Finish
          </button>
        </div>

        {/* Sub-bar: volume on mobile + start time */}
        <div className="flex items-center gap-3 px-4 pb-2 -mt-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            <Dumbbell size={10} />
            <span className="font-mono-repsy">{formatVolume(currentVolume)}</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="text-[11px] text-zinc-600 font-mono-repsy">
            Started {format(new Date(Number(session.startedAt / 1_000_000n)), "h:mm a")}
          </div>
        </div>
      </header>

      {/* Exercises */}
      <div className="px-3 pt-4 pb-40 space-y-3">
        {store.exercises.length === 0 ? (
          <div className="repsy-card p-8 text-center mt-4">
            <Dumbbell size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No exercises yet</p>
            <p className="text-zinc-600 text-sm mt-1">
              Tap below to add your first exercise
            </p>
          </div>
        ) : (
          store.exercises.map((_, exIdx) => (
            <ExerciseCard key={store.exercises[exIdx].id} exIdx={exIdx} />
          ))
        )}

        {/* Add Exercise button */}
        <button
          type="button"
          onClick={() => setShowAddExercise(true)}
          className="w-full h-12 flex items-center justify-center gap-2 
                     border border-dashed border-zinc-700 hover:border-green-500/50
                     text-zinc-500 hover:text-green-500 rounded-lg transition-all text-sm"
        >
          <Plus size={16} />
          Add Exercise
        </button>
      </div>

      {/* Rest Timer */}
      <RestTimer />

      {/* Modals */}
      <AddExerciseModal
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAdd={handleAddExercise}
      />

      <FinishModal
        open={showFinish}
        onConfirm={() => void handleFinish()}
        onCancel={() => setShowFinish(false)}
        duration={elapsed}
        totalVolume={currentVolume}
        exerciseCount={store.exercises.length}
        prCount={store.exercises.reduce(
          (n, ex) => n + ex.sets.filter((s) => s.isPR).length,
          0
        )}
        isPending={finishSession.isPending || updateSession.isPending}
      />
    </div>
  );
}
