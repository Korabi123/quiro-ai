import Wrapper from "@/components/coding-problems/wrapper";

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <Wrapper slug={slug} />
    </div>
  )
}