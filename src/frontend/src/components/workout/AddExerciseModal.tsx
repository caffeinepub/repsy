import { useState, useMemo } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExerciseList, useCreateCustomExercise } from "../../hooks/useQueries";
import { toast } from "sonner";
import type { Exercise } from "../../backend.d";

interface AddExerciseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS = [
  "Chest",
  "Shoulders",
  "Triceps",
  "Back",
  "Biceps",
  "Legs",
  "Glutes",
  "Core",
  "Cardio/Full Body",
] as const;

const CATEGORIES = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Kettlebell",
  "Other",
] as const;

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: "bg-red-500/20 text-red-400",
  Back: "bg-blue-500/20 text-blue-400",
  Shoulders: "bg-purple-500/20 text-purple-400",
  Arms: "bg-yellow-500/20 text-yellow-400",
  Biceps: "bg-yellow-500/20 text-yellow-400",
  Triceps: "bg-orange-500/20 text-orange-400",
  Legs: "bg-green-500/20 text-green-400",
  Quadriceps: "bg-green-500/20 text-green-400",
  Hamstrings: "bg-teal-500/20 text-teal-400",
  Glutes: "bg-pink-500/20 text-pink-400",
  Core: "bg-cyan-500/20 text-cyan-400",
  Abs: "bg-cyan-500/20 text-cyan-400",
  Calves: "bg-lime-500/20 text-lime-400",
  Cardio: "bg-rose-500/20 text-rose-400",
  "Cardio/Full Body": "bg-rose-500/20 text-rose-400",
};

function getMuscleColor(muscleGroup: string) {
  return MUSCLE_GROUP_COLORS[muscleGroup] ?? "bg-zinc-700/50 text-zinc-400";
}

const selectClass =
  "w-full bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 " +
  "px-3 py-2.5 rounded-md text-sm outline-none " +
  "border border-zinc-700 focus:border-green-500 transition-colors appearance-none";

export function AddExerciseModal({
  open,
  onClose,
  onAdd,
}: AddExerciseModalProps) {
  const [search, setSearch] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [customCategory, setCustomCategory] = useState<string>(CATEGORIES[0]);

  const { data: exercises = [], isLoading } = useExerciseList();
  const createCustomExercise = useCreateCustomExercise();

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises;
    const q = search.toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const group = ex.muscleGroup || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(ex);
    }
    return groups;
  }, [filtered]);

  const handleAdd = (exercise: Exercise) => {
    onAdd(exercise);
    onClose();
  };

  const handleSaveCustom = async () => {
    if (!customName.trim()) {
      toast.error("Enter an exercise name");
      return;
    }
    try {
      const newExercise = await createCustomExercise.mutateAsync({
        name: customName.trim(),
        muscleGroup: customMuscleGroup,
        category: customCategory,
      });
      toast.success(`"${newExercise.name}" added`);
      onAdd(newExercise);
      onClose();
    } catch {
      toast.error("Failed to create exercise");
    }
  };

  const handleCancelCustom = () => {
    setShowCustomForm(false);
    setCustomName("");
    setCustomMuscleGroup(MUSCLE_GROUPS[0]);
    setCustomCategory(CATEGORIES[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md w-full p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-zinc-50 font-semibold">
              Add Exercise
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 
                         pl-9 pr-3 py-2.5 rounded-md text-sm outline-none
                         border border-zinc-700 focus:border-green-500 transition-colors"
              autoFocus
            />
          </div>
        </DialogHeader>

        {/* Exercise List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="px-4 py-6 space-y-2">
              {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
                <div
                  key={k}
                  className="h-12 bg-zinc-800 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 && !showCustomForm ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Search size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No exercises found</p>
            </div>
          ) : (
            <>
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([group, exs]) => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-zinc-950/50 border-b border-zinc-800/50">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${getMuscleColor(group)}`}
                      >
                        {group}
                      </span>
                    </div>
                    {exs.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleAdd(exercise)}
                        className="w-full flex items-center justify-between px-4 py-3 
                                   hover:bg-zinc-800/60 transition-colors border-b border-zinc-800/30
                                   text-left group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm text-zinc-100 font-medium group-hover:text-white flex items-center gap-1.5">
                              <span className="truncate">{exercise.name}</span>
                              {exercise.isCustom && (
                                <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide shrink-0">
                                  Custom
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {exercise.category}
                            </p>
                          </div>
                        </div>
                        <Plus
                          size={16}
                          className="text-zinc-600 group-hover:text-green-500 transition-colors shrink-0 ml-2"
                        />
                      </button>
                    ))}
                  </div>
                ))}

              {/* Create Custom Exercise */}
              <div className="px-4 py-3 border-t border-zinc-800/50">
                {!showCustomForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(true)}
                    className="w-full flex items-center justify-center gap-2 h-10 border border-dashed
                               border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-green-500/50
                               rounded-md text-sm transition-colors"
                  >
                    <Plus size={14} />
                    Create Custom Exercise
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                      New Custom Exercise
                    </p>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Exercise name"
                      className="w-full bg-zinc-800 text-zinc-50 placeholder:text-zinc-500
                                 px-3 py-2.5 rounded-md text-sm outline-none
                                 border border-zinc-700 focus:border-green-500 transition-colors"
                      autoFocus
                    />
                    <select
                      value={customMuscleGroup}
                      onChange={(e) => setCustomMuscleGroup(e.target.value)}
                      className={selectClass}
                    >
                      {MUSCLE_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className={selectClass}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCancelCustom}
                        className="flex-1 h-9 rounded-md text-sm text-zinc-400 border border-zinc-700
                                   hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveCustom()}
                        disabled={createCustomExercise.isPending}
                        className="flex-1 h-9 rounded-md text-sm bg-green-500 hover:bg-green-400
                                   text-zinc-950 font-semibold transition-colors disabled:opacity-60
                                   flex items-center justify-center gap-1.5"
                      >
                        {createCustomExercise.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
