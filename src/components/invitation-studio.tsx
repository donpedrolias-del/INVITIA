"use client";

import { useState } from "react";
import { getCopy, getEventTypeOptions } from "@/lib/i18n";
import { InvitationPreview } from "@/components/invitation-preview";
import { InvitationRecord, InvitationFormData, Language, LayoutBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialForm: InvitationFormData = {
  eventType: "generic",
  language: "fr",
  title: "",
  hostName: "",
  description: "",
  dateTime: "",
  venue: "",
  dressCode: "",
  contactInfo: "",
  heroImage: "",
  theme: "",
  prompt: ""
};

const scenarios = {
  fr: ["Mariage romantique", "Anniversaire festif", "Événement professionnel soigné"],
  en: ["Romantic wedding", "Playful birthday", "Polished corporate event"]
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "Request failed");
  }

  return json;
}

function EditorBlock({
  block,
  onChange
}: {
  block: LayoutBlock;
  onChange: (next: LayoutBlock) => void;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{block.label}</p>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{block.type}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.visible}
            onChange={(event) => onChange({ ...block, visible: event.target.checked })}
          />
          Visible
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Align</span>
          <select
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2"
            value={block.align}
            onChange={(event) => onChange({ ...block, align: event.target.value as LayoutBlock["align"] })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span>Spacing</span>
          <select
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2"
            value={block.spacing}
            onChange={(event) => onChange({ ...block, spacing: event.target.value as LayoutBlock["spacing"] })}
          >
            <option value="tight">Tight</option>
            <option value="normal">Normal</option>
            <option value="airy">Airy</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function InvitationStudio() {
  const [form, setForm] = useState<InvitationFormData>(initialForm);
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [busyState, setBusyState] = useState<"idle" | "generating" | "saving" | "publishing">("idle");
  const [error, setError] = useState<string>("");

  const t = getCopy(form.language);
  const eventOptions = getEventTypeOptions(form.language);

  function updateField<Key extends keyof InvitationFormData>(key: Key, value: InvitationFormData[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleGenerate() {
    try {
      setError("");
      setBusyState("generating");

      const generated = await fetchJson<Omit<InvitationRecord, "id" | "slug" | "createdAt" | "updatedAt">>(
        "/api/invitations/generate",
        {
          method: "POST",
          body: JSON.stringify(form)
        }
      );

      const saved = await fetchJson<InvitationRecord>("/api/invitations", {
        method: "POST",
        body: JSON.stringify(generated)
      });

      setInvitation(saved);
      setForm({
        eventType: saved.eventType,
        language: saved.language,
        title: saved.title,
        hostName: saved.hostName,
        description: saved.description,
        dateTime: saved.dateTime,
        venue: saved.venue,
        dressCode: saved.dressCode,
        contactInfo: saved.contactInfo,
        heroImage: saved.heroImage,
        theme: saved.theme,
        prompt: saved.prompt
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.aiError);
    } finally {
      setBusyState("idle");
    }
  }

  async function handleSave(next: InvitationRecord) {
    try {
      setBusyState("saving");
      setError("");
      const saved = await fetchJson<InvitationRecord>(`/api/invitations/${next.id}`, {
        method: "PATCH",
        body: JSON.stringify(next)
      });
      setInvitation(saved);
      setForm({
        eventType: saved.eventType,
        language: saved.language,
        title: saved.title,
        hostName: saved.hostName,
        description: saved.description,
        dateTime: saved.dateTime,
        venue: saved.venue,
        dressCode: saved.dressCode,
        contactInfo: saved.contactInfo,
        heroImage: saved.heroImage,
        theme: saved.theme,
        prompt: saved.prompt
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed");
    } finally {
      setBusyState("idle");
    }
  }

  async function handlePublish() {
    if (!invitation) return;
    try {
      setBusyState("publishing");
      const saved = await fetchJson<InvitationRecord>(`/api/invitations/${invitation.id}/publish`, {
        method: "POST"
      });
      setInvitation(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Publish failed");
    } finally {
      setBusyState("idle");
    }
  }

  function updateLayout(index: number, nextBlock: LayoutBlock) {
    setInvitation((current) => {
      if (!current) return current;
      const layoutConfig = current.design.layoutConfig.map((block, blockIndex) =>
        blockIndex === index ? nextBlock : block
      );

      return {
        ...current,
        design: {
          ...current.design,
          layoutConfig
        }
      };
    });
  }

  const publicUrl =
    invitation && invitation.status === "published"
      ? `/invite/${invitation.slug || invitation.id}`
      : "";

  const previewInvitation = invitation
    ? invitation
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[36px] border border-white/40 bg-[linear-gradient(135deg,#102033_0%,#7a3e33_45%,#d7ba84_100%)] p-8 text-white shadow-glow md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em]">
              {t.appName}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl md:text-6xl">{t.heroTitle}</h1>
              <p className="max-w-2xl text-base text-white/80 md:text-lg">{t.heroBody}</p>
            </div>
          </div>
          <div className="rounded-[28px] bg-white/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">{t.scenariosTitle}</p>
            <div className="mt-5 grid gap-3">
              {scenarios[form.language].map((scenario) => (
                <div key={scenario} className="rounded-2xl border border-white/15 bg-black/10 px-4 py-3">
                  {scenario}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="space-y-6 rounded-[32px] border border-black/5 bg-[#fffaf2] p-6 shadow-[0_10px_40px_rgba(24,28,40,0.06)] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-slate-500">{t.startLabel}</p>
              <h2 className="mt-2 text-2xl text-slate-900">{t.details}</h2>
            </div>
            <select
              className="rounded-full border border-black/10 bg-white px-4 py-2"
              value={form.language}
              onChange={(event) => updateField("language", event.target.value as Language)}
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm">{t.eventType}</span>
              <select
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.eventType}
                onChange={(event) => updateField("eventType", event.target.value as InvitationFormData["eventType"])}
              >
                {eventOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.theme}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.theme}
                onChange={(event) => updateField("theme", event.target.value)}
                placeholder={form.language === "fr" ? "Ex. Jardin doré contemporain" : "Ex. Contemporary golden garden"}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.title}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.hostName}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.hostName}
                onChange={(event) => updateField("hostName", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.dateTime}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.dateTime}
                onChange={(event) => updateField("dateTime", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.venue}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.dressCode}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.dressCode}
                onChange={(event) => updateField("dressCode", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.contactInfo}</span>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={form.contactInfo}
                onChange={(event) => updateField("contactInfo", event.target.value)}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm">{t.heroImage}</span>
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              value={form.heroImage}
              onChange={(event) => updateField("heroImage", event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm">{t.description}</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm">{t.prompt}</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              value={form.prompt}
              onChange={(event) => updateField("prompt", event.target.value)}
              placeholder={
                form.language === "fr"
                  ? "Ex. Une invitation moderne, lumineuse, luxe discret, fleurs ivoire, ambiance éditoriale."
                  : "Ex. Modern luminous invitation, understated luxury, ivory florals, editorial atmosphere."
              }
            />
          </label>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60"
            onClick={handleGenerate}
            disabled={busyState === "generating" || busyState === "saving" || busyState === "publishing"}
          >
            {busyState === "generating" ? t.regenerate : t.generate}
          </button>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_10px_40px_rgba(24,28,40,0.06)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">{t.preview}</p>
                <h2 className="mt-2 text-2xl text-slate-900">{t.editor}</h2>
              </div>
              {invitation ? (
                <span
                  className={cn(
                    "rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em]",
                    invitation.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {invitation.status === "published" ? t.published : t.draft}
                </span>
              ) : null}
            </div>

            {!previewInvitation ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-slate-500">
                {t.noPreview}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <InvitationPreview invitation={previewInvitation} />

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4 rounded-[28px] bg-[#fff7ea] p-5">
                    <h3 className="text-lg text-slate-900">{t.colors}</h3>
                    <div className="grid gap-3">
                      {(
                        Object.keys(previewInvitation.design.colorPalette) as Array<
                          keyof InvitationRecord["design"]["colorPalette"]
                        >
                      ).map((key) => (
                        <label key={key} className="space-y-2 text-sm">
                          <span className="capitalize">{key}</span>
                          <input
                            type="color"
                            className="h-12 w-full rounded-2xl border border-black/10 bg-white p-2"
                            value={previewInvitation.design.colorPalette[key]}
                            onChange={(event) =>
                              setInvitation((current) =>
                                current
                                  ? {
                                      ...current,
                                      design: {
                                        ...current.design,
                                        colorPalette: {
                                          ...current.design.colorPalette,
                                          [key]: event.target.value
                                        }
                                      }
                                    }
                                  : current
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[28px] bg-[#f6f1ff] p-5">
                    <h3 className="text-lg text-slate-900">{t.layout}</h3>
                    <div className="space-y-3">
                      {previewInvitation.design.layoutConfig.map((block, index) => (
                        <EditorBlock key={block.id} block={block} onChange={(next) => updateLayout(index, next)} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm">{t.title}</span>
                    <input
                      className="w-full rounded-2xl border border-black/10 px-4 py-3"
                      value={previewInvitation.content.title}
                      onChange={(event) =>
                        setInvitation((current) =>
                          current
                            ? {
                                ...current,
                                title: event.target.value,
                                content: {
                                  ...current.content,
                                  title: event.target.value
                                }
                              }
                            : current
                        )
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm">{t.hostName}</span>
                    <input
                      className="w-full rounded-2xl border border-black/10 px-4 py-3"
                      value={previewInvitation.content.subtitle}
                      onChange={(event) =>
                        setInvitation((current) =>
                          current
                            ? {
                                ...current,
                                hostName: event.target.value,
                                content: {
                                  ...current.content,
                                  subtitle: event.target.value
                                }
                              }
                            : current
                        )
                      }
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm">{t.description}</span>
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-black/10 px-4 py-3"
                      value={previewInvitation.content.description}
                      onChange={(event) =>
                        setInvitation((current) =>
                          current
                            ? {
                                ...current,
                                description: event.target.value,
                                content: {
                                  ...current.content,
                                  description: event.target.value
                                }
                              }
                            : current
                        )
                      }
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60"
                    onClick={() => previewInvitation && handleSave(previewInvitation)}
                    disabled={busyState !== "idle"}
                  >
                    {busyState === "saving" ? t.saving : t.saveDraft}
                  </button>
                  <button
                    className="rounded-full bg-emerald-600 px-5 py-3 text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    onClick={handlePublish}
                    disabled={!invitation || busyState !== "idle"}
                  >
                    {busyState === "publishing" ? t.publishing : t.publish}
                  </button>
                  <p className="text-sm text-slate-500">{t.publishHint}</p>
                </div>

                {publicUrl ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">{t.publicLink}</p>
                    <a className="mt-2 block font-medium text-emerald-900 underline" href={publicUrl} target="_blank">
                      {publicUrl}
                    </a>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {t.publishReady}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
