"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { InvitationRecord, ParticleStyle } from "@/lib/types";

interface CountdownState {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getCountdown(dateTime: string): CountdownState {
  const target = new Date(dateTime).getTime();
  if (Number.isNaN(target)) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const diff = Math.max(target - Date.now(), 0);
  return {
    days: pad(Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours: pad(Math.floor((diff / (1000 * 60 * 60)) % 24)),
    minutes: pad(Math.floor((diff / (1000 * 60)) % 60)),
    seconds: pad(Math.floor((diff / 1000) % 60))
  };
}

function buildMapUrl(venue: string) {
  const encoded = encodeURIComponent(venue);
  return {
    link: "https://www.google.com/maps/search/?api=1&query=" + encoded,
    embed: "https://www.google.com/maps?q=" + encoded + "&output=embed"
  };
}

function formatLongDate(dateTime: string, language: "fr" | "en") {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTime(dateTime: string, language: "fr" | "en") {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function hashValue(input: string) {
  return Math.abs(Array.from(input).reduce((acc, char) => acc * 31 + char.charCodeAt(0), 17));
}

function particlePalette(style: ParticleStyle) {
  switch (style) {
    case "petals":
      return ["#f6d7d9", "#efd0d8", "#f0c5bf", "#f5e2dc"];
    case "confetti":
      return ["#f0b646", "#d26a38", "#d8a06d", "#ffffff"];
    case "glow":
      return ["#ffffff", "#f6e7cf", "#ead6b0", "#d8be94"];
    case "leaves":
      return ["#c8d6b0", "#9fb586", "#c8b89f", "#efe5d8"];
    default:
      return ["#ffffff"];
  }
}

function particleShape(style: ParticleStyle, index: number) {
  if (style === "confetti") {
    return index % 2 === 0 ? "48% 52% 40% 60% / 48% 55% 45% 52%" : "20%";
  }
  if (style === "glow") {
    return "999px";
  }
  return index % 2 === 0 ? "60% 40% 60% 40% / 55% 45% 55% 45%" : "46% 54% 58% 42% / 58% 44% 56% 42%";
}

function buildParticles(invitation: InvitationRecord) {
  if (invitation.experience.particleStyle === "none") {
    return [];
  }

  const seed = hashValue(invitation.id + invitation.slug + invitation.theme + invitation.experience.particleStyle);
  const colors = particlePalette(invitation.experience.particleStyle);

  return Array.from({ length: 14 }, (_, index) => {
    const hue = colors[(seed + index) % colors.length];
    const left = ((seed * (index + 3)) % 92) + 2;
    const size = 10 + ((seed + index * 13) % 18);
    const delay = (index % 6) * 0.9;
    const duration = 9 + ((seed + index * 7) % 7);
    const drift = ((seed + index * 19) % 80) - 40;

    return {
      id: "particle-" + index,
      style: {
        left: left + "%",
        top: -8 - (index % 4) * 9 + "%",
        width: size + "px",
        height: invitation.experience.particleStyle === "glow" ? size + "px" : Math.max(8, size * 1.25) + "px",
        background: hue,
        animationDelay: delay + "s",
        animationDuration: duration + "s",
        borderRadius: particleShape(invitation.experience.particleStyle, index),
        transform: "translate3d(0,0,0) rotate(" + ((seed + index * 21) % 360) + "deg)",
        opacity: invitation.experience.particleStyle === "glow" ? 0.45 : 0.72,
        filter: invitation.experience.particleStyle === "glow" ? "blur(2px)" : "none",
        ["--drift" as string]: drift + "px"
      } as CSSProperties
    };
  });
}

function coverSurface(coverStyle: InvitationRecord["experience"]["coverStyle"]) {
  if (coverStyle === "veil") {
    return "bg-[linear-gradient(145deg,rgba(241,235,228,0.82),rgba(191,178,166,0.88))]";
  }
  if (coverStyle === "monogram") {
    return "bg-[linear-gradient(145deg,rgba(204,194,181,0.94),rgba(126,103,87,0.92))]";
  }
  if (coverStyle === "minimal") {
    return "bg-[linear-gradient(145deg,rgba(235,230,223,0.98),rgba(202,191,176,0.94))]";
  }
  return "bg-[linear-gradient(145deg,rgba(172,187,150,0.92),rgba(98,103,76,0.96))]";
}

export function InvitationExperience({ invitation }: { invitation: InvitationRecord }) {
  const isFrench = invitation.language === "fr";
  const [isOpened, setIsOpened] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>(() => getCountdown(invitation.dateTime));
  const touchStartY = useRef<number | null>(null);

  const map = useMemo(() => buildMapUrl(invitation.venue), [invitation.venue]);
  const eventDate = useMemo(() => formatLongDate(invitation.dateTime, invitation.language), [invitation.dateTime, invitation.language]);
  const eventTime = useMemo(() => formatTime(invitation.dateTime, invitation.language), [invitation.dateTime, invitation.language]);
  const particles = useMemo(() => buildParticles(invitation), [invitation]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown(invitation.dateTime)), 1000);
    return () => window.clearInterval(timer);
  }, [invitation.dateTime]);

  function openInvitation() {
    setIsOpened(true);
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartY.current;
    const end = event.changedTouches[0]?.clientY;
    if (start == null || end == null) return;
    if (start - end > 60) {
      openInvitation();
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden text-[#2b1f24]"
      style={{
        background: "radial-gradient(circle at top, " + invitation.design.colorPalette.surface + ", transparent 24%), linear-gradient(180deg, " + invitation.design.colorPalette.background + " 0%, #f8f3eb 48%, " + invitation.design.colorPalette.surface + " 100%)",
        color: invitation.design.colorPalette.text
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_24%),linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:auto,34px_34px,34px_34px]" />

      {particles.map((particle) => (
        <span key={particle.id} className="pointer-events-none absolute z-[1] animate-[invitation-fall_linear_infinite]" style={particle.style} />
      ))}

      <main className="relative z-[2] mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 md:max-w-lg">
        <div
          className={"pointer-events-auto absolute inset-0 z-30 transition-all duration-[1400ms] " + (isOpened ? "-translate-y-[115%] rotate-3 opacity-0" : "translate-y-0 opacity-100")}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={"absolute inset-0 " + coverSurface(invitation.experience.coverStyle)} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_24%),linear-gradient(180deg,rgba(37,27,22,0.14),rgba(37,27,22,0.24))]" />
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_12%),radial-gradient(circle_at_70%_28%,rgba(92,74,62,0.18),transparent_14%),radial-gradient(circle_at_34%_78%,rgba(92,74,62,0.16),transparent_13%)]" />

          <div className="relative flex min-h-screen flex-col items-center justify-between px-8 py-10 text-center text-white">
            <div className="w-full rounded-[36px] border border-white/20 bg-black/10 px-4 py-3 text-[10px] uppercase tracking-[0.5em] backdrop-blur-sm">
              {invitation.experience.openingLabel}
            </div>

            <div className="w-full rounded-[42px] border border-white/20 bg-white/10 px-8 py-12 shadow-[0_30px_120px_rgba(44,33,24,0.24)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.45em] text-white/75">{invitation.content.eyebrow}</p>
              <p className="mt-7 font-[var(--font-display)] text-5xl leading-none text-white drop-shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
                {invitation.experience.coverHeadline}
              </p>
              <p className="mt-5 text-sm leading-7 text-white/84">{invitation.experience.coverMessage}</p>

              <button
                type="button"
                onClick={openInvitation}
                className="mt-10 inline-flex h-24 w-24 items-center justify-center rounded-full border border-[#ead8cb] bg-[radial-gradient(circle_at_top,#f8efe9,#d9c2b4_70%,#b78c74)] font-[var(--font-display)] text-3xl text-[#6f4d40] shadow-[0_16px_50px_rgba(57,34,27,0.35)] transition hover:scale-105"
              >
                {isFrench ? "Ouvrir" : "Open"}
              </button>
            </div>

            <div className="space-y-3 text-white/88">
              <p className="text-xs uppercase tracking-[0.45em]">{isFrench ? "Glisse vers le haut" : "Swipe up"}</p>
              <div className="mx-auto h-10 w-6 rounded-full border border-white/35">
                <div className="mx-auto mt-2 h-2 w-2 animate-bounce rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        </div>

        <div className={"transition-all duration-[1200ms] " + (isOpened ? "translate-y-0 opacity-100" : "translate-y-8 opacity-50 blur-[2px]")}>
          <section className="relative overflow-hidden rounded-[36px] border border-white/60 shadow-[0_30px_80px_rgba(43,27,17,0.18)] backdrop-blur-xl">
            <div className="absolute inset-0">
              <img src={invitation.heroImage} alt={invitation.content.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,23,0.24),rgba(20,17,23,0.56))]" />
            </div>

            <div className="relative flex min-h-[75svh] flex-col justify-between px-6 py-8 text-center text-white">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/75">
                <span>{invitation.content.eyebrow}</span>
                <span>{eventDate}</span>
              </div>

              <div className="space-y-4 pb-10 pt-20">
                <p className="text-xs uppercase tracking-[0.5em] text-white/70">{invitation.design.theme}</p>
                <h1 className="font-[var(--font-display)] text-6xl leading-none drop-shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                  {invitation.title || invitation.content.title}
                </h1>
                <p className="font-[var(--font-display)] text-4xl italic text-white/90">{invitation.hostName || invitation.content.subtitle}</p>
                <p className="mx-auto max-w-xs text-sm leading-7 text-white/82">{invitation.description || invitation.content.description}</p>
                <p className="text-sm uppercase tracking-[0.42em] text-white/72">{invitation.experience.signatureLine}</p>
              </div>

              <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-3 rounded-[28px] border border-white/15 bg-black/10 p-3 backdrop-blur-md">
                {[
                  { label: isFrench ? "Jours" : "Days", value: countdown.days },
                  { label: isFrench ? "Heures" : "Hours", value: countdown.hours },
                  { label: isFrench ? "Minutes" : "Minutes", value: countdown.minutes },
                  { label: isFrench ? "Secondes" : "Seconds", value: countdown.seconds }
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-5">
                    <p className="font-[var(--font-accent)] text-3xl">{item.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-white/70">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 space-y-6 rounded-[34px] border border-[#e8dacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,239,231,0.95))] p-6 shadow-[0_25px_70px_rgba(48,31,18,0.09)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{invitation.experience.dateTitle}</p>
              <h2 className="mt-4 font-[var(--font-display)] text-4xl text-[#2a1f22]">{eventDate}</h2>
              <p className="mt-3 text-xl text-[#5c4740]">{eventTime}</p>
              <p className="mt-4 text-sm leading-7 text-[#77645b]">{invitation.experience.dateIntro}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: isFrench ? "Arrivee" : "Arrival", value: eventTime || (isFrench ? "A confirmer" : "To be confirmed") },
                { label: "Dress code", value: invitation.dressCode || (isFrench ? "Elegant" : "Elegant") }
              ].map((item) => (
                <div key={item.label} className="rounded-[26px] border border-[#eadccc] bg-white/80 p-4 text-center shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-[#9a7c65]">{item.label}</p>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#33272a]">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-5 rounded-[34px] border border-[#e8dacc] bg-white/92 p-6 shadow-[0_25px_70px_rgba(48,31,18,0.08)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{invitation.experience.venueTitle}</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#2a1f22]">{invitation.venue || (isFrench ? "Lieu a venir" : "Venue coming soon")}</h2>
              <p className="mt-2 text-sm leading-7 text-[#77645b]">{invitation.experience.venueIntro}</p>
            </div>

            <a href={map.link} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[28px] border border-[#eddccc] bg-[#fbf7f1] p-3 shadow-sm transition hover:-translate-y-0.5">
              <iframe title="Google map preview" src={map.embed} className="h-64 w-full rounded-[22px] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <div className="mt-4 flex items-center justify-between rounded-[20px] bg-white px-4 py-3 text-sm text-[#3f3134] shadow-sm">
                <span>{invitation.experience.venueCtaLabel}</span>
                <span className="text-[#9a7c65]">↗</span>
              </div>
            </a>
          </section>

          <section className="mt-6 rounded-[34px] border border-[#e8dacc] bg-white/92 p-6 shadow-[0_25px_70px_rgba(48,31,18,0.08)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{invitation.experience.scheduleTitle}</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#2a1f22]">{isFrench ? "Le rythme de la journee" : "The rhythm of the day"}</h2>
              <p className="mt-3 text-sm leading-7 text-[#77645b]">{invitation.experience.scheduleIntro}</p>
            </div>

            <div className="mt-6 space-y-4">
              {invitation.experience.moments.map((item, index) => (
                <div key={item.time + item.title} className="grid grid-cols-[auto_1fr] gap-4 rounded-[24px] border border-[#efe2d4] bg-[#fcfaf7] p-4 shadow-sm">
                  <div className="flex flex-col items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c0a7] bg-white text-sm font-semibold text-[#7b5d4b]">
                      {index + 1}
                    </div>
                    {index < invitation.experience.moments.length - 1 ? <div className="mt-2 h-full w-px bg-[#e5d5c5]" /> : null}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[#251b22] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white">{item.time}</span>
                      <h3 className="text-lg font-semibold text-[#2d2024]">{item.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#736058]">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 mb-10 rounded-[34px] border border-[#e8dacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,239,231,0.92))] p-6 shadow-[0_25px_70px_rgba(48,31,18,0.08)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{invitation.experience.guestTitle}</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#2a1f22]">{isFrench ? "Votre invitation en details" : "Your invitation in detail"}</h2>
              <p className="mt-3 text-sm leading-7 text-[#77645b]">{invitation.experience.guestIntro}</p>
            </div>

            <div className="mt-6 grid gap-4">
              {invitation.experience.guestDetails.map((detail) => (
                <div key={detail.label} className="rounded-[24px] border border-[#ecdccc] bg-white/90 p-5">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-[#9a7c65]">{detail.label}</p>
                  <p className="mt-3 text-sm leading-7 text-[#3d2f34]">{detail.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        @keyframes invitation-fall {
          0% {
            transform: translate3d(0,-8vh,0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.72;
          }
          100% {
            transform: translate3d(var(--drift),110vh,0) rotate(320deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
