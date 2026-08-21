/**
 * Standalone smoke test for the Shotstack adapter.
 *
 *   node --env-file=.env.local scripts/smoke-shotstack.mjs
 *
 * Submits a minimal 3-image render against the sandbox API and polls until it
 * finishes, so you can confirm SHOTSTACK_API_KEY and the render JSON shape work
 * before wiring the full app to real photos.
 */

const BASE =
  process.env.SHOTSTACK_ENV === "production"
    ? "https://api.shotstack.io/edit/v1"
    : "https://api.shotstack.io/edit/stage";

const KEY = process.env.SHOTSTACK_API_KEY;
if (!KEY) {
  console.error("SHOTSTACK_API_KEY is not set");
  process.exit(1);
}

const SAMPLE_IMAGES = [
  "https://picsum.photos/seed/livingroom/1280/720",
  "https://picsum.photos/seed/kitchen/1280/720",
  "https://picsum.photos/seed/bedroom/1280/720",
];

const body = {
  timeline: {
    tracks: [
      {
        clips: SAMPLE_IMAGES.map((src, i) => ({
          asset: { type: "image", src },
          start: i * 3,
          length: 3,
          effect: "zoomIn",
          transition: { in: "fade", out: "fade" },
        })),
      },
    ],
  },
  output: {
    format: "mp4",
    resolution: "sd",
    aspectRatio: "16:9",
    destinations: [{ provider: "shotstack" }],
  },
};

const submit = await fetch(`${BASE}/render`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": KEY },
  body: JSON.stringify(body),
});
const submitJson = await submit.json();
if (!submit.ok || !submitJson?.response?.id) {
  console.error("Submit failed:", submit.status, JSON.stringify(submitJson, null, 2));
  process.exit(1);
}

const id = submitJson.response.id;
console.log(`Submitted render ${id} — polling…`);

for (let attempt = 0; attempt < 60; attempt++) {
  await new Promise((r) => setTimeout(r, 5000));
  const res = await fetch(`${BASE}/render/${id}`, { headers: { "x-api-key": KEY } });
  const json = await res.json();
  const status = json?.response?.status;
  console.log(`  [${attempt + 1}] ${status}`);
  if (status === "done") {
    console.log(`\nDone: ${json.response.url}`);
    process.exit(0);
  }
  if (status === "failed") {
    console.error(`\nFailed: ${json.response.error ?? "unknown error"}`);
    process.exit(1);
  }
}

console.error("Timed out waiting for render");
process.exit(1);
