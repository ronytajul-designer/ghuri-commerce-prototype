import {
  ChevronsUpDownIcon, ExternalLinkIcon, FolderTreeIcon, HomeIcon, PackageIcon, PaletteIcon, SettingsIcon, ShoppingCartIcon, UsersIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

export type NavKey = "home" | "products" | "collections" | "orders" | "customers" | "theme" | "settings"

const NAV: { key: NavKey; title: string; icon: React.ComponentType; href: string }[] = [
  { key: "home", title: "Home", icon: HomeIcon, href: "#orders" },
  { key: "products", title: "Products", icon: PackageIcon, href: "#product-new" },
  { key: "collections", title: "Collections", icon: FolderTreeIcon, href: "#orders" },
  { key: "orders", title: "Orders", icon: ShoppingCartIcon, href: "#orders" },
  { key: "customers", title: "Customers", icon: UsersIcon, href: "#orders" },
  { key: "theme", title: "Theme", icon: PaletteIcon, href: "#orders" },
  { key: "settings", title: "Settings", icon: SettingsIcon, href: "#orders" },
]

/** Admin frame matching the live product: sidebar, top bar with View store + theme, scrolling content. */
export function AppShell({ active, badges, children }: { active: NavKey; badges?: Partial<Record<NavKey, number>>; children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">G</div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">Tajul 1</span>
                  <span className="truncate text-xs text-muted-foreground">Owner</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((n) => (
                  <SidebarMenuItem key={n.key}>
                    <SidebarMenuButton asChild isActive={active === n.key}>
                      <a href={n.href} aria-current={active === n.key ? "page" : undefined}><n.icon /><span>{n.title}</span></a>
                    </SidebarMenuButton>
                    {badges?.[n.key] ? <SidebarMenuBadge>{badges[n.key]}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild><a href="#checkout"><ExternalLinkIcon /><span>View store</span></a></SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <Avatar className="size-8 rounded-md"><AvatarFallback className="rounded-md">T</AvatarFallback></Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">Tajul</span>
                  <span className="truncate text-xs text-muted-foreground">Prototype, sample data</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><a href="#checkout"><ExternalLinkIcon />View store</a></Button>
            <ModeToggle />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
