import { useEffect, useRef } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "./components/layout/BottomNav";
import { StartPage } from "./pages/StartPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { useSeed } from "./hooks/useQueries";
import { useActor } from "./hooks/useActor";

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
    // Wait until the actor is ready before attempting to seed
    if (!actor || isFetching) return;
    if (hasFired.current) return;
    hasFired.current = true;

    seedMutate(undefined, {
      onSuccess: () => {
        // Mark seeded so we know the exercises are populated
        localStorage.setItem(SEED_KEY, "1");
        // Ensure the exercise list is refetched fresh after seed
        qc.invalidateQueries({ queryKey: ["exercises"] });
      },
      onError: () => {
        // If seed fails, still invalidate so stale empty cache is cleared
        qc.invalidateQueries({ queryKey: ["exercises"] });
      },
    });
  }, [actor, isFetching, seedMutate, qc]);

  return null;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <SeedInitializer />
      <Outlet />
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
