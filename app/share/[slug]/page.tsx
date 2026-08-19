import { notFound } from "next/navigation";
import { getRenderJobByShareSlug } from "@/lib/db/queries/renderJobs";

// Public page — excluded from Clerk auth in middleware.ts so a share link
// works for anyone who receives it.
export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const renderJob = await getRenderJobByShareSlug(slug);

  if (!renderJob || renderJob.status !== "done" || !renderJob.outputUrl) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <video
        controls
        autoPlay
        src={renderJob.outputUrl}
        className="w-full rounded-lg border border-neutral-200 bg-black"
      />
      <div className="mt-4 flex justify-between text-sm">
        <a href={renderJob.outputUrl} download className="font-medium hover:underline">
          Download MP4
        </a>
        <span className="text-neutral-500">Made with Listing Reel</span>
      </div>
    </main>
  );
}
