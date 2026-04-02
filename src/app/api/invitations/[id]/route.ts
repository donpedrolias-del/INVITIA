import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/store";
import { invitationUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const existing = await getInvitation(id);

    if (!existing) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const json = await request.json();
    const payload = invitationUpdateSchema.parse(json);
    const invitation = await updateInvitation(id, payload);
    return NextResponse.json(invitation);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update invitation"
      },
      { status: 400 }
    );
  }
}
