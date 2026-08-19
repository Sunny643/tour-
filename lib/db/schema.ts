import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  defaultPersona: text("default_persona").notNull().default("agent"),
  brandLogoKey: text("brand_logo_key"),
  brandContactName: text("brand_contact_name"),
  brandContactPhone: text("brand_contact_phone"),
  brandContactEmail: text("brand_contact_email"),
  brandContactWebsite: text("brand_contact_website"),
  razorpayCustomerId: text("razorpay_customer_id").unique(),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  plan: text("plan").notNull().default("free"),
  rendersUsedThisPeriod: integer("renders_used_this_period").notNull().default(0),
  periodResetAt: timestamp("period_reset_at", { withTimezone: true })
    .notNull()
    .default(sql`(now() + interval '30 days')`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const musicTracks = pgTable("music_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  moodTags: text("mood_tags").array().notNull().default(sql`'{}'::text[]`),
  suggestedPersona: text("suggested_persona").notNull().default("both"),
  fileUrl: text("file_url").notNull(),
  durationSeconds: integer("duration_seconds"),
  isPlaceholder: boolean("is_placeholder").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  personaType: text("persona_type").notNull(),
  priceText: text("price_text"),
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  templateStyle: text("template_style"),
  musicTrackId: uuid("music_track_id").references(() => musicTracks.id),
  status: text("status").notNull().default("draft"),
  latestRenderJobId: uuid("latest_render_job_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_projects_user_id").on(table.userId),
}));

export const projectPhotos = pgTable("project_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  publicUrl: text("public_url"),
  orderIndex: integer("order_index").notNull(),
  width: integer("width"),
  height: integer("height"),
  fileSizeBytes: integer("file_size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("idx_project_photos_project_id").on(table.projectId),
  projectOrderUnique: uniqueIndex("project_photos_project_id_order_index_key").on(
    table.projectId,
    table.orderIndex
  ),
}));

export const renderJobs = pgTable("render_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("shotstack"),
  providerJobId: text("provider_job_id"),
  status: text("status").notNull().default("queued"),
  renderParams: jsonb("render_params").notNull(),
  outputUrl: text("output_url"),
  shareSlug: text("share_slug").unique(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("idx_render_jobs_project_id").on(table.projectId),
}));

export type AppUser = typeof appUsers.$inferSelect;
export type MusicTrack = typeof musicTracks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectPhoto = typeof projectPhotos.$inferSelect;
export type RenderJob = typeof renderJobs.$inferSelect;
