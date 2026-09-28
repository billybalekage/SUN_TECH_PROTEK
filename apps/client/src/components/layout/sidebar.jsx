import { Link, useLocation } from "react-router-dom";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAVIGATION, NAVIGATION_LABELS_FR } from "@/config/navigation";

const Sidebar = ({ user }) => {
  const location = useLocation();
  const roleName = user?.role?.name ?? user?.roleName;

  return (
    <SidebarPrimitive className="top-16 h-[calc(100svh-4rem)]">
      <SidebarContent className="overflow-hidden">
        {NAVIGATION.map((section) => {
          const items = section.items.filter((item) =>
            item.roles.includes(roleName),
          );

          if (items.length === 0) return null;

          return (
            <SidebarGroup key={section.labelKey}>
              <SidebarGroupLabel>
                {NAVIGATION_LABELS_FR[section.labelKey] ?? section.labelKey}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path === "/projects" &&
                        location.pathname.startsWith("/projects/") &&
                        location.pathname !== "/projects/new") ||
                      location.pathname.startsWith(`${item.path}/`);
                    const label =
                      NAVIGATION_LABELS_FR[item.labelKey] ?? item.labelKey;

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          render={<Link to={item.path} />}
                          tooltip={label}
                        >
                          <Icon aria-hidden="true" />
                          <span>{label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </SidebarPrimitive>
  );
};

export default Sidebar;
