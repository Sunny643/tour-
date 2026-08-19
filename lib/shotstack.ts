/**
 * Shotstack Edit API adapter — verified against live docs (shotstack.io/docs/api)
 * on 2026-08-19. This file is the ONLY place that knows Shotstack's actual
 * request/response shape; everything else in the app talks to the small
 * interface exported below.
 *
 * Base URLs:
 *   sandbox:    https://api.shotstack.io/edit/stage
 *   production: https://api.shotstack.io/edit/v1
 * Auth header: x-api-key: <SHOTSTACK_API_KEY>
 *
 * POST /render -> 201 { success, response: { id } }               (id = provider job id, used to poll)
 * GET  /render/{id} -> 200 { response: { status, url, ... } }      status: queued|rendering|done|failed
 *
 * Output retention: by default a render's output.destinations includes
 * { provider: "shotstack" }, which uses Shotstack's own persistent CDN
 * hosting (not the 24h-expiring raw S3 URL you'd get without a destination).
 * We rely on that default rather than re-uploading to R2 ourselves.
 */

export type ShotstackClipAsset =
  | { type: "image"; src: string }
  | { type: "title"; text: string; style?: string; color?: string; size?: string; position?: string }
  | { type: "audio"; src: string; volume?: number };

export interface ShotstackClip {
  asset: ShotstackClipAsset;
  start: number;
  length: number;
  effect?: string;
  transition?: { in?: string; out?: string };
  opacity?: number;
}

export interface ShotstackEditInput {
  aspectRatio: "16:9" | "9:16";
  tracks: { clips: ShotstackClip[] }[];
  soundtrack?: { src: string; volume?: number };
}

export interface SubmitRenderResult {
  providerId: string;
}

export interface RenderStatusResult {
  status: "queued" | "rendering" | "done" | "failed";
  outputUrl?: string;
  error?: string;
}

const SANDBOX_BASE_URL = "https://api.shotstack.io/edit/stage";
const PRODUCTION_BASE_URL = "https://api.shotstack.io/edit/v1";

function getBaseUrl(): string {
  return process.env.SHOTSTACK_ENV === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
}

function getApiKey(): string {
  const key = process.env.SHOTSTACK_API_KEY;
  if (!key) throw new Error("SHOTSTACK_API_KEY is not configured");
  return key;
}

export async function submitRender(edit: ShotstackEditInput): Promise<SubmitRenderResult> {
  const body = {
    timeline: {
      tracks: edit.tracks,
      ...(edit.soundtrack ? { soundtrack: { src: edit.soundtrack.src, effect: "fadeInFadeOut" } } : {}),
    },
    output: {
      format: "mp4",
      resolution: "hd",
      aspectRatio: edit.aspectRatio,
      destinations: [{ provider: "shotstack" }],
    },
  };

  const res = await fetch(`${getBaseUrl()}/render`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": getApiKey() },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || !json?.response?.id) {
    throw new Error(`Shotstack submitRender failed: ${res.status} ${JSON.stringify(json)}`);
  }

  return { providerId: json.response.id as string };
}

export async function getRenderStatus(providerId: string): Promise<RenderStatusResult> {
  const res = await fetch(`${getBaseUrl()}/render/${providerId}`, {
    headers: { "x-api-key": getApiKey() },
  });

  const json = await res.json();
  if (!res.ok || !json?.response?.status) {
    throw new Error(`Shotstack getRenderStatus failed: ${res.status} ${JSON.stringify(json)}`);
  }

  const status = json.response.status as RenderStatusResult["status"];
  return {
    status,
    outputUrl: status === "done" ? (json.response.url as string) : undefined,
    error: status === "failed" ? (json.response.error as string | undefined) ?? "Render failed" : undefined,
  };
}
