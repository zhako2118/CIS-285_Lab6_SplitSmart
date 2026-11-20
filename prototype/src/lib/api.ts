import { NextResponse } from "next/server";
import { ServiceError } from "./splitsmart";

/** Read a JSON object body; returns {} for missing/invalid JSON so validation reports field errors. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}

/** Convert service errors to JSON responses; log and hide unexpected errors. */
export function errorResponse(error: unknown) {
  if (error instanceof ServiceError) {
    return NextResponse.json({ error: error.message, field: error.field }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
