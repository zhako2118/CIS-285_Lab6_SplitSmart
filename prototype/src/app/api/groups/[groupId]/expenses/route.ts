import { NextResponse } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { createExpense } from "@/lib/splitsmart";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const expense = await createExpense(groupId, await readJson(request));
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
