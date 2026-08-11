export type BlogPostStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";

export interface DbBlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  status: "active" | "inactive";
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBlogAuthor {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  role: string | null;
  specialty: string | null;
  credentials: string | null;
  bio: string | null;
  image_url: string | null;
  image_alt: string | null;
  profile_url: string | null;
  linked_doctor_id: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface DbBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_json: unknown | null;
  body_html: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  author_id: string | null;
  reviewer_id: string | null;
  status: BlogPostStatus;
  featured: boolean;
  related_service_id: string | null;
  tags: string[];
  seo_title: string | null;
  meta_description: string | null;
  canonical_override: string | null;
  og_image_url: string | null;
  focus_keyword: string | null;
  medical_disclaimer: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DbBlogPostSource {
  id: string;
  post_id: string;
  title: string;
  url: string;
  sort_order: number;
}

export interface DbBlogPostFaq {
  id: string;
  post_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface DbBlogPostRelated {
  id: string;
  post_id: string;
  related_post_id: string;
  sort_order: number;
}

/** Post joined with the pieces the UI actually needs to render. */
export interface BlogPostWithRelations extends DbBlogPost {
  category: DbBlogCategory | null;
  author: DbBlogAuthor | null;
  reviewer: DbBlogAuthor | null;
  sources: DbBlogPostSource[];
  faqs: DbBlogPostFaq[];
  related_posts: DbBlogPost[];
}

export interface TocEntry {
  id: string;
  level: 2 | 3;
  text: string;
}
