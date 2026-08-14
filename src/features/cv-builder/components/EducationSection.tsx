import { Plus, Trash2 } from "lucide-react";
import type { EducationEntry } from "@/features/cv-builder/types";
import { newId } from "@/features/cv-builder/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

const emptyEntry = (): EducationEntry => ({
  id: newId(),
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
});

export function EducationSection({ entries, onChange }: Props) {
  function update(id: string, patch: Partial<EducationEntry>) {
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`institution-${entry.id}`}>Institution</Label>
                <Input
                  id={`institution-${entry.id}`}
                  value={entry.institution}
                  onChange={(e) => update(entry.id, { institution: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`degree-${entry.id}`}>Degree</Label>
                <Input id={`degree-${entry.id}`} value={entry.degree} onChange={(e) => update(entry.id, { degree: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`field-${entry.id}`}>Field of study</Label>
                <Input id={`field-${entry.id}`} value={entry.field} onChange={(e) => update(entry.id, { field: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`edu-start-${entry.id}`}>Start year</Label>
                  <Input
                    id={`edu-start-${entry.id}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="YYYY"
                    value={entry.startDate.slice(0, 4)}
                    onChange={(e) => update(entry.id, { startDate: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`edu-end-${entry.id}`}>End year</Label>
                  <Input
                    id={`edu-end-${entry.id}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="YYYY"
                    value={entry.endDate.slice(0, 4)}
                    onChange={(e) => update(entry.id, { endDate: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
              </div>
            </div>

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
        <Plus className="size-4" /> Add education
      </Button>
    </div>
  );
}
