export type PostResult<T> = { ok: true; data: T } | { ok: false; error: string; field?: string };

/** POST JSON to an API route and normalize server, validation, and network errors. */
export async function postJson<T>(url: string, body: unknown): Promise<PostResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? `Request failed (${response.status}).`,
        field: payload.field,
      };
    }
    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}
