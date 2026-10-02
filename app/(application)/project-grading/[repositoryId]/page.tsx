import { RepositoryDetail } from "@/components/project-grading/repository-detail";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-6">
      <RepositoryDetail repositoryId={repositoryId} />
    </div>
  );
}
