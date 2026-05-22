import HeroClient from "./HeroClient";
import { supabaseServer } from "@/lib/supabase";

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

export default async function HeroSection() {
  const heroImageUrl = await getHeroImageUrl();
  return <HeroClient heroImageUrl={heroImageUrl} />;
}
