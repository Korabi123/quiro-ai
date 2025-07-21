import { AgentContent } from "@/components/agents/content";
import { AgentHeading } from "@/components/agents/heading";
import prismadb from "@/lib/prismadb";
import { notFound } from "next/navigation";

const AgentByIdPage = async ({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) => {
  const { agentId } = await params;

  const agentDB = await prismadb.agent.findUnique({
    where: {
      id: agentId,
    },
  });

  if (!agentDB) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <AgentHeading
        meetingId={agentDB.id}
        secondary
        breadcrumb={agentDB.name}
        breadcrumbHref={agentDB.id}
      />
      <AgentContent agentId={agentDB.id} />
    </div>
  );
};

export default AgentByIdPage;
