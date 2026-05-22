import { clinicConfig } from "@/config/clinic";
import type { DbClinicSettings } from "@/types/admin";

// Fallback values from static config
export const defaultSettings: DbClinicSettings = {
  id: 1,
  phone: clinicConfig.phoneNumber,
  whatsapp: clinicConfig.whatsappNumber,
  address: clinicConfig.address,
  working_hours: clinicConfig.workingHours,
  google_maps_embed_url: clinicConfig.googleMapsEmbedUrl,
  google_maps_direction_url: clinicConfig.googleMapsDirectionUrl,
  facebook_url: clinicConfig.socialLinks.facebook,
  instagram_url: clinicConfig.socialLinks.instagram,
  updated_at: "",
};

export async function getClinicSettings(): Promise<DbClinicSettings> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return defaultSettings;
    const { supabaseServer } = await import("@/lib/supabase");
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("clinic_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !data) return defaultSettings;
    return data as DbClinicSettings;
  } catch {
    return defaultSettings;
  }
}

export function makeWhatsAppUrl(whatsapp: string, message?: string) {
  const text = encodeURIComponent(message ?? clinicConfig.whatsappMessage);
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${text}`;
}
