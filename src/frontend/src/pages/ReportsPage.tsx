import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, startOfWeek, subWeeks, isAfter } from "date-fns";
import { Loader2, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkoutSessions, useExerciseList } from "../hooks/useQueries";
import type { WorkoutSession, Exercise } from "../backend.d";

// ─── Chart theme ──────────────────────────────────────────────────────────────

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  color: "#f4f4f5",
  fontSize: 12,
};

const AXIS_STYLE = {
  stroke: "#3f3f46",
  tick: { fill: "#71717a", fontSize: 11 },
};

const PIE_COLORS = [
  "#22c55e",
  "#16a34a",
  "#4ade80",
  "#86efac",
  "#bbf7d0",
  "#dcfce7",
  "#15803d",
  "#166534",
];

// ─── Epley 1RM ────────────────────────────────────────────────────────────────

function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildVolumeData(
  sessions: WorkoutSession[],
  exerciseId: string
): Array<{ date: string; volume: number }> {
  const points: { date: string; volume: number }[] = [];
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const vol = ex.sets.reduce((sum, ws) => {
      if (!ws.completed) return sum;
      return sum + (ws.weight ?? 0) * Number(ws.reps ?? 0);
    }, 0);
    if (vol === 0) continue;
    points.push({
      date: format(new Date(Number(s.startedAt / 1_000_000n)), "MMM d"),
      volume: Math.round(vol),
    });
  }
  return points.slice(-12);
}

function buildStrengthData(
  sessions: WorkoutSession[],
  exerciseId: string
): Array<{ date: string; oneRM: number }> {
  const points: { date: string; oneRM: number }[] = [];
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    let best = 0;
    for (const ws of ex.sets) {
      if (!ws.completed || !ws.weight || !ws.reps) continue;
      const rm = epley1RM(ws.weight, Number(ws.reps));
      if (rm > best) best = rm;
    }
    if (best === 0) continue;
    points.push({
      date: format(new Date(Number(s.startedAt / 1_000_000n)), "MMM d"),
      oneRM: Math.round(best),
    });
  }
  return points.slice(-12);
}

function buildFrequencyData(
  sessions: WorkoutSession[]
): Array<{ week: string; count: number }> {
  const data: Array<{ week: string; count: number }> = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = subWeeks(now, i - 1);
    const count = sessions.filter((s) => {
      if (!s.finishedAt) return false;
      const d = new Date(Number(s.startedAt / 1_000_000n));
      return isAfter(d, weekStart) && !isAfter(d, weekEnd);
    }).length;
    data.push({ week: format(weekStart, "MMM d"), count });
  }
  return data;
}

function buildMuscleData(
  sessions: WorkoutSession[],
  exerciseMap: Map<string, Exercise>
): Array<{ name: string; value: number }> {
  const groups: Record<string, number> = {};
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    for (const se of s.exercises) {
      const ex = exerciseMap.get(se.exerciseId);
      if (!ex) continue;
      const vol = se.sets.reduce((sum, ws) => {
        if (!ws.completed) return sum;
        return sum + (ws.weight ?? 0) * Number(ws.reps ?? 0);
      }, 0);
      groups[ex.muscleGroup] = (groups[ex.muscleGroup] ?? 0) + vol;
    }
  }
  return Object.entries(groups)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] text-zinc-600">
      <TrendingUp size={28} className="mb-2 opacity-40" />
      <p className="text-xs">{message}</p>
    </div>
  );
}

// ─── Tab selector ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "volume", label: "Volume" },
  { id: "strength", label: "Strength" },
  { id: "frequency", label: "Frequency" },
  { id: "muscles", label: "Muscles" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("volume");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  const { data: sessions = [], isLoading: sessionsLoading } = useWorkoutSessions();
  const { data: exercises = [], isLoading: exLoading } = useExerciseList();

  const isLoading = sessionsLoading || exLoading;

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  // Exercises that appear in sessions
  const usedExercises = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sessions) {
      for (const se of s.exercises) ids.add(se.exerciseId);
    }
    return exercises.filter((e) => ids.has(e.id));
  }, [sessions, exercises]);

  const currentExercise =
    usedExercises.find((e) => e.id === selectedExerciseId) ?? usedExercises[0];

  const volumeData = useMemo(
    () => buildVolumeData(sessions, currentExercise?.id ?? ""),
    [sessions, currentExercise]
  );

  const strengthData = useMemo(
    () => buildStrengthData(sessions, currentExercise?.id ?? ""),
    [sessions, currentExercise]
  );

  const frequencyData = useMemo(
    () => buildFrequencyData(sessions),
    [sessions]
  );

  const muscleData = useMemo(
    () => buildMuscleData(sessions, exerciseMap),
    [sessions, exerciseMap]
  );

  const totalMuscleVolume = useMemo(
    () => muscleData.reduce((s, d) => s + d.value, 0),
    [muscleData]
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-zinc-50 font-bold text-lg tracking-tight">
            Reports
          </h1>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800/60 px-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors relative
              ${
                activeTab === tab.id
                  ? "text-green-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-green-500" />
          </div>
        ) : (
          <>
            {/* Volume Tab */}
            {activeTab === "volume" && (
              <div className="space-y-4 animate-fade-in">
                <Select
                  value={currentExercise?.id ?? ""}
                  onValueChange={setSelectedExerciseId}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 h-10">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {usedExercises.map((ex) => (
                      <SelectItem
                        key={ex.id}
                        value={ex.id}
                        className="text-zinc-200 focus:bg-zinc-800"
                      >
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="repsy-card p-4">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                    Total Volume (kg)
                  </h3>
                  {volumeData.length === 0 ? (
                    <EmptyChart message="No data for this exercise" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={volumeData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                        />
                        <XAxis
                          dataKey="date"
                          stroke={AXIS_STYLE.stroke}
                          tick={AXIS_STYLE.tick}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={AXIS_STYLE.stroke}
                          tick={AXIS_STYLE.tick}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: "#22c55e", r: 3 }}
                          activeDot={{ r: 5, fill: "#22c55e" }}
                          name="Volume"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Strength Tab */}
            {activeTab === "strength" && (
              <div className="space-y-4 animate-fade-in">
                <Select
                  value={currentExercise?.id ?? ""}
                  onValueChange={setSelectedExerciseId}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 h-10">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {usedExercises.map((ex) => (
                      <SelectItem
                        key={ex.id}
                        value={ex.id}
                        className="text-zinc-200 focus:bg-zinc-800"
                      >
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="repsy-card p-4">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
                    Estimated 1RM (kg)
                  </h3>
                  <p className="text-[10px] text-zinc-600 mb-4">
                    Epley formula: w × (1 + reps/30)
                  </p>
                  {strengthData.length === 0 ? (
                    <EmptyChart message="No data for this exercise" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={strengthData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                        />
                        <XAxis
                          dataKey="date"
                          stroke={AXIS_STYLE.stroke}
                          tick={AXIS_STYLE.tick}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={AXIS_STYLE.stroke}
                          tick={AXIS_STYLE.tick}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Line
                          type="monotone"
                          dataKey="oneRM"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: "#22c55e", r: 3 }}
                          activeDot={{ r: 5, fill: "#22c55e" }}
                          name="Est. 1RM"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Frequency Tab */}
            {activeTab === "frequency" && (
              <div className="space-y-4 animate-fade-in">
                <div className="repsy-card p-4">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                    Workouts per Week
                  </h3>
                  {frequencyData.every((d) => d.count === 0) ? (
                    <EmptyChart message="No completed workouts yet" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={frequencyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="week"
                          stroke={AXIS_STYLE.stroke}
                          tick={AXIS_STYLE.tick}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={AXIS_STYLE.stroke}
                          tick={AXIS_STYLE.tick}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar
                          dataKey="count"
                          fill="#22c55e"
                          radius={[3, 3, 0, 0]}
                          name="Workouts"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Muscles Tab */}
            {activeTab === "muscles" && (
              <div className="space-y-4 animate-fade-in">
                <div className="repsy-card p-4">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                    Volume by Muscle Group
                  </h3>
                  {muscleData.length === 0 ? (
                    <EmptyChart message="Complete workouts to see muscle distribution" />
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={muscleData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            dataKey="value"
                            paddingAngle={2}
                          >
                            {muscleData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={CHART_TOOLTIP_STYLE}
                            formatter={(value: number) => [
                              `${Math.round((value / totalMuscleVolume) * 100)}% (${value} kg)`,
                              "Volume",
                            ]}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 11, color: "#71717a" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Legend breakdown */}
                      <div className="mt-3 space-y-1.5">
                        {muscleData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-xs text-zinc-400 flex-1">
                              {d.name}
                            </span>
                            <span className="font-mono-repsy text-xs text-zinc-400">
                              {Math.round((d.value / totalMuscleVolume) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
