import Link from "next/link";
import { Show } from "@clerk/nextjs";

const FEATURES = [
  {
    title: "Upload up to 30 photos",
    body: "Drag to reorder until the tour flows the way you'd walk a buyer or guest through the property.",
  },
  {
    title: "Pick a style, get a video",
    body: "Ken Burns pans, transitions and music applied from a template — no editing timeline to learn.",
  },
  {
    title: "Your branding, every time",
    body: "Save your logo and contact details once; they're applied to every video you generate.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        For agents &amp; short-term rental hosts
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
        Turn listing photos into a branded promo video.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">
        Upload your photos, choose a style, and get a ready-to-post video for the listing or the
        booking page. Walkthrough pacing for agents, punchy amenity reels for hosts.
      </p>

      <div className="mt-8 flex gap-3">
        <Show when="signed-out">
          <Link
            href="/sign-up"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-100"
          >
            Sign in
          </Link>
        </Show>
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Go to dashboard
          </Link>
        </Show>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <h2 className="text-sm font-semibold text-neutral-900">{f.title}</h2>
            <p className="mt-1.5 text-sm text-neutral-600">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
