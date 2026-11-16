import { useEffect, useState } from "react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import {
  ArrowSquareOut, CaretUpDown, Database, FolderSimple, Gear, House, Monitor, Moon, Package, Palette, ShoppingCart,
  SignOut, Sidebar as SidebarIcon, Sparkle, Sun, User, Users, X,
} from "@phosphor-icons/react"
import { Button as ActionButton, IconButton } from "@/components/ui/action-button"
import { Menu } from "@/components/ui/action-menu"
import { useAppTheme } from "@/components/mode-toggle"
import type { NavKey } from "@/components/app/app-shell"
import { EASE_OUT, enter, exit, spring } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useApp } from "@/store/store"

const NAV: { key: NavKey; title: string; icon: typeof House; href: string }[] = [
  { key: "home", title: "Home", icon: House, href: "#home-tuffui" },
  { key: "products", title: "Products", icon: Package, href: "#products-tuffui" },
  { key: "collections", title: "Collections", icon: FolderSimple, href: "#collections" },
  { key: "orders", title: "Orders", icon: ShoppingCart, href: "#orders-tuffui" },
  { key: "customers", title: "Customers", icon: Users, href: "#customers" },
  { key: "theme", title: "Theme", icon: Palette, href: "#theme" },
  { key: "settings", title: "Settings", icon: Gear, href: "#settings-general" },
]

const row =
  "group/nav relative flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm outline-none select-none transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:scale-100"

function useIsDesktop() {
  const q = "(min-width: 768px)"
  const [desktop, setDesktop] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return desktop
}

function SidebarBody({ active, badges, onNavigate, onClose }: {
  active: NavKey; badges?: Partial<Record<NavKey, number>>; onNavigate: () => void; onClose?: () => void
}) {
  const { state, reset } = useApp()
  const initial = (state.store.name || "G")[0].toUpperCase()
  const go = (hash: string) => { window.location.hash = hash; onNavigate() }
  return (
    <div className="flex h-full flex-col gap-4 p-2">
      <div className="flex items-center gap-2">
        <button type="button" className={cn(row, "h-12 flex-1 hover:bg-foreground/[0.06]")} aria-label={`Store: ${state.store.name}`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.625rem] bg-(image:--button) text-sm font-semibold text-(--button-foreground) shadow-(--button-shadow)">{initial}</span>
          <span className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate font-medium">{state.store.name}</span>
            <span className="truncate text-xs text-muted-foreground">Owner</span>
          </span>
          <CaretUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
        {onClose && <IconButton size="md" icon={outline(X)} label="Close menu" onClick={onClose} />}
      </div>

      <nav aria-label="Main" className="flex-1">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const isActive = active === n.key
            const count = badges?.[n.key]
            return (
              <li key={n.key}>
                <a href={n.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined}
                  className={cn(row, isActive ? "font-medium text-foreground" : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground")}>
                  {isActive && <motion.span layoutId="nav-active" transition={spring} className="absolute inset-0 rounded-xl bg-foreground/[0.08]" aria-hidden="true" />}
                  <n.icon className="relative size-5 shrink-0" aria-hidden="true" />
                  <span className="relative flex-1 truncate">{n.title}</span>
                  {count ? <span className="relative rounded-full bg-foreground/[0.08] px-2 text-xs font-medium text-foreground tabular-nums">{count}<span className="sr-only"> to confirm</span></span> : null}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-0.5">
        <a href="#store" onClick={onNavigate} className={cn(row, "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground")}>
          <ArrowSquareOut className="size-5 shrink-0" aria-hidden="true" /><span>View store</span>
        </a>
        <Menu
          side="top" align="start" className="w-60"
          trigger={
            <button type="button" className={cn(row, "h-12 hover:bg-foreground/[0.05] data-[state=open]:bg-foreground/[0.07]")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-medium">{(state.account?.name || "U")[0]}</span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-medium">{state.account?.name || "You"}</span>
                <span className="truncate text-xs text-muted-foreground tabular-nums">{state.account?.phone || state.account?.email}</span>
              </span>
              <CaretUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          }
          groups={[
            { id: "account", items: [{ id: "account", label: "Account", icon: outline(User), onSelect: () => go("settings-account") }] },
            {
              id: "data", label: "Prototype data", items: [
                { id: "sample", label: "Load sample store", icon: outline(Database), onSelect: () => { reset("sample"); go("home"); toast("Sample store loaded") } },
                { id: "empty", label: "Start a new store", icon: outline(Sparkle), onSelect: () => { reset("empty"); go("home"); toast("Started a new, empty store") } },
              ],
            },
            { id: "out", items: [{ id: "logout", label: "Log out", icon: outline(SignOut), onSelect: () => go("login") }] },
          ]}
        />
      </div>
    </div>
  )
}

function ThemeMenu() {
  const { theme, setTheme } = useAppTheme()
  return (
    <Menu
      align="end"
      trigger={<IconButton icon={outline(theme === "dark" ? Moon : theme === "system" ? Monitor : Sun)} label="Change theme" size="md" />}
      groups={[{
        items: [{
          type: "radio", id: "theme", value: theme, onValueChange: (v) => setTheme(v as typeof theme),
          options: [
            { value: "light", label: "Light", icon: outline(Sun) },
            { value: "dark", label: "Dark", icon: outline(Moon) },
            { value: "system", label: "System", icon: outline(Monitor) },
          ],
        }],
      }]}
    />
  )
}

/** TuffUI admin frame: flat surface sidebar, quiet top bar, drawer on phones. Same routes as AppShell. */
export function AppShellTuffui({ active, badges, children }: { active: NavKey; badges?: Partial<Record<NavKey, number>>; children: React.ReactNode }) {
  const { state } = useApp()
  const desktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawer])
  useEffect(() => { if (desktop) setDrawer(false) }, [desktop])

  const toggle = () => (desktop ? setCollapsed((c) => !c) : setDrawer((o) => !o))
  const sidebarOpen = desktop ? !collapsed : drawer

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-svh bg-surface text-foreground">
        <AnimatePresence initial={false}>
          {desktop && !collapsed && (
            <motion.aside key="side" aria-label="Sidebar"
              initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
              exit={{ width: 0, opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
              className="sticky top-0 h-svh shrink-0 overflow-hidden">
              <div className="h-full w-64"><SidebarBody active={active} badges={badges} onNavigate={() => {}} /></div>
            </motion.aside>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!desktop && drawer && (
            <div className="fixed inset-0 z-40">
              <motion.div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={() => setDrawer(false)}
                initial={{ opacity: 0 }} animate={{ opacity: 1, transition: enter }} exit={{ opacity: 0, transition: exit }} />
              <motion.aside role="dialog" aria-modal="true" aria-label="Menu"
                initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1, transition: { duration: 0.24, ease: EASE_OUT } }}
                exit={{ x: "-100%", opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
                className="absolute inset-y-0 left-0 w-72 max-w-[85vw] rounded-r-[1.375rem] bg-surface shadow-[0_16px_40px_-12px_rgb(0_0_0/0.4)]">
                <SidebarBody active={active} badges={badges} onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
          <div className="flex min-w-0 flex-1 flex-col bg-background md:rounded-[1.375rem]">
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-surface/85 px-4 backdrop-blur md:static md:bg-transparent md:backdrop-blur-none">
              <IconButton size="md" icon={outline(SidebarIcon)} label="Toggle sidebar" tooltip={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                tooltipSide="bottom" tooltipAlign="start" aria-expanded={sidebarOpen} onClick={toggle} />
              <span className="truncate text-sm font-medium md:hidden">{state.store.name}</span>
              <div className="ml-auto flex items-center gap-2">
                <ActionButton variant="quiet" size="md" icon={outline(ArrowSquareOut)} onClick={() => { window.location.hash = "store" }}>View store</ActionButton>
                <ThemeMenu />
              </div>
            </header>
            {children}
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
