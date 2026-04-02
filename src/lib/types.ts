export type Language = "fr" | "en";
export type InvitationStatus = "draft" | "published";
export type EventType =
  | "wedding"
  | "birthday"
  | "baptism"
  | "corporate"
  | "generic";
export type LayoutBlockType = "hero" | "details" | "message" | "gallery" | "footer";
export type TextAlign = "left" | "center" | "right";
export type ParticleStyle = "petals" | "confetti" | "glow" | "leaves" | "none";
export type CoverStyle = "envelope" | "veil" | "monogram" | "minimal";

export interface ColorPalette {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
}

export interface TypographyConfig {
  heading: string;
  body: string;
  accent: string;
}

export interface InvitationMediaConfig {
  gallery: string[];
  video: string;
}

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType;
  label: string;
  visible: boolean;
  align: TextAlign;
  spacing: "tight" | "normal" | "airy";
}

export interface InvitationContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  message: string;
  dateLabel: string;
  venueLabel: string;
  dressCodeLabel: string;
  contactLabel: string;
  ctaLabel: string;
}

export interface InvitationMoment {
  time: string;
  title: string;
  note: string;
}

export interface GuestDetail {
  label: string;
  value: string;
}

export interface InvitationExperienceConfig {
  coverHeadline: string;
  coverMessage: string;
  openingLabel: string;
  dateTitle: string;
  dateIntro: string;
  venueTitle: string;
  venueIntro: string;
  scheduleTitle: string;
  scheduleIntro: string;
  guestTitle: string;
  guestIntro: string;
  signatureLine: string;
  venueCtaLabel: string;
  particleStyle: ParticleStyle;
  coverStyle: CoverStyle;
  moments: InvitationMoment[];
  guestDetails: GuestDetail[];
}

export interface InvitationFormData {
  eventType: EventType;
  language: Language;
  title: string;
  hostName: string;
  description: string;
  dateTime: string;
  venue: string;
  dressCode: string;
  contactInfo: string;
  heroImage: string;
  theme: string;
  prompt: string;
}

export interface InvitationDesign {
  theme: string;
  tone: string;
  colorPalette: ColorPalette;
  typography: TypographyConfig;
  layoutConfig: LayoutBlock[];
  media: InvitationMediaConfig;
}

export interface InvitationRecord extends InvitationFormData {
  id: string;
  slug: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
  content: InvitationContent;
  design: InvitationDesign;
  experience: InvitationExperienceConfig;
}

export interface InvitationGeneratePayload {
  eventType: EventType;
  language: Language;
  title?: string;
  hostName?: string;
  description?: string;
  dateTime?: string;
  venue?: string;
  dressCode?: string;
  contactInfo?: string;
  heroImage?: string;
  theme?: string;
  prompt?: string;
}
