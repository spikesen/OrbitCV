import { Plus, Trash2 } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { newId, SKILL_CATEGORY_PRESETS, type SkillGroup } from "@/features/cv-builder/types";

interface Props {
  skills: SkillGroup[];
  onChange: (skills: SkillGroup[]) => void;
}

export function SkillGroupsEditor({ skills: groups, onChange }: Props) {
  function update(id: string, patch: Partial<SkillGroup>) {
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function remove(id: string) {
    onChange(groups.filter((g) => g.id !== id));
  }

  function addGroup(category: string) {
    onChange([...groups, { id: newId(), category, skills: [] }]);
  }

  const unusedPresets = SKILL_CATEGORY_PRESETS.filter(
    (preset) => !groups.some((g) => g.category.toLowerCase() === preset.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`skill-category-${group.id}`}>Category</Label>
                <Input
                  id={`skill-category-${group.id}`}
                  value={group.category}
                  onChange={(e) => update(group.id, { category: e.target.value })}
                  placeholder="e.g. Technical, Soft Skills, Tools"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(group.id)}
                aria-label={`Remove ${group.category || "category"}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <TagInput
              tags={group.skills}
              onChange={(skills) => update(group.id, { skills })}
              placeholder="Type a skill and press Enter..."
              label={`skills in ${group.category || "category"}`}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap gap-2">
        {unusedPresets.map((preset) => (
          <Button key={preset} type="button" variant="outline" size="sm" onClick={() => addGroup(preset)}>
            <Plus className="size-3.5" /> {preset}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addGroup("")}>
          <Plus className="size-3.5" /> Custom category
        </Button>
      </div>
    </div>
  );
}
