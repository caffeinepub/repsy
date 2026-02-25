import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, startOfWeek, subWeeks, isAfter } from "date-fns";
import {
  User,
  Edit2,
  Check,
  X,
  Plus,
  Loader2,
  Scale,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUser,
  useUpdateUser,
  useBodyWeightEntries,
  useAddBodyWeightEntry,
  useBodyMeasurements,
  useAddBodyMeasurement,
  useWorkoutSessions,
} from "../hooks/useQueries";

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

// ─── Body parts ───────────────────────────────────────────────────────────────

const BODY_PARTS = [
  { value: "chest", label: "Chest" },
  { value: "waist", label: "Waist" },
  { value: "shoulders", label: "Shoulders" },
  { value: "bicep_left", label: "Bicep Left" },
  { value: "bicep_right", label: "Bicep Right" },
  { value: "thigh_left", label: "Thigh Left" },
  { value: "thigh_right", label: "Thigh Right" },
];

// ─── Log Weight Modal ─────────────────────────────────────────────────────────

function LogWeightModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const addWeight = useAddBodyWeightEntry();

  const handleSubmit = async () => {
    const val = parseFloat(weight);
    if (!val || val <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    try {
      await addWeight.mutateAsync({ weight: val, unit });
      toast.success("Weight logged");
      onClose();
      setWeight("");
    } catch {
      toast.error("Failed to log weight");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-xs w-full">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Log Weight</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 
                         px-3 py-2.5 rounded-md text-sm outline-none
                         border border-zinc-700 focus:border-green-500 transition-colors"
              autoFocus
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-20 bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="kg" className="text-zinc-200 focus:bg-zinc-800">kg</SelectItem>
                <SelectItem value="lbs" className="text-zinc-200 focus:bg-zinc-800">lbs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={addWeight.isPending}
            className="w-full h-11 bg-green-500 hover:bg-green-400 text-zinc-950 font-semibold
                       rounded-md text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {addWeight.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Log Weight
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Log Measurement Modal ────────────────────────────────────────────────────

function LogMeasurementModal({
  open,
  onClose,
  defaultBodyPart,
}: {
  open: boolean;
  onClose: () => void;
  defaultBodyPart: string;
}) {
  const [bodyPart, setBodyPart] = useState(defaultBodyPart);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("cm");
  const addMeasurement = useAddBodyMeasurement();

  const handleSubmit = async () => {
    const val = parseFloat(value);
    if (!val || val <= 0) {
      toast.error("Enter a valid measurement");
      return;
    }
    try {
      await addMeasurement.mutateAsync({ bodyPart, value: val, unit });
      toast.success("Measurement logged");
      onClose();
      setValue("");
    } catch {
      toast.error("Failed to log measurement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-xs w-full">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Log Measurement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Select value={bodyPart} onValueChange={setBodyPart}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {BODY_PARTS.map((bp) => (
                <SelectItem key={bp.value} value={bp.value} className="text-zinc-200 focus:bg-zinc-800">
                  {bp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 
                         px-3 py-2.5 rounded-md text-sm outline-none
                         border border-zinc-700 focus:border-green-500 transition-colors"
              autoFocus
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-20 bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="cm" className="text-zinc-200 focus:bg-zinc-800">cm</SelectItem>
                <SelectItem value="in" className="text-zinc-200 focus:bg-zinc-800">in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={addMeasurement.isPending}
            className="w-full h-11 bg-green-500 hover:bg-green-400 text-zinc-950 font-semibold
                       rounded-md text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {addMeasurement.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Log Measurement
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Profile Header ───────────────────────────────────────────────────────────

function ProfileHeader() {
  const { data: user, isLoading } = useUser();
  const updateUser = useUpdateUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "" });

  const startEdit = () => {
    if (user) {
      setForm({ name: user.name, username: user.username, email: user.email });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync(form);
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="repsy-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-32" />
            <div className="h-3 bg-zinc-800 rounded animate-pulse w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="repsy-card p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 
                        flex items-center justify-center shrink-0">
          <User size={28} className="text-zinc-500" />
        </div>

        {editing ? (
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Name"
              className="w-full bg-zinc-800 text-zinc-50 px-3 py-2 rounded-md text-sm
                         outline-none border border-zinc-700 focus:border-green-500 transition-colors"
            />
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Username"
              className="w-full bg-zinc-800 text-zinc-50 px-3 py-2 rounded-md text-sm
                         outline-none border border-zinc-700 focus:border-green-500 transition-colors"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              className="w-full bg-zinc-800 text-zinc-50 px-3 py-2 rounded-md text-sm
                         outline-none border border-zinc-700 focus:border-green-500 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateUser.isPending}
                className="flex items-center gap-1.5 px-3 h-8 bg-green-500 hover:bg-green-400 
                           text-zinc-950 rounded-md text-xs font-semibold transition-colors"
              >
                {updateUser.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 h-8 bg-zinc-800 hover:bg-zinc-700 
                           text-zinc-400 rounded-md text-xs transition-colors"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-50 font-bold text-base truncate">
                {user?.name ?? "Demo User"}
              </h2>
              <button
                type="button"
                onClick={startEdit}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 shrink-0"
              >
                <Edit2 size={14} />
              </button>
            </div>
            <p className="text-zinc-500 text-sm">@{user?.username ?? "demo"}</p>
            <p className="text-zinc-600 text-xs mt-1 truncate">
              {user?.email ?? ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Body Weight Section ──────────────────────────────────────────────────────

function BodyWeightSection() {
  const [showLog, setShowLog] = useState(false);
  const { data: entries = [], isLoading } = useBodyWeightEntries();

  const sorted = useMemo(
    () => [...entries].sort((a, b) => Number(a.loggedAt) - Number(b.loggedAt)),
    [entries]
  );

  const chartData = sorted.slice(-30).map((e) => ({
    date: format(new Date(Number(e.loggedAt / 1_000_000n)), "MMM d"),
    weight: e.weight,
  }));

  const latest = sorted[sorted.length - 1];

  return (
    <div className="repsy-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={14} className="text-green-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Body Weight
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowLog(true)}
          className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 transition-colors"
        >
          <Plus size={12} />
          Log
        </button>
      </div>

      {latest && (
        <div className="mb-3">
          <span className="font-mono-repsy text-3xl font-bold text-zinc-50">
            {latest.weight}
          </span>
          <span className="text-zinc-500 text-sm ml-1">{latest.unit}</span>
          <p className="text-zinc-600 text-xs mt-0.5">
            {format(new Date(Number(latest.loggedAt / 1_000_000n)), "EEE, MMM d")}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="h-[150px] bg-zinc-800 rounded animate-pulse" />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              stroke={AXIS_STYLE.stroke}
              tick={AXIS_STYLE.tick}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke={AXIS_STYLE.stroke}
              tick={AXIS_STYLE.tick}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#22c55e" }}
              name="Weight"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 text-zinc-600">
          <Scale size={20} className="mb-1 opacity-30" />
          <p className="text-xs">No entries yet</p>
        </div>
      )}

      <LogWeightModal open={showLog} onClose={() => setShowLog(false)} />
    </div>
  );
}

// ─── Body Measurements Section ────────────────────────────────────────────────

function MeasurementsSection() {
  const [showLog, setShowLog] = useState(false);
  const [selectedPart, setSelectedPart] = useState("chest");
  const { data: entries = [], isLoading } = useBodyMeasurements(null);

  const filtered = useMemo(
    () =>
      [...entries]
        .filter((e) => e.bodyPart === selectedPart)
        .sort((a, b) => Number(a.loggedAt) - Number(b.loggedAt)),
    [entries, selectedPart]
  );

  const chartData = filtered.slice(-20).map((e) => ({
    date: format(new Date(Number(e.loggedAt / 1_000_000n)), "MMM d"),
    value: e.value,
  }));

  const latest = filtered[filtered.length - 1];

  return (
    <div className="repsy-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-green-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Measurements
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowLog(true)}
          className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 transition-colors"
        >
          <Plus size={12} />
          Log
        </button>
      </div>

      <Select value={selectedPart} onValueChange={setSelectedPart}>
        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 h-9 text-xs mb-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-700">
          {BODY_PARTS.map((bp) => (
            <SelectItem key={bp.value} value={bp.value} className="text-zinc-200 focus:bg-zinc-800">
              {bp.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {latest && (
        <div className="mb-3">
          <span className="font-mono-repsy text-2xl font-bold text-zinc-50">
            {latest.value}
          </span>
          <span className="text-zinc-500 text-sm ml-1">{latest.unit}</span>
        </div>
      )}

      {isLoading ? (
        <div className="h-[130px] bg-zinc-800 rounded animate-pulse" />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              stroke={AXIS_STYLE.stroke}
              tick={AXIS_STYLE.tick}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke={AXIS_STYLE.stroke}
              tick={AXIS_STYLE.tick}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#22c55e" }}
              name="Measurement"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-20 text-zinc-600">
          <p className="text-xs">No entries for {selectedPart}</p>
        </div>
      )}

      <LogMeasurementModal
        open={showLog}
        onClose={() => setShowLog(false)}
        defaultBodyPart={selectedPart}
      />
    </div>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────

function WorkoutStatsSection() {
  const { data: sessions = [] } = useWorkoutSessions();

  const weeklyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
      const weekEnd = subWeeks(now, 7 - i - 1);
      const count = sessions.filter((s) => {
        if (!s.finishedAt) return false;
        const d = new Date(Number(s.startedAt / 1_000_000n));
        return isAfter(d, weekStart) && !isAfter(d, weekEnd);
      }).length;
      return { week: format(weekStart, "MMM d"), count };
    });
  }, [sessions]);

  const calorieDays = useMemo(() => {
    const now = new Date();
    const days: { day: string; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const daySessions = sessions.filter((s) => {
        if (!s.finishedAt) return false;
        const d = new Date(Number(s.startedAt / 1_000_000n));
        return d >= dayStart && d < dayEnd;
      });

      const calories = daySessions.reduce((sum, s) => {
        const durationMin = s.durationSeconds ? Number(s.durationSeconds) / 60 : 0;
        return sum + s.totalVolume * 0.05 + durationMin * 5;
      }, 0);

      days.push({ day: format(dayStart, "EEE"), calories: Math.round(calories) });
    }
    return days;
  }, [sessions]);

  return (
    <>
      <div className="repsy-card p-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Workouts / Week
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
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
            <Bar dataKey="count" fill="#22c55e" radius={[3, 3, 0, 0]} name="Workouts" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="repsy-card p-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          Est. Calories Burned
        </h3>
        <p className="text-[10px] text-zinc-600 mb-4">Last 7 days</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={calorieDays}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="day"
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
            <Bar dataKey="calories" fill="#16a34a" radius={[3, 3, 0, 0]} name="Calories" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-zinc-50 font-bold text-lg tracking-tight">
            Profile
          </h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <ProfileHeader />
        <BodyWeightSection />
        <MeasurementsSection />
        <WorkoutStatsSection />

        {/* Footer */}
        <div className="text-center py-4 pb-2">
          <p className="text-zinc-700 text-xs">
            © 2026. Built with{" "}
            <span className="text-red-500">♥</span>{" "}
            using{" "}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-500 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
