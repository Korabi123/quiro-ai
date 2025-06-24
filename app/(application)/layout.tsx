import { AppSidebar } from "@/components/app-sidebar";
import MeetingsSearch from "@/components/search-meetings";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="w-full flex bg-white items-center py-[2px] px-4">
          <SidebarTrigger className="rounded-lg size-8" variant={"outline"} />
          <MeetingsSearch />
        </header>
        <NuqsAdapter>
          <main>
            {children}
            <Toaster />
          </main>
        </NuqsAdapter>
      </SidebarInset>
    </SidebarProvider>
  );
}
