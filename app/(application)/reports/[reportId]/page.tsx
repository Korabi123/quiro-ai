import { ReportContent } from "@/components/reports/content";
import { ReportsHeading } from "@/components/reports/heading";
import prismadb from "@/lib/prismadb";
import { notFound } from "next/navigation";

import { headers } from "next/headers";
import { auth } from "@/auth";

const ReportPage = async ({ params }: { params: Promise<{ reportId: string }> }) => {
  const { reportId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const reportDB = await prismadb.report.findUnique({
    where: {
      id: reportId,
    },
  });

  if (!reportDB) {
    notFound();
  }

  if (reportDB.userId !== session?.user.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <ReportsHeading
        reportId={reportDB.id}
        secondary
        breadcrumb={reportDB.name}
        breadcrumbHref={reportDB.id}
      />
      <ReportContent reportId={reportDB.id} />
    </div>
  );
}

export default ReportPage;
