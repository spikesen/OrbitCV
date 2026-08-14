import { Plus, Trash2 } from "lucide-react";
import type { ReferenceEntry } from "@/features/cv-builder/types";
import { newId } from "@/features/cv-builder/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  entries: ReferenceEntry[];
  onChange: (entries: ReferenceEntry[]) => void;
}

const emptyEntry = (): ReferenceEntry => ({
  id: newId(),
  name: "",
  title: "",
  company: "",
  email: "",
  phone: "",
  relationship: "",
});

export function ReferencesSection({ entries, onChange }: Props) {
  function update(id: string, patch: Partial<ReferenceEntry>) {
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
                <Label htmlFor={`ref-name-${entry.id}`}>Name</Label>
                <Input
                  id={`ref-name-${entry.id}`}
                  value={entry.name}
                  onChange={(e) => update(entry.id, { name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`ref-relationship-${entry.id}`}>Relationship</Label>
                <Input
                  id={`ref-relationship-${entry.id}`}
                  value={entry.relationship}
                  placeholder="e.g. Former Manager"
                  onChange={(e) => update(entry.id, { relationship: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`ref-title-${entry.id}`}>Title</Label>
                <Input
                  id={`ref-title-${entry.id}`}
                  value={entry.title}
                  onChange={(e) => update(entry.id, { title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`ref-company-${entry.id}`}>Company</Label>
                <Input
                  id={`ref-company-${entry.id}`}
                  value={entry.company}
                  onChange={(e) => update(entry.id, { company: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`ref-email-${entry.id}`}>Email</Label>
                <Input
                  id={`ref-email-${entry.id}`}
                  type="email"
                  value={entry.email}
                  onChange={(e) => update(entry.id, { email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`ref-phone-${entry.id}`}>Phone</Label>
                <Input
                  id={`ref-phone-${entry.id}`}
                  value={entry.phone}
                  onChange={(e) => update(entry.id, { phone: e.target.value })}
                />
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
        <Plus className="size-4" /> Add reference
      </Button>
    </div>
  );
}
