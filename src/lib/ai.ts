import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  CoverStyle,
  EventType,
  GuestDetail,
  InvitationContent,
  InvitationDesign,
  InvitationExperienceConfig,
  InvitationFormData,
  InvitationGeneratePayload,
  InvitationMoment,
  LayoutBlock,
  ParticleStyle
} from "@/lib/types";
import { randomId } from "@/lib/utils";

const themePresets: Record<
  EventType,
  {
    tone: string;
    theme: string;
    colors: InvitationDesign["colorPalette"];
    particles: ParticleStyle[];
    covers: CoverStyle[];
  }
> = {
  wedding: {
    tone: "romantic editorial",
    theme: "Velvet Garden",
    particles: ["petals", "glow", "leaves"],
    covers: ["envelope", "veil", "monogram"],
    colors: {
      background: "#f4ebe5",
      surface: "#fff8f2",
      primary: "#6e3347",
      accent: "#c99a67",
      text: "#2d1f25"
    }
  },
  birthday: {
    tone: "playful chic",
    theme: "Golden Confetti",
    particles: ["confetti", "glow", "petals"],
    covers: ["monogram", "minimal", "envelope"],
    colors: {
      background: "#fff2df",
      surface: "#fffaf2",
      primary: "#d25c34",
      accent: "#efb646",
      text: "#3a251d"
    }
  },
  baptism: {
    tone: "soft graceful",
    theme: "Morning Grace",
    particles: ["glow", "petals", "none"],
    covers: ["veil", "envelope", "minimal"],
    colors: {
      background: "#edf4fb",
      surface: "#fafdff",
      primary: "#5b6da4",
      accent: "#d1b07a",
      text: "#26324d"
    }
  },
  corporate: {
    tone: "refined modern",
    theme: "Nocturne Brief",
    particles: ["glow", "none", "confetti"],
    covers: ["minimal", "monogram", "veil"],
    colors: {
      background: "#101726",
      surface: "#182335",
      primary: "#eef2f5",
      accent: "#60c0b6",
      text: "#eef3f7"
    }
  },
  generic: {
    tone: "signature premium",
    theme: "Signature Glow",
    particles: ["petals", "glow", "confetti"],
    covers: ["envelope", "minimal", "monogram"],
    colors: {
      background: "#f3eee7",
      surface: "#fffdf9",
      primary: "#413a56",
      accent: "#c38250",
      text: "#221d2f"
    }
  }
};

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function hashValue(input: string) {
  return Math.abs(Array.from(input).reduce((acc, char) => acc * 31 + char.charCodeAt(0), 17));
}

function pickVariant<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length];
}

function getLayoutBlocks(language: InvitationFormData["language"]): LayoutBlock[] {
  const labels =
    language === "fr"
      ? {
          hero: "Couverture",
          details: "Details",
          message: "Message",
          gallery: "Image",
          footer: "Contact"
        }
      : {
          hero: "Cover",
          details: "Details",
          message: "Message",
          gallery: "Gallery",
          footer: "Contact"
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
  const title = input.title || (isFrench ? "Vous etes invites a celebrer" : "You are invited to celebrate");
  const host = input.hostName || (isFrench ? "Vos hotes" : "Your hosts");
  const description =
    input.description ||
    (isFrench
      ? "Une invitation pensee pour offrir une experience soignee, elegante et memorable des le premier regard."
      : "An invitation designed to feel polished, elegant, and memorable from the very first look.");
  const moodBase = input.theme.trim() || themePresets[input.eventType].theme;

  return {
    eyebrow: input.prompt.trim() || (isFrench ? "Collection " + moodBase : moodBase + " collection"),
    title,
    subtitle: host,
    description,
    message: isFrench
      ? "Chaque detail de cette invitation a ete imagine pour traduire un univers " + moodBase.toLowerCase() + " et offrir une experience vraiment distinctive."
      : "Every detail of this invitation has been shaped to express a " + moodBase.toLowerCase() + " atmosphere and deliver a truly distinctive experience.",
    dateLabel: isFrench ? "Quand" : "When",
    venueLabel: isFrench ? "Adresse" : "Address",
    dressCodeLabel: "Dress code",
    contactLabel: "Contact",
    ctaLabel: isFrench ? "Voir invitation" : "View invitation"
  };
}

function buildMoments(input: InvitationFormData, seed: number): InvitationMoment[] {
  const isFrench = input.language === "fr";
  const momentsByEvent: Record<EventType, Array<{ fr: string; en: string }>> = {
    wedding: [
      { fr: "Ceremonie", en: "Ceremony" },
      { fr: "Cocktail", en: "Cocktail" },
      { fr: "Diner", en: "Dinner" },
      { fr: "Soiree", en: "Party" }
    ],
    birthday: [
      { fr: "Accueil", en: "Welcome" },
      { fr: "Toast", en: "Toast" },
      { fr: "Diner", en: "Dinner" },
      { fr: "Dancefloor", en: "Dancefloor" }
    ],
    baptism: [
      { fr: "Ceremonie", en: "Ceremony" },
      { fr: "Reception", en: "Reception" },
      { fr: "Dejeuner", en: "Lunch" },
      { fr: "Moment famille", en: "Family moment" }
    ],
    corporate: [
      { fr: "Accueil", en: "Reception" },
      { fr: "Ouverture", en: "Opening" },
      { fr: "Temps fort", en: "Main segment" },
      { fr: "Networking", en: "Networking" }
    ],
    generic: [
      { fr: "Accueil", en: "Arrival" },
      { fr: "Moment cle", en: "Main moment" },
      { fr: "Pause", en: "Pause" },
      { fr: "Finale", en: "Finale" }
    ]
  };

  const notes =
    isFrench
      ? [
          "L ouverture se fait dans une atmosphere douce et tres soignee.",
          "Un temps pense pour creer du lien et installer le ton de evenement.",
          input.description || "Le coeur de la celebration se deploie ici.",
          "La fin prend une tournure plus festive, elegante et memorable."
        ]
      : [
          "The opening unfolds in a soft and carefully designed atmosphere.",
          "A moment created to build connection and set the tone of the event.",
          input.description || "The heart of the celebration unfolds here.",
          "The ending becomes more festive, elegant, and memorable."
        ];

  const date = new Date(input.dateTime);
  const baseMinutes = Number.isNaN(date.getTime()) ? 17 * 60 : (date.getHours() || 17) * 60 + date.getMinutes();
  const offsets = [0, 60 + (seed % 20), 150 + (seed % 25), 255 + (seed % 30)];

  return momentsByEvent[input.eventType].map((item, index) => {
    const total = baseMinutes + offsets[index];
    const hours = Math.floor(total / 60) % 24;
    const minutes = total % 60;

    return {
      time: pad(hours) + ":" + pad(minutes),
      title: isFrench ? item.fr : item.en,
      note: notes[index]
    };
  });
}

function buildGuestDetails(input: InvitationFormData): GuestDetail[] {
  const isFrench = input.language === "fr";

  return isFrench
    ? [
        {
          label: "Accueil invite",
          value: "Presentez cette invitation a votre arrivee pour etre oriente vers votre espace et les informations utiles."
        },
        {
          label: "Dress code",
          value: input.dressCode || "Une tenue elegante et confortable est recommandee."
        },
        {
          label: "Contact",
          value: input.contactInfo || "Les coordonnees pratiques seront confirmees par organisateur."
        }
      ]
    : [
        {
          label: "Guest arrival",
          value: "Present this invitation upon arrival to be guided to your area and receive the key practical details."
        },
        {
          label: "Dress code",
          value: input.dressCode || "Elegant and comfortable attire is recommended."
        },
        {
          label: "Contact",
          value: input.contactInfo || "Practical contact details will be confirmed by the organizer."
        }
      ];
}

function buildExperience(input: InvitationFormData): InvitationExperienceConfig {
  const isFrench = input.language === "fr";
  const preset = themePresets[input.eventType];
  const seed = hashValue(
    input.eventType + "-" + input.title + "-" + input.hostName + "-" + input.theme + "-" + input.prompt + "-" + input.dateTime
  );
  const host = input.hostName || (isFrench ? "Les hotes" : "The hosts");
  const title = input.title || (isFrench ? "Notre celebration" : "Our celebration");
  const mood = input.theme || preset.theme;

  const coverMessages =
    isFrench
      ? [
          "Une invitation privee pensee dans un esprit " + mood.toLowerCase() + ".",
          "Faites glisser la couverture pour decouvrir une experience imaginee autour de " + title.toLowerCase() + ".",
          "Chaque ecran a ete travaille pour que cette invitation ne ressemble a aucune autre."
        ]
      : [
          "A private invitation shaped with a " + mood.toLowerCase() + " atmosphere.",
          "Swipe the cover to reveal the experience created around " + title.toLowerCase() + ".",
          "Each screen has been crafted so this invitation feels distinct from every other one."
        ];

  const dateIntros =
    isFrench
      ? [
          "La date, heure et rythme de la journee sont mis au centre pour que tout soit clair.",
          "Cette section donne le tempo avec une lecture simple, premium et lisible.",
          "Tout commence ici avec le moment precis ou vos invites entrent dans experience."
        ]
      : [
          "The date, time, and pacing of the day take center stage so everything feels clear.",
          "This section sets the tempo with a premium and readable presentation.",
          "Everything begins here with the exact moment your guests enter the experience."
        ];

  const venueIntros =
    isFrench
      ? [
          "Adresse et itineraire doivent etre aussi fluides que le reste de experience.",
          "Un clic suffit pour ouvrir itineraire dans Google Maps le jour J.",
          "Le lieu est presente comme une etape naturelle du parcours invite."
        ]
      : [
          "Address and directions should feel as seamless as the rest of the experience.",
          "A single tap opens the route in Google Maps on the day of the event.",
          "The venue is presented as a natural part of the guest journey."
        ];

  const scheduleIntros =
    isFrench
      ? [
          "Le programme donne de la clarte sans enlever la magie de la soiree.",
          "Chaque etape est posee avec elegance pour aider les invites a se projeter.",
          "Un bon deroule rassure, structure et donne envie de vivre chaque instant."
        ]
      : [
          "The schedule brings clarity without taking away the magic of the evening.",
          "Each step is framed elegantly so guests can picture the flow of the event.",
          "A strong timeline reassures, structures, and builds anticipation for every moment."
        ];

  const guestIntros =
    isFrench
      ? [
          "Les informations invite completent experience avec douceur et precision.",
          "Cette derniere section rassemble les details pratiques sans alourdir le design.",
          "On termine avec ce qui aide vraiment invite a venir sereinement."
        ]
      : [
          "Guest details complete the experience with calm clarity and precision.",
          "This final section gathers practical details without weighing down the design.",
          "It ends with the details that genuinely help guests arrive with confidence."
        ];

  return {
    coverHeadline: host,
    coverMessage: pickVariant(coverMessages, seed),
    openingLabel: isFrench ? "Invitation exclusive" : "Exclusive invitation",
    dateTitle: isFrench ? "Date et heure" : "Date and time",
    dateIntro: pickVariant(dateIntros, seed, 1),
    venueTitle: isFrench ? "Adresse et acces" : "Address and directions",
    venueIntro: pickVariant(venueIntros, seed, 2),
    scheduleTitle: isFrench ? "Programme de la celebration" : "Celebration schedule",
    scheduleIntro: pickVariant(scheduleIntros, seed),
    guestTitle: isFrench ? "Informations invite" : "Guest details",
    guestIntro: pickVariant(guestIntros, seed, 1),
    signatureLine: isFrench ? host + " vous attendent" : host + " are waiting for you",
    venueCtaLabel: isFrench ? "Ouvrir dans Google Maps" : "Open in Google Maps",
    particleStyle: pickVariant(preset.particles, seed),
    coverStyle: pickVariant(preset.covers, seed, 1),
    moments: buildMoments(input, seed),
    guestDetails: buildGuestDetails(input)
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

const invitationExperienceSchema = z.object({
  coverHeadline: z.string(),
  coverMessage: z.string(),
  openingLabel: z.string(),
  dateTitle: z.string(),
  dateIntro: z.string(),
  venueTitle: z.string(),
  venueIntro: z.string(),
  scheduleTitle: z.string(),
  scheduleIntro: z.string(),
  guestTitle: z.string(),
  guestIntro: z.string(),
  signatureLine: z.string(),
  venueCtaLabel: z.string(),
  particleStyle: z.enum(["petals", "confetti", "glow", "leaves", "none"]),
  coverStyle: z.enum(["envelope", "veil", "monogram", "minimal"]),
  moments: z.array(
    z.object({
      time: z.string(),
      title: z.string(),
      note: z.string()
    })
  ),
  guestDetails: z.array(
    z.object({
      label: z.string(),
      value: z.string()
    })
  )
});

const invitationResponseSchema = z.object({
  content: invitationContentSchema,
  design: invitationDesignSchema,
  experience: invitationExperienceSchema.optional()
});

function normalizeHex(color: string, fallback: string) {
  const normalized = color.trim();
  return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized : fallback;
}

function sanitizeDesign(
  design: InvitationDesign,
  fallback: InvitationDesign,
  language: InvitationFormData["language"]
): InvitationDesign {
  return {
    theme: design.theme.trim() || fallback.theme,
    tone: design.tone.trim() || fallback.tone,
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
  };
}

function sanitizeExperience(
  experience: InvitationExperienceConfig,
  fallback: InvitationExperienceConfig
): InvitationExperienceConfig {
  return {
    ...fallback,
    ...experience,
    particleStyle: experience.particleStyle || fallback.particleStyle,
    coverStyle: experience.coverStyle || fallback.coverStyle,
    moments: experience.moments && experience.moments.length > 0 ? experience.moments.slice(0, 6) : fallback.moments,
    guestDetails:
      experience.guestDetails && experience.guestDetails.length > 0
        ? experience.guestDetails.slice(0, 6)
        : fallback.guestDetails
  };
}

export function generateInvitationDesign(
  payload: InvitationGeneratePayload
): Pick<InvitationFormData, keyof InvitationFormData> & {
  content: InvitationContent;
  design: InvitationDesign;
  experience: InvitationExperienceConfig;
} {
  const preset = themePresets[payload.eventType];
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
    theme: payload.theme?.trim() || preset.theme,
    prompt: payload.prompt?.trim() || ""
  };

  return {
    ...normalized,
    content: buildContent(normalized),
    design: {
      theme: normalized.theme,
      tone: preset.tone,
      colorPalette: preset.colors,
      typography: {
        heading: "var(--font-display)",
        body: "var(--font-body)",
        accent: "var(--font-accent)"
      },
      layoutConfig: getLayoutBlocks(normalized.language)
    },
    experience: buildExperience(normalized)
  };
}

function buildOpenAIInstructions(input: InvitationFormData) {
  const isFrench = input.language === "fr";

  return [
    "You generate premium event invitation data for a cinematic web invitation builder.",
    "Return only structured fields matching the provided schema.",
    "Do not include HTML, markdown, or prose outside the schema.",
    "The invitation must feel luxurious, highly polished, and different from generic templates.",
    "Text must be concise, elegant, emotionally clear, and typo free.",
    "Create tasteful variation so different invitations do not sound or feel identical.",
    "Use exactly five layout blocks and only these block types: hero, details, message, gallery, footer.",
    "Use six digit hex colors only.",
    "Typography values must remain CSS variables: var(--font-display), var(--font-body), var(--font-accent).",
    isFrench ? "Write all user facing text in French." : "Write all user facing text in English.",
    input.description ? "Respect every factual user detail." : "Invent tasteful copy only where details are missing.",
    "Keep the content usable for weddings, birthdays, baptisms, corporate events, and generic events.",
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
    experience: InvitationExperienceConfig;
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
      design: sanitizeDesign(output.design, fallback.design, fallback.language),
      experience: output.experience
        ? sanitizeExperience(output.experience, fallback.experience)
        : fallback.experience
    };
  } catch (error) {
    console.error("OpenAI invitation generation failed, falling back to local generator.", error);
    return fallback;
  }
}
