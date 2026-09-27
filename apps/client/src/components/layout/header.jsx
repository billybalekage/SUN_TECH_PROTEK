import { Laptop, LogOut, Moon, Sun } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { NAVIGATION, NAVIGATION_LABELS_FR } from "@/config/navigation";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
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
  const isAuthenticatedArea = [
    "/dashboard",
    "/projects",
    "/password/change",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      {isAuthenticatedArea ? (
        <AuthenticatedNavigation />
      ) : (
        <span aria-hidden="true" />
      )}
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
    </header>
  );
};

function AuthenticatedNavigation() {
  const { data: user } = useAuthSession();
  const logout = useLogout();
  const roleName = user?.role?.name ?? user?.roleName;
  const sections = NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(roleName)),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-5">
      <Link
        to="/dashboard"
        className="shrink-0 text-sm font-semibold tracking-tight"
      >
        PROTEK
      </Link>
      <nav
        aria-label="Navigation principale"
        className="flex flex-wrap items-center gap-x-5 gap-y-2"
      >
        {sections.flatMap((section) =>
          section.items.map((item) => {
            const Icon = item.icon;
            const label = NAVIGATION_LABELS_FR[item.labelKey] ?? item.labelKey;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/projects"}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 text-sm transition-colors hover:text-foreground ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`
                }
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </NavLink>
            );
          }),
        )}
      </nav>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start lg:ml-auto lg:self-auto"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        <LogOut aria-hidden="true" />
        {logout.isPending ? "Déconnexion..." : "Déconnexion"}
      </Button>
    </div>
  );
}

export default Header;
