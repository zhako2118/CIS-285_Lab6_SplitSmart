"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { GroupSummary } from "@/lib/splitsmart";
import { NAME_MAX, parseGroupName } from "@/lib/validation";
import { postJson } from "./post-json";
import { FormMessage, Icons, Spinner, buttonClass, inputClass } from "./ui";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGroupName(name);
    if (!parsed.ok) return setError(parsed.error);
    setPending(true);
    setError(null);
    const result = await postJson<{ group: GroupSummary }>("/api/groups", { name: parsed.value });
    if (!result.ok) {
      setPending(false);
      return setError(result.error);
    }
    setName("");
    router.push(`/groups/${result.data.group.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <label htmlFor="group-name" className="block text-sm font-medium text-slate-700">
        Group name
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="group-name"
          className={inputClass}
          placeholder="e.g. Ski Trip 2026, Apartment 4B"
          value={name}
          maxLength={NAME_MAX}
          aria-invalid={!!error}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          disabled={pending}
        />
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? <Spinner /> : Icons.plus}
          {pending ? "Creating…" : "Create group"}
        </button>
      </div>
      <FormMessage error={error} />
    </form>
  );
}
