import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Plus,
  Play,
  Dumbbell,
  ChevronRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTemplates, useCreateWorkoutSession, useDeleteTemplate, useCreateTemplate, useExerciseList, useCreateCustomExercise } from "../hooks/useQueries";
import type { WorkoutTemplate, Exercise } from "../backend.d";

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

const selectClass =
  "w-full bg-zinc-700 text-zinc-50 placeholder:text-zinc-500 " +
  "px-3 py-2 rounded-md text-sm outline-none " +
  "border border-zinc-600 focus:border-green-500 transition-colors appearance-none";

interface CreateTemplateForm {
  name: string;
  exercises: { exerciseId: string; name: string; sets: number }[];
}

function TemplateCard({
  template,
  onStart,
  onDelete,
}: {
  template: WorkoutTemplate;
  onStart: () => void;
  onDelete: () => void;
}) {
  const exerciseCount = template.exercises.length;
  const createdDate = new Date(Number(template.createdAt / 1_000_000n));

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Left accent — only shown on hover */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pl-1">
          <h3 className="text-zinc-50 font-bold text-sm truncate pr-2 tracking-tight">
            {template.name}
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""} •{" "}
            {format(createdDate, "MMM d")}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-zinc-700 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100 rounded-md hover:bg-red-500/10"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Exercise list preview */}
      <div className="flex flex-wrap gap-1.5 pl-1">
        {template.exercises.slice(0, 5).map((te) => (
          <span
            key={te.exerciseId}
            className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono-repsy"
          >
            {Number(te.sets)} sets
          </span>
        ))}
        {template.exercises.length > 5 && (
          <span className="text-[10px] text-zinc-600">
            +{template.exercises.length - 5} more
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex items-center justify-center gap-2 w-full h-11 bg-green-500 
                   hover:bg-green-400 active:scale-[0.98] text-zinc-950 rounded-lg text-sm font-bold
                   transition-all duration-150 shadow-[0_2px_12px_rgba(34,197,94,0.25)]
                   hover:shadow-[0_4px_20px_rgba(34,197,94,0.4)]"
      >
        <Play size={14} className="fill-zinc-950" />
        Start Workout
      </button>
    </div>
  );
}

function CreateTemplateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CreateTemplateForm>({
    name: "",
    exercises: [],
  });
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [customCategory, setCustomCategory] = useState<string>(CATEGORIES[0]);

  const { data: exercises = [] } = useExerciseList();
  const createTemplate = useCreateTemplate();
  const createCustomExercise = useCreateCustomExercise();

  const filtered = exercises.filter(
    (e) =>
      !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddExercise = (exercise: Exercise) => {
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { exerciseId: exercise.id, name: exercise.name, sets: 3 },
      ],
    }));
    setShowExercisePicker(false);
    setShowCustomForm(false);
    setSearch("");
    setCustomName("");
    setCustomMuscleGroup(MUSCLE_GROUPS[0]);
    setCustomCategory(CATEGORIES[0]);
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
      handleAddExercise(newExercise);
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

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Enter a template name");
      return;
    }
    try {
      await createTemplate.mutateAsync({
        name: form.name,
        exercises: form.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          order: i,
        })),
      });
      toast.success("Template created");
      onClose();
      setForm({ name: "", exercises: [] });
    } catch {
      toast.error("Failed to create template");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm w-full p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-zinc-800 shrink-0">
          <DialogTitle className="text-zinc-50">New Template</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Template name"
            className="w-full bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 
                       px-3 py-2.5 rounded-md text-sm outline-none
                       border border-zinc-700 focus:border-green-500 transition-colors"
          />

          {/* Exercises */}
          <div className="space-y-2">
            {form.exercises.map((ex, i) => (
              <div
                key={`${ex.exerciseId}-${i}`}
                className="flex items-center gap-2 bg-zinc-800/50 rounded-md px-3 py-2"
              >
                <span className="flex-1 text-sm text-zinc-200 truncate">
                  {ex.name}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setForm((p) => ({
                        ...p,
                        exercises: p.exercises.map((e2, j) =>
                          j === i ? { ...e2, sets: val } : e2
                        ),
                      }));
                    }}
                    className="w-10 text-center bg-zinc-700 text-zinc-50 rounded text-xs py-1 outline-none"
                    min={1}
                    max={20}
                  />
                  <span className="text-zinc-500 text-xs">sets</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        exercises: p.exercises.filter((_, j) => j !== i),
                      }))
                    }
                    className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {!showExercisePicker ? (
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="w-full flex items-center justify-center gap-2 h-10 border border-dashed 
                           border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500
                           rounded-md text-sm transition-colors"
              >
                <Plus size={14} />
                Add Exercise
              </button>
            ) : (
              <div className="bg-zinc-800 rounded-md overflow-hidden">
                {!showCustomForm ? (
                  <>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search exercises..."
                      className="w-full bg-transparent text-zinc-50 placeholder:text-zinc-500 
                                 px-3 py-2 text-sm outline-none border-b border-zinc-700"
                      autoFocus
                    />
                    <div className="max-h-44 overflow-y-auto">
                      {filtered.slice(0, 30).map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleAddExercise(ex)}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-300 
                                     hover:bg-zinc-700/50 hover:text-white transition-colors
                                     flex items-center gap-2"
                        >
                          <span className="flex-1 truncate">{ex.name}</span>
                          {ex.isCustom && (
                            <span className="text-[9px] bg-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide shrink-0">
                              Custom
                            </span>
                          )}
                          <span className="text-zinc-600 text-xs shrink-0">
                            {ex.muscleGroup}
                          </span>
                        </button>
                      ))}
                      {/* Create Custom link */}
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(true)}
                        className="w-full text-left px-3 py-2.5 text-xs text-green-500/70
                                   hover:text-green-400 hover:bg-zinc-700/30 transition-colors
                                   border-t border-zinc-700 flex items-center gap-1.5"
                      >
                        <Plus size={12} />
                        Create Custom Exercise
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 space-y-2.5">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                      New Custom Exercise
                    </p>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Exercise name"
                      className="w-full bg-zinc-700 text-zinc-50 placeholder:text-zinc-500
                                 px-3 py-2 rounded-md text-sm outline-none
                                 border border-zinc-600 focus:border-green-500 transition-colors"
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
                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleCancelCustom}
                        className="flex-1 h-8 rounded text-xs text-zinc-400 border border-zinc-600
                                   hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveCustom()}
                        disabled={createCustomExercise.isPending}
                        className="flex-1 h-8 rounded text-xs bg-green-500 hover:bg-green-400
                                   text-zinc-950 font-semibold transition-colors disabled:opacity-60
                                   flex items-center justify-center gap-1"
                      >
                        {createCustomExercise.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : null}
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={createTemplate.isPending}
            className="w-full h-11 bg-green-500 hover:bg-green-400 text-zinc-950 font-semibold
                       rounded-md text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {createTemplate.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Create Template
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StartPage() {
  const navigate = useNavigate();
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const { data: templates = [], isLoading } = useTemplates();
  const createSession = useCreateWorkoutSession();
  const deleteTemplate = useDeleteTemplate();

  const handleStartEmpty = async () => {
    try {
      const session = await createSession.mutateAsync({
        name: `Workout ${format(new Date(), "MMM d")}`,
        templateId: null,
      });
      void navigate({ to: "/workout/$id", params: { id: session.id } });
    } catch {
      toast.error("Failed to start workout");
    }
  };

  const handleStartTemplate = async (template: WorkoutTemplate) => {
    try {
      const session = await createSession.mutateAsync({
        name: template.name,
        templateId: template.id,
      });
      void navigate({ to: "/workout/$id", params: { id: session.id } });
    } catch {
      toast.error("Failed to start workout");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-green-500" />
            <span className="text-green-500 font-bold tracking-widest text-lg uppercase">
              REPSY
            </span>
          </div>
          <span className="text-zinc-400 text-sm">
            {format(new Date(), "EEE, MMM d")}
          </span>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-6">
        {/* Quick Start */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Quick Start
          </h2>
          <button
            type="button"
            onClick={handleStartEmpty}
            disabled={createSession.isPending}
            className="w-full h-16 flex items-center gap-4 px-5
                       bg-green-500 hover:bg-green-400 active:scale-[0.99]
                       text-zinc-950 rounded-xl transition-all duration-150
                       disabled:opacity-60 font-bold text-base
                       shadow-[0_4px_24px_rgba(34,197,94,0.3)]
                       hover:shadow-[0_6px_32px_rgba(34,197,94,0.45)]"
          >
            {createSession.isPending ? (
              <Loader2 size={22} className="animate-spin shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-950/20 flex items-center justify-center shrink-0">
                <Plus size={20} className="text-zinc-950" />
              </div>
            )}
            <span className="flex-1 text-left">Start Empty Workout</span>
            {!createSession.isPending && (
              <ChevronRight size={18} className="text-zinc-950/60 shrink-0" />
            )}
          </button>
        </section>

        {/* Templates */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              My Templates
            </h2>
            <span className="text-xs text-zinc-600">
              {templates.length} saved
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {["t1", "t2", "t3"].map((k) => (
                <div
                  key={k}
                  className="h-28 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="repsy-card p-6 text-center">
              <Dumbbell
                size={28}
                className="text-zinc-700 mx-auto mb-2"
              />
              <p className="text-zinc-500 text-sm">No templates yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Tap + to create your first template
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onStart={() => void handleStartTemplate(template)}
                  onDelete={() => void handleDeleteTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowCreateTemplate(true)}
        className="fixed bottom-[76px] right-4 w-12 h-12 bg-green-500 hover:bg-green-400 
                   text-zinc-950 rounded-full shadow-lg hover:shadow-green-500/25
                   flex items-center justify-center transition-all active:scale-95
                   repsy-glow"
      >
        <Plus size={22} />
      </button>

      <CreateTemplateModal
        open={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
      />
    </div>
  );
}
