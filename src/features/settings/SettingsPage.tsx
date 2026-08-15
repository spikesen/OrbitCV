import { useEffect, useState } from "react";
import { LoadingPage } from "@/components/loading-page";
import { useSession } from "@/features/auth/useSession";
import { getUserSettings, upsertUserSettings } from "@/features/settings/api";
import { encryptApiKey, decryptApiKey } from "@/features/settings/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Provider = "gemini" | "openrouter";

const PROVIDER_INFO: Record<Provider, { label: string; getKeyUrl: string; getKeyLabel: string; model: string }> = {
  gemini: {
    label: "Google Gemini",
    getKeyUrl: "https://aistudio.google.com/apikey",
    getKeyLabel: "ai.google.dev",
    model: "gemini-3.5-flash",
  },
  openrouter: {
    label: "OpenRouter",
    getKeyUrl: "https://openrouter.ai/workspaces/default/keys",
    getKeyLabel: "openrouter.ai",
    model: "openai/gpt-4o-mini",
  },
};

export function SettingsPage() {
  const { session } = useSession();
  const [provider, setProvider] = useState<Provider>("gemini");
  const [hasKey, setHasKey] = useState(false);
  const [lastFour, setLastFour] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    getUserSettings(session.user.id)
      .then((settings) => {
        setHasKey(!!settings.ai_key_encrypted);
        if (settings.ai_key_provider === "openrouter" || settings.ai_key_provider === "gemini") {
          setProvider(settings.ai_key_provider);
        }
        if (settings.ai_key_encrypted && settings.ai_key_iv) {
          decryptApiKey(settings.ai_key_encrypted, settings.ai_key_iv)
            .then((key) => setLastFour(key.slice(-4)))
            .catch(() => setLastFour("****"));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function handleSaveKey() {
    if (!keyInput || !session?.user) return;
    setSaving(true);
    setMessage(null);
    try {
      const { encrypted, iv } = await encryptApiKey(keyInput);
      await upsertUserSettings(session.user.id, {
        ai_key_encrypted: encrypted,
        ai_key_iv: iv,
        ai_key_provider: provider,
      });
      setHasKey(true);
      setLastFour(keyInput.slice(-4));
      setKeyInput("");
      setMessage(`${PROVIDER_INFO[provider].label} key saved. Calls go directly from your browser.`);
    } catch {
      setMessage("Failed to save key. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveKey() {
    if (!session?.user) return;
    setSaving(true);
    setMessage(null);
    try {
      await upsertUserSettings(session.user.id, {
        ai_key_encrypted: null,
        ai_key_iv: null,
        ai_key_provider: null,
      });
      setHasKey(false);
      setLastFour("");
      setMessage("API key removed. You will use the shared quota (5/day).");
    } catch {
      setMessage("Failed to remove key.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestKey() {
    if (!session?.user) return;
    setTesting(true);
    setMessage(null);
    try {
      const settings = await getUserSettings(session.user.id);
      if (!settings.ai_key_encrypted || !settings.ai_key_iv) {
        setMessage("No key saved. Save a key first.");
        setTesting(false);
        return;
      }
      const key = await decryptApiKey(settings.ai_key_encrypted, settings.ai_key_iv);
      const activeProvider = (settings.ai_key_provider as Provider) ?? provider;

      if (activeProvider === "openrouter") {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: "Say hi in 3 words" }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = err?.error?.message ?? `HTTP ${res.status}`;
          if (msg.includes("high demand") || msg.includes("try again later")) {
            setMessage("Key is valid. API temporarily overloaded, try again in a moment.");
          } else if (msg.includes("Invalid") || msg.includes("unauthorized")) {
            setMessage("Key invalid. Check your key and try again.");
          } else {
            setMessage(`Error: ${msg}`);
          }
        } else {
          setMessage("Key works! AI tailoring is ready.");
        }
      } else {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say hi in 3 words" }] }],
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = err?.error?.message ?? `HTTP ${res.status}`;
          if (msg.includes("high demand") || msg.includes("try again later")) {
            setMessage("Key is valid. API temporarily overloaded, try again in a moment.");
          } else if (msg.includes("API key not valid") || msg.includes("invalid")) {
            setMessage("Key invalid. Check your key and try again.");
          } else {
            setMessage(`Error: ${msg}`);
          }
        } else {
          setMessage("Key works! AI tailoring is ready.");
        }
      }
    } catch {
      setMessage("Network error. Check your connection.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <LoadingPage />;
  }

  const info = PROVIDER_INFO[provider];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground">Settings</h1>

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="mb-2 text-xl">AI Tailoring</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect your own API key for unlimited AI tailoring, or use the shared quota (5
              requests per day).
            </p>

            {hasKey ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm">
                  {info.label} key (****{lastFour}) saved and encrypted. Calls go directly from your
                  browser.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleTestKey} disabled={saving || testing}>
                    {testing ? "Testing..." : "Test key"}
                  </Button>
                  <Button variant="outline" onClick={handleRemoveKey} disabled={saving || testing}>
                    {saving ? "Removing..." : "Remove key"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  No key set. You are using the shared quota (5 requests per day).
                </p>

                {/* Provider selector */}
                <div className="flex flex-col gap-1.5">
                  <Label>Provider</Label>
                  <div className="flex gap-2">
                    {(Object.entries(PROVIDER_INFO) as [Provider, (typeof PROVIDER_INFO)[Provider]][]).map(
                      ([id, p]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setProvider(id)}
                          className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                            provider === id
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-foreground/30"
                          }`}
                        >
                          {p.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="api-key">{info.label} API key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-key"
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={`Paste your ${info.label} API key`}
                      className="max-w-md"
                    />
                    <Button onClick={handleSaveKey} disabled={!keyInput || saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get a free key at{" "}
                    <a
                      href={info.getKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {info.getKeyLabel}
                    </a>
                    . Your key is encrypted locally and never sent to our server.
                  </p>
                </div>
              </div>
            )}

            {message && <p className="mt-2 text-sm">{message}</p>}
          </div>
        </section>
      </main>
  );
}
