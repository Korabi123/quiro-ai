import { ProblemDetail } from "@/components/coding-problems/detail";
import { CodingProblemHeading } from "@/components/coding-problems/heading";
import { headers } from "next/headers";
import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { formatProblemTitle } from "@/lib/utils";

const ProblemPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <CodingProblemHeading secondary breadcrumb={"Problem"} />
        <p className="text-muted-foreground">Please log in to view this page</p>
      </div>
    );
  }

  const problem = await prismadb.codingProblem.findUnique({
    where: { id },
  });

  if (!problem) {
    return (
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <CodingProblemHeading secondary breadcrumb={"Problem"} />
        <p className="text-muted-foreground">Problem not found in database</p>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
      </div>
    );
  }

  const progress = await prismadb.userProblemProgress.findUnique({
    where: {
      userId_problemId: {
        userId: session.user.id,
        problemId: id,
      },
    },
  });

  if (!progress) {
    return (
      <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
        <CodingProblemHeading secondary breadcrumb={formatProblemTitle(problem.title)} />
        <p className="text-muted-foreground">
          You haven&apos;t attempted this problem yet.
        </p>
        <ProblemDetail problemId={id} problemSlug={problem.slug} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <CodingProblemHeading
        secondary
        breadcrumb={formatProblemTitle(problem.title)}
        breadcrumbHref="/coding-problems"
      />
      <ProblemDetail problemId={id} problemSlug={problem.slug} />
    </div>
  );
};

export default ProblemPage;
