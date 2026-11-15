import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeftIcon, CheckCircle2Icon, ChevronDownIcon, CircleIcon, ImagePlusIcon, PlusIcon, StarIcon, XIcon,
} from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { taka } from "@/data/orders"

const BN: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" }
const toNum = (raw: string) => {
  const s = raw.replace(/[০-৯]/g, (c) => BN[c]).replace(/[,\s৳]/g, "")
  if (s === "") return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : NaN
}
const SIZE_PRESETS = ["S", "M", "L", "XL", "XXL", "Free size"]
const COLLECTIONS_START = ["Eid collection", "New arrivals", "Panjabi", "Three-piece"]

type Photo = { id: string; url: string; name: string }
type VariantRow = { key: string; size?: string; colour?: string; price: string; stock: string }

export function ProductFormPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [price, setPrice] = useState("")
  const [compare, setCompare] = useState("")
  const [stock, setStock] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [sizes, setSizes] = useState<string[]>([])
  const [colours, setColours] = useState<string[]>([])
  const [colourDraft, setColourDraft] = useState("")
  const [bulkStock, setBulkStock] = useState("")
  const [rows, setRows] = useState<Record<string, VariantRow>>({})
  const [status, setStatus] = useState<"draft" | "active">("draft")
  const [collections, setCollections] = useState<string[]>(COLLECTIONS_START)
  const [picked, setPicked] = useState<string[]>([])
  const [newCollection, setNewCollection] = useState("")
  const [weight, setWeight] = useState("500")
  const [sku, setSku] = useState("")
  const [slugEdit, setSlugEdit] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const slugSeed = useRef(Math.random().toString(36).slice(2, 7))

  const mark = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setDirty(true) }
  const touch = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }))
  const show = (k: string) => submitted || touched[k]

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  // Validation
  const priceN = toNum(price)
  const compareN = toNum(compare)
  const stockN = toNum(stock)
  const errors = {
    title: !title.trim() ? "Enter a product name." : null,
    price: priceN === null ? "Enter a price." : Number.isNaN(priceN) ? "Use numbers only, for example 1200 or ১২০০." : priceN === 0 ? "Price must be more than ৳0." : null,
    compare: compareN === null ? null : Number.isNaN(compareN) ? "Use numbers only." : priceN && compareN <= priceN ? `Must be higher than the price (${taka(priceN)}) to show a discount.` : null,
    stock: hasVariants || stockN === null ? null : Number.isNaN(stockN) || !Number.isInteger(stockN) ? "Use a whole number, for example 10." : null,
  }
  const discount = priceN && compareN && !errors.compare ? Math.round((1 - priceN / compareN) * 100) : null

  // Web address
  const autoSlug = useMemo(() => {
    const latin = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
    return latin || (title.trim() ? `product-${slugSeed.current}` : "")
  }, [title])
  const slug = slugEdit ?? autoSlug

  // Variants
  const combos = useMemo(() => {
    const s = sizes.length ? sizes : [undefined]
    const c = colours.length ? colours : [undefined]
    return s.flatMap((size) => c.map((colour) => ({ size, colour, key: `${size ?? ""}|${colour ?? ""}` }))).filter((x) => x.size || x.colour)
  }, [sizes, colours])
  const rowFor = (k: string, size?: string, colour?: string): VariantRow => rows[k] ?? { key: k, size, colour, price: "", stock: "" }
  const setRow = (k: string, patch: Partial<VariantRow>) => { setRows((r) => ({ ...r, [k]: { ...rowFor(k), ...r[k], ...patch } })); setDirty(true) }
  const totalStock = hasVariants
    ? combos.reduce((s, c) => s + (toNum(rowFor(c.key).stock) || 0), 0)
    : stockN || 0

  // Ready to sell
  const ready = [
    { ok: photos.length > 0, text: "At least 1 photo" },
    { ok: !errors.title, text: "Product name" },
    { ok: !errors.price, text: "Price" },
    { ok: totalStock > 0, text: hasVariants ? "Stock for at least one size or colour" : "Stock quantity" },
  ]
  const canActivate = ready.every((r) => r.ok)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).filter((f) => f.type.startsWith("image/")).map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), name: f.name }))
    setPhotos((p) => [...p, ...next].slice(0, 8))
    setDirty(true)
  }
  const addColour = () => {
    const v = colourDraft.trim()
    if (v && !colours.includes(v)) { setColours([...colours, v]); setDirty(true) }
    setColourDraft("")
  }
  const save = () => {
    setSubmitted(true)
    const blocking = errors.title || errors.price || errors.compare || errors.stock
    if (blocking) { toast.error("Fix the highlighted fields to save."); return }
    if (status === "active" && !canActivate) { toast.error("Finish the Ready to sell list, or save as Draft."); return }
    setDirty(false)
    toast.success(status === "active" ? "Product saved and live in your store" : "Product saved as draft")
  }
  const leave = () => { if (dirty) setConfirmLeave(true); else toast("Back to Products (prototype)") }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
        <Button variant="ghost" size="sm" onClick={leave} aria-label="Back to Products"><ArrowLeftIcon /><span className="hidden sm:inline">Products</span></Button>
        <h1 className="truncate text-base font-semibold">{title.trim() || "Add product"}</h1>
        <div className="ml-auto flex items-center gap-2">
          {dirty && <span className="hidden text-sm text-muted-foreground md:inline">Unsaved changes</span>}
          <Button variant="outline" size="sm" className="hidden md:inline-flex" disabled={!dirty} onClick={leave}>Discard</Button>
          <Button size="sm" className="hidden md:inline-flex" onClick={save}>Save</Button>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-4 p-4 pb-28 lg:grid-cols-[1fr_320px] lg:p-6 md:pb-6">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Photos first */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Add photos now. The first photo is the cover in your store and on Facebook shares.</CardDescription>
            </CardHeader>
            <CardContent>
              <input ref={fileRef} id="photos" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = "" }} />
              {photos.length === 0 ? (
                <label
                  htmlFor="photos"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
                  className={cn("flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:bg-muted/50", show("photos") && submitted && status === "active" && "border-destructive")}
                >
                  <ImagePlusIcon className="size-8 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">Add photos</span>
                  <span className="text-sm text-muted-foreground">Tap to choose from your phone, or drop files here. Up to 8.</span>
                </label>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((p, i) => (
                    <li key={p.id} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
                      <img src={p.url} alt={p.name} className="size-full object-cover" />
                      {i === 0 ? (
                        <Badge className="absolute bottom-1 left-1">Cover</Badge>
                      ) : (
                        <Button size="icon" variant="secondary" className="absolute bottom-1 left-1 size-7" aria-label={`Make ${p.name} the cover`}
                          onClick={() => { setPhotos((ps) => [p, ...ps.filter((x) => x.id !== p.id)]); setDirty(true) }}><StarIcon /></Button>
                      )}
                      <Button size="icon" variant="secondary" className="absolute top-1 right-1 size-7" aria-label={`Remove ${p.name}`}
                        onClick={() => { setPhotos((ps) => ps.filter((x) => x.id !== p.id)); setDirty(true) }}><XIcon /></Button>
                    </li>
                  ))}
                  {photos.length < 8 && (
                    <li>
                      <label htmlFor="photos" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-sm text-muted-foreground hover:bg-muted/50">
                        <PlusIcon className="size-5" aria-hidden="true" /> Add
                      </label>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Basics */}
          <Card>
            <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={(show("title") && !!errors.title) || undefined}>
                  <FieldLabel htmlFor="title">Product name <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                  <Input id="title" value={title} onChange={(e) => mark(setTitle)(e.target.value)} onBlur={touch("title")}
                    aria-invalid={(show("title") && !!errors.title) || undefined} className="h-10 text-base md:text-sm" />
                  {show("title") && errors.title ? <FieldError>{errors.title}</FieldError> : <FieldDescription>Bangla or English. Example: Cotton Panjabi, Eid 2026.</FieldDescription>}
                </Field>
                {slug && (
                  <div className="-mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                    <span>Web address:</span>
                    {slugEdit === null ? (
                      <>
                        <span className="break-all text-foreground">tajul-1.ghuri.store/products/{slug}</span>
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setSlugEdit(autoSlug)}>Edit</Button>
                      </>
                    ) : (
                      <InputGroup className="mt-1 h-9 max-w-md">
                        <InputGroupAddon><InputGroupText>/products/</InputGroupText></InputGroupAddon>
                        <InputGroupInput aria-label="Web address" value={slugEdit} onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
                      </InputGroup>
                    )}
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="desc">Description</FieldLabel>
                  <Textarea id="desc" rows={4} value={desc} onChange={(e) => mark(setDesc)(e.target.value)} className="text-base md:text-sm" />
                  <FieldDescription>Fabric, fit, size guide, wash care. Shoppers ask these before ordering.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle>Price</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={(show("price") && !!errors.price) || undefined}>
                    <FieldLabel htmlFor="price">Selling price <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                    <InputGroup className="h-10">
                      <InputGroupAddon><InputGroupText>৳</InputGroupText></InputGroupAddon>
                      <InputGroupInput id="price" inputMode="decimal" value={price} onChange={(e) => mark(setPrice)(e.target.value)} onBlur={touch("price")}
                        aria-invalid={(show("price") && !!errors.price) || undefined} className="text-base md:text-sm" />
                    </InputGroup>
                    {show("price") && errors.price && <FieldError>{errors.price}</FieldError>}
                  </Field>
                  <Field data-invalid={(show("compare") && !!errors.compare) || undefined}>
                    <FieldLabel htmlFor="compare">Regular price <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                    <InputGroup className="h-10">
                      <InputGroupAddon><InputGroupText>৳</InputGroupText></InputGroupAddon>
                      <InputGroupInput id="compare" inputMode="decimal" value={compare} onChange={(e) => mark(setCompare)(e.target.value)} onBlur={touch("compare")}
                        aria-invalid={(show("compare") && !!errors.compare) || undefined} className="text-base md:text-sm" />
                    </InputGroup>
                    {show("compare") && errors.compare ? <FieldError>{errors.compare}</FieldError> : <FieldDescription>The price before discount. Shown crossed out.</FieldDescription>}
                  </Field>
                </div>
                {priceN ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3" aria-live="polite">
                    <span className="text-sm text-muted-foreground">Shoppers see:</span>
                    <span className="text-lg font-semibold tabular-nums">{taka(priceN)}</span>
                    {discount !== null && compareN && (
                      <>
                        <span className="text-muted-foreground tabular-nums line-through">{taka(compareN)}</span>
                        <Badge variant="destructive">{discount}% off</Badge>
                      </>
                    )}
                  </div>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <CardTitle><label htmlFor="has-variants">Sizes or colours</label></CardTitle>
                  <CardDescription>Turn on if shoppers pick a size or colour.</CardDescription>
                </div>
                <Switch id="has-variants" checked={hasVariants} onCheckedChange={mark(setHasVariants)} />
              </div>
            </CardHeader>
            <CardContent>
              {!hasVariants ? (
                <Field data-invalid={(show("stock") && !!errors.stock) || undefined} className="max-w-xs">
                  <FieldLabel htmlFor="stock">Stock quantity</FieldLabel>
                  <Input id="stock" inputMode="numeric" value={stock} onChange={(e) => mark(setStock)(e.target.value)} onBlur={touch("stock")}
                    aria-invalid={(show("stock") && !!errors.stock) || undefined} className="h-10 text-base md:text-sm" />
                  {show("stock") && errors.stock ? <FieldError>{errors.stock}</FieldError> : <FieldDescription>How many you have to sell now.</FieldDescription>}
                </Field>
              ) : (
                <FieldGroup>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 text-sm font-medium">Sizes</legend>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((s) => {
                        const on = sizes.includes(s)
                        return (
                          <Button key={s} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} className="min-w-11"
                            onClick={() => { setSizes(on ? sizes.filter((x) => x !== s) : [...sizes, s]); setDirty(true) }}>{s}</Button>
                        )
                      })}
                    </div>
                  </fieldset>
                  <Field>
                    <FieldLabel htmlFor="colour">Colours</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {colours.map((c) => (
                        <Badge key={c} variant="secondary" className="h-8 gap-1 pr-1 text-sm">
                          {c}
                          <Button size="icon" variant="ghost" className="size-6" aria-label={`Remove ${c}`} onClick={() => { setColours(colours.filter((x) => x !== c)); setDirty(true) }}><XIcon /></Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex max-w-sm gap-2">
                      <Input id="colour" placeholder="Type a colour, e.g. Maroon" value={colourDraft} onChange={(e) => setColourDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColour() } }} className="h-10 text-base md:text-sm" />
                      <Button type="button" variant="outline" className="h-10" onClick={addColour}>Add</Button>
                    </div>
                  </Field>

                  {combos.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{combos.length} option{combos.length > 1 && "s"} · {totalStock} in stock</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={!price} onClick={() => combos.forEach((c) => setRow(c.key, { size: c.size, colour: c.colour, price }))}>Same price for all</Button>
                          <Input aria-label="Stock for every option" placeholder="Stock" inputMode="numeric" className="h-8 w-20" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} />
                          <Button size="sm" variant="outline" disabled={!bulkStock} onClick={() => combos.forEach((c) => setRow(c.key, { size: c.size, colour: c.colour, stock: bulkStock }))}>
                            Apply to all
                          </Button>
                        </div>
                      </div>
                      <ul className="divide-y rounded-lg border">
                        {combos.map((c) => {
                          const r = rowFor(c.key, c.size, c.colour)
                          const label = [c.size, c.colour].filter(Boolean).join(" / ")
                          return (
                            <li key={c.key} className="grid grid-cols-[1fr_96px_80px] items-center gap-2 p-2 sm:grid-cols-[1fr_140px_100px]">
                              <span className="truncate text-sm font-medium">{label}</span>
                              <InputGroup className="h-9">
                                <InputGroupAddon><InputGroupText>৳</InputGroupText></InputGroupAddon>
                                <InputGroupInput aria-label={`Price for ${label}`} inputMode="decimal" placeholder={priceN ? String(priceN) : "0"} value={r.price}
                                  onChange={(e) => setRow(c.key, { size: c.size, colour: c.colour, price: e.target.value })} />
                              </InputGroup>
                              <Input aria-label={`Stock for ${label}`} inputMode="numeric" placeholder="Stock" className="h-9" value={r.stock}
                                onChange={(e) => setRow(c.key, { size: c.size, colour: c.colour, stock: e.target.value })} />
                            </li>
                          )
                        })}
                      </ul>
                      <p className="text-sm text-muted-foreground">Empty price uses the selling price ({price ? taka(toNum(price) || 0) : "not set"}).</p>
                    </div>
                  )}
                </FieldGroup>
              )}
            </CardContent>
          </Card>

          {/* Advanced */}
          <Collapsible>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="-mx-2 justify-between px-2 [&[data-state=open]>svg]:rotate-180">
                    <span className="font-semibold">Delivery weight, SKU and more</span>
                    <ChevronDownIcon className="transition-transform" />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <FieldGroup className="sm:grid sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="weight">Weight with packaging</FieldLabel>
                      <InputGroup className="h-10">
                        <InputGroupInput id="weight" inputMode="numeric" value={weight} onChange={(e) => mark(setWeight)(e.target.value)} />
                        <InputGroupAddon align="inline-end"><InputGroupText>grams</InputGroupText></InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>Couriers charge more above 1 kg.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sku">SKU <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                      <Input id="sku" value={sku} onChange={(e) => mark(setSku)(e.target.value)} className="h-10" />
                      <FieldDescription>Your own code to find it in stock.</FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Side column */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <RadioGroup value={status} onValueChange={(v) => mark(setStatus)(v as "draft" | "active")} className="gap-2">
                {([
                  { v: "draft", t: "Draft", d: "Only you can see it." },
                  { v: "active", t: "Active", d: "Live in your store." },
                ] as const).map((o) => (
                  <FieldLabel key={o.v} htmlFor={`st-${o.v}`} className="cursor-pointer rounded-lg border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/60">
                    <Field orientation="horizontal" className="items-start">
                      <RadioGroupItem id={`st-${o.v}`} value={o.v} className="mt-0.5" />
                      <span className="flex flex-col gap-0.5"><span className="font-medium">{o.t}</span><span className="text-sm font-normal text-muted-foreground">{o.d}</span></span>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              <div className={cn("flex flex-col gap-2 rounded-lg border p-3", status === "active" && !canActivate && submitted && "border-destructive")}>
                <span className="text-sm font-medium">Ready to sell</span>
                <ul className="flex flex-col gap-1.5">
                  {ready.map((r) => (
                    <li key={r.text} className={cn("flex items-center gap-2 text-sm", r.ok ? "text-foreground" : "text-muted-foreground")}>
                      {r.ok ? <CheckCircle2Icon className="size-4 text-success" aria-hidden="true" /> : <CircleIcon className="size-4" aria-hidden="true" />}
                      {r.text}<span className="sr-only">{r.ok ? ": done" : ": missing"}</span>
                    </li>
                  ))}
                </ul>
                {status === "active" && !canActivate && <p className="text-sm text-muted-foreground">Finish this list to go live, or save as Draft for now.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
              <CardDescription>Groups shoppers browse, like “Eid collection”.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {collections.map((c) => (
                  <li key={c}>
                    <Field orientation="horizontal">
                      <Checkbox id={`col-${c}`} checked={picked.includes(c)} onCheckedChange={(v) => { setPicked(v ? [...picked, c] : picked.filter((x) => x !== c)); setDirty(true) }} />
                      <FieldLabel htmlFor={`col-${c}`} className="font-normal">{c}</FieldLabel>
                    </Field>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input aria-label="New collection name" placeholder="New collection" value={newCollection} onChange={(e) => setNewCollection(e.target.value)} className="h-9"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLButtonElement)?.click() } }} />
                <Button variant="outline" size="sm" className="h-9" onClick={() => {
                  const v = newCollection.trim()
                  if (v && !collections.includes(v)) { setCollections([...collections, v]); setPicked([...picked, v]); setDirty(true) }
                  setNewCollection("")
                }}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Mobile save bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-2 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <span className="flex-1 text-sm text-muted-foreground">{dirty ? "Unsaved changes" : "No changes"}</span>
        <Button variant="outline" size="lg" disabled={!dirty} onClick={leave}>Discard</Button>
        <Button size="lg" onClick={save}>Save</Button>
      </div>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this product?</AlertDialogTitle>
            <AlertDialogDescription>Your photos and details are not saved yet. Save as Draft to keep them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              setPhotos([]); setTitle(""); setDesc(""); setPrice(""); setCompare(""); setStock(""); setHasVariants(false); setSizes([]); setColours([]); setRows({})
              setPicked([]); setTouched({}); setSubmitted(false); setDirty(false); setSlugEdit(null); setStatus("draft")
            }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
