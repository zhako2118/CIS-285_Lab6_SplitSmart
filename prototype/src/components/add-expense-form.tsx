"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { ExpenseDTO, MemberDTO } from "@/lib/splitsmart";
import { formatCents, parseAmountToCents, splitEqually } from "@/lib/money";
import { DESCRIPTION_MAX, parseDescription } from "@/lib/validation";
import { postJson } from "./post-json";
import { Avatar, FormMessage, Icons, Spinner, buttonClass, cx, inputClass } from "./ui";

type Field = "description" | "amount" | "payerId" | "participantIds" | "date";
type Errors = Partial<Record<Field, string>>;

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function AddExpenseForm({ groupId, members }: { groupId: number; members: MemberDTO[] }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<string>(members[0] ? String(members[0].id) : "");
  const [participants, setParticipants] = useState<number[]>(members.map((m) => m.id));
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Set the default date on the client so it uses the viewer's local day.
  useEffect(() => setDate((d) => d || localToday()), []);

  // Keep selections valid when the member list changes: drop removed IDs,
  // auto-include newly added members, and keep the payer pointing at a member.
  const knownIds = useRef(members.map((m) => m.id));
  const memberKey = members.map((m) => m.id).join(",");
  useEffect(() => {
    const ids = memberKey ? memberKey.split(",").map(Number) : [];
    const added = ids.filter((id) => !knownIds.current.includes(id));
    knownIds.current = ids;
    setParticipants((prev) => [...prev.filter((id) => ids.includes(id)), ...added]);
    setPayerId((prev) => (ids.includes(Number(prev)) ? prev : ids[0] ? String(ids[0]) : ""));
  }, [memberKey]);

  const parsedAmount = useMemo(() => parseAmountToCents(amount), [amount]);
  const preview = useMemo(() => {
    if (!parsedAmount.ok || participants.length === 0) return null;
    return splitEqually(parsedAmount.value, participants);
  }, [parsedAmount, participants]);
  const nameById = new Map(members.map((m) => [m.id, m.name]));

  function clearFieldError(field: Field) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
    setSuccess(null);
  }

  function toggleParticipant(id: number) {
    clearFieldError("participantIds");
    setParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccess(null);
    const next: Errors = {};
    const desc = parseDescription(description);
    if (!desc.ok) next.description = desc.error;
    if (!parsedAmount.ok) next.amount = parsedAmount.error;
    if (!payerId) next.payerId = "Choose who paid.";
    if (participants.length === 0) next.participantIds = "Select at least one participant.";
    if (!date) next.date = "Choose a date.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    setFormError(null);
    const result = await postJson<{ expense: ExpenseDTO }>(`/api/groups/${groupId}/expenses`, {
      description: desc.ok ? desc.value : description,
      amount,
      payerId: Number(payerId),
      participantIds: participants,
      date,
    });
    setPending(false);
    if (!result.ok) {
      const field = result.field as Field | undefined;
      if (field && field in { description: 1, amount: 1, payerId: 1, participantIds: 1, date: 1 }) {
        setErrors({ [field]: result.error });
      } else {
        setFormError(result.error);
      }
      return;
    }
    const e = result.data.expense;
    setSuccess(`Added “${e.description}” for ${formatCents(e.amountCents)}.`);
    setDescription("");
    setAmount("");
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
        Add at least one member to this group before recording expenses.
      </p>
    );
  }

  const allSelected = participants.length === members.length;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Description" htmlFor="exp-desc" error={errors.description}>
          <input
            id="exp-desc"
            className={inputClass}
            placeholder="e.g. Groceries, Dinner, Gas"
            value={description}
            maxLength={DESCRIPTION_MAX}
            aria-invalid={!!errors.description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearFieldError("description");
            }}
            disabled={pending}
          />
        </Field>
        <Field label="Amount (USD)" htmlFor="exp-amount" error={errors.amount}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
              $
            </span>
            <input
              id="exp-amount"
              className={cx(inputClass, "pl-7 tabular-nums")}
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              aria-invalid={!!errors.amount}
              onChange={(e) => {
                setAmount(e.target.value);
                clearFieldError("amount");
              }}
              disabled={pending}
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Paid by" htmlFor="exp-payer" error={errors.payerId}>
          <select
            id="exp-payer"
            className={inputClass}
            value={payerId}
            aria-invalid={!!errors.payerId}
            onChange={(e) => {
              setPayerId(e.target.value);
              clearFieldError("payerId");
            }}
            disabled={pending}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" htmlFor="exp-date" error={errors.date}>
          <input
            id="exp-date"
            type="date"
            className={inputClass}
            value={date}
            aria-invalid={!!errors.date}
            onChange={(e) => {
              setDate(e.target.value);
              clearFieldError("date");
            }}
            disabled={pending}
          />
        </Field>
      </div>

      <fieldset>
        <div className="mb-1.5 flex items-center justify-between">
          <legend className="text-sm font-medium text-slate-700">Split equally between</legend>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-700 hover:underline"
            onClick={() => {
              clearFieldError("participantIds");
              setParticipants(allSelected ? [] : members.map((m) => m.id));
            }}
            disabled={pending}
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const checked = participants.includes(m.id);
            const share = preview?.find((s) => s.memberId === m.id);
            return (
              <label
                key={m.id}
                className={cx(
                  "flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition select-none",
                  checked
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  pending && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleParticipant(m.id)}
                  disabled={pending}
                />
                <Avatar id={m.id} name={m.name} size="sm" />
                <span className="font-medium">{m.name}</span>
                {checked && share && (
                  <span className="tabular-nums text-emerald-700">{formatCents(share.shareCents)}</span>
                )}
                {checked && <span className="text-emerald-600">{Icons.check}</span>}
              </label>
            );
          })}
        </div>
        {errors.participantIds && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.participantIds}</p>
        )}
        {preview && (
          <p className="mt-2 text-xs text-slate-500">
            {formatCents(parsedAmount.ok ? parsedAmount.value : 0)} split {preview.length} way
            {preview.length === 1 ? "" : "s"}
            {new Set(preview.map((s) => s.shareCents)).size > 1 &&
              ` — extra cent${parsedAmount.ok && parsedAmount.value % preview.length > 1 ? "s" : ""} go to ${preview
                .filter((s) => s.shareCents === preview[0].shareCents)
                .map((s) => nameById.get(s.memberId))
                .join(", ")}`}
            .
          </p>
        )}
      </fieldset>

      <FormMessage error={formError} success={success} />

      <div className="flex justify-end">
        <button type="submit" className={cx(buttonClass, "w-full sm:w-auto")} disabled={pending}>
          {pending ? <Spinner /> : Icons.plus}
          {pending ? "Saving…" : "Add expense"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
