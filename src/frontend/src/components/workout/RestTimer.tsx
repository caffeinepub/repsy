import { useEffect } from "react";
import { X } from "lucide-react";
import { useWorkoutStore } from "../../store/workoutStore";

export function RestTimer() {
  const restTimer = useWorkoutStore((s) => s.restTimer);
  const tickRestTimer = useWorkoutStore((s) => s.tickRestTimer);
  const dismissRestTimer = useWorkoutStore((s) => s.dismissRestTimer);

  useEffect(() => {
    if (!restTimer) return;
    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer, tickRestTimer]);

  if (!restTimer) return null;

  const total = 90;
  const { secondsLeft } = restTimer;
  const progress = ((total - secondsLeft) / total) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className="fixed left-0 right-0 z-30 animate-slide-up"
      style={{ bottom: "calc(60px + max(0px, env(safe-area-inset-bottom)))" }}
    >
      <div className="mx-3 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="h-0.5 bg-zinc-700">
          <div
            className="h-full bg-green-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                Rest
              </span>
              <span className="font-mono-repsy text-xl font-semibold text-green-500 leading-none">
                {timeStr}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissRestTimer}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 
                       transition-colors bg-zinc-700/50 hover:bg-zinc-700 px-3 py-1.5 rounded-md"
          >
            <X size={12} />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
