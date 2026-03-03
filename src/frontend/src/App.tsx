import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RegisterModal } from "./components/auth/RegisterModal";
import { BottomNav } from "./components/layout/BottomNav";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useSeed } from "./hooks/useQueries";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportsPage } from "./pages/ReportsPage";
import { StartPage } from "./pages/StartPage";
import { WorkoutPage } from "./pages/WorkoutPage";

const SEED_KEY = "repsy_seeded_v1";

// ─── Seed initializer ─────────────────────────────────────────────────────────
// Seeds the backend once per session (backend is idempotent).
// After seed completes, invalidates exercises so the query never serves a
// stale empty result that was cached before seed finished.

function SeedInitializer() {
  const { actor, isFetching } = useActor();
  const { mutate: seedMutate } = useSeed();
  const qc = useQueryClient();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    if (hasFired.current) return;
    hasFired.current = true;

    seedMutate(undefined, {
      onSuccess: () => {
        localStorage.setItem(SEED_KEY, "1");
        qc.invalidateQueries({ queryKey: ["exercises"] });
      },
      onError: () => {
        qc.invalidateQueries({ queryKey: ["exercises"] });
      },
    });
  }, [actor, isFetching, seedMutate, qc]);

  return null;
}

// ─── Auth gate + registration flow ───────────────────────────────────────────

type AuthState = "checking" | "needs_register" | "ready";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const hasChecked = useRef(false);

  const isAnonymous = !identity || identity.getPrincipal().isAnonymous();

  // Once actor is ready and user is logged in, check if they're registered
  useEffect(() => {
    if (isInitializing || isFetching || !actor || isAnonymous) return;
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Try to fetch the user — if it throws, they need to register
    actor
      .getUser()
      .then(() => {
        setAuthState("ready");
      })
      .catch(() => {
        // getUser threw — user not registered yet
        setAuthState("needs_register");
      });
  }, [actor, isFetching, isInitializing, isAnonymous]);

  // Reset check when identity changes (logout → login)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resets when identity changes
  useEffect(() => {
    hasChecked.current = false;
    setAuthState("checking");
  }, [identity]);

  // Not logged in → show login page
  if (isAnonymous) {
    return <LoginPage />;
  }

  // Still checking / actor not ready
  if (authState === "checking" || isInitializing || isFetching) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          <p className="text-zinc-600 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Logged in but not registered → show register modal
  if (authState === "needs_register") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RegisterModal open={true} onRegistered={() => setAuthState("ready")} />
      </div>
    );
  }

  // Fully authenticated and registered
  return <>{children}</>;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <AuthGate>
        <SeedInitializer />
        <Outlet />
      </AuthGate>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#f4f4f5",
          },
        }}
      />
    </div>
  );
}

// ─── Layout with bottom nav ───────────────────────────────────────────────────

function AppLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/start" });
  },
  component: () => null,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});

const startRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/start",
  component: StartPage,
});

const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/history",
  component: HistoryPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/reports",
  component: ReportsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

// Workout page – no bottom nav
const workoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout/$id",
  component: WorkoutPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  appLayoutRoute.addChildren([
    startRoute,
    historyRoute,
    reportsRoute,
    profileRoute,
  ]),
  workoutRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />;
}
