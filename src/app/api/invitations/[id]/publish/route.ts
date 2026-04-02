import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const existing = await getInvitation(id);

  if (!existing) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const invitation = await updateInvitation(id, { status: "published" });
  return NextResponse.json(invitation);
}
