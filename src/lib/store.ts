import { createClient } from "@supabase/supabase-js";
import { generateInvitationDesign } from "@/lib/ai";
import { InvitationRecord } from "@/lib/types";
import { randomId, slugify } from "@/lib/utils";

const invitationTable = process.env.SUPABASE_INVITATIONS_TABLE || "invitations";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const memoryStore = new Map<string, InvitationRecord>();

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function ensureSlug(record: InvitationRecord) {
  const base = slugify(record.title || record.hostName || record.eventType) || record.id;
  return record.slug || base + "-" + record.id.slice(-4);
}

function hydrateInvitation(row: Record<string, any>): InvitationRecord {
  const fallback = generateInvitationDesign({
    eventType: row.eventType,
    language: row.language,
    title: row.title,
    hostName: row.hostName,
    description: row.description,
    dateTime: row.dateTime,
    venue: row.venue,
    dressCode: row.dressCode,
    contactInfo: row.contactInfo,
    heroImage: row.heroImage,
    theme: row.theme,
    prompt: row.prompt
  });

  const embeddedExperience = row.design && typeof row.design === "object" ? row.design.experience : undefined;

  return {
    ...row,
    content: row.content || fallback.content,
    design: row.design
      ? {
          theme: row.design.theme || fallback.design.theme,
          tone: row.design.tone || fallback.design.tone,
          colorPalette: row.design.colorPalette || fallback.design.colorPalette,
          typography: row.design.typography || fallback.design.typography,
          layoutConfig: row.design.layoutConfig || fallback.design.layoutConfig,
          media: row.design.media || fallback.design.media
        }
      : fallback.design,
    experience: row.experience || embeddedExperience || fallback.experience
  } as InvitationRecord;
}

function serializeInvitation(record: InvitationRecord) {
  const { experience, ...rest } = record;

  return {
    ...rest,
    design: {
      ...record.design,
      experience
    }
  };
}

export async function createInvitation(
  invitation: Omit<InvitationRecord, "id" | "slug" | "createdAt" | "updatedAt">
) {
  const now = new Date().toISOString();
  const id = randomId();
  const record: InvitationRecord = {
    ...invitation,
    id,
    slug: "",
    createdAt: now,
    updatedAt: now
  };
  record.slug = ensureSlug(record);

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.from(invitationTable).insert(serializeInvitation(record)).select().single();
    if (error) {
      throw new Error(error.message);
    }

    return hydrateInvitation(data as Record<string, any>);
  }

  memoryStore.set(record.id, record);
  return record;
}

export async function updateInvitation(id: string, updates: Partial<InvitationRecord>) {
  const existing = await getInvitation(id);
  if (!existing) {
    return null;
  }

  const next: InvitationRecord = {
    ...existing,
    ...updates,
    content: {
      ...existing.content,
      ...(updates.content || {})
    },
    design: {
      ...existing.design,
      ...(updates.design || {}),
      colorPalette: {
        ...existing.design.colorPalette,
        ...(updates.design?.colorPalette || {})
      },
      typography: {
        ...existing.design.typography,
        ...(updates.design?.typography || {})
      },
      layoutConfig: updates.design?.layoutConfig || existing.design.layoutConfig,
      media: {
        ...existing.design.media,
        ...(updates.design?.media || {})
      }
    },
    experience: {
      ...existing.experience,
      ...(updates.experience || {}),
      moments: updates.experience?.moments || existing.experience.moments,
      guestDetails: updates.experience?.guestDetails || existing.experience.guestDetails
    },
    updatedAt: new Date().toISOString()
  };
  next.slug = ensureSlug(next);

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from(invitationTable)
      .update(serializeInvitation(next))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return hydrateInvitation(data as Record<string, any>);
  }

  memoryStore.set(id, next);
  return next;
}

export async function getInvitation(id: string) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.from(invitationTable).select("*").eq("id", id).single();

    if (error) {
      return null;
    }

    return hydrateInvitation(data as Record<string, any>);
  }

  return memoryStore.get(id) || null;
}

export async function getInvitationByIdentifier(identifier: string) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from(invitationTable)
      .select("*")
      .or("id.eq." + identifier + ",slug.eq." + identifier)
      .single();

    if (error) {
      return null;
    }

    return hydrateInvitation(data as Record<string, any>);
  }

  for (const record of memoryStore.values()) {
    if (record.id === identifier || record.slug === identifier) {
      return record;
    }
  }

  return null;
}
