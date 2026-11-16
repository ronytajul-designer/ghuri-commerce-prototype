import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowSquareOut, DesktopTower, DeviceMobile, Image as ImageIcon, Lightbulb, LockSimple, Megaphone, Palette, SquaresFour } from "@phosphor-icons/react"
import { PageTuffui as Page, PageGridTuffui as PageGrid, PageHeaderTuffui as PageHeader } from "@/components/app/page-tuffui"
import { useUnsavedGuard } from "@/components/app/unsaved-guard"
import { Button as ActionButton } from "@/components/ui/action-button"
import { Switch } from "@/components/ui/choice-controls"
import { Segmented } from "@/components/ui/segmented-control"
import { Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { TextArea, TextField } from "@/components/ui/text-field"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { StoreHomeContent } from "@/pages/storefront-pages"
import { PreviewViewport } from "@/pages/theme-page"
import { useApp } from "@/store/store"
import type { ThemeSettings } from "@/store/types"

type TextKey = "announcement" | "heroTitle" | "heroSubtitle" | "heroCta"

const LIMITS: Record<TextKey, { max: number; required: boolean; name: string }> = {
  announcement: { max: 80, required: false, name: "announcement" },
  heroTitle: { max: 60, required: true, name: "banner heading" },
  heroSubtitle: { max: 140, required: false, name: "banner text" },
  heroCta: { max: 20, required: true, name: "button text" },
}

const errorFor = (k: TextKey, v: string) => {
  const l = LIMITS[k]
  if (l.required && !v.trim()) return `Enter the ${l.name}.`
  if (v.length > l.max) return `Keep it to ${l.max} characters. Remove ${v.length - l.max}.`
  return null
}

const comparable = (t: ThemeSettings) => JSON.stringify({ ...t, edited: false })

/** ShellHeader truncates subtitles; let them wrap instead (same as #home-tuffui). */
const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"

export function ThemeTuffuiPage() {
  const { state, set } = useApp()
  const [draft, setDraft] = useState<ThemeSettings>(state.theme)
  const [touched, setTouched] = useState<Partial<Record<TextKey, boolean>>>({})
  const [tried, setTried] = useState(false)
  const [device, setDevice] = useState<"phone" | "desktop">("phone")
  const dirty = comparable(draft) !== comparable(state.theme)

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])
  useUnsavedGuard(dirty)

  const errors = Object.fromEntries((Object.keys(LIMITS) as TextKey[]).map((k) => [k, errorFor(k, draft[k])])) as Record<TextKey, string | null>
  const hasErrors = Object.values(errors).some(Boolean)
  // Required-field errors wait for blur or a publish attempt; going over the limit shows at once.
  const shownError = (k: TextKey) => errors[k] && (tried || touched[k] || draft[k].length > LIMITS[k].max) ? errors[k] : null

  const publish = () => {
    setTried(true)
    if (hasErrors) { toast.error("Fix the highlighted fields to publish."); return }
    set((s) => ({ ...s, theme: { ...draft, edited: true } }))
    setDraft({ ...draft, edited: true })
    setTried(false)
    setTouched({})
    toast.success("Homepage published")
  }
  const discard = () => { setDraft(state.theme); setTried(false); setTouched({}) }

  const text = (k: TextKey, label: string, opts: { placeholder?: string; hint?: string; multiline?: boolean }) => {
    const err = shownError(k)
    const v = draft[k]
    const over = v.length > LIMITS[k].max
    const props = {
      id: `theme-${k}`,
      label: <>{label}{!LIMITS[k].required && <span className="font-normal text-muted-foreground"> (optional)</span>}</>,
      value: v,
      placeholder: opts.placeholder,
      error: err,
      description: (
        <span className="flex justify-between gap-4">
          <span>{opts.hint}</span>
          <span className={cn("shrink-0 tabular-nums", over && "text-negative")} aria-live="polite">{v.length}/{LIMITS[k].max}</span>
        </span>
      ),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [k]: e.target.value }),
      onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    }
    return opts.multiline ? <TextArea rows={3} {...props} /> : <TextField {...props} />
  }

  const viewStore = () => { window.location.hash = "store" }

  return (
    <Page className="pb-24 md:pb-8">
      <PageHeader
        title="Theme"
        description="Edit what shoppers see on your store’s homepage."
        actions={
          <div className="flex items-center gap-2">
            <ActionButton variant="quiet" size="md" icon={outline(ArrowSquareOut)} onClick={viewStore}>View store</ActionButton>
            {dirty && <ActionButton variant="secondary" size="md" className="hidden md:inline-flex" onClick={discard}>Discard</ActionButton>}
            <ActionButton variant="primary" size="md" className="hidden md:inline-flex" disabled={!dirty} onClick={publish}>Publish</ActionButton>
          </div>
        }
      />

      <PageGrid asideFirst>
        <div className="flex min-w-0 flex-col gap-6">
          <Shell>
            <ShellHeader className={WRAP} icon={outline(Palette)} title="Minimal" subtitle="More themes coming soon."
              aside={<span className="rounded-full bg-positive/15 px-2.5 py-0.5 text-xs font-medium text-positive">Live</span>} />
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(Megaphone)} title="Announcement bar" subtitle="A thin strip at the very top of every page. Leave it empty to hide it." />
            <Panel className="p-4">
              {text("announcement", "Announcement", { placeholder: "e.g. Free exchange within 3 days", hint: "Good for offers, delivery or exchange." })}
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(ImageIcon)} title="Banner" subtitle="The first thing shoppers see when they open your store." />
            <Panel className="flex flex-col gap-6 p-4">
              {text("heroTitle", "Heading", { placeholder: "e.g. Eid collection is here", hint: "Short and clear works best." })}
              {text("heroSubtitle", "Text", { placeholder: "e.g. Cash on delivery all over Bangladesh. Dhaka delivery in 1 to 2 days.", hint: "One or two sentences.", multiline: true })}
              {text("heroCta", "Button text", { placeholder: "e.g. Shop now", hint: "Takes shoppers to your products." })}
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(SquaresFour)} title={<label htmlFor="theme-collections">Show collections as tabs</label>}
              subtitle="Shoppers can tap a collection, like Eid or Sale, to filter products."
              aside={<Switch id="theme-collections" aria-label="Show collections as tabs" checked={draft.showCollections} onCheckedChange={(v) => setDraft({ ...draft, showCollections: v })} />} />
          </Shell>
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-20 xl:row-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium">Preview{dirty && <span className="hidden font-normal text-muted-foreground sm:inline"> · not published yet</span>}</h2>
            <Segmented<"phone" | "desktop">
              label="Preview size"
              value={device}
              onValueChange={setDevice}
              options={[
                { value: "phone", label: <span className="flex items-center gap-1.5"><DeviceMobile className="size-3.5" aria-hidden="true" />Phone</span> },
                { value: "desktop", label: <span className="flex items-center gap-1.5"><DesktopTower className="size-3.5" aria-hidden="true" />Desktop</span> },
              ]}
            />
          </div>
          <Shell className="overflow-hidden p-0">
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex gap-2" aria-hidden="true">
                <span className="size-2 rounded-full bg-foreground/15" />
                <span className="size-2 rounded-full bg-foreground/15" />
                <span className="size-2 rounded-full bg-foreground/15" />
              </div>
              <div className="flex h-8 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-foreground/[0.06] px-3 text-xs text-muted-foreground">
                <LockSimple className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{state.store.handle}.ghuri.store</span>
              </div>
            </div>
            <PreviewViewport width={device === "phone" ? 390 : 1280}>
              <StoreHomeContent state={state} theme={draft} preview />
            </PreviewViewport>
          </Shell>
        </div>

        <Shell className="min-w-0">
          <ShellHeader icon={outline(Lightbulb)} title="Tips" />
          <Panel className="p-4">
            <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground">
              <li>Put your offer and delivery promise in the banner, like “Eid sale 20% off. Dhaka delivery in 24 hours.”</li>
              <li>Keep the heading under 8 words so it fits on one phone screen.</li>
              <li>Use the announcement bar for your exchange policy, like “Size not right? Free exchange within 3 days.”</li>
            </ul>
          </Panel>
        </Shell>
      </PageGrid>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-surface/90 px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur md:hidden">
        <span className="flex-1 text-sm text-muted-foreground">{dirty ? "Not published yet" : "No changes"}</span>
        <ActionButton variant="secondary" size="md" disabled={!dirty} onClick={discard}>Discard</ActionButton>
        <ActionButton variant="primary" size="md" disabled={!dirty} onClick={publish}>Publish</ActionButton>
      </div>
    </Page>
  )
}
