"use client";

import { ChangeEvent, useState } from "react";
import { InvitationPreview } from "@/components/invitation-preview";
import { getCopy, getEventTypeOptions } from "@/lib/i18n";
import { InvitationFormData, InvitationMoment, InvitationRecord, GuestDetail, Language, LayoutBlock } from "@/lib/types";
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
  fr: ["Mariage editorial", "Anniversaire chic", "Evenement signature"],
  en: ["Editorial wedding", "Chic birthday", "Signature event"]
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white/78 p-5 shadow-sm">
      <h3 className="text-lg text-slate-900">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function updateMomentField(
  invitation: InvitationRecord,
  index: number,
  key: keyof InvitationMoment,
  value: string
): InvitationRecord {
  const moments = invitation.experience.moments.map((moment, momentIndex) =>
    momentIndex === index ? { ...moment, [key]: value } : moment
  );

  return {
    ...invitation,
    experience: {
      ...invitation.experience,
      moments
    }
  };
}

function updateGuestField(
  invitation: InvitationRecord,
  index: number,
  key: keyof GuestDetail,
  value: string
): InvitationRecord {
  const guestDetails = invitation.experience.guestDetails.map((detail, detailIndex) =>
    detailIndex === index ? { ...detail, [key]: value } : detail
  );

  return {
    ...invitation,
    experience: {
      ...invitation.experience,
      guestDetails
    }
  };
}

export function InvitationStudio() {
  const [form, setForm] = useState<InvitationFormData>(initialForm);
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [busyState, setBusyState] = useState<"idle" | "generating" | "saving" | "publishing">("idle");
  const [error, setError] = useState("");

  const t = getCopy(form.language);
  const eventOptions = getEventTypeOptions(form.language);
  const isFrench = form.language === "fr";

  function updateField<Key extends keyof InvitationFormData>(key: Key, value: InvitationFormData[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateField("heroImage", dataUrl);
      setInvitation((current) =>
        current
          ? {
              ...current,
              heroImage: dataUrl
            }
          : current
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load image");
    }
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
      const saved = await fetchJson<InvitationRecord>("/api/invitations/" + next.id, {
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
      setError("");
      const saved = await fetchJson<InvitationRecord>("/api/invitations/" + invitation.id + "/publish", {
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
    invitation && invitation.status === "published" ? "/invite/" + (invitation.slug || invitation.id) : "";

  const previewInvitation = invitation || null;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1450px] flex-col gap-12 px-5 py-10 md:px-10">
      <section className="relative overflow-hidden rounded-[42px] border border-[#f1d6a2]/30 bg-[radial-gradient(circle_at_top_left,rgba(241,214,162,0.28),transparent_24%),linear-gradient(135deg,#120f1f_0%,#362131_34%,#7f4f3d_69%,#efd3a0_100%)] p-8 text-white shadow-[0_30px_120px_rgba(16,12,21,0.34)] md:p-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.45em]">
              {t.appName}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl leading-none md:text-7xl">{t.heroTitle}</h1>
              <p className="max-w-2xl text-base leading-7 text-white/82 md:text-lg">{t.heroBody}</p>
            </div>
          </div>
          <div className="rounded-[30px] border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
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

      <div className="grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-6 rounded-[36px] border border-[#d9c5ab]/80 bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(247,239,228,0.96))] p-6 shadow-[0_24px_90px_rgba(43,29,18,0.08)] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-slate-500">{t.startLabel}</p>
              <h2 className="mt-2 text-2xl text-slate-900">{t.details}</h2>
            </div>
            <select
              className="rounded-full border border-[#d9c6ad] bg-white/80 px-4 py-2 shadow-sm"
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
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
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
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.theme}
                onChange={(event) => updateField("theme", event.target.value)}
                placeholder={isFrench ? "Ex. Jardin dore editorial" : "Ex. Editorial golden garden"}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.title}</span>
              <input
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.hostName}</span>
              <input
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.hostName}
                onChange={(event) => updateField("hostName", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.dateTime}</span>
              <input
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.dateTime}
                onChange={(event) => updateField("dateTime", event.target.value)}
                placeholder={isFrench ? "Ex. 12 Juin 2026 - 16:00" : "Ex. June 12, 2026 - 4:00 PM"}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.venue}</span>
              <input
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.dressCode}</span>
              <input
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.dressCode}
                onChange={(event) => updateField("dressCode", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm">{t.contactInfo}</span>
              <input
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
                value={form.contactInfo}
                onChange={(event) => updateField("contactInfo", event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-sm">{t.heroImage}</span>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7] file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white"
                onChange={handleImageUpload}
              />
            </label>
            {form.heroImage ? (
              <button
                type="button"
                className="rounded-full border border-black/10 px-4 py-3 text-sm"
                onClick={() => updateField("heroImage", "")}
              >
                {isFrench ? "Retirer image" : "Remove image"}
              </button>
            ) : null}
          </div>

          {form.heroImage ? (
            <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white p-2">
              <img src={form.heroImage} alt="Selected invitation cover" className="h-48 w-full rounded-[18px] object-cover" />
            </div>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm">{t.description}</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm">{t.prompt}</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7]"
              value={form.prompt}
              onChange={(event) => updateField("prompt", event.target.value)}
              placeholder={
                isFrench
                  ? "Ex. Invitation editoriale, luxe doux, fleurs ivoire, ouverture cinematographique, details impecables."
                  : "Ex. Editorial invitation, soft luxury, ivory florals, cinematic opening, impeccable details."
              }
            />
          </label>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60"
            onClick={handleGenerate}
            disabled={busyState !== "idle"}
          >
            {busyState === "generating" ? t.regenerate : t.generate}
          </button>
        </section>

        <section className="space-y-6">
          <div className="rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,245,238,0.96))] p-6 shadow-[0_24px_90px_rgba(34,23,16,0.08)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">{t.preview}</p>
                <h2 className="mt-2 text-2xl text-slate-900">{t.editor}</h2>
              </div>
              {invitation ? (
                <span
                  className={cn(
                    "rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em]",
                    invitation.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
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

                <div className="grid gap-6 xl:grid-cols-2">
                  <SectionCard title={isFrench ? "Palette" : "Palette"}>
                    <div className="grid gap-3">
                      {(Object.keys(previewInvitation.design.colorPalette) as Array<keyof InvitationRecord["design"]["colorPalette"]>).map((key) => (
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
                  </SectionCard>

                  <SectionCard title={isFrench ? "Mise en page" : "Layout"}>
                    <div className="space-y-3">
                      {previewInvitation.design.layoutConfig.map((block, index) => (
                        <EditorBlock key={block.id} block={block} onChange={(next) => updateLayout(index, next)} />
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <SectionCard title={isFrench ? "Contenu principal" : "Main content"}>
                    <label className="space-y-2 text-sm">
                      <span>{t.title}</span>
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
                    <label className="space-y-2 text-sm">
                      <span>{t.hostName}</span>
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
                                  },
                                  experience: {
                                    ...current.experience,
                                    coverHeadline: event.target.value || current.experience.coverHeadline,
                                    signatureLine:
                                      current.language === "fr"
                                        ? (event.target.value || current.experience.coverHeadline) + " vous attendent"
                                        : (event.target.value || current.experience.coverHeadline) + " are waiting for you"
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{t.description}</span>
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
                  </SectionCard>

                  <SectionCard title={isFrench ? "Couverture" : "Cover"}>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Titre couverture" : "Cover headline"}</span>
                      <input
                        className="w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.coverHeadline}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    coverHeadline: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Message couverture" : "Cover message"}</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.coverMessage}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    coverMessage: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Style animation" : "Motion style"}</span>
                      <select
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                        value={previewInvitation.experience.particleStyle}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    particleStyle: event.target.value as InvitationRecord["experience"]["particleStyle"]
                                  }
                                }
                              : current
                          )
                        }
                      >
                        <option value="petals">Petals</option>
                        <option value="confetti">Confetti</option>
                        <option value="glow">Glow</option>
                        <option value="leaves">Leaves</option>
                        <option value="none">None</option>
                      </select>
                    </label>
                  </SectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <SectionCard title={isFrench ? "Bloc date" : "Date section"}>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Titre" : "Title"}</span>
                      <input
                        className="w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.dateTitle}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    dateTitle: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Introduction" : "Intro"}</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.dateIntro}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    dateIntro: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                  </SectionCard>

                  <SectionCard title={isFrench ? "Bloc adresse" : "Venue section"}>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Titre" : "Title"}</span>
                      <input
                        className="w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.venueTitle}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    venueTitle: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Introduction" : "Intro"}</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.venueIntro}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    venueIntro: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Texte du bouton map" : "Map button label"}</span>
                      <input
                        className="w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.venueCtaLabel}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    venueCtaLabel: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                  </SectionCard>

                  <SectionCard title={isFrench ? "Bloc infos invite" : "Guest section"}>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Titre" : "Title"}</span>
                      <input
                        className="w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.guestTitle}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    guestTitle: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Introduction" : "Intro"}</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3"
                        value={previewInvitation.experience.guestIntro}
                        onChange={(event) =>
                          setInvitation((current) =>
                            current
                              ? {
                                  ...current,
                                  experience: {
                                    ...current.experience,
                                    guestIntro: event.target.value
                                  }
                                }
                              : current
                          )
                        }
                      />
                    </label>
                  </SectionCard>
                </div>

                <SectionCard title={isFrench ? "Programme" : "Schedule"}>
                  <label className="space-y-2 text-sm">
                    <span>{isFrench ? "Titre section" : "Section title"}</span>
                    <input
                      className="w-full rounded-2xl border border-black/10 px-4 py-3"
                      value={previewInvitation.experience.scheduleTitle}
                      onChange={(event) =>
                        setInvitation((current) =>
                          current
                            ? {
                                ...current,
                                experience: {
                                  ...current.experience,
                                  scheduleTitle: event.target.value
                                }
                              }
                            : current
                        )
                      }
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>{isFrench ? "Introduction section" : "Section intro"}</span>
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3"
                      value={previewInvitation.experience.scheduleIntro}
                      onChange={(event) =>
                        setInvitation((current) =>
                          current
                            ? {
                                ...current,
                                experience: {
                                  ...current.experience,
                                  scheduleIntro: event.target.value
                                }
                              }
                            : current
                        )
                      }
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {previewInvitation.experience.moments.map((moment, index) => (
                      <div key={index} className="rounded-3xl border border-black/8 bg-[#fffaf4] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{(isFrench ? "Moment" : "Moment") + " " + (index + 1)}</p>
                        <div className="mt-3 grid gap-3">
                          <input
                            className="rounded-2xl border border-black/10 px-4 py-3"
                            value={moment.time}
                            onChange={(event) =>
                              setInvitation((current) =>
                                current ? updateMomentField(current, index, "time", event.target.value) : current
                              )
                            }
                            placeholder={isFrench ? "Heure" : "Time"}
                          />
                          <input
                            className="rounded-2xl border border-black/10 px-4 py-3"
                            value={moment.title}
                            onChange={(event) =>
                              setInvitation((current) =>
                                current ? updateMomentField(current, index, "title", event.target.value) : current
                              )
                            }
                            placeholder={isFrench ? "Titre" : "Title"}
                          />
                          <textarea
                            className="min-h-20 rounded-2xl border border-black/10 px-4 py-3"
                            value={moment.note}
                            onChange={(event) =>
                              setInvitation((current) =>
                                current ? updateMomentField(current, index, "note", event.target.value) : current
                              )
                            }
                            placeholder={isFrench ? "Description" : "Description"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title={isFrench ? "Details invite" : "Guest details"}>
                  <div className="grid gap-4 md:grid-cols-3">
                    {previewInvitation.experience.guestDetails.map((detail, index) => (
                      <div key={index} className="rounded-3xl border border-black/8 bg-[#fffaf4] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{(isFrench ? "Carte" : "Card") + " " + (index + 1)}</p>
                        <div className="mt-3 grid gap-3">
                          <input
                            className="rounded-2xl border border-black/10 px-4 py-3"
                            value={detail.label}
                            onChange={(event) =>
                              setInvitation((current) =>
                                current ? updateGuestField(current, index, "label", event.target.value) : current
                              )
                            }
                          />
                          <textarea
                            className="min-h-24 rounded-2xl border border-black/10 px-4 py-3"
                            value={detail.value}
                            onChange={(event) =>
                              setInvitation((current) =>
                                current ? updateGuestField(current, index, "value", event.target.value) : current
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <label className="space-y-2">
                    <span className="text-sm">{t.heroImage}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 shadow-sm outline-none transition focus:border-[#a97747] focus:ring-2 focus:ring-[#e9d3b7] file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {previewInvitation.heroImage ? (
                    <button
                      type="button"
                      className="rounded-full border border-black/10 px-4 py-3 text-sm"
                      onClick={() =>
                        setInvitation((current) =>
                          current
                            ? {
                                ...current,
                                heroImage: ""
                              }
                            : current
                        )
                      }
                    >
                      {isFrench ? "Retirer image" : "Remove image"}
                    </button>
                  ) : null}
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
                    <a className="mt-2 block font-medium text-emerald-900 underline" href={publicUrl} target="_blank" rel="noreferrer">
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
