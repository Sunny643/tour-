import { z } from "zod";

export const personaTypeSchema = z.enum(["agent", "host"]);
export const aspectRatioSchema = z.enum(["16:9", "9:16"]);

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  personaType: personaTypeSchema,
  priceText: z.string().max(100).optional().nullable(),
  aspectRatio: aspectRatioSchema.optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  priceText: z.string().max(100).optional().nullable(),
  aspectRatio: aspectRatioSchema.optional(),
  templateStyle: z.string().max(100).optional().nullable(),
  musicTrackId: z.string().uuid().optional().nullable(),
});

export const presignUploadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("photo"),
    projectId: z.string().uuid(),
    filename: z.string().min(1),
    contentType: z.string().min(1),
  }),
  z.object({
    kind: z.literal("logo"),
    filename: z.string().min(1),
    contentType: z.string().min(1),
  }),
]);

export const registerPhotoSchema = z.object({
  storageKey: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
});

export const reorderPhotosSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), orderIndex: z.number().int().min(0) })).min(1),
});

export const updateBrandingSchema = z.object({
  brandLogoKey: z.string().nullable().optional(),
  brandContactName: z.string().max(200).nullable().optional(),
  brandContactPhone: z.string().max(50).nullable().optional(),
  brandContactEmail: z.string().email().max(200).nullable().optional(),
  brandContactWebsite: z.string().max(200).nullable().optional(),
  defaultPersona: personaTypeSchema.optional(),
});
