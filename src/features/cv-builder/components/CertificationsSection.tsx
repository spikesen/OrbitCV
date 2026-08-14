import { Plus, Trash2 } from "lucide-react";
import type { CertificationEntry } from "@/features/cv-builder/types";
import { newId } from "@/features/cv-builder/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TagInput } from "@/components/tag-input";

interface Props {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

const emptyEntry = (): CertificationEntry => ({
  id: newId(),
  kind: "single",
  name: "",
  issuer: "",
  year: "",
  items: [],
  note: "",
});

export function CertificationsSection({ entries, onChange }: Props) {
  function update(id: string, patch: Partial<CertificationEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function remove(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-center gap-1 rounded-md bg-muted p-1 text-sm w-fit">
              <button
                type="button"
                onClick={() => update(entry.id, { kind: "single" })}
                className={`rounded px-2.5 py-1 ${entry.kind === "single" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                Single certificate
              </button>
              <button
                type="button"
                onClick={() => update(entry.id, { kind: "group" })}
                className={`rounded px-2.5 py-1 ${entry.kind === "group" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                Grouped list
              </button>
            </div>

            {entry.kind === "single" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`cert-name-${entry.id}`}>Certification</Label>
                  <Input
                    id={`cert-name-${entry.id}`}
                    value={entry.name}
                    placeholder="e.g. AWS Certified Solutions Architect"
                    onChange={(e) => update(entry.id, { name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`cert-year-${entry.id}`}>Year</Label>
                  <Input
                    id={`cert-year-${entry.id}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="YYYY"
                    value={entry.year.slice(0, 4)}
                    onChange={(e) => update(entry.id, { year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`cert-issuer-${entry.id}`}>Issued by</Label>
                  <Input
                    id={`cert-issuer-${entry.id}`}
                    value={entry.issuer}
                    placeholder="e.g. Amazon Web Services"
                    onChange={(e) => update(entry.id, { issuer: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  For several smaller items (CTFs, workshops, participation certificates) that don't
                  need their own line. Shows as one compact line: "Label: item, item, item".
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`cert-group-label-${entry.id}`}>Group label</Label>
                  <Input
                    id={`cert-group-label-${entry.id}`}
                    value={entry.name}
                    placeholder="e.g. CTF Competitions"
                    onChange={(e) => update(entry.id, { name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Items</Label>
                  <TagInput
                    tags={entry.items}
                    onChange={(items) => update(entry.id, { items })}
                    placeholder="e.g. HackFest 2025, then press Enter..."
                    label={`items in ${entry.name || "group"}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`cert-note-${entry.id}`}>Note (optional)</Label>
                  <Input
                    id={`cert-note-${entry.id}`}
                    value={entry.note}
                    placeholder="e.g. Active on TryHackMe (username) and HackTheBox"
                    onChange={(e) => update(entry.id, { note: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit text-destructive"
              onClick={() => remove(entry.id)}
            >
              <Trash2 className="size-3.5" /> Remove
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...entries, emptyEntry()])} className="w-fit">
        <Plus className="size-4" /> Add certification
      </Button>
    </div>
  );
}
