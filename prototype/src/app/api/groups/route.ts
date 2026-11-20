import { NextResponse } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { createGroup, listGroups } from "@/lib/splitsmart";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ groups: await listGroups() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const group = await createGroup(await readJson(request));
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
