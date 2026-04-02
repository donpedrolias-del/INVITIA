"use client";

import { InvitationRecord, LayoutBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

function getAlignClass(block: LayoutBlock) {
  if (block.align === "left") return "text-left items-start";
  if (block.align === "right") return "text-right items-end";
  return "text-center items-center";
}

function getSpacingClass(block: LayoutBlock) {
  if (block.spacing === "tight") return "gap-3 py-4";
  if (block.spacing === "airy") return "gap-8 py-10";
  return "gap-5 py-6";
}

function InvitationImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} />;
}

export function InvitationPreview({
  invitation,
  publicMode = false
}: {
  invitation: InvitationRecord;
  publicMode?: boolean;
}) {
  const { content, design, layoutConfig, dateTime, venue, dressCode, contactInfo, heroImage } = {
    ...invitation,
    layoutConfig: invitation.design.layoutConfig
  };

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[32px] border border-white/30 shadow-glow",
        publicMode ? "min-h-screen rounded-none border-none shadow-none" : ""
      )}
      style={{
        background: `linear-gradient(180deg, ${design.colorPalette.surface}, ${design.colorPalette.background})`,
        color: design.colorPalette.text
      }}
    >
      {layoutConfig
        .filter((block) => block.visible)
        .map((block) => {
          if (block.type === "hero") {
            return (
              <section
                key={block.id}
                className={cn("relative flex min-h-[360px] flex-col justify-end p-8 md:p-12", getAlignClass(block), getSpacingClass(block))}
              >
                <div className="absolute inset-0">
                  <InvitationImage src={heroImage} alt={content.title} className="h-full w-full object-cover" />
                  <div
                    className="absolute inset-0 bg-hero-haze"
                    style={{
                      backgroundColor: `${design.colorPalette.background}b3`
                    }}
                  />
                </div>
                <div className="relative z-10 max-w-3xl space-y-4">
                  <p
                    className="text-sm uppercase tracking-[0.35em]"
                    style={{ color: design.colorPalette.accent }}
                  >
                    {content.eyebrow}
                  </p>
                  <h1
                    className="text-4xl md:text-6xl"
                    style={{ fontFamily: design.typography.heading }}
                  >
                    {content.title}
                  </h1>
                  <p className="text-lg md:text-xl" style={{ fontFamily: design.typography.accent }}>
                    {content.subtitle}
                  </p>
                </div>
              </section>
            );
          }

          if (block.type === "details") {
            return (
              <section key={block.id} className={cn("flex flex-col px-8 md:px-12", getAlignClass(block), getSpacingClass(block))}>
                <div className="grid w-full gap-4 md:grid-cols-3">
                  {dateTime ? (
                    <div className="rounded-3xl border border-black/10 p-5" style={{ backgroundColor: `${design.colorPalette.surface}` }}>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: design.colorPalette.accent }}>
                        {content.dateLabel}
                      </p>
                      <p className="mt-2 text-base">{dateTime}</p>
                    </div>
                  ) : null}
                  {venue ? (
                    <div className="rounded-3xl border border-black/10 p-5" style={{ backgroundColor: `${design.colorPalette.surface}` }}>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: design.colorPalette.accent }}>
                        {content.venueLabel}
                      </p>
                      <p className="mt-2 text-base">{venue}</p>
                    </div>
                  ) : null}
                  {dressCode ? (
                    <div className="rounded-3xl border border-black/10 p-5" style={{ backgroundColor: `${design.colorPalette.surface}` }}>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: design.colorPalette.accent }}>
                        {content.dressCodeLabel}
                      </p>
                      <p className="mt-2 text-base">{dressCode}</p>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          }

          if (block.type === "message") {
            return (
              <section key={block.id} className={cn("flex flex-col px-8 md:px-12", getAlignClass(block), getSpacingClass(block))}>
                <p className="max-w-3xl text-lg leading-8">{content.description}</p>
                <p className="max-w-3xl text-base leading-8 opacity-80">{content.message}</p>
              </section>
            );
          }

          if (block.type === "gallery") {
            return (
              <section key={block.id} className={cn("flex flex-col px-8 md:px-12", getAlignClass(block), getSpacingClass(block))}>
                <div className="relative h-72 w-full overflow-hidden rounded-[28px]">
                  <InvitationImage src={heroImage} alt={content.title} className="h-full w-full object-cover" />
                </div>
              </section>
            );
          }

          return (
            <section key={block.id} className={cn("flex flex-col px-8 pb-10 md:px-12", getAlignClass(block), getSpacingClass(block))}>
              {contactInfo ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: design.colorPalette.accent }}>
                    {content.contactLabel}
                  </p>
                  <p>{contactInfo}</p>
                </div>
              ) : null}
            </section>
          );
        })}
    </article>
  );
}
