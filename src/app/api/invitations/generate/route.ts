import { NextResponse } from "next/server";
import { generateInvitationWithAI } from "@/lib/ai";
import { invitationGenerateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = invitationGenerateSchema.parse(json);
    const generated = await generateInvitationWithAI(payload);

    return NextResponse.json({
      ...generated,
      status: "draft"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate invitation"
      },
      { status: 400 }
    );
  }
}
