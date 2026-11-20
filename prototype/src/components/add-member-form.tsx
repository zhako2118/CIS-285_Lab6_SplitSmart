"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { MemberDTO } from "@/lib/splitsmart";
import { NAME_MAX, parseMemberName } from "@/lib/validation";
import { postJson } from "./post-json";
import { FormMessage, Icons, Spinner, buttonClass, inputClass } from "./ui";

export function AddMemberForm({ groupId }: { groupId: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccess(null);
    const parsed = parseMemberName(name);
    if (!parsed.ok) return setError(parsed.error);
    setPending(true);
    setError(null);
    const result = await postJson<{ member: MemberDTO }>(`/api/groups/${groupId}/members`, {
      name: parsed.value,
    });
    setPending(false);
    if (!result.ok) return setError(result.error);
    setName("");
    setSuccess(`${result.data.member.name} was added to the group.`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <label htmlFor="member-name" className="sr-only">
        New member name
      </label>
      <div className="flex gap-2">
        <input
          id="member-name"
          className={inputClass}
          placeholder="Add a member, e.g. Alice"
          value={name}
          maxLength={NAME_MAX}
          aria-invalid={!!error}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          disabled={pending}
        />
        <button type="submit" className={buttonClass} disabled={pending} aria-label="Add member">
          {pending ? <Spinner /> : Icons.plus}
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <FormMessage error={error} success={success} />
    </form>
  );
}
