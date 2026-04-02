import Link from "next/link";
import { notFound } from "next/navigation";
import { InvitationPreview } from "@/components/invitation-preview";
import { getCopy } from "@/lib/i18n";
import { getInvitationByIdentifier } from "@/lib/store";
import { InvitationRecord } from "@/lib/types";

export default async function PublicInvitationPage({
  params
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  const invitation = await getInvitationByIdentifier(identifier);

  if (!invitation) {
    notFound();
  }

  const invitationRecord = invitation as InvitationRecord;
  const t = getCopy(invitationRecord.language);

  if (invitationRecord.status !== "published") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe8] px-6 py-12">
        <div className="max-w-xl rounded-[32px] bg-white p-8 text-center shadow-glow">
          <h1 className="text-3xl">{t.notPublished}</h1>
          <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-5 py-3 text-white" href="/">
            {t.backHome}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: invitationRecord.design.colorPalette.background }}>
      <InvitationPreview invitation={invitationRecord} publicMode />
    </main>
  );
}
