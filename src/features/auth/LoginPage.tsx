import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "sign-in" | "sign-up";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (mode === "sign-up") {
      setInfo("Check your email to confirm your account, then sign in.");
      setMode("sign-in");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <span className="font-display text-3xl tracking-tight text-foreground">
            Orbit<span className="text-primary">CV</span>
          </span>
          <p className="mt-1.5 text-sm text-muted-foreground">
            One master CV, tailored for every role.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "sign-in" ? "Sign in" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {mode === "sign-in"
                ? "Welcome back."
                : "Build your first CV in a few minutes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-muted-foreground">{info}</p>}

              <Button type="submit" disabled={submitting} className="mt-2">
                {submitting ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Sign up"}
              </Button>

              <button
                type="button"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                }}
              >
                {mode === "sign-in"
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          100% free · ATS-safe PDF export · BYOK AI
        </p>
      </div>
    </main>
  );
}
