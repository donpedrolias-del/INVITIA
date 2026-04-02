import { createClient } from "@supabase/supabase-js";
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
  return record.slug || `${base}-${record.id.slice(-4)}`;
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
    const { error } = await supabase.from(invitationTable).insert(record);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    memoryStore.set(record.id, record);
  }

  return record;
}

export async function updateInvitation(
  id: string,
  updates: Partial<InvitationRecord>
) {
  const existing = await getInvitation(id);
  if (!existing) {
    return null;
  }

  const next: InvitationRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  next.slug = ensureSlug(next);

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from(invitationTable)
      .update(next)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as InvitationRecord;
  }

  memoryStore.set(id, next);
  return next;
}

export async function getInvitation(id: string) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from(invitationTable)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return data as InvitationRecord;
  }

  return memoryStore.get(id) || null;
}

export async function getInvitationByIdentifier(identifier: string) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from(invitationTable)
      .select("*")
      .or(`id.eq.${identifier},slug.eq.${identifier}`)
      .single();

    if (error) {
      return null;
    }

    return data as InvitationRecord;
  }

  for (const record of memoryStore.values()) {
    if (record.id === identifier || record.slug === identifier) {
      return record;
    }
  }

  return null;
}
