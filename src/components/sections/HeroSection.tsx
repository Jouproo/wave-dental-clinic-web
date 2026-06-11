import HeroClient from "./HeroClient";
import { supabaseServer } from "@/lib/supabase";
import type { DbClinicSettings } from "@/types/admin";

async function getHeroImageUrl(): Promise<string | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    const supabase = supabaseServer();
    const { data } = await supabase
      .from("hero_settings")
      .select("background_image_url")
      .eq("id", 1)
      .single();
    return data?.background_image_url ?? null;
  } catch {
    return null;
  }
}

interface HeroSectionProps {
  settings?: DbClinicSettings;
}

export default async function HeroSection({ settings }: HeroSectionProps) {
  const heroImageUrl = await getHeroImageUrl();
  return <HeroClient heroImageUrl={heroImageUrl} settings={settings} />;
}
