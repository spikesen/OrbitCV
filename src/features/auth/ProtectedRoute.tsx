import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSession } from "@/features/auth/useSession";
import { LoadingPage } from "@/components/loading-page";
import { getUserProfile } from "@/features/profile/api";
import { withTimeout } from "@/lib/withTimeout";

const PUBLIC_ROUTES = ["/onboarding", "/profile"];

export function ProtectedRoute() {
  const { session, loading } = useSession();
  const location = useLocation();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    // Session still resolving - wait.
    if (loading) return;

    // No session: no point checking for a profile; render will redirect to /login.
    if (!session?.user) {
      setHasProfile(false);
      return;
    }

    // Skip profile check for profile-management routes.
    if (PUBLIC_ROUTES.some((r) => location.pathname.startsWith(r))) {
      setHasProfile(true);
      return;
    }

    let cancelled = false;
    withTimeout(getUserProfile(session.user.id), 8000, "Profile lookup")
      .then((profile) => { if (!cancelled) setHasProfile(!!profile); })
      .catch(() => { if (!cancelled) setHasProfile(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, loading, location.pathname]);

  // Still waiting on session resolution.
  if (loading) return <LoadingPage />;

  // Session resolved but no user → redirect immediately, no profile fetch needed.
  if (!session) return <Navigate to="/login" replace />;

  // Session exists but profile check still in flight.
  if (hasProfile === null) return <LoadingPage />;

  // New user: send to onboarding.
  if (!hasProfile && !PUBLIC_ROUTES.some((r) => location.pathname.startsWith(r))) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
