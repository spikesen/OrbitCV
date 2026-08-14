import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/features/auth/useSession";
import { Menu, X, LayoutDashboard, Search, BookOpen, User, Settings, LogOut, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { key: "dashboard", to: "/dashboard", label: "My CVs",        icon: LayoutDashboard },
  { key: "jobs",      to: "/jobs",       label: "Find jobs",    icon: Search },
  { key: "guide",     to: "/guide",      label: "Writing guide",icon: BookOpen },
];

const UTILITY_LINKS = [
  { key: "profile",  to: "/profile",  label: "Profile",  icon: User },
  { key: "settings", to: "/settings", label: "Settings", icon: Settings },
];

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMobileOpen(false);
    navigate("/login");
  }

  const isActive = (key: string) => {
    const p = location.pathname;
    if (key === "dashboard") return p === "/dashboard" || p.startsWith("/cv/");
    if (key === "jobs")      return p.startsWith("/jobs");
    if (key === "guide")     return p.startsWith("/guide");
    if (key === "profile")   return p.startsWith("/profile") || p.startsWith("/onboarding");
    if (key === "settings")  return p.startsWith("/settings");
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-0 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to={session ? "/dashboard" : "/"}
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2 py-3.5"
        >
          <span className="font-display text-lg tracking-tight text-foreground">
            Orbit<span className="text-primary">CV</span>
          </span>
        </Link>

        {/* Desktop nav, primary links */}
        <nav className="hidden flex-1 items-center gap-0.5 sm:flex">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
            </div>
          ) : session ? (
            <>
              {NAV_LINKS.map(({ key, to, label, icon: Icon }) => (
                <Link
                  key={key}
                  to={to}
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(key)
                      ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          ) : (
            <>
              <Link
                to="/jobs"
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("jobs") ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Search className="size-3.5" />Find jobs
              </Link>
              <Link
                to="/guide"
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("guide") ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />Writing guide
              </Link>
            </>
          )}
        </nav>

        {/* Desktop right side, utility links + auth */}
        <div className="hidden items-center gap-1 sm:flex">
          {loading ? (
            <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
          ) : session ? (
            <>
              {UTILITY_LINKS.map(({ key, to, label, icon: Icon }) => (
                <Link
                  key={key}
                  to={to}
                  title={label}
                  className={`flex items-center rounded-md p-2 text-sm transition-colors ${
                    isActive(key)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </Link>
              ))}
              <div className="mx-1 h-4 w-px bg-border" />
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right side */}
        <div className="ml-auto flex items-center gap-2 sm:hidden">
          {!session && !loading && (
            <Link
              to="/login"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Get started
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-background sm:hidden">
          <div className="px-4 py-3">
            {session ? (
              <>
                {/* Primary nav */}
                <div className="mb-2">
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Navigation</p>
                  {NAV_LINKS.map(({ key, to, label, icon: Icon }) => (
                    <Link
                      key={key}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive(key)
                          ? "bg-primary/8 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        {label}
                      </span>
                      {isActive(key) && <ChevronRight className="size-3.5 text-primary/60" />}
                    </Link>
                  ))}
                </div>

                {/* Utility nav */}
                <div className="mb-2 border-t border-border/60 pt-2">
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Account</p>
                  {UTILITY_LINKS.map(({ key, to, label, icon: Icon }) => (
                    <Link
                      key={key}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive(key)
                          ? "bg-primary/8 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="size-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <Link to="/jobs"  onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Search className="size-4" />Find jobs</Link>
                <Link to="/guide" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><BookOpen className="size-4" />Writing guide</Link>
                <div className="border-t border-border/60 pt-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><User className="size-4" />Sign in</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
