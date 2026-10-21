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
  role: "admin" | "sales_manager" | "sales_agent";
  status: "active" | "disabled";
  allowed_branch_ids: string[];
  extra_permissions: string[];
  manager_id: string | null;
  scope_override: "own" | "team" | "all" | null;
  created_at: string;
}

export interface DbBranch {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  bookable: boolean;
  created_at: string;
}

export type LeadStage =
  | "new" | "contacted" | "qualified" | "exam_booked" | "exam_attended"
  | "plan_presented" | "treatment_started" | "completed"
  | "no_answer" | "not_interested" | "unqualified" | "lost";

export type LeadClassification = "Hot" | "Warm" | "Cold";
export type LeadQualificationStatus = "qualified" | "qualifies_by_call" | "needs_phone" | "invalid_phone";

export interface DbLead {
  id: string;
  lead_code: string;
  legacy_id: string | null;
  entry_date: string;
  imported_at: string | null;
  name: string;
  mobile_raw: string | null;
  mobile_normalized: string | null;
  whatsapp_raw: string | null;
  whatsapp_normalized: string | null;
  alt_phone: string | null;
  source: string | null;
  campaign_raw: string | null;
  service_interest: string | null;
  mapped_service_id: string | null;
  case_size: string | null;
  start_timing: string | null;
  branch_id: string | null;
  gender: string | null;
  job_title: string | null;
  asked_price: boolean;
  opened_messenger: boolean;
  conversation_summary: string | null;
  lead_score: number;
  score_breakdown: Record<string, unknown>;
  classification: LeadClassification;
  qualification_status: LeadQualificationStatus;
  stage: LeadStage;
  assigned_to: string | null;
  contact_attempts: number;
  last_contact_at: string | null;
  last_call_result: string | null;
  next_follow_up_at: string | null;
  next_exam_at: string | null;
  expected_value_egp: number | null;
  loss_reason: string | null;
  loss_reason_other: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  import_batch_id: string | null;
  needs_review: boolean;
  review_notes: string | null;
}

export interface DbImportBatch {
  id: string;
  source_filename: string;
  imported_by: string | null;
  started_at: string;
  finished_at: string | null;
  total_rows: number;
  inserted_count: number;
  duplicate_count: number;
  review_count: number;
  error_count: number;
  status: "running" | "completed" | "failed";
  created_at: string;
}

export interface DbLeadStageHistory {
  id: string;
  lead_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
}

export type BookingRequestType = "appointment" | "implant_diagnosis";

export type BookingStatus =
  | "new"
  | "contacted"
  | "in_review"
  | "diagnosed"
  | "completed"
  | "cancelled";

export interface DbBookingRequest {
  id: string;
  request_type: BookingRequestType;
  name: string;
  phone: string;
  age: number | null;
  service_id: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  xray_paths: string[];
  consent_given: boolean;
  status: BookingStatus;
  diagnosis_notes: string | null;
  diagnosed_by: string | null;
  diagnosed_at: string | null;
  submitter_ip: string | null;
  created_at: string;
  updated_at: string;
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
