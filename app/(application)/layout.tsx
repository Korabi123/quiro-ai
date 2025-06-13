import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "20rem"
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <main className="p-2">
          <SidebarTrigger className="md:hidden block" />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
