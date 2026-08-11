export interface DbDoctor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image_url: string | null;
  experience: string;
  whatsapp: string;
  status: "active" | "inactive";
  display_order: number;
  created_at: string;
}

export interface DbService {
  id: string;
  icon: string;
  title: string;
  description: string;
  short_cta: string;
  detail_description: string;
  status: "active" | "inactive";
  display_order: number;
  created_at: string;
}

export interface DbGallery {
  id: string;
  service_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
  caption: string;
  display_order: number;
  featured_home: boolean;
  created_at: string;
}

export interface DbHeroSettings {
  id: number;
  background_image_url: string | null;
  updated_at: string;
}

export interface DbServiceWithGallery extends DbService {
  gallery: DbGallery[];
}

export interface DbAdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface DbClinicSettings {
  id: number;
  phone: string;
  whatsapp: string;
  address: string;
  working_hours: string;
  google_maps_embed_url: string;
  google_maps_direction_url: string;
  facebook_url: string;
  instagram_url: string;
  updated_at: string;
}
