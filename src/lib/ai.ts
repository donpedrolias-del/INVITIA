import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  EventType,
  InvitationContent,
  InvitationDesign,
  InvitationFormData,
  InvitationGeneratePayload,
  LayoutBlock
} from "@/lib/types";
import { randomId } from "@/lib/utils";

const themePresets: Record<
  EventType,
  { tone: string; colors: InvitationDesign["colorPalette"]; theme: string }
> = {
  wedding: {
    tone: "romantic",
    theme: "Velvet Garden",
    colors: {
      background: "#f8ede8",
      surface: "#fff8f4",
      primary: "#6f2f44",
      accent: "#d7a66b",
      text: "#2e1d23"
    }
  },
  birthday: {
    tone: "joyful",
    theme: "Confetti Light",
    colors: {
      background: "#fff1dd",
      surface: "#fffaf2",
      primary: "#da5a2a",
      accent: "#f0b53a",
      text: "#34211b"
    }
  },
  baptism: {
    tone: "soft",
    theme: "Morning Grace",
    colors: {
      background: "#eef5fb",
      surface: "#f9fcff",
      primary: "#5c6fa8",
      accent: "#d8b574",
      text: "#273250"
    }
  },
  corporate: {
    tone: "refined",
    theme: "Midnight Brief",
    colors: {
      background: "#101826",
      surface: "#172235",
      primary: "#e9e7e1",
      accent: "#63c3b9",
      text: "#edf3f7"
    }
  },
  generic: {
    tone: "versatile",
    theme: "Signature Glow",
    colors: {
      background: "#f2efe8",
      surface: "#fffdf8",
      primary: "#3d3a56",
      accent: "#c27f4f",
      text: "#201d2e"
    }
  }
};

function getLayoutBlocks(language: InvitationFormData["language"]): LayoutBlock[] {
  const labels =
    language === "fr"
      ? {
          hero: "Couverture",
          details: "Détails",
          message: "Message",
          gallery: "Image",
          footer: "Pied de page"
        }
      : {
          hero: "Hero",
          details: "Details",
          message: "Message",
          gallery: "Image",
          footer: "Footer"
        };

  return [
    { id: "hero", type: "hero", label: labels.hero, visible: true, align: "center", spacing: "airy" },
    { id: "details", type: "details", label: labels.details, visible: true, align: "center", spacing: "normal" },
    { id: "message", type: "message", label: labels.message, visible: true, align: "left", spacing: "normal" },
    { id: "gallery", type: "gallery", label: labels.gallery, visible: true, align: "center", spacing: "normal" },
    { id: "footer", type: "footer", label: labels.footer, visible: true, align: "center", spacing: "tight" }
  ];
}

function buildContent(input: InvitationFormData): InvitationContent {
  const isFrench = input.language === "fr";
  const title =
    input.title ||
    (isFrench ? "Vous êtes chaleureusement invités" : "You are warmly invited");
  const host = input.hostName || (isFrench ? "Vos hôtes" : "Your hosts");
  const description =
    input.description ||
    (isFrench
      ? "Une célébration pensée comme un moment rare, chaleureux et mémorable."
      : "A celebration designed as a warm, memorable, one-of-a-kind gathering.");
  const promptHint = input.prompt?.trim();

  return {
    eyebrow:
      promptHint ||
      (isFrench ? "Invitation sur mesure" : "Custom invitation"),
    title,
    subtitle: host,
    description,
    message: isFrench
      ? `Rejoignez-nous pour un moment ${input.theme || "unique"} autour de ${title.toLowerCase()}.`
      : `Join us for a ${input.theme || "special"} moment built around ${title.toLowerCase()}.`,
    dateLabel: isFrench ? "Quand" : "When",
    venueLabel: isFrench ? "Où" : "Where",
    dressCodeLabel: isFrench ? "Style" : "Dress code",
    contactLabel: isFrench ? "Contact" : "Contact",
    ctaLabel: isFrench ? "Partager l'invitation" : "Share invitation"
  };
}

const invitationContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  message: z.string(),
  dateLabel: z.string(),
  venueLabel: z.string(),
  dressCodeLabel: z.string(),
  contactLabel: z.string(),
  ctaLabel: z.string()
});

const invitationDesignSchema = z.object({
  theme: z.string(),
  tone: z.string(),
  colorPalette: z.object({
    background: z.string(),
    surface: z.string(),
    primary: z.string(),
    accent: z.string(),
    text: z.string()
  }),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
    accent: z.string()
  }),
  layoutConfig: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["hero", "details", "message", "gallery", "footer"]),
      label: z.string(),
      visible: z.boolean(),
      align: z.enum(["left", "center", "right"]),
      spacing: z.enum(["tight", "normal", "airy"])
    })
  )
});

const invitationResponseSchema = z.object({
  content: invitationContentSchema,
  design: invitationDesignSchema
});

function normalizeHex(color: string, fallback: string) {
  const normalized = color.trim();
  return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized : fallback;
}

function sanitizeDesign(
  design: InvitationDesign,
  fallback: InvitationDesign,
  language: InvitationFormData["language"]
) {
  return {
    theme: design.theme?.trim() || fallback.theme,
    tone: design.tone?.trim() || fallback.tone,
    colorPalette: {
      background: normalizeHex(design.colorPalette.background, fallback.colorPalette.background),
      surface: normalizeHex(design.colorPalette.surface, fallback.colorPalette.surface),
      primary: normalizeHex(design.colorPalette.primary, fallback.colorPalette.primary),
      accent: normalizeHex(design.colorPalette.accent, fallback.colorPalette.accent),
      text: normalizeHex(design.colorPalette.text, fallback.colorPalette.text)
    },
    typography: {
      heading: "var(--font-display)",
      body: "var(--font-body)",
      accent: "var(--font-accent)"
    },
    layoutConfig:
      design.layoutConfig.length > 0
        ? design.layoutConfig.map((block) => ({
            id: block.id || randomId(block.type),
            type: block.type,
            label: block.label || getLayoutBlocks(language).find((item) => item.type === block.type)?.label || block.type,
            visible: block.visible,
            align: block.align,
            spacing: block.spacing
          }))
        : fallback.layoutConfig
  } satisfies InvitationDesign;
}

export function generateInvitationDesign(
  payload: InvitationGeneratePayload
): Pick<InvitationFormData, keyof InvitationFormData> & {
  content: InvitationContent;
  design: InvitationDesign;
} {
  const baseTheme = themePresets[payload.eventType];
  const normalized: InvitationFormData = {
    eventType: payload.eventType,
    language: payload.language,
    title: payload.title?.trim() || "",
    hostName: payload.hostName?.trim() || "",
    description: payload.description?.trim() || "",
    dateTime: payload.dateTime?.trim() || "",
    venue: payload.venue?.trim() || "",
    dressCode: payload.dressCode?.trim() || "",
    contactInfo: payload.contactInfo?.trim() || "",
    heroImage:
      payload.heroImage?.trim() ||
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    theme: payload.theme?.trim() || baseTheme.theme,
    prompt: payload.prompt?.trim() || ""
  };

  return {
    ...normalized,
    content: buildContent(normalized),
    design: {
      theme: normalized.theme,
      tone: baseTheme.tone,
      colorPalette: baseTheme.colors,
      typography: {
        heading: "var(--font-display)",
        body: "var(--font-body)",
        accent: "var(--font-accent)"
      },
      layoutConfig: getLayoutBlocks(normalized.language)
    }
  };
}

function buildOpenAIInstructions(input: InvitationFormData) {
  const isFrench = input.language === "fr";

  return [
    "You generate polished event invitation data for a web invitation builder.",
    "Return only structured fields matching the provided schema.",
    "Do not include HTML, markdown, code fences, or prose outside the schema.",
    "Keep the response elegant and publication-ready.",
    "Use exactly five layout blocks and only these block types: hero, details, message, gallery, footer.",
    "Use six-digit hex colors only.",
    "Typography values must remain CSS variables: var(--font-display), var(--font-body), var(--font-accent).",
    isFrench
      ? "Write all user-facing text in French."
      : "Write all user-facing text in English.",
    input.description
      ? "Respect the user's factual details and tone."
      : "Invent tasteful copy only where details are missing.",
    "If some event fields are empty, keep the copy graceful and compatible with hidden sections."
  ].join(" ");
}

function buildOpenAIUserPrompt(input: InvitationFormData) {
  return JSON.stringify(
    {
      eventType: input.eventType,
      language: input.language,
      title: input.title,
      hostName: input.hostName,
      description: input.description,
      dateTime: input.dateTime,
      venue: input.venue,
      dressCode: input.dressCode,
      contactInfo: input.contactInfo,
      heroImage: input.heroImage,
      theme: input.theme,
      prompt: input.prompt
    },
    null,
    2
  );
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export async function generateInvitationWithAI(
  payload: InvitationGeneratePayload
): Promise<
  Pick<InvitationFormData, keyof InvitationFormData> & {
    content: InvitationContent;
    design: InvitationDesign;
  }
> {
  const fallback = generateInvitationDesign(payload);
  const client = getOpenAIClient();

  if (!client) {
    return fallback;
  }

  try {
    const parsed = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: buildOpenAIInstructions(fallback) }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildOpenAIUserPrompt(fallback) }]
        }
      ],
      text: {
        format: zodTextFormat(invitationResponseSchema, "invitation")
      }
    });

    const output = parsed.output_parsed;

    if (!output) {
      return fallback;
    }

    return {
      ...fallback,
      content: {
        ...fallback.content,
        ...output.content
      },
      design: sanitizeDesign(output.design, fallback.design, fallback.language)
    };
  } catch (error) {
    console.error("OpenAI invitation generation failed, falling back to local generator.", error);
    return fallback;
  }
}
