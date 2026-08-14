import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function TagInput({ tags, onChange, placeholder = "Type and press Enter...", label = "Add items" }: Props) {
  const [draft, setDraft] = useState("");

  function addTags(values: string[]) {
    const next = [...tags];
    for (const raw of values) {
      const value = raw.trim();
      if (value && !next.includes(value)) next.push(value);
    }
    onChange(next);
  }

  function commitDraft() {
    addTags([draft]);
    setDraft("");
  }

  // Handles both typing "react," and pasting a whole comma-separated list
  // ("Python, React, Node.js") at once: any comma in the field's value
  // immediately splits and commits every segment as its own tag.
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value.includes(",")) {
      addTags(value.split(","));
      setDraft("");
    } else {
      setDraft(value);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <Label htmlFor={`tag-input-${label}`} className="sr-only">
        {label}
      </Label>
      <Input
        id={`tag-input-${label}`}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={placeholder}
      />
    </div>
  );
}
