import { ReportsHeading } from "@/components/reports/heading";
import { authClient } from "@/lib/auth-client";
import prismadb from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { Wrapper } from "./wrapper";

const StartReportPage = async ({ params }: { params: Promise<{ reportId: string }> }) => {
  const { reportId } = await params;
  const session = await authClient.getSession();

  const reportDB = await prismadb.report.findUnique({
    where: {
      id: reportId,
      userId: session?.data?.user.id,
    },
  });

  // if (reportDB?.userId !== session?.data?.user.id) {
  //   notFound();
  // }

  if (!reportDB) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <ReportsHeading
        optionsHidden
        secondary
        breadcrumb={reportDB.name}
        breadcrumbHref={reportDB.id}
      />
      <Wrapper reportId={reportId} />
    </div>
  );
}

export default StartReportPage;
