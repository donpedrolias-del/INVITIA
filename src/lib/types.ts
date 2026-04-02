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
}

export interface InvitationRecord extends InvitationFormData {
  id: string;
  slug: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
  content: InvitationContent;
  design: InvitationDesign;
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
