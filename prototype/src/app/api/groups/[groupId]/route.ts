import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { getGroupDetail } from "@/lib/splitsmart";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const group = await getGroupDetail(groupId);
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });
    return NextResponse.json({ group });
  } catch (error) {
    return errorResponse(error);
  }
}
