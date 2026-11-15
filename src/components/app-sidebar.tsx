import { HomeIcon, PackageIcon, ShoppingBagIcon, UsersIcon, PaletteIcon, SettingsIcon, ExternalLinkIcon } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ toConfirm }: { toConfirm: number }) {
  const items = [
    { title: "Home", icon: HomeIcon },
    { title: "Products", icon: PackageIcon },
    { title: "Orders", icon: ShoppingBagIcon, active: true, badge: toConfirm },
    { title: "Customers", icon: UsersIcon },
    { title: "Theme", icon: PaletteIcon },
    { title: "Settings", icon: SettingsIcon },
  ]
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">G</div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Tajul 1</span>
            <span className="text-xs text-muted-foreground">Owner</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.title}>
                  <SidebarMenuButton isActive={it.active} asChild>
                    <a href="#orders" aria-current={it.active ? "page" : undefined}>
                      <it.icon />
                      <span>{it.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {it.badge ? <SidebarMenuBadge aria-label={`${it.badge} orders to confirm`}>{it.badge}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#checkout"><ExternalLinkIcon /><span>View store checkout</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="px-2 text-xs text-muted-foreground">Redesign prototype. Sample data.</p>
      </SidebarFooter>
    </Sidebar>
  )
}
