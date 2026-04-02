import { z } from "zod";

export const invitationGenerateSchema = z.object({
  eventType: z.enum(["wedding", "birthday", "baptism", "corporate", "generic"]),
  language: z.enum(["fr", "en"]),
  title: z.string().optional().default(""),
  hostName: z.string().optional().default(""),
  description: z.string().optional().default(""),
  dateTime: z.string().optional().default(""),
  venue: z.string().optional().default(""),
  dressCode: z.string().optional().default(""),
  contactInfo: z.string().optional().default(""),
  heroImage: z.string().optional().default(""),
  theme: z.string().optional().default(""),
  prompt: z.string().optional().default("")
});

export const invitationCreateSchema = invitationGenerateSchema.extend({
  status: z.enum(["draft", "published"]).default("draft"),
  content: z.object({
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
  }),
  design: z.object({
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
  })
});

export const invitationUpdateSchema = invitationCreateSchema.partial();
