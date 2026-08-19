import type { ShotstackEditInput, ShotstackClip } from "@/lib/shotstack";
import { getTemplateStyle } from "@/lib/render/templates";
import { PERSONA_DEFAULTS, type PersonaType } from "@/lib/persona/defaults";

export interface BuildTimelineInput {
  personaType: PersonaType;
  aspectRatio: "16:9" | "9:16";
  templateStyleId: string | null;
  title: string;
  priceText?: string | null;
  photoUrls: string[]; // resolved public/presigned URLs, already ordered
  musicTrackUrl?: string | null;
  branding?: {
    logoUrl?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactWebsite?: string | null;
  };
}

const TITLE_CARD_LENGTH_SECONDS = 3;

/**
 * Pure, I/O-free translation from our internal project model into a
 * Shotstack edit. The only caller of lib/shotstack.ts's submitRender should
 * be fed the output of this function. Kept side-effect-free for testability.
 *
 * NOTE: image-asset position/scale and title-asset position enum values are
 * only lightly verified against Shotstack's docs; refine against the full
 * JSON schema reference during the sandbox smoke test (see plan verification
 * steps) if branding overlay placement needs adjusting.
 */
export function buildTimeline(input: BuildTimelineInput): ShotstackEditInput {
  const template = getTemplateStyle(input.templateStyleId);
  const secondsPerPhoto = PERSONA_DEFAULTS[input.personaType].secondsPerPhoto;

  const contentClips: ShotstackClip[] = [];
  let cursor = 0;

  if (input.title) {
    contentClips.push({
      asset: {
        type: "title",
        text: input.priceText ? `${input.title}\n${input.priceText}` : input.title,
        style: "minimal",
      },
      start: cursor,
      length: TITLE_CARD_LENGTH_SECONDS,
      transition: { in: "fade", out: "fade" },
    });
    cursor += TITLE_CARD_LENGTH_SECONDS;
  }

  for (const url of input.photoUrls) {
    contentClips.push({
      asset: { type: "image", src: url },
      start: cursor,
      length: secondsPerPhoto,
      effect: template.kenBurnsEffect,
      transition: template.transition,
    });
    cursor += secondsPerPhoto;
  }

  const totalLength = cursor;
  const tracks: { clips: ShotstackClip[] }[] = [];

  // Branding overlay track (rendered on top): logo + contact info, spans
  // the full video, sits above the main content track below.
  const brandingClips: ShotstackClip[] = [];
  if (input.branding?.logoUrl) {
    brandingClips.push({
      asset: { type: "image", src: input.branding.logoUrl },
      start: 0,
      length: totalLength,
      opacity: 0.9,
    });
  }
  const contactParts = [input.branding?.contactName, input.branding?.contactPhone, input.branding?.contactWebsite].filter(
    Boolean
  );
  if (contactParts.length > 0) {
    brandingClips.push({
      asset: { type: "title", text: contactParts.join("  ·  "), style: "minimal", position: "bottom" },
      start: 0,
      length: totalLength,
    });
  }
  if (brandingClips.length > 0) {
    tracks.push({ clips: brandingClips });
  }

  tracks.push({ clips: contentClips });

  return {
    aspectRatio: input.aspectRatio,
    tracks,
    soundtrack: input.musicTrackUrl ? { src: input.musicTrackUrl, volume: 0.6 } : undefined,
  };
}
