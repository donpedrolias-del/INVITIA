import { NextResponse } from "next/server";
import { createInvitation } from "@/lib/store";
import { invitationCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = invitationCreateSchema.parse(json);
    const invitation = await createInvitation(payload);
    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create invitation"
      },
      { status: 400 }
    );
  }
}
