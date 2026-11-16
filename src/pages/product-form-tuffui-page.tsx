import { useEffect, useId, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft, Archive, ArrowCounterClockwise, CheckCircle, Circle, CurrencyCircleDollar, FolderSimple, Images, ListChecks, Plus, Star, Swatches, TextAlignLeft, Truck, X,
} from "@phosphor-icons/react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { Money, parseAmount } from "@/components/app/money"
import { navigateTo, useUnsavedGuard } from "@/components/app/unsaved-guard"
import { Button as ActionButton, IconButton } from "@/components/ui/action-button"
import { Checkbox, Radio, RadioGroup, Switch } from "@/components/ui/choice-controls"
import { DropZone } from "@/components/ui/drop-zone"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { TextArea, TextField } from "@/components/ui/text-field"
import { EASE_OUT } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { slugify } from "@/lib/bd"
import { uid, useApp } from "@/store/store"
import type { Product } from "@/store/types"
import { Pill } from "@/pages/products-tuffui-page"

const SIZE_PRESETS = ["S", "M", "L", "XL", "XXL", "Free size"]
type Photo = { id: string; url: string; name: string }
type Status = "draft" | "active"

/** ShellHeader truncates subtitles; let them wrap instead (same as #home-tuffui). */
const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"

function shrink(file: File, max = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = () => resolve(URL.createObjectURL(file))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * TuffUI text control with a fixed prefix or suffix (৳, /products/, g).
 * Same look as TextField: tinted pill, no border, label, description and error wired by id.
 */
function AffixField({ label, description, error, prefix, suffix, className, inputClassName, ...props }: Omit<React.ComponentProps<"input">, "prefix"> & {
  label?: React.ReactNode; description?: React.ReactNode; error?: React.ReactNode; prefix?: string; suffix?: string; inputClassName?: string
}) {
  const id = useId()
  const inputId = props.id ?? id
  const descId = description && !error ? `${id}-d` : undefined
  const errId = error ? `${id}-e` : undefined
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={inputId} className="px-1 text-[0.8125rem] font-medium">{label}</label>}
      <div className={cn(
        "flex h-9 w-full items-center gap-1 rounded-full bg-foreground/[0.06] px-3.5 text-sm transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.08] focus-within:bg-foreground/[0.1] focus-within:ring-2 focus-within:ring-ring",
        EDGE, error && "bg-negative/10", inputClassName,
      )}>
        {prefix && <span className="shrink-0 text-muted-foreground" aria-hidden="true">{prefix}</span>}
        <input {...props} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
          className="h-full min-w-0 flex-1 !shadow-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
        {suffix && <span className="shrink-0 text-muted-foreground" aria-hidden="true">{suffix}</span>}
      </div>
      {descId && <p id={descId} className="px-1 text-xs text-muted-foreground">{description}</p>}
      {errId && <p id={errId} className="px-1 text-xs text-[oklch(0.45_0.2_27)] dark:text-[oklch(0.78_0.14_25)]">{error}</p>}
    </div>
  )
}

/** Field error text, with the page's contrast fix applied (TuffUI text-negative is under 4.5:1 in light mode). */
const ERR = "[&_[id$=-error]]:text-[oklch(0.45_0.2_27)] dark:[&_[id$=-error]]:text-[oklch(0.78_0.14_25)]"
/**
 * Page-scoped boundary fix: TuffUI fields and unchecked boxes are tint-only (about 1.1:1 against the panel).
 * A 1px inset edge at 55% foreground brings every control boundary to 3:1 in both themes.
 */
const EDGE = "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"
const EDGES = "[&_[role=switch][aria-checked=true]]:bg-[#248a3d] dark:[&_[role=switch][aria-checked=true]]:bg-[#30d158] [&_input:not([type=file])]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_textarea]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=checkbox][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=radio][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=switch][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"

export function ProductFormTuffuiPage({ id }: { id?: string }) {
  const { state, set } = useApp()
  const existing = id ? state.products.find((p) => p.id === id) : undefined
  const [photos, setPhotos] = useState<Photo[]>(() => (existing?.photos ?? []).map((url, i) => ({ id: String(i), url, name: `${existing?.title} photo ${i + 1}` })))
  const [title, setTitle] = useState(existing?.title ?? "")
  const [desc, setDesc] = useState(existing?.description ?? "")
  const [price, setPrice] = useState(existing ? String(existing.price) : "")
  const [compare, setCompare] = useState(existing?.compareAt ? String(existing.compareAt) : "")
  const [stock, setStock] = useState(existing && !existing.variants.length ? String(existing.stock) : "")
  const [hasVariants, setHasVariants] = useState(!!existing?.variants.length)
  const [sizes, setSizes] = useState<string[]>(existing?.sizes ?? [])
  const [colours, setColours] = useState<string[]>(existing?.colours ?? [])
  const [colourDraft, setColourDraft] = useState("")
  const [variantStock, setVariantStock] = useState<Record<string, string>>(() => Object.fromEntries((existing?.variants ?? []).map((v) => [v.key, String(v.stock)])))
  const [variantPrice, setVariantPrice] = useState<Record<string, string>>(() => Object.fromEntries((existing?.variants ?? []).filter((v) => v.price).map((v) => [v.key, String(v.price)])))
  const [bulkStock, setBulkStock] = useState("")
  const [status, setStatus] = useState<Status>(existing?.status === "active" ? "active" : "draft")
  const collections = state.collections
  const [picked, setPicked] = useState<string[]>(existing?.collectionIds ?? [])
  const [newCollection, setNewCollection] = useState("")
  const [weight, setWeight] = useState(String(existing?.weight ?? 500))
  const [slugEdit, setSlugEdit] = useState<string | null>(existing ? existing.slug : null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const slugSeed = useRef(Math.random().toString(36).slice(2, 7))

  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true) }
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }))
  const shown = (k: string) => submitted || !!touched[k]

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])
  useUnsavedGuard(dirty)

  const priceN = parseAmount(price)
  const compareN = parseAmount(compare)
  const stockN = parseAmount(stock)
  const errors = {
    title: !title.trim() ? "Enter a product name." : null,
    price: priceN === null ? "Enter a price." : Number.isNaN(priceN) ? "Use numbers only, for example 1200 or ১২০০." : priceN === 0 ? "Price must be more than ৳0." : null,
    compare: compareN === null ? null : Number.isNaN(compareN) ? "Use numbers only." : priceN && compareN <= priceN ? "Must be higher than the selling price to show a discount." : null,
    stock: hasVariants || stockN === null ? null : Number.isNaN(stockN) || !Number.isInteger(stockN) ? "Use a whole number, for example 10." : null,
  }
  const discount = priceN && compareN && !errors.compare ? Math.round((1 - priceN / compareN) * 100) : null

  const autoSlug = useMemo(() => slugify(title, slugSeed.current), [title])

  const variants = useMemo(() => {
    const s = sizes.length ? sizes : [undefined]
    const c = colours.length ? colours : [undefined]
    return s.flatMap((size) => c.map((colour) => { const label = [size, colour].filter(Boolean).join(" / "); return { key: label, label } })).filter((v) => v.label)
  }, [sizes, colours])
  const totalStock = hasVariants ? variants.reduce((s, v) => s + (parseAmount(variantStock[v.key] ?? "") || 0), 0) : stockN || 0

  const checklist = [
    { done: photos.length > 0, label: "At least 1 photo" },
    { done: !errors.title, label: "Product name" },
    { done: !errors.price, label: "Selling price" },
    { done: totalStock > 0, label: "Stock to sell" },
  ]
  const ready = checklist.every((c) => c.done)

  // Photos are shrunk to 800px JPEG so the prototype can keep them in browser storage.
  const addFiles = async (files: File[]) => {
    const next = await Promise.all(files.filter((f) => f.type.startsWith("image/")).map(async (f) => ({ id: uid(), url: await shrink(f), name: f.name })))
    setPhotos((p) => [...p, ...next].slice(0, 8)); setDirty(true)
  }
  const addInput = useRef<HTMLInputElement>(null)
  const addColour = () => {
    const v = colourDraft.trim()
    if (v && !colours.includes(v)) { setColours([...colours, v]); setDirty(true) }
    setColourDraft("")
  }
  const save = () => {
    setSubmitted(true)
    if (errors.title || errors.price || errors.compare || errors.stock) { toast.error("Fix the highlighted fields to save."); return }
    if (status === "active" && !ready) { toast.error("Finish the checklist to go live, or save as Draft."); return }
    const saved: Product = {
      id: existing?.id ?? uid(),
      title: title.trim(),
      slug: slugEdit ?? autoSlug,
      description: desc,
      photos: photos.map((p) => p.url),
      tint: existing?.tint ?? "oklch(0.92 0.03 60)",
      price: priceN as number,
      compareAt: compareN && !Number.isNaN(compareN) ? compareN : undefined,
      status,
      sizes: hasVariants ? sizes : [],
      colours: hasVariants ? colours : [],
      variants: hasVariants ? variants.map((v) => ({ key: v.key, label: v.label, stock: parseAmount(variantStock[v.key] ?? "") || 0, price: parseAmount(variantPrice[v.key] ?? "") || undefined })) : [],
      stock: hasVariants ? 0 : (stockN as number) || 0,
      weight: Number(weight) || 0,
      collectionIds: picked,
      sold: existing?.sold ?? 0,
    }
    set((s) => ({ ...s, products: existing ? s.products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...s.products] }))
    setDirty(false)
    toast.success(status === "active" ? "Product saved and live in your store" : "Product saved as draft")
    navigateTo("products-tuffui")
  }
  const archive = () => {
    if (!existing) return
    const next = existing.status === "archived" ? "draft" : "archived"
    set((s) => ({ ...s, products: s.products.map((p) => (p.id === existing.id ? { ...p, status: next } : p)) }))
    toast(next === "archived" ? "Product archived. It is hidden from your store." : "Product restored as draft")
    navigateTo("products-tuffui")
  }
  const reset = () => {
    if (existing) { setDirty(false); navigateTo("products-tuffui"); return }
    setPhotos([]); setTitle(""); setDesc(""); setPrice(""); setCompare(""); setStock(""); setHasVariants(false); setSizes([]); setColours([])
    setVariantStock({}); setVariantPrice({}); setPicked([]); setTouched({}); setSubmitted(false); setDirty(false); setSlugEdit(null); setStatus("draft")
  }
  const archived = existing?.status === "archived"

  return (
    <Page className="pb-24 md:pb-8">
      <div className="flex flex-col gap-2">
        <a href="#products-tuffui" className="flex w-max items-center gap-2 rounded-full px-2 py-1 text-sm text-muted-foreground outline-none hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="size-4" aria-hidden="true" />Back to products
        </a>
        <PageHeader
          title={title.trim() || (existing ? "Untitled product" : "Add product")}
          badge={archived ? <Pill tone="neutral">Archived</Pill> : <Pill tone={status === "active" ? "positive" : "neutral"}>{status === "active" ? "Active" : "Draft"}</Pill>}
          actions={
            <div className="hidden items-center gap-2 md:flex">
              {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
              {existing && <ActionButton variant="quiet" size="md" icon={outline(archived ? ArrowCounterClockwise : Archive)} onClick={archive}>{archived ? "Restore" : "Archive"}</ActionButton>}
              <ActionButton variant="secondary" size="md" disabled={!dirty} onClick={() => setConfirmDiscard(true)}>Discard</ActionButton>
              <ActionButton variant="primary" size="md" onClick={save}>Save</ActionButton>
            </div>
          }
        />
      </div>

      <PageGrid className={EDGES}>
        <PageColumn>
          <Shell>
            <ShellHeader className={WRAP} icon={outline(Images)} title="Photos" subtitle="The first photo is the cover in your store and in Facebook link previews." />
            <Panel className="p-4">
              {photos.length === 0 ? (
                <DropZone accept="image/jpeg,image/png,image/webp" maxFiles={8} onFiles={addFiles} title="Add photos"
                  hint="Choose from your phone or drop files here. JPEG, PNG or WebP, up to 8." />
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <AnimatePresence initial={false}>
                    {photos.map((p, i) => (
                      <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE_OUT } }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
                        className="relative aspect-square overflow-hidden rounded-xl bg-foreground/[0.04]">
                        <img src={p.url} alt={p.name} className="size-full object-cover" />
                        {i === 0 ? <span className="absolute bottom-2 left-2 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">Cover</span> : (
                          <IconButton size="sm" variant="secondary" className="absolute bottom-2 left-2" icon={outline(Star)} label={`Make ${p.name} the cover`}
                            onClick={() => { setPhotos((ps) => [p, ...ps.filter((x) => x.id !== p.id)]); setDirty(true) }} />
                        )}
                        <IconButton size="sm" variant="secondary" className="absolute top-2 right-2" icon={outline(X)} label={`Remove ${p.name}`}
                          onClick={() => { setPhotos((ps) => ps.filter((x) => x.id !== p.id)); setDirty(true) }} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {photos.length < 8 && (
                    <li>
                      <input ref={addInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = "" }} />
                      <button type="button" onClick={() => addInput.current?.click()}
                        className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl bg-foreground/[0.06] text-sm text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.1] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                        <Plus className="size-4" aria-hidden="true" />Add
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader icon={outline(TextAlignLeft)} title="Details" />
            <Panel className={cn("flex flex-col gap-6 p-4", ERR)}>
              <TextField id="title" label="Name" value={title} onChange={(e) => edit(setTitle)(e.target.value)} onBlur={blur("title")}
                error={shown("title") ? errors.title : undefined}
                description={autoSlug ? <>Web address: <span className="text-foreground">/products/{slugEdit ?? autoSlug}</span>{slugEdit === null && <> · <button type="button" className="underline underline-offset-4" onClick={() => setSlugEdit(autoSlug)}>Edit</button></>}</> : "Bangla or English. Example: Cotton Panjabi."} />
              {slugEdit !== null && (
                <AffixField id="slug" label="Web address" prefix="/products/" value={slugEdit} onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              )}
              <TextArea id="desc" label="Description" rows={4} value={desc} onChange={(e) => edit(setDesc)(e.target.value)}
                description="Fabric, fit, size guide and wash care. Shoppers ask these before ordering." />
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader icon={outline(CurrencyCircleDollar)} title="Pricing" />
            <Panel className="flex flex-col gap-6 p-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <AffixField id="price" label="Selling price" prefix="৳" inputMode="decimal" value={price} onChange={(e) => edit(setPrice)(e.target.value)} onBlur={blur("price")}
                  error={shown("price") ? errors.price : undefined} />
                <AffixField id="compare" label="Regular price" prefix="৳" inputMode="decimal" value={compare} onChange={(e) => edit(setCompare)(e.target.value)} onBlur={blur("compare")}
                  error={shown("compare") ? errors.compare : undefined} description="Optional. Shown crossed out." />
              </div>
              <AnimatePresence initial={false}>
                {priceN ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                    <Inset className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm" aria-live="polite">
                      <span className="text-muted-foreground">Shoppers see</span>
                      <Money value={priceN} className="font-semibold" />
                      {discount !== null && compareN && <><Money value={compareN} className="text-muted-foreground line-through" /><Pill tone="negative">{discount}% off</Pill></>}
                    </Inset>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(Swatches)} title={<label htmlFor="has-variants">Sizes and colours</label>}
              subtitle="Turn on when shoppers pick a size or colour. Each option gets its own stock."
              aside={<Switch id="has-variants" aria-label="Sizes and colours" checked={hasVariants} onCheckedChange={edit(setHasVariants)} />} />
            <Panel className={cn("p-4", ERR)}>
              {!hasVariants ? (
                <AffixField id="stock" label="Stock" className="sm:max-w-60" inputMode="numeric" value={stock} onChange={(e) => edit(setStock)(e.target.value)} onBlur={blur("stock")}
                  error={shown("stock") ? errors.stock : undefined} description="How many you can sell now." />
              ) : (
                <div className="flex flex-col gap-6">
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 px-1 text-[0.8125rem] font-medium">Sizes</legend>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((s) => {
                        const on = sizes.includes(s)
                        return (
                          <Inset key={s} className={cn("px-4 py-2 transition-colors", on && "bg-foreground/[0.1]")}>
                            <Checkbox label={s} checked={on} onCheckedChange={(v) => edit(setSizes)(v ? SIZE_PRESETS.filter((x) => x === s || sizes.includes(x)) : sizes.filter((x) => x !== s))} />
                          </Inset>
                        )
                      })}
                    </div>
                  </fieldset>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="colour" className="px-1 text-[0.8125rem] font-medium">Colours</label>
                    {colours.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {colours.map((c) => (
                          <span key={c} className="flex h-8 items-center gap-1 rounded-full bg-foreground/[0.07] pr-1 pl-3 text-sm">
                            {c}
                            <IconButton size="sm" variant="quiet" className="size-6" icon={outline(X)} label={`Remove ${c}`} onClick={() => { setColours(colours.filter((x) => x !== c)); setDirty(true) }} />
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-start gap-2 sm:max-w-sm">
                      <TextField id="colour" className="flex-1" aria-label="Colours" placeholder="e.g. Maroon" value={colourDraft} onChange={(e) => setColourDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColour() } }} />
                      <ActionButton variant="secondary" size="md" onClick={addColour}>Add</ActionButton>
                    </div>
                  </div>

                  {variants.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">{variants.length} options · {totalStock} in stock</span>
                        <div className="flex items-center gap-2">
                          <AffixField aria-label="Stock for every option" placeholder="Stock" inputMode="numeric" className="w-24" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} />
                          <ActionButton size="sm" variant="secondary" disabled={!bulkStock} onClick={() => { setVariantStock(Object.fromEntries(variants.map((v) => [v.key, bulkStock]))); setDirty(true) }}>Apply to all</ActionButton>
                        </div>
                      </div>
                      <Inset className="overflow-hidden">
                        <table className="w-full text-sm">
                          <caption className="sr-only">Options</caption>
                          <thead>
                            <tr className="text-left text-xs text-muted-foreground">
                              <th scope="col" className="px-4 py-2 font-medium">Option</th>
                              <th scope="col" className="w-32 px-2 py-2 font-medium sm:w-36">Price</th>
                              <th scope="col" className="w-20 py-2 pr-4 pl-2 font-medium sm:w-24">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((v) => (
                              <tr key={v.key} className="border-t border-foreground/[0.06]">
                                <td className="px-4 py-2 font-medium">{v.label}</td>
                                <td className="px-2 py-2"><AffixField prefix="৳" inputMode="decimal" aria-label={`Price for ${v.label}`} placeholder={priceN ? String(priceN) : "0"} inputClassName="h-8 px-3" value={variantPrice[v.key] ?? ""} onChange={(e) => { setVariantPrice({ ...variantPrice, [v.key]: e.target.value }); setDirty(true) }} /></td>
                                <td className="py-2 pr-4 pl-2"><AffixField inputMode="numeric" aria-label={`Stock for ${v.label}`} placeholder="0" inputClassName="h-8 px-3" value={variantStock[v.key] ?? ""} onChange={(e) => { setVariantStock({ ...variantStock, [v.key]: e.target.value }); setDirty(true) }} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Inset>
                      <p className="text-sm text-muted-foreground">An empty price uses the selling price.</p>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          </Shell>
        </PageColumn>

        <PageColumn>
          <Shell>
            <ShellHeader icon={outline(ListChecks)} title="Status" />
            <Panel className="flex flex-col gap-6 p-4">
              <RadioGroup label="Status" value={status} onValueChange={(v) => edit(setStatus)(v as Status)} className="flex flex-col gap-2">
                {([["draft", "Draft", "Only you can see it."], ["active", "Active", "Live in your store."]] as const).map(([v, t, d]) => (
                  <Inset key={v} className={cn("p-4 transition-colors", status === v && "bg-foreground/[0.1]")}><Radio value={v} label={t} description={d} /></Inset>
                ))}
              </RadioGroup>
              <div className={cn("flex flex-col gap-2", status === "active" && !ready && submitted && "text-[oklch(0.45_0.2_27)] dark:text-[oklch(0.78_0.14_25)]")}>
                <span className="text-sm font-medium">Ready to sell</span>
                <ul className="flex flex-col gap-2">
                  {checklist.map((c) => (
                    <li key={c.label} className={cn("flex items-center gap-2 text-sm", !c.done && "text-muted-foreground")}>
                      {c.done ? <CheckCircle className="size-4 text-success-foreground dark:text-success" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
                      {c.label}<span className="sr-only">{c.done ? ", done" : ", missing"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader icon={outline(Truck)} title="Shipping" />
            <Panel className="p-4">
              <AffixField id="weight" label="Weight with packaging" suffix="g" inputMode="numeric" value={weight} onChange={(e) => edit(setWeight)(e.target.value)} description="Couriers charge more above 1 kg." />
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(FolderSimple)} title="Collections" subtitle="Groups shoppers browse, like Eid collection." />
            <Panel className="flex flex-col gap-4 p-4">
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">Collections</legend>
                {collections.length === 0 && <p className="text-sm text-muted-foreground">No collections yet. Create one below.</p>}
                {collections.map((c) => (
                  <Checkbox key={c.id} id={`col-${c.id}`} label={c.title} checked={picked.includes(c.id)} onCheckedChange={(v) => { setPicked(v ? [...picked, c.id] : picked.filter((x) => x !== c.id)); setDirty(true) }} />
                ))}
              </fieldset>
              <form className="flex items-start gap-2" onSubmit={(e) => {
                e.preventDefault()
                const v = newCollection.trim()
                if (v && !collections.some((c) => c.title.toLowerCase() === v.toLowerCase())) {
                  const cid = uid()
                  set((s) => ({ ...s, collections: [...s.collections, { id: cid, title: v, description: "", visible: true }] }))
                  setPicked([...picked, cid]); setDirty(true)
                }
                setNewCollection("")
              }}>
                <TextField className="flex-1" aria-label="New collection name" placeholder="New collection" value={newCollection} onChange={(e) => setNewCollection(e.target.value)} />
                <ActionButton type="submit" variant="secondary" size="md">Create</ActionButton>
              </form>
            </Panel>
          </Shell>
        </PageColumn>
      </PageGrid>

      {existing && (
        <Shell className="md:hidden">
          <ShellHeader className={WRAP} icon={outline(archived ? ArrowCounterClockwise : Archive)} title={archived ? "Restore product" : "Archive product"}
            subtitle={archived ? "Bring it back as a draft. You can make it active again later." : "Hide it from your store without deleting it. Past orders keep it."} />
          <Panel className="p-4">
            <ActionButton variant="secondary" size="md" className="w-full" onClick={archive}>{archived ? "Restore" : "Archive"}</ActionButton>
          </Panel>
        </Shell>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-surface/90 px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur md:hidden">
        <span className="flex-1 text-sm text-muted-foreground">{dirty ? "Unsaved changes" : "No changes"}</span>
        <ActionButton variant="secondary" size="md" disabled={!dirty} onClick={() => setConfirmDiscard(true)}>Discard</ActionButton>
        <ActionButton variant="primary" size="md" onClick={save}>Save</ActionButton>
      </div>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{existing ? "Discard your changes?" : "Discard this product?"}</AlertDialogTitle>
            <AlertDialogDescription>{existing ? "The product stays as it was last saved." : "Your photos and details are not saved. Save as Draft to keep them."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><ActionButton variant="secondary" size="md">Keep editing</ActionButton></AlertDialogCancel>
            <AlertDialogAction asChild><ActionButton variant="primary" size="md" onClick={reset}>Discard</ActionButton></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
