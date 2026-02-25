import { Link, useRouterState } from "@tanstack/react-router";
import {
  Play,
  Clock,
  BarChart2,
  User,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/start", label: "Start", icon: Play },
  { path: "/history", label: "History", icon: Clock },
  { path: "/reports", label: "Reports", icon: BarChart2 },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around h-[60px]">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = currentPath === path || (path === "/start" && currentPath === "/");
          return (
            <Link
              key={path}
              to={path}
              className={`
                relative flex flex-col items-center justify-center gap-1 min-w-[64px] h-full
                transition-all duration-200
                ${isActive ? "text-green-500" : "text-zinc-500 hover:text-zinc-300"}
              `}
            >
              {/* Active pill indicator */}
              <span
                className={`
                  absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full
                  transition-all duration-300 ease-out
                  ${isActive ? "w-6 bg-green-500" : "w-0 bg-transparent"}
                `}
              />

              <Icon
                size={isActive ? 22 : 20}
                className={`transition-all duration-200 ${
                  isActive
                    ? "drop-shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                    : ""
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                  isActive ? "text-green-500" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
