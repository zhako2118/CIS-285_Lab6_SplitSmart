import { NextResponse } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { addMember } from "@/lib/splitsmart";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const member = await addMember(groupId, await readJson(request));
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
