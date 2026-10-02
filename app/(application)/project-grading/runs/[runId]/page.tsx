import { RunDetail } from "@/components/project-grading/run-detail";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-6">
      <RunDetail runId={runId} />
    </div>
  );
}
