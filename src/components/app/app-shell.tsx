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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DatabaseIcon, LogOutIcon, SparkleIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/store/store"

export type NavKey = "home" | "products" | "collections" | "orders" | "customers" | "theme" | "settings"

const NAV: { key: NavKey; title: string; icon: React.ComponentType; href: string }[] = [
  { key: "home", title: "Home", icon: HomeIcon, href: "#home" },
  { key: "products", title: "Products", icon: PackageIcon, href: "#products" },
  { key: "collections", title: "Collections", icon: FolderTreeIcon, href: "#collections" },
  { key: "orders", title: "Orders", icon: ShoppingCartIcon, href: "#orders" },
  { key: "customers", title: "Customers", icon: UsersIcon, href: "#customers" },
  { key: "theme", title: "Theme", icon: PaletteIcon, href: "#theme" },
  { key: "settings", title: "Settings", icon: SettingsIcon, href: "#settings-general" },
]

/** Admin frame matching the live product: sidebar, top bar with View store + theme, scrolling content. */
export function AppShell({ active, badges, children }: { active: NavKey; badges?: Partial<Record<NavKey, number>>; children: React.ReactNode }) {
  const { state, reset } = useApp()
  const initial = (state.store.name || "G")[0].toUpperCase()
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#settings-general" aria-label={`${state.store.name}, store settings`}>
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{initial}</div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{state.store.name}</span>
                  <span className="truncate text-xs text-muted-foreground">Owner</span>
                </div>
                </a>
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
              <SidebarMenuButton asChild><a href="#store"><ExternalLinkIcon /><span>View store</span></a></SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="size-8 rounded-md"><AvatarFallback className="rounded-md">{(state.account?.name || "U")[0]}</AvatarFallback></Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-medium">{state.account?.name || "You"}</span>
                      <span className="truncate text-xs text-muted-foreground">{state.account?.phone || state.account?.email}</span>
                    </div>
                    <ChevronsUpDownIcon className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-60">
                  <DropdownMenuItem asChild><a href="#settings-account"><UserIcon />Account</a></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Prototype data</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => { reset("sample"); window.location.hash = "home"; toast("Sample store loaded") }}><DatabaseIcon />Load sample store</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { reset("empty"); window.location.hash = "home"; toast("Started a new, empty store") }}><SparkleIcon />Start a new store</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><a href="#login"><LogOutIcon />Log out</a></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <span className="truncate text-sm font-medium md:hidden">{state.store.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><a href="#store"><ExternalLinkIcon />View store</a></Button>
            <ModeToggle />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
