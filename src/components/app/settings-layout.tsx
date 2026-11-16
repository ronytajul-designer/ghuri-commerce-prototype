import { Page, PageHeader } from "@/components/app/page"
import { cn } from "@/lib/utils"

export const SETTINGS_NAV = [
  { key: "settings-general", label: "General" },
  { key: "settings-shipping", label: "Shipping" },
  { key: "settings-payments", label: "Payments" },
  { key: "settings-team", label: "Team" },
  { key: "settings-domains", label: "Domain" },
  { key: "settings-ai", label: "AI apps" },
  { key: "settings-account", label: "Account" },
] as const

/** Settings frame: page title, section nav (wraps on phones), then the section's cards. */
export function SettingsLayout({ active, title, description, actions, children }: {
  active: (typeof SETTINGS_NAV)[number]["key"]; title: string; description: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <Page>
      <PageHeader title="Settings" description="Your store’s details, delivery, payments and team." />
      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0 [scrollbar-width:none]">
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {SETTINGS_NAV.map((n) => (
              <li key={n.key}>
                <a href={`#${n.key}`} aria-current={active === n.key ? "page" : undefined}
                  className={cn("flex h-10 items-center rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted lg:h-8 lg:px-2",
                    active === n.key ? "bg-muted text-foreground" : "text-muted-foreground")}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
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
