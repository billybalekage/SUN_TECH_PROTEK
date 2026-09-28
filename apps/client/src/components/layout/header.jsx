import { Laptop, LogOut, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { themeOptions, useTheme } from "./theme-context";

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Laptop,
};

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const logout = useLogout();
  const isAuthenticatedArea = [
    "/dashboard",
    "/projects",
    "/password/change",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
      <Link
        to={isAuthenticatedArea ? "/dashboard" : "/login"}
        className="shrink-0 text-sm font-semibold tracking-tight"
      >
        PROTEK
      </Link>
      <div
        aria-label="Choisir le thème"
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1"
        role="group"
      >
        {themeOptions.map(({ value, label }) => {
          const Icon = themeIcons[value];

          return (
            <button
              aria-label={`Thème ${label.toLowerCase()}`}
              aria-pressed={theme === value}
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
              key={value}
              onClick={() => setTheme(value)}
              title={label}
              type="button"
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          );
        })}
      </div>
      {isAuthenticatedArea && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut aria-hidden="true" />
          <span className="hidden sm:inline">
            {logout.isPending ? "Déconnexion..." : "Déconnexion"}
          </span>
        </Button>
      )}
    </header>
  );
};

export default Header;
