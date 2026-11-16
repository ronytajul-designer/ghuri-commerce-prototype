import { PageTuffui, PageHeaderTuffui } from "@/components/app/page-tuffui"
import { SegmentedNavTuffui } from "@/components/app/tabs-tuffui"

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
 * TuffUI settings frame: page title, then the section nav as the shared TuffUI segmented track (links, aria-current), so title, tabs and cards share one left edge (no second aside width). Links are plain hashes, so
 * the unsaved-changes guard in App.tsx still intercepts them.
 */
export function SettingsLayoutTuffui({ active, title, description, actions, children }: {
  active: SettingsTuffuiKey; title: string; description: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <PageTuffui>
      <PageHeaderTuffui title="Settings" description="Your store’s details, delivery, payments and team." />
      <SegmentedNavTuffui label="Settings sections" active={active} items={SETTINGS_NAV_TUFFUI.map((n) => ({ key: n.key, href: `#${n.key}`, label: n.label }))} />
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {actions}
          </div>
          {children}
        </div>
    </PageTuffui>
  )
}
