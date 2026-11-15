import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { ExternalLinkIcon, LockIcon, MonitorIcon, SmartphoneIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Page, PageHeader } from "@/components/app/page"
import { StoreHomeContent } from "@/pages/storefront-pages"
import { useApp } from "@/store/store"
import type { ThemeSettings } from "@/store/types"
import { cn } from "@/lib/utils"

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

export function ThemePage() {
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
    const id = `theme-${k}`
    const props = {
      id,
      value: v,
      placeholder: opts.placeholder,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": `${id}-desc`,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [k]: e.target.value }),
      onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    }
    return (
      <Field data-invalid={err ? true : undefined}>
        <FieldLabel htmlFor={id}>{label}{!LIMITS[k].required && <span className="font-normal text-muted-foreground">(optional)</span>}</FieldLabel>
        {opts.multiline ? <Textarea rows={3} {...props} /> : <Input {...props} />}
        <FieldDescription id={`${id}-desc`} className="flex justify-between gap-4">
          <span>{opts.hint}</span>
          <span className={cn("shrink-0 tabular-nums", v.length > LIMITS[k].max && "text-destructive")} aria-live="polite">{v.length}/{LIMITS[k].max}</span>
        </FieldDescription>
        {err && <FieldError>{err}</FieldError>}
      </Field>
    )
  }

  return (
    <Page className="pb-24 md:pb-8">
      <PageHeader
        title="Theme"
        description="Edit what shoppers see on your store’s homepage."
        actions={
          <>
            <Button variant="outline" asChild><a href="#store"><ExternalLinkIcon />View store</a></Button>
            {dirty && <Button variant="outline" className="hidden md:inline-flex" onClick={discard}>Discard</Button>}
            <Button className="hidden md:inline-flex" disabled={!dirty} onClick={publish}>Publish</Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>More themes coming soon.</CardDescription>
              <CardAction className="flex items-center gap-2 text-sm font-medium">Minimal <Badge variant="success">Live</Badge></CardAction>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcement bar</CardTitle>
              <CardDescription>A thin strip at the very top of every page. Leave it empty to hide it.</CardDescription>
            </CardHeader>
            <CardContent>
              {text("announcement", "Announcement", { placeholder: "e.g. Free exchange within 3 days", hint: "Good for offers, delivery or exchange." })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banner</CardTitle>
              <CardDescription>The first thing shoppers see when they open your store.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {text("heroTitle", "Heading", { placeholder: "e.g. Eid collection is here", hint: "Short and clear works best." })}
                {text("heroSubtitle", "Text", { placeholder: "e.g. Cash on delivery all over Bangladesh. Dhaka delivery in 1 to 2 days.", hint: "One or two sentences.", multiline: true })}
                {text("heroCta", "Button text", { placeholder: "e.g. Shop now", hint: "Takes shoppers to your products." })}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="theme-collections">Show collections as tabs</FieldLabel>
                  <FieldDescription>Shoppers can tap a collection, like Eid or Sale, to filter products.</FieldDescription>
                </FieldContent>
                <Switch id="theme-collections" checked={draft.showCollections} onCheckedChange={(v) => setDraft({ ...draft, showCollections: v })} />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-20 xl:row-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium">Preview{dirty && <span className="hidden font-normal text-muted-foreground sm:inline"> · not published yet</span>}</h2>
            <ToggleGroup type="single" size="sm" variant="outline" value={device} onValueChange={(v) => v && setDevice(v as "phone" | "desktop")} aria-label="Preview size">
              <ToggleGroupItem value="phone" className="px-4"><SmartphoneIcon />Phone</ToggleGroupItem>
              <ToggleGroupItem value="desktop" className="px-4"><MonitorIcon />Desktop</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2">
              <div className="flex gap-2" aria-hidden="true">
                <span className="size-2 rounded-full bg-foreground/15" />
                <span className="size-2 rounded-full bg-foreground/15" />
                <span className="size-2 rounded-full bg-foreground/15" />
              </div>
              <div className="flex h-8 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-background px-2 text-xs text-muted-foreground">
                <LockIcon className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{state.store.handle}.ghuri.store</span>
              </div>
            </div>
            <PreviewViewport width={device === "phone" ? 390 : 1280}>
              <StoreHomeContent state={state} theme={draft} preview />
            </PreviewViewport>
          </div>
        </div>

        <Card className="min-w-0">
          <CardHeader><CardTitle>Tips</CardTitle></CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-muted-foreground">
              <li>Put your offer and delivery promise in the banner, like “Eid sale 20% off. Dhaka delivery in 24 hours.”</li>
              <li>Keep the heading under 8 words so it fits on one phone screen.</li>
              <li>Use the announcement bar for your exchange policy, like “Size not right? Free exchange within 3 days.”</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t bg-background px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
        <span className="flex-1 text-sm text-muted-foreground">{dirty ? "Not published yet" : "No changes"}</span>
        <Button variant="outline" disabled={!dirty} onClick={discard}>Discard</Button>
        <Button disabled={!dirty} onClick={publish}>Publish</Button>
      </div>
    </Page>
  )
}

const FRAME_HEIGHT = 640

/**
 * Renders children inside an iframe at a fixed virtual width (390 phone, 1280 desktop) and scales it to fit,
 * so the store's own breakpoints behave as they would on that device. Styles and dark mode are copied from the admin.
 */
function PreviewViewport({ width, children }: { width: number; children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [avail, setAvail] = useState(0)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width))
    ro.observe(el)
    setAvail(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    let observers: MutationObserver[] = []
    const setup = () => {
      const doc = frame.contentDocument
      if (!doc?.body) return
      const syncStyles = () => {
        doc.head.querySelectorAll("[data-preview-style]").forEach((n) => n.remove())
        document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => {
          const c = n.cloneNode(true) as HTMLElement
          c.setAttribute("data-preview-style", "")
          doc.head.appendChild(c)
        })
      }
      const syncRoot = () => {
        doc.documentElement.className = document.documentElement.className
        doc.documentElement.style.cssText = document.documentElement.style.cssText
      }
      syncStyles()
      syncRoot()
      const headObs = new MutationObserver(syncStyles)
      headObs.observe(document.head, { childList: true, subtree: true, characterData: true })
      const rootObs = new MutationObserver(syncRoot)
      rootObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
      observers = [headObs, rootObs]
      doc.body.className = "bg-background text-foreground"
      setMount(doc.body)
    }
    if (frame.contentDocument?.readyState === "complete" && frame.contentDocument.body) setup()
    frame.addEventListener("load", setup)
    return () => { frame.removeEventListener("load", setup); observers.forEach((o) => o.disconnect()) }
  }, [])

  const scale = avail ? Math.min(1, avail / width) : 1
  return (
    <div ref={wrapRef} className="bg-muted/30" style={{ height: FRAME_HEIGHT }}>
      <div className="mx-auto overflow-hidden" style={{ width: width * scale, height: FRAME_HEIGHT }}>
        <iframe
          ref={frameRef}
          title="Store homepage preview"
          srcDoc="<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'></head><body></body></html>"
          className="block origin-top-left border-0 bg-background"
          style={{ width, height: FRAME_HEIGHT / scale, transform: `scale(${scale})` }}
        />
      </div>
      {mount && createPortal(
        // Preview only: links and buttons inside do nothing, so shoppers' links never leave the editor.
        <div onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault() }}>{children}</div>,
        mount,
      )}
    </div>
  )
}
