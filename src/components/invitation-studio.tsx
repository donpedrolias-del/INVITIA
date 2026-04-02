"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { InvitationPreview } from "@/components/invitation-preview";
import { getCopy, getEventTypeOptions } from "@/lib/i18n";
import {
  GuestDetail,
  InvitationFormData,
  InvitationMoment,
  InvitationRecord,
  Language,
  LayoutBlock
} from "@/lib/types";
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
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

async function readFilesAsDataUrls(files: FileList | File[]) {
  return Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
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

function SectionCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white/78 p-5 shadow-sm">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.32em] text-slate-500">{eyebrow}</p> : null}
      <h3 className="mt-1 text-lg text-slate-900">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function updateMomentField(invitation: InvitationRecord, index: number, key: keyof InvitationMoment, value: string) {
  const moments = invitation.experience.moments.map((moment, currentIndex) =>
    currentIndex === index ? { ...moment, [key]: value } : moment
  );

  return {
    ...invitation,
    experience: {
      ...invitation.experience,
      moments
    }
  };
}

function updateGuestField(invitation: InvitationRecord, index: number, key: keyof GuestDetail, value: string) {
  const guestDetails = invitation.experience.guestDetails.map((detail, currentIndex) =>
    currentIndex === index ? { ...detail, [key]: value } : detail
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

  const creationSteps = useMemo(
    () =>
      isFrench
        ? [
            { label: "Essentiel", hint: "Type, titre, date" },
            { label: "Direction", hint: "Theme et prompt" },
            { label: "Medias", hint: "Photos et video" },
            { label: "Edition", hint: "Texte et rendu final" }
          ]
        : [
            { label: "Essentials", hint: "Type, title, date" },
            { label: "Direction", hint: "Theme and prompt" },
            { label: "Media", hint: "Photos and video" },
            { label: "Editing", hint: "Text and final polish" }
          ],
    [isFrench]
  );

  function updateField<Key extends keyof InvitationFormData>(key: Key, value: InvitationFormData[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleHeroImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateField("heroImage", dataUrl);
      setInvitation((current) =>
        current
          ? {
              ...current,
              heroImage: dataUrl,
              design: {
                ...current.design,
                media: {
                  ...current.design.media,
                  gallery: current.design.media.gallery.length > 0 ? current.design.media.gallery : [dataUrl]
                }
              }
            }
          : current
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load image");
    }
  }

  async function handleGalleryUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const images = await readFilesAsDataUrls(files);
      setInvitation((current) =>
        current
          ? {
              ...current,
              design: {
                ...current.design,
                media: {
                  ...current.design.media,
                  gallery: [...current.design.media.gallery, ...images].slice(0, 8)
                }
              }
            }
          : current
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load gallery images");
    }
  }

  async function handleVideoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const video = await readFileAsDataUrl(file);
      setInvitation((current) =>
        current
          ? {
              ...current,
              design: {
                ...current.design,
                media: {
                  ...current.design.media,
                  video
                }
              }
            }
          : current
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load video");
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

      return {
        ...current,
        design: {
          ...current.design,
          layoutConfig: current.design.layoutConfig.map((block, blockIndex) =>
            blockIndex === index ? nextBlock : block
          )
        }
      };
    });
  }

  const publicUrl = invitation && invitation.status === "published" ? "/invite/" + (invitation.slug || invitation.id) : "";
  const previewInvitation = invitation || null;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1450px] flex-col gap-10 px-5 py-10 md:px-10">
      <section className="relative overflow-hidden rounded-[42px] border border-[#f1d6a2]/30 bg-[radial-gradient(circle_at_top_left,rgba(241,214,162,0.28),transparent_24%),linear-gradient(135deg,#120f1f_0%,#362131_34%,#7f4f3d_69%,#efd3a0_100%)] p-8 text-white shadow-[0_30px_120px_rgba(16,12,21,0.34)] md:p-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.45em]">{t.appName}</span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl leading-none md:text-7xl">{t.heroTitle}</h1>
              <p className="max-w-2xl text-base leading-7 text-white/82 md:text-lg">{t.heroBody}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {creationSteps.map((step, index) => (
              <div key={step.label} className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-white/64">0{index + 1}</p>
                <h3 className="mt-3 text-lg text-white">{step.label}</h3>
                <p className="mt-2 text-sm text-white/72">{step.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-6 rounded-[36px] border border-[#d9c5ab]/80 bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(247,239,228,0.96))] p-6 shadow-[0_24px_90px_rgba(43,29,18,0.08)] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-slate-500">{t.startLabel}</p>
              <h2 className="mt-2 text-2xl text-slate-900">{isFrench ? "Creation organisee" : "Organized creation"}</h2>
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

          <SectionCard eyebrow={isFrench ? "Etape 1" : "Step 1"} title={isFrench ? "Essentiel" : "Essentials"}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm">{t.eventType}</span>
                <select
                  className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3"
                  value={form.eventType}
                  onChange={(event) => updateField("eventType", event.target.value as InvitationFormData["eventType"])}
                >
                  {eventOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.theme}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.theme} onChange={(event) => updateField("theme", event.target.value)} placeholder={isFrench ? "Ex. Jardin dore editorial" : "Ex. Editorial golden garden"} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.title}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.hostName}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.hostName} onChange={(event) => updateField("hostName", event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.dateTime}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.dateTime} onChange={(event) => updateField("dateTime", event.target.value)} placeholder={isFrench ? "Ex. 12 Juin 2026 - 16:00" : "Ex. June 12, 2026 - 4:00 PM"} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.venue}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.venue} onChange={(event) => updateField("venue", event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.dressCode}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.dressCode} onChange={(event) => updateField("dressCode", event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{t.contactInfo}</span>
                <input className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.contactInfo} onChange={(event) => updateField("contactInfo", event.target.value)} />
              </label>
            </div>
          </SectionCard>

          <SectionCard eyebrow={isFrench ? "Etape 2" : "Step 2"} title={isFrench ? "Direction creative" : "Creative direction"}>
            <label className="space-y-2">
              <span className="text-sm">{t.description}</span>
              <textarea className="min-h-28 w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm">{t.prompt}</span>
              <textarea className="min-h-28 w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3" value={form.prompt} onChange={(event) => updateField("prompt", event.target.value)} placeholder={isFrench ? "Ex. Invitation editoriale, luxe doux, fleurs ivoire, ouverture cinematographique, details impeccables." : "Ex. Editorial invitation, soft luxury, ivory florals, cinematic opening, impeccable details."} />
            </label>
          </SectionCard>

          <SectionCard eyebrow={isFrench ? "Etape 3" : "Step 3"} title={isFrench ? "Medias" : "Media"}>
            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm">{t.heroImage}</span>
                <input type="file" accept="image/*" className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white" onChange={handleHeroImageUpload} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{isFrench ? "Photos supplementaires" : "Additional photos"}</span>
                <input type="file" accept="image/*" multiple className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white" onChange={handleGalleryUpload} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">{isFrench ? "Video" : "Video"}</span>
                <input type="file" accept="video/*" className="w-full rounded-2xl border border-[#dcc8b0] bg-white/85 px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white" onChange={handleVideoUpload} />
              </label>
            </div>
            {form.heroImage ? <img src={form.heroImage} alt="Selected invitation cover" className="h-48 w-full rounded-[18px] object-cover" /> : null}
          </SectionCard>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60" onClick={handleGenerate} disabled={busyState !== "idle"}>
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
                <span className={cn("rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em]", invitation.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                  {invitation.status === "published" ? t.published : t.draft}
                </span>
              ) : null}
            </div>

            {!previewInvitation ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-slate-500">{t.noPreview}</div>
            ) : (
              <div className="mt-6 space-y-6">
                <InvitationPreview invitation={previewInvitation} />

                <div className="grid gap-6 xl:grid-cols-2">
                  <SectionCard eyebrow={isFrench ? "Etape 4" : "Step 4"} title={isFrench ? "Palette et structure" : "Palette and structure"}>
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
                    <div className="space-y-3">
                      {previewInvitation.design.layoutConfig.map((block, index) => (
                        <EditorBlock key={block.id} block={block} onChange={(next) => updateLayout(index, next)} />
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title={isFrench ? "Texte principal" : "Main copy"}>
                    <label className="space-y-2 text-sm">
                      <span>{t.title}</span>
                      <input className="w-full rounded-2xl border border-black/10 px-4 py-3" value={previewInvitation.content.title} onChange={(event) => setInvitation((current) => current ? { ...current, title: event.target.value, content: { ...current.content, title: event.target.value } } : current)} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{t.hostName}</span>
                      <input className="w-full rounded-2xl border border-black/10 px-4 py-3" value={previewInvitation.content.subtitle} onChange={(event) => setInvitation((current) => current ? { ...current, hostName: event.target.value, content: { ...current.content, subtitle: event.target.value }, experience: { ...current.experience, coverHeadline: event.target.value || current.experience.coverHeadline, signatureLine: current.language === "fr" ? (event.target.value || current.experience.coverHeadline) + " vous attendent" : (event.target.value || current.experience.coverHeadline) + " are waiting for you" } } : current)} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{t.description}</span>
                      <textarea className="min-h-28 w-full rounded-2xl border border-black/10 px-4 py-3" value={previewInvitation.content.description} onChange={(event) => setInvitation((current) => current ? { ...current, description: event.target.value, content: { ...current.content, description: event.target.value } } : current)} />
                    </label>
                  </SectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <SectionCard title={isFrench ? "Ouverture" : "Opening"}>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Titre couverture" : "Cover headline"}</span>
                      <input className="w-full rounded-2xl border border-black/10 px-4 py-3" value={previewInvitation.experience.coverHeadline} onChange={(event) => setInvitation((current) => current ? { ...current, experience: { ...current.experience, coverHeadline: event.target.value } } : current)} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Message couverture" : "Cover message"}</span>
                      <textarea className="min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3" value={previewInvitation.experience.coverMessage} onChange={(event) => setInvitation((current) => current ? { ...current, experience: { ...current.experience, coverMessage: event.target.value } } : current)} />
                    </label>
                  </SectionCard>

                  <SectionCard title={isFrench ? "Bibliotheque media" : "Media library"}>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Photos de la galerie" : "Gallery photos"}</span>
                      <input type="file" accept="image/*" multiple className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white" onChange={handleGalleryUpload} />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {previewInvitation.design.media.gallery.map((image, index) => (
                        <div key={image + index} className="overflow-hidden rounded-[22px] border border-black/10 bg-white">
                          <img src={image} alt={"Gallery " + (index + 1)} className="h-32 w-full object-cover" />
                          <button type="button" className="w-full border-t border-black/8 px-3 py-2 text-sm text-slate-600" onClick={() => setInvitation((current) => current ? { ...current, design: { ...current.design, media: { ...current.design.media, gallery: current.design.media.gallery.filter((_, currentIndex) => currentIndex !== index) } } } : current)}>
                            {isFrench ? "Retirer" : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="space-y-2 text-sm">
                      <span>{isFrench ? "Video de l invitation" : "Invitation video"}</span>
                      <input type="file" accept="video/*" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:text-white" onChange={handleVideoUpload} />
                    </label>
                    {previewInvitation.design.media.video ? (
                      <div className="overflow-hidden rounded-[24px] border border-black/10 bg-black/90">
                        <video src={previewInvitation.design.media.video} controls className="h-56 w-full object-cover" />
                        <button type="button" className="w-full border-t border-white/10 px-3 py-2 text-sm text-white/80" onClick={() => setInvitation((current) => current ? { ...current, design: { ...current.design, media: { ...current.design.media, video: "" } } } : current)}>
                          {isFrench ? "Retirer la video" : "Remove video"}
                        </button>
                      </div>
                    ) : null}
                  </SectionCard>
                </div>

                <SectionCard title={isFrench ? "Programme" : "Schedule"}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {previewInvitation.experience.moments.map((moment, index) => (
                      <div key={index} className="rounded-3xl border border-black/8 bg-[#fffaf4] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{(isFrench ? "Moment" : "Moment") + " " + (index + 1)}</p>
                        <div className="mt-3 grid gap-3">
                          <input className="rounded-2xl border border-black/10 px-4 py-3" value={moment.time} onChange={(event) => setInvitation((current) => current ? updateMomentField(current, index, "time", event.target.value) : current)} />
                          <input className="rounded-2xl border border-black/10 px-4 py-3" value={moment.title} onChange={(event) => setInvitation((current) => current ? updateMomentField(current, index, "title", event.target.value) : current)} />
                          <textarea className="min-h-20 rounded-2xl border border-black/10 px-4 py-3" value={moment.note} onChange={(event) => setInvitation((current) => current ? updateMomentField(current, index, "note", event.target.value) : current)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title={isFrench ? "Details invite" : "Guest details"}>
                  <div className="grid gap-4 md:grid-cols-3">
                    {previewInvitation.experience.guestDetails.map((detail, index) => (
                      <div key={index} className="rounded-3xl border border-black/8 bg-[#fffaf4] p-4">
                        <div className="mt-3 grid gap-3">
                          <input className="rounded-2xl border border-black/10 px-4 py-3" value={detail.label} onChange={(event) => setInvitation((current) => current ? updateGuestField(current, index, "label", event.target.value) : current)} />
                          <textarea className="min-h-24 rounded-2xl border border-black/10 px-4 py-3" value={detail.value} onChange={(event) => setInvitation((current) => current ? updateGuestField(current, index, "value", event.target.value) : current)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <div className="flex flex-wrap items-center gap-3">
                  <button className="rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60" onClick={() => previewInvitation && handleSave(previewInvitation)} disabled={busyState !== "idle"}>
                    {busyState === "saving" ? t.saving : t.saveDraft}
                  </button>
                  <button className="rounded-full bg-emerald-600 px-5 py-3 text-white transition hover:bg-emerald-500 disabled:opacity-60" onClick={handlePublish} disabled={!invitation || busyState !== "idle"}>
                    {busyState === "publishing" ? t.publishing : t.publish}
                  </button>
                  <p className="text-sm text-slate-500">{t.publishHint}</p>
                </div>

                {publicUrl ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">{t.publicLink}</p>
                    <a className="mt-2 block font-medium text-emerald-900 underline" href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{t.publishReady}</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
