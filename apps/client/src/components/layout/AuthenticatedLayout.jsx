import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Sidebar from "./sidebar";

function AuthenticatedLayout({ children, user }) {
  return (
    <SidebarProvider className="h-[calc(100svh-4rem)] !min-h-0 overflow-hidden">
      <Sidebar user={user} />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <SidebarTrigger aria-label="Ouvrir ou fermer la navigation" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AuthenticatedLayout;
