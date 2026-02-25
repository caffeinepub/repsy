import { useState, useMemo } from "react";
import {
  Clock,
  Dumbbell,
  Trophy,
  ChevronDown,
  ChevronUp,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { format, isAfter, subWeeks, subMonths } from "date-fns";
import { useWorkoutSessions, useExerciseList } from "../hooks/useQueries";
import type { WorkoutSession } from "../backend.d";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${vol.toFixed(0)} kg`;
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  exerciseNameMap,
}: {
  session: WorkoutSession;
  exerciseNameMap: Map<string, { name: string; muscleGroup: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(Number(session.startedAt / 1_000_000n));
  const duration = session.durationSeconds ? Number(session.durationSeconds) : 0;

  return (
    <div className="repsy-card overflow-hidden animate-fade-in">
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-zinc-50 font-semibold text-sm truncate">
              {session.name}
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
              <CalendarDays size={11} />
              {format(date, "EEE, MMM d")} • {format(date, "h:mm a")}
            </p>
          </div>
          <div className="text-zinc-500 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock size={12} className="text-zinc-600" />
            <span className="font-mono-repsy">{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Dumbbell size={12} className="text-zinc-600" />
            <span className="font-mono-repsy">{formatVolume(session.totalVolume)}</span>
          </div>
          {Number(session.prCount) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-500">
              <Trophy size={12} />
              <span className="font-mono-repsy">{Number(session.prCount)} PR</span>
            </div>
          )}
        </div>

        {/* Exercise preview pills */}
        {!expanded && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {session.exercises.slice(0, 3).map((se) => {
              const exInfo = exerciseNameMap.get(se.exerciseId);
              return (
                <span
                  key={se.id}
                  className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
                >
                  {exInfo?.name ?? se.exerciseId}
                </span>
              );
            })}
            {session.exercises.length > 3 && (
              <span className="text-[10px] text-zinc-600">
                +{session.exercises.length - 3} more
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3 animate-fade-in">
          {session.exercises.map((se) => {
            const exInfo = exerciseNameMap.get(se.exerciseId);
            return (
              <div key={se.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-300">
                    {exInfo?.name ?? "Unknown"}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {exInfo?.muscleGroup ?? ""}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {se.sets.map((ws) => (
                    <div
                      key={ws.id}
                      className={`flex items-center gap-3 text-xs px-2 py-1 rounded ${
                        ws.completed ? "bg-green-500/8 text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      <span className="font-mono-repsy w-4 text-zinc-600">
                        {Number(ws.setNumber)}
                      </span>
                      <span className="font-mono-repsy">
                        {ws.weight !== undefined ? `${ws.weight} kg` : "—"} ×{" "}
                        {ws.reps !== undefined ? Number(ws.reps) : "—"}
                      </span>
                      {ws.isPR && (
                        <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/15 px-1 py-0.5 rounded">
                          PR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {session.notes && (
            <div className="bg-zinc-800/50 rounded-md p-2.5 mt-2">
              <p className="text-xs text-zinc-400">{session.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────────────

type FilterPeriod = "week" | "month" | "all";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 h-8 rounded-full text-xs font-medium transition-all
        ${
          active
            ? "bg-green-500 text-zinc-950"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        }
      `}
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const [filter, setFilter] = useState<FilterPeriod>("all");
  const { data: sessions = [], isLoading } = useWorkoutSessions();
  const { data: exercises = [] } = useExerciseList();

  const exerciseNameMap = useMemo(() => {
    const map = new Map<string, { name: string; muscleGroup: string }>();
    for (const ex of exercises) {
      map.set(ex.id, { name: ex.name, muscleGroup: ex.muscleGroup });
    }
    return map;
  }, [exercises]);

  const filtered = useMemo(() => {
    const now = new Date();
    const sorted = [...sessions].sort(
      (a, b) => Number(b.startedAt) - Number(a.startedAt)
    );
    if (filter === "week") {
      const cutoff = subWeeks(now, 1);
      return sorted.filter((s) => isAfter(new Date(Number(s.startedAt / 1_000_000n)), cutoff));
    }
    if (filter === "month") {
      const cutoff = subMonths(now, 1);
      return sorted.filter((s) => isAfter(new Date(Number(s.startedAt / 1_000_000n)), cutoff));
    }
    return sorted;
  }, [sessions, filter]);

  // Completed workouts only
  const completed = useMemo(
    () => filtered.filter((s) => s.finishedAt !== undefined),
    [filtered]
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-zinc-50 font-bold text-lg tracking-tight">
            History
          </h1>
        </div>
      </header>

      {/* Filter chips */}
      <div className="px-4 py-3 flex gap-2 border-b border-zinc-800/50">
        <FilterChip
          label="Week"
          active={filter === "week"}
          onClick={() => setFilter("week")}
        />
        <FilterChip
          label="Month"
          active={filter === "month"}
          onClick={() => setFilter("month")}
        />
        <FilterChip
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <div className="ml-auto flex items-center text-xs text-zinc-600">
          {completed.length} workout{completed.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-3 space-y-2.5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-green-500" />
          </div>
        ) : completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock size={40} className="text-zinc-800 mb-3" />
            <p className="text-zinc-500 font-medium">No workouts yet</p>
            <p className="text-zinc-600 text-sm mt-1">
              Complete a workout to see it here
            </p>
          </div>
        ) : (
          completed.map((session: WorkoutSession) => (
            <SessionCard
              key={session.id}
              session={session}
              exerciseNameMap={exerciseNameMap}
            />
          ))
        )}
      </div>
    </div>
  );
}
