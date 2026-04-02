"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InvitationRecord } from "@/lib/types";

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
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds)
  };
}

function buildMapUrl(venue: string) {
  const encoded = encodeURIComponent(venue);
  return {
    link: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    embed: `https://www.google.com/maps?q=${encoded}&output=embed`
  };
}

function buildSchedule(invitation: InvitationRecord) {
  const isFrench = invitation.language === "fr";
  const date = new Date(invitation.dateTime);
  const baseHour = Number.isNaN(date.getTime()) ? 16 : date.getHours() || 16;
  const baseMinute = Number.isNaN(date.getTime()) ? 0 : date.getMinutes();

  function slot(offsetMinutes: number) {
    const total = baseHour * 60 + baseMinute + offsetMinutes;
    const hours = Math.floor(total / 60) % 24;
    const minutes = total % 60;
    return `${pad(hours)}:${pad(minutes)}`;
  }

  if (invitation.eventType === "wedding") {
    return isFrench
      ? [
          { time: slot(0), title: "Cérémonie", note: "L'ouverture officielle de notre grand jour." },
          { time: slot(90), title: "Cocktail", note: "Un moment élégant pour accueillir chaque invité." },
          { time: slot(180), title: "Dîner", note: "Le repas, les discours et les premières émotions." },
          { time: slot(300), title: "Soirée", note: "Danse, musique et souvenirs jusqu'au bout de la nuit." }
        ]
      : [
          { time: slot(0), title: "Ceremony", note: "The official opening of our special day." },
          { time: slot(90), title: "Cocktail", note: "A refined welcome moment for every guest." },
          { time: slot(180), title: "Dinner", note: "Dinner, speeches, and the first big emotions." },
          { time: slot(300), title: "Party", note: "Music, dancing, and memories into the night." }
        ];
  }

  return isFrench
    ? [
        { time: slot(0), title: "Accueil", note: "Ouverture des portes et installation des invités." },
        { time: slot(45), title: "Moment principal", note: invitation.description || "Le cœur de la célébration commence." },
        { time: slot(120), title: "Pause conviviale", note: "Rencontres, échanges et ambiance détendue." },
        { time: slot(180), title: "Finale", note: "Clôture du programme dans une belle atmosphère." }
      ]
    : [
        { time: slot(0), title: "Arrival", note: "Doors open and guests settle in." },
        { time: slot(45), title: "Main moment", note: invitation.description || "The heart of the celebration begins." },
        { time: slot(120), title: "Social break", note: "Conversation, connection, and a relaxed atmosphere." },
        { time: slot(180), title: "Finale", note: "A graceful close to the evening." }
      ];
}

export function InvitationExperience({ invitation }: { invitation: InvitationRecord }) {
  const isFrench = invitation.language === "fr";
  const [isOpened, setIsOpened] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>(() => getCountdown(invitation.dateTime));
  const touchStartY = useRef<number | null>(null);

  const map = useMemo(() => buildMapUrl(invitation.venue), [invitation.venue]);
  const schedule = useMemo(() => buildSchedule(invitation), [invitation]);
  const eventDate = useMemo(() => {
    const date = new Date(invitation.dateTime);
    if (Number.isNaN(date.getTime())) {
      return invitation.dateTime;
    }

    return new Intl.DateTimeFormat(isFrench ? "fr-FR" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }, [invitation.dateTime, isFrench]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(invitation.dateTime));
    }, 1000);

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
    <div className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7efe5,transparent_22%),linear-gradient(180deg,#f5ede4_0%,#efe5d7_38%,#f9f3eb_100%)] text-[#261e23]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_18%),radial-gradient(circle_at_80%_14%,rgba(152,119,86,0.14),transparent_16%),linear-gradient(rgba(255,255,255,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:auto,auto,28px_28px,28px_28px] opacity-60" />

      <main className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 md:max-w-lg">
        <div
          className={`pointer-events-auto absolute inset-0 z-30 transition-all duration-1000 ${
            isOpened ? "-translate-y-full rotate-2 opacity-0" : "translate-y-0 opacity-100"
          }`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0 bg-[#d2cabd]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_22%),linear-gradient(180deg,rgba(33,28,26,0.16),rgba(33,28,26,0.22))]" />
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_12%),radial-gradient(circle_at_70%_28%,rgba(92,74,62,0.18),transparent_14%),radial-gradient(circle_at_34%_78%,rgba(92,74,62,0.16),transparent_13%)]" />

          <div className="relative flex min-h-screen flex-col items-center justify-between px-8 py-10 text-center">
            <div className="w-full rounded-[38px] border border-white/20 bg-black/10 p-4 text-[10px] uppercase tracking-[0.5em] text-white/85 backdrop-blur-sm">
              {isFrench ? "Invitation exclusive" : "Exclusive invitation"}
            </div>

            <div className="w-full rounded-[42px] border border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-8 py-12 shadow-[0_30px_120px_rgba(44,33,24,0.24)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.45em] text-white/70">{invitation.content.eyebrow}</p>
              <p className="mt-8 font-[var(--font-display)] text-5xl leading-none text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]">
                {invitation.hostName || invitation.content.subtitle}
              </p>
              <p className="mt-3 text-sm italic text-white/80">
                {isFrench ? "Cette invitation est exclusive pour toi" : "This invitation was created just for you"}
              </p>

              <button
                type="button"
                onClick={openInvitation}
                className="mt-10 inline-flex h-24 w-24 items-center justify-center rounded-full border border-[#e5d0c2] bg-[radial-gradient(circle_at_top,#f8efe9,#d7beb0_68%,#b48d77)] font-[var(--font-display)] text-3xl text-[#6f4d40] shadow-[0_16px_50px_rgba(57,34,27,0.35)] transition hover:scale-105"
              >
                {isFrench ? "Ouvrir" : "Open"}
              </button>
            </div>

            <div className="space-y-3 text-white/85">
              <p className="text-xs uppercase tracking-[0.45em]">{isFrench ? "Glisse vers le haut" : "Swipe up"}</p>
              <div className="mx-auto h-10 w-6 rounded-full border border-white/35">
                <div className="mx-auto mt-2 h-2 w-2 animate-bounce rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-1000 ${isOpened ? "translate-y-0 opacity-100" : "translate-y-8 opacity-50 blur-[2px]"}`}>
          <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-white/40 shadow-[0_30px_80px_rgba(43,27,17,0.16)] backdrop-blur-xl">
            <div className="absolute inset-0">
              <img src={invitation.heroImage} alt={invitation.content.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,23,0.22),rgba(20,17,23,0.48))]" />
            </div>

            <div className="relative flex min-h-[75svh] flex-col justify-between px-6 py-8 text-center text-white">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/75">
                <span>{invitation.content.eyebrow}</span>
                <span>{eventDate}</span>
              </div>

              <div className="space-y-4 pb-10 pt-20">
                <p className="text-xs uppercase tracking-[0.5em] text-white/70">{isFrench ? "Nos cœurs" : "Our story"}</p>
                <h1 className="font-[var(--font-display)] text-6xl leading-none drop-shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                  {invitation.title || invitation.content.title}
                </h1>
                <p className="font-[var(--font-display)] text-4xl italic text-white/90">{invitation.hostName || invitation.content.subtitle}</p>
                <p className="mx-auto max-w-xs text-sm leading-7 text-white/82">{invitation.description || invitation.content.description}</p>
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

          <section className="mt-6 space-y-6 rounded-[34px] border border-[#e8dacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,239,231,0.95))] p-6 shadow-[0_25px_70px_rgba(48,31,18,0.09)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{isFrench ? "Quand" : "When"}</p>
              <h2 className="mt-4 font-[var(--font-display)] text-4xl text-[#2a1f22]">{eventDate}</h2>
              <p className="mt-3 text-xl text-[#5c4740]">{invitation.dateTime}</p>
              <p className="mt-4 text-sm leading-7 text-[#77645b]">{invitation.content.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: isFrench ? "Entrée invités" : "Guest arrival", value: invitation.dateTime || (isFrench ? "À confirmer" : "To be confirmed") },
                { label: isFrench ? "Dress code" : "Dress code", value: invitation.dressCode || (isFrench ? "Élégant" : "Elegant") }
              ].map((item) => (
                <div key={item.label} className="rounded-[26px] border border-[#eadccc] bg-white/80 p-4 text-center shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-[#9a7c65]">{item.label}</p>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#33272a]">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-5 rounded-[34px] border border-[#e8dacc] bg-white/90 p-6 shadow-[0_25px_70px_rgba(48,31,18,0.08)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{isFrench ? "Où nous célébrons" : "Where we celebrate"}</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#2a1f22]">{invitation.venue || (isFrench ? "Lieu à venir" : "Venue coming soon")}</h2>
              <p className="mt-2 text-sm leading-7 text-[#77645b]">{isFrench ? "Clique pour ouvrir l'adresse directement dans Google Maps." : "Tap to open the address directly in Google Maps."}</p>
            </div>

            <a href={map.link} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[28px] border border-[#eddccc] bg-[#fbf7f1] p-3 shadow-sm transition hover:-translate-y-0.5">
              <iframe title="Google map preview" src={map.embed} className="h-64 w-full rounded-[22px] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <div className="mt-4 flex items-center justify-between rounded-[20px] bg-white px-4 py-3 text-sm text-[#3f3134] shadow-sm">
                <span>{isFrench ? "Ouvrir dans Maps" : "Open in Maps"}</span>
                <span className="text-[#9a7c65]">↗</span>
              </div>
            </a>
          </section>

          <section className="mt-6 rounded-[34px] border border-[#e8dacc] bg-white/90 p-6 shadow-[0_25px_70px_rgba(48,31,18,0.08)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{isFrench ? "Programme" : "Schedule"}</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#2a1f22]">{isFrench ? "Le déroulé de la soirée" : "Planned for you"}</h2>
            </div>

            <div className="mt-6 space-y-4">
              {schedule.map((item, index) => (
                <div key={`${item.time}-${item.title}`} className="grid grid-cols-[auto_1fr] gap-4 rounded-[24px] border border-[#efe2d4] bg-[#fcfaf7] p-4 shadow-sm">
                  <div className="flex flex-col items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c0a7] bg-white text-sm font-semibold text-[#7b5d4b]">
                      {index + 1}
                    </div>
                    {index < schedule.length - 1 ? <div className="mt-2 h-full w-px bg-[#e5d5c5]" /> : null}
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

          <section className="mt-6 mb-10 rounded-[34px] border border-[#e8dacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,239,231,0.9))] p-6 shadow-[0_25px_70px_rgba(48,31,18,0.08)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8f7059]">{isFrench ? "Détails invités" : "Guest details"}</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#2a1f22]">{isFrench ? "Votre place vous attend" : "Your place is ready"}</h2>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[24px] border border-[#ecdccc] bg-white/90 p-5">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[#9a7c65]">{isFrench ? "Accueil" : "Arrival"}</p>
                <p className="mt-3 text-sm leading-7 text-[#3d2f34]">
                  {isFrench
                    ? "Présentez cette invitation à l'arrivée pour être guidé vers votre place et les informations utiles de la soirée."
                    : "Present this invitation on arrival to be guided to your seat and receive the evening details."}
                </p>
              </div>
              <div className="rounded-[24px] border border-[#ecdccc] bg-white/90 p-5">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[#9a7c65]">{isFrench ? "Contact" : "Contact"}</p>
                <p className="mt-3 text-sm leading-7 text-[#3d2f34]">{invitation.contactInfo || (isFrench ? "Les coordonnées seront communiquées par l'organisateur." : "Contact details will be shared by the organizer.")}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
