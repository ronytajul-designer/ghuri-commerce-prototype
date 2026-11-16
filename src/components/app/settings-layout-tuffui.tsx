import { Page, PageHeader } from "@/components/app/page"
import { cn } from "@/lib/utils"

export const SETTINGS_NAV_TUFFUI = [
  { key: "settings-tuffui-general", label: "General" },
  { key: "settings-tuffui-shipping", label: "Shipping" },
  { key: "settings-tuffui-payments", label: "Payments" },
  { key: "settings-tuffui-team", label: "Team" },
  { key: "settings-tuffui-domains", label: "Domain" },
  { key: "settings-tuffui-ai", label: "AI apps" },
  { key: "settings-tuffui-account", label: "Account" },
] as const

export type SettingsTuffuiKey = (typeof SETTINGS_NAV_TUFFUI)[number]["key"]

/**
 * TuffUI settings frame: page title, then a section nav that is a wrapping row of
 * tinted pills on phones and a vertical list on desktop. Links are plain hashes, so
 * the unsaved-changes guard in App.tsx still intercepts them.
 */
export function SettingsLayoutTuffui({ active, title, description, actions, children }: {
  active: SettingsTuffuiKey; title: string; description: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <Page>
      <PageHeader title="Settings" description="Your store’s details, delivery, payments and team." />
      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="rounded-[1.375rem] bg-surface p-1.5 lg:sticky lg:top-6">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {SETTINGS_NAV_TUFFUI.map((n) => {
              const on = active === n.key
              return (
                <li key={n.key}>
                  <a href={`#${n.key}`} aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap outline-none transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring lg:rounded-xl",
                      on ? "bg-surface-inset text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
                    )}>
                    {n.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4 px-1">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {actions}
          </div>
          {children}
        </div>
      </div>
    </Page>
  )
}
