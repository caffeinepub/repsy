import { Dumbbell, Loader2, Shield, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();

  const isLoading = isInitializing || isLoggingIn;

  return (
    <div
      className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6"
      data-ocid="login.page"
    >
      {/* Background subtle gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Dumbbell size={32} className="text-green-500" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 font-display-repsy">
              REPSY
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              Track your workouts. Own your progress.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
            <Zap size={16} className="text-green-500 shrink-0" />
            <span className="text-sm text-zinc-300">
              Live workout tracking with PR detection
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
            <Dumbbell size={16} className="text-green-500 shrink-0" />
            <span className="text-sm text-zinc-300">
              80+ exercises across all muscle groups
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
            <Shield size={16} className="text-green-500 shrink-0" />
            <span className="text-sm text-zinc-300">
              Progress charts and strength analytics
            </span>
          </div>
        </div>

        {/* Sign-in button */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={login}
            disabled={isLoading}
            data-ocid="login.primary_button"
            className="w-full h-12 bg-green-500 hover:bg-green-400 active:bg-green-600
                       text-zinc-950 font-bold text-sm rounded-xl
                       transition-colors disabled:opacity-60
                       flex items-center justify-center gap-2.5"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isInitializing ? "Loading…" : "Opening Internet Identity…"}
              </>
            ) : (
              <>
                <Shield size={16} />
                Sign in with Internet Identity
              </>
            )}
          </button>

          {/* Explanation */}
          <p className="text-center text-xs text-zinc-600 leading-relaxed">
            Internet Identity is a secure, privacy-preserving login —{" "}
            <span className="text-zinc-500">no passwords, no tracking.</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-zinc-700 text-xs">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-red-500/70">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-500 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
